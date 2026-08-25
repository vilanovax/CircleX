import { prisma } from "@/lib/db";
import {
  DEMO_FOF,
  DEMO_PHONES,
} from "@/lib/demo-circle-catalog";
import { relationLabels, relationTowardName } from "@/lib/labels";
import {
  listingEndorsementsInclude,
  memberFromEdge,
  toClientEvent,
  toClientListing,
  toClientOffer,
  toClientRequest,
  toHomeListing,
} from "@/lib/mappers";
import { listingViewerFlags } from "@/lib/server-listing-privacy";
import { backfillFamilyReciprocals } from "@/lib/server-family-reciprocal";
import { threadKey } from "@/lib/listing-privacy";
import type {
  CircleEvent,
  Listing,
  Offer,
  Person,
  Request,
  TrustHop,
} from "@/lib/types";
import { Prisma, type CircleEdge, type RelationType, type User } from "@prisma/client";

export type NetworkLink = {
  fromId: string;
  toId: string;
  relationType: RelationType;
};

const FOF_NOTE_BY_PHONE = new Map<string, string>(
  DEMO_FOF.map((f) => [DEMO_PHONES[f.key], f.noteTemplate]),
);

function noteForFof(phone: string, bridgeName: string): string | undefined {
  const template = FOF_NOTE_BY_PHONE.get(phone);
  if (!template) return `از طریق ${bridgeName}`;
  return template.replace("{bridge}", bridgeName);
}

export function personFromNetworkUser(
  user: User,
  opts: {
    relation: RelationType;
    level: "A" | "B" | "C";
    note?: string;
    inMyCircle: boolean;
  },
): Person {
  return {
    id: user.id,
    name: user.name || "عضو شبکه",
    avatar: user.avatar || "/avatars/01.webp",
    relation: opts.relation,
    level: opts.level,
    note: opts.note,
    deals: 0,
    city: user.city ?? undefined,
    inMyCircle: opts.inMyCircle,
    inviteStatus: opts.inMyCircle ? "joined" : undefined,
  };
}

type DirectCircle = {
  members: Person[];
  directIds: string[];
  directSet: Set<string>;
  memberById: Map<string, Person>;
};

type TrustContext = DirectCircle & {
  hopEdges: Array<CircleEdge & { to: User }>;
  connectorBySeller: Map<string, Person>;
  /** Bridge→seller edge relation (how the bridge labeled the FoF). */
  viaRelationBySeller: Map<string, RelationType>;
  networkPeople: Map<string, Person>;
};

async function loadDirectCircle(viewerId: string): Promise<DirectCircle> {
  await backfillFamilyReciprocals(viewerId);
  const myEdges = await prisma.circleEdge.findMany({
    where: { fromUserId: viewerId },
    include: { to: true },
    orderBy: { createdAt: "desc" },
  });

  const members = myEdges.map(memberFromEdge);
  const directIds = myEdges.map((e) => e.toUserId);
  return {
    members,
    directIds,
    directSet: new Set(directIds),
    memberById: new Map(members.map((m) => [m.id, m])),
  };
}

async function loadTrustContext(viewerId: string): Promise<TrustContext> {
  const direct = await loadDirectCircle(viewerId);

  const hopEdges =
    direct.directIds.length === 0
      ? []
      : await prisma.circleEdge.findMany({
          where: {
            fromUserId: { in: direct.directIds },
            toUserId: { not: viewerId },
          },
          include: { to: true },
        });

  const connectorBySeller = new Map<string, Person>();
  const viaRelationBySeller = new Map<string, RelationType>();
  const networkPeople = new Map<string, Person>();

  for (const edge of hopEdges) {
    if (direct.directSet.has(edge.toUserId)) continue;
    const bridge = direct.memberById.get(edge.fromUserId);
    if (!bridge) continue;
    if (!connectorBySeller.has(edge.toUserId)) {
      connectorBySeller.set(edge.toUserId, bridge);
      viaRelationBySeller.set(edge.toUserId, edge.relationType);
    }
    if (!networkPeople.has(edge.toUserId)) {
      const note = noteForFof(edge.to.phoneNormalized, bridge.name);
      networkPeople.set(
        edge.toUserId,
        personFromNetworkUser(edge.to, {
          relation: "acquaintance",
          level: "C",
          note,
          inMyCircle: false,
        }),
      );
    }
  }

  return {
    ...direct,
    hopEdges,
    connectorBySeller,
    viaRelationBySeller,
    networkPeople,
  };
}

function sellerIdsFor(viewerId: string, ctx: TrustContext): string[] {
  return [viewerId, ...ctx.directIds, ...Array.from(ctx.connectorBySeller.keys())];
}

function linksFromContext(viewerId: string, ctx: TrustContext): NetworkLink[] {
  const links: NetworkLink[] = [];
  const linkKeys = new Set<string>();
  const addLink = (fromId: string, toId: string, relationType: RelationType) => {
    if (fromId === toId) return;
    const key = fromId < toId ? `${fromId}|${toId}` : `${toId}|${fromId}`;
    if (linkKeys.has(key)) return;
    linkKeys.add(key);
    links.push({ fromId, toId, relationType });
  };

  for (const member of ctx.members) {
    addLink(viewerId, member.id, member.relation);
  }
  for (const edge of ctx.hopEdges) {
    addLink(edge.fromUserId, edge.toUserId, edge.relationType);
  }
  return links;
}

/** People + peer links for the map — no listing bodies. */
export async function loadGraphNetwork(viewerId: string): Promise<{
  members: Person[];
  network: Person[];
  links: NetworkLink[];
}> {
  const ctx = await loadTrustContext(viewerId);
  return {
    members: ctx.members,
    network: Array.from(ctx.networkPeople.values()),
    links: linksFromContext(viewerId, ctx),
  };
}

/**
 * Load direct + 2-hop listings, FoF people, trust paths, and peer links
 * so the feed and graph reflect a real multi-circle network.
 */
export async function loadCircleNetwork(viewerId: string): Promise<{
  members: Person[];
  network: Person[];
  listings: Listing[];
  links: NetworkLink[];
  requests: Request[];
  offers: Offer[];
  events: CircleEvent[];
}> {
  const ctx = await loadTrustContext(viewerId);
  const sellerIds = sellerIdsFor(viewerId, ctx);

  const marketRows =
    sellerIds.length === 0
      ? []
      : await prisma.marketListing.findMany({
          where: visibleMarketWhere(viewerId, sellerIds),
          orderBy: { createdAt: "desc" },
          include: listingEndorsementsInclude,
        });

  const flags = await listingViewerFlags(viewerId, marketRows);
  const visibleRows = marketRows.filter((row) => !flags.blockedIds.has(row.id));

  const listings = visibleRows.map((row) =>
    toClientListing(
      row,
      viewerId,
      trustPathForListing(row, viewerId, ctx),
      {
        revealed: flags.revealedIds.has(row.id),
        excludePersonIds: flags.excludeIdsByListing.get(row.id),
        identityRevealedPeerIds: flags.revealPeersByListing.get(row.id),
      },
    ),
  );

  const social = await loadSocialFeed(viewerId, sellerIds, ctx);

  return {
    members: ctx.members,
    network: Array.from(ctx.networkPeople.values()),
    listings,
    links: linksFromContext(viewerId, ctx),
    ...social,
  };
}

const HOME_LISTING_SELECT = {
  id: true,
  title: true,
  type: true,
  price: true,
  category: true,
  image: true,
  sellerId: true,
  createdAt: true,
  privacy: true,
  hideIdentity: true,
  excludeRelationTypes: true,
  city: true,
  area: true,
  dealStatus: true,
  endorsements: {
    select: { personId: true, types: true, note: true, hidden: true },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

/**
 * Others’ unpublished ads stay out of feeds; the owner still receives theirs.
 * `dealStatus` is nullable — Prisma `not: "inactive"` would also drop NULL,
 * which hid every seeded circle ad except ones explicitly marked available.
 */
function visibleMarketWhere(
  viewerId: string,
  sellerIds: string[],
): Prisma.MarketListingWhereInput {
  return {
    sellerId: { in: sellerIds },
    OR: [
      { sellerId: viewerId },
      { dealStatus: null },
      { dealStatus: { not: "inactive" } },
    ],
  };
}

/** First paint shows a page of listing cards; keep a buffer for filters. */
const HOME_FEED_LIMIT = 24;
const HOME_EVENT_LIMIT = 8;

/** Viewer, direct circle, or one hop — same set as the old JS FoF scan. */
function sqlInViewerNetwork(
  viewerId: string,
  personCol: Prisma.Sql,
): Prisma.Sql {
  return Prisma.sql`(
    ${personCol} = ${viewerId}
    OR EXISTS (
      SELECT 1 FROM "CircleEdge" AS d
      WHERE d."fromUserId" = ${viewerId}
        AND d."toUserId" = ${personCol}
    )
    OR (
      ${personCol} <> ${viewerId}
      AND EXISTS (
        SELECT 1 FROM "CircleEdge" AS d
        INNER JOIN "CircleEdge" AS h ON h."fromUserId" = d."toUserId"
        WHERE d."fromUserId" = ${viewerId}
          AND h."toUserId" = ${personCol}
      )
      AND NOT EXISTS (
        SELECT 1 FROM "CircleEdge" AS me
        WHERE me."fromUserId" = ${viewerId}
          AND me."toUserId" = ${personCol}
      )
    )
  )`;
}

function orderByIds<T extends { id: string }>(rows: T[], ids: string[]): T[] {
  const map = new Map(rows.map((row) => [row.id, row]));
  const out: T[] = [];
  for (const id of ids) {
    const row = map.get(id);
    if (row) out.push(row);
  }
  return out;
}

async function homeFeedListingIds(viewerId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT m.id FROM "MarketListing" AS m
    WHERE ${sqlInViewerNetwork(viewerId, Prisma.raw('m."sellerId"'))}
      AND (
        m."sellerId" = ${viewerId}
        OR m."dealStatus" IS NULL
        OR m."dealStatus" <> 'inactive'
      )
    ORDER BY m."createdAt" DESC
    LIMIT ${HOME_FEED_LIMIT}
  `;
  return rows.map((row) => row.id);
}

async function homeFeedRequestIds(viewerId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT w.id FROM "WantRequest" AS w
    WHERE (w.hidden = false OR w."requesterId" = ${viewerId})
      AND ${sqlInViewerNetwork(viewerId, Prisma.raw('w."requesterId"'))}
    ORDER BY w."createdAt" DESC
    LIMIT ${HOME_FEED_LIMIT}
  `;
  return rows.map((row) => row.id);
}

async function homeFeedEventIds(viewerId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT g.id FROM "Gathering" AS g
    WHERE (g.hidden = false OR g."hostId" = ${viewerId})
      AND ${sqlInViewerNetwork(viewerId, Prisma.raw('g."hostId"'))}
    ORDER BY g."createdAt" DESC
    LIMIT ${HOME_EVENT_LIMIT}
  `;
  return rows.map((row) => row.id);
}

async function connectorsForFoF(
  direct: DirectCircle,
  fofIds: string[],
): Promise<{
  connectorBySeller: Map<string, Person>;
  viaRelationBySeller: Map<string, RelationType>;
}> {
  const connectorBySeller = new Map<string, Person>();
  const viaRelationBySeller = new Map<string, RelationType>();
  if (fofIds.length === 0 || direct.directIds.length === 0) {
    return { connectorBySeller, viaRelationBySeller };
  }
  const hopEdges = await prisma.circleEdge.findMany({
    where: {
      fromUserId: { in: direct.directIds },
      toUserId: { in: fofIds },
    },
    select: { fromUserId: true, toUserId: true, relationType: true },
  });
  for (const edge of hopEdges) {
    if (direct.directSet.has(edge.toUserId)) continue;
    const bridge = direct.memberById.get(edge.fromUserId);
    if (!bridge || connectorBySeller.has(edge.toUserId)) continue;
    connectorBySeller.set(edge.toUserId, bridge);
    viaRelationBySeller.set(edge.toUserId, edge.relationType);
  }
  return { connectorBySeller, viaRelationBySeller };
}

/** Home feed: capped cards, FoF users only for sellers on those cards. */
export async function loadHomeFeed(viewerId: string): Promise<{
  members: Person[];
  network: Person[];
  listings: Listing[];
  requests: Request[];
  offers: Offer[];
  events: CircleEvent[];
}> {
  const direct = await loadDirectCircle(viewerId);

  const [listingIds, requestIds, eventIds] = await Promise.all([
    homeFeedListingIds(viewerId),
    homeFeedRequestIds(viewerId),
    homeFeedEventIds(viewerId),
  ]);

  const [marketUnsorted, requestUnsorted, eventUnsorted] = await Promise.all([
    listingIds.length === 0
      ? Promise.resolve([])
      : prisma.marketListing.findMany({
          where: { id: { in: listingIds } },
          select: HOME_LISTING_SELECT,
        }),
    requestIds.length === 0
      ? Promise.resolve([])
      : prisma.wantRequest.findMany({
          where: { id: { in: requestIds } },
          include: {
            offers: {
              select: {
                id: true,
                requestId: true,
                fromId: true,
                price: true,
                createdAt: true,
              },
            },
          },
        }),
    eventIds.length === 0
      ? Promise.resolve([])
      : prisma.gathering.findMany({
          where: { id: { in: eventIds } },
          include: { rsvps: { select: { personId: true } } },
        }),
  ]);

  const marketRows = orderByIds(marketUnsorted, listingIds);
  const requestRows = orderByIds(requestUnsorted, requestIds);
  const eventRows = orderByIds(eventUnsorted, eventIds);

  const fofIds: string[] = [];
  const seenFof = new Set<string>();
  const addFof = (id: string) => {
    if (id === viewerId || direct.directSet.has(id) || seenFof.has(id)) return;
    seenFof.add(id);
    fofIds.push(id);
  };
  for (const row of marketRows) addFof(row.sellerId);
  for (const row of requestRows) addFof(row.requesterId);
  for (const row of eventRows) addFof(row.hostId);

  const { connectorBySeller, viaRelationBySeller } = await connectorsForFoF(
    direct,
    fofIds,
  );

  const pathCtx = {
    directSet: direct.directSet,
    memberById: direct.memberById,
    connectorBySeller,
    viaRelationBySeller,
  };

  const flags = await listingViewerFlags(viewerId, marketRows);
  const visibleRows = marketRows.filter((row) => !flags.blockedIds.has(row.id));

  const listings = visibleRows.map((row) =>
    toHomeListing(row, viewerId, trustPathForListing(row, viewerId, pathCtx), {
      revealed: flags.revealedIds.has(row.id),
      excludePersonIds: flags.excludeIdsByListing.get(row.id),
      identityRevealedPeerIds: flags.revealPeersByListing.get(row.id),
    }),
  );

  const requests = requestRows.map((row) => {
    const mapped = toClientRequest(
      row,
      viewerId,
      trustPathForListing({ sellerId: row.requesterId }, viewerId, pathCtx),
    );
    if (mapped.description.length <= 180) return mapped;
    return {
      ...mapped,
      description: `${mapped.description.slice(0, 180).trim()}…`,
    };
  });
  const offers = requestRows.flatMap((row) =>
    row.offers.map((offer) => toClientOffer(offer, viewerId)),
  );
  const events = eventRows.map((row) => {
    const mapped = toClientEvent(
      row,
      viewerId,
      trustPathForListing({ sellerId: row.hostId }, viewerId, pathCtx),
    );
    return { ...mapped, description: "" };
  });

  const fofSellerIds = Array.from(
    new Set(
      visibleRows
        .filter((row) => !row.hideIdentity || flags.revealedIds.has(row.id))
        .map((row) => row.sellerId)
        .filter((id) => id !== viewerId && !direct.directSet.has(id)),
    ),
  );

  const fofUsers =
    fofSellerIds.length === 0
      ? []
      : await prisma.user.findMany({ where: { id: { in: fofSellerIds } } });

  const network = fofUsers.map((user) => {
    const bridge = connectorBySeller.get(user.id);
    const note = noteForFof(user.phoneNormalized, bridge?.name ?? "حلقه");
    return personFromNetworkUser(user, {
      relation: "acquaintance",
      level: "C",
      note,
      inMyCircle: false,
    });
  });

  return { members: direct.members, network, listings, requests, offers, events };
}

export type ListingAccess = {
  ok: boolean;
  trustPath: TrustHop[];
};

/**
 * May the viewer open this seller's listing, and the one-hop trust path if any.
 * Does not load the rest of the FoF graph.
 */
export async function listingAccess(
  viewerId: string,
  sellerId: string,
): Promise<ListingAccess> {
  if (sellerId === viewerId) return { ok: true, trustPath: [] };

  const direct = await prisma.circleEdge.findUnique({
    where: {
      fromUserId_toUserId: {
        fromUserId: viewerId,
        toUserId: sellerId,
      },
    },
    select: { fromUserId: true },
  });
  if (direct) return { ok: true, trustPath: [] };

  const myEdges = await prisma.circleEdge.findMany({
    where: { fromUserId: viewerId },
    select: { toUserId: true, relationType: true },
  });
  if (myEdges.length === 0) return { ok: false, trustPath: [] };

  const hop = await prisma.circleEdge.findFirst({
    where: {
      fromUserId: { in: myEdges.map((e) => e.toUserId) },
      toUserId: sellerId,
    },
    select: {
      fromUserId: true,
      relationType: true,
      from: { select: { name: true } },
    },
  });
  if (!hop) return { ok: false, trustPath: [] };

  const bridge = myEdges.find((e) => e.toUserId === hop.fromUserId);
  const bridgeName = hop.from.name?.trim() || "آشنا";
  const label = bridge
    ? `${relationLabels[bridge.relationType]} من`
    : "آشنای من";

  return {
    ok: true,
    trustPath: [
      {
        personId: hop.fromUserId,
        relationLabel: label,
        priorRelationLabel: relationTowardName(hop.relationType, bridgeName),
      },
    ],
  };
}

function trustPathForListing(
  row: { sellerId: string },
  viewerId: string,
  ctx: {
    directSet: Set<string>;
    memberById: Map<string, Person>;
    connectorBySeller: Map<string, Person>;
    viaRelationBySeller?: Map<string, RelationType>;
  },
): TrustHop[] {
  if (row.sellerId === viewerId) return [];
  if (ctx.directSet.has(row.sellerId)) return [];

  const bridge = ctx.connectorBySeller.get(row.sellerId);
  if (!bridge) return [];

  const myRelation = ctx.memberById.get(bridge.id)?.relation;
  const label = myRelation
    ? `${relationLabels[myRelation]} من`
    : "آشنای من";
  const viaRel = ctx.viaRelationBySeller?.get(row.sellerId);

  return [
    {
      personId: bridge.id,
      relationLabel: label,
      ...(viaRel
        ? { priorRelationLabel: relationTowardName(viaRel, bridge.name) }
        : {}),
    },
  ];
}

type PathCtx = {
  directSet: Set<string>;
  memberById: Map<string, Person>;
  connectorBySeller: Map<string, Person>;
  viaRelationBySeller?: Map<string, RelationType>;
};

export async function loadSocialFeed(
  viewerId: string,
  actorIds: string[],
  pathCtx: PathCtx,
  opts?: { requestTake?: number; eventTake?: number; compact?: boolean },
): Promise<{ requests: Request[]; offers: Offer[]; events: CircleEvent[] }> {
  if (actorIds.length === 0) {
    return { requests: [], offers: [], events: [] };
  }
  const compact = Boolean(opts?.compact);
  const [requestRows, eventRows] = await Promise.all([
    prisma.wantRequest.findMany({
      where: {
        requesterId: { in: actorIds },
        OR: [{ hidden: false }, { requesterId: viewerId }],
      },
      orderBy: { createdAt: "desc" },
      take: opts?.requestTake,
      include: compact
        ? {
            offers: {
              select: {
                id: true,
                requestId: true,
                fromId: true,
                price: true,
                createdAt: true,
              },
            },
          }
        : { offers: true },
    }),
    prisma.gathering.findMany({
      where: {
        hostId: { in: actorIds },
        OR: [{ hidden: false }, { hostId: viewerId }],
      },
      orderBy: { createdAt: "desc" },
      take: opts?.eventTake,
      include: { rsvps: { select: { personId: true } } },
    }),
  ]);
  const requests = requestRows.map((row) => {
    const mapped = toClientRequest(
      row,
      viewerId,
      trustPathForListing({ sellerId: row.requesterId }, viewerId, pathCtx),
    );
    if (!compact || mapped.description.length <= 180) return mapped;
    return {
      ...mapped,
      description: `${mapped.description.slice(0, 180).trim()}…`,
    };
  });
  const offers = requestRows.flatMap((row) =>
    row.offers.map((offer) => toClientOffer(offer, viewerId)),
  );
  const events = eventRows.map((row) => {
    const mapped = toClientEvent(
      row,
      viewerId,
      trustPathForListing({ sellerId: row.hostId }, viewerId, pathCtx),
    );
    if (!compact) return mapped;
    return { ...mapped, description: "" };
  });
  return { requests, offers, events };
}

export async function loadThreadPrefs(viewerId: string): Promise<{
  archivedThreads: string[];
  pinnedThreads: string[];
  deletedThreads: string[];
}> {
  const threadRows = await prisma.threadPreference.findMany({
    where: { userId: viewerId },
  });
  const archivedThreads: string[] = [];
  const pinnedThreads: string[] = [];
  const deletedThreads: string[] = [];
  for (const row of threadRows) {
    if (row.deletedAt) deletedThreads.push(threadKey(row.peerId, row.listingId));
    else if (row.archived) archivedThreads.push(threadKey(row.peerId, row.listingId));
    if (row.pinned && !row.deletedAt) {
      pinnedThreads.push(threadKey(row.peerId, row.listingId));
    }
  }
  return { archivedThreads, pinnedThreads, deletedThreads };
}

/** Feed hide/save + notes. Thread archive lives on /api/messages. */
export async function loadFeedPrefs(viewerId: string): Promise<{
  showOwnListingsInFeed: boolean;
  saved: string[];
  hiddenListings: string[];
  hiddenPeople: string[];
  listingNotes: Record<string, string>;
}> {
  const [user, savedRows, hiddenRows, hiddenPeopleRows, noteRows] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: viewerId },
        select: { showOwnListingsInFeed: true },
      }),
      prisma.savedListing.findMany({
        where: { userId: viewerId },
        orderBy: { createdAt: "desc" },
        select: { listingId: true },
      }),
      prisma.hiddenListing.findMany({
        where: { userId: viewerId },
        orderBy: { createdAt: "desc" },
        select: { listingId: true },
      }),
      prisma.hiddenPerson.findMany({
        where: { userId: viewerId },
        orderBy: { createdAt: "desc" },
        select: { personId: true },
      }),
      prisma.listingPersonalNote.findMany({
        where: { userId: viewerId },
        select: { listingId: true, body: true },
      }),
    ]);
  const listingNotes: Record<string, string> = {};
  for (const row of noteRows) {
    if (row.body.trim()) listingNotes[row.listingId] = row.body;
  }
  return {
    showOwnListingsInFeed: user?.showOwnListingsInFeed ?? true,
    saved: savedRows.map((row) => row.listingId),
    hiddenListings: hiddenRows.map((row) => row.listingId),
    hiddenPeople: hiddenPeopleRows.map((row) => row.personId),
    listingNotes,
  };
}

export async function loadViewerPrefs(viewerId: string): Promise<{
  showOwnListingsInFeed: boolean;
  saved: string[];
  hiddenListings: string[];
  hiddenPeople: string[];
  listingNotes: Record<string, string>;
  archivedThreads: string[];
  pinnedThreads: string[];
  deletedThreads: string[];
}> {
  const [feed, threads] = await Promise.all([
    loadFeedPrefs(viewerId),
    loadThreadPrefs(viewerId),
  ]);
  return { ...feed, ...threads };
}
