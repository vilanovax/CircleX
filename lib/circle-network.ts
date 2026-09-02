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
import { privacyVisibleToViewer } from "@/lib/server-listing-visibility";
import {
  listingShareHitsForViewer,
  sqlListingShareOr,
  trustPathViaBridge,
} from "@/lib/listing-share-access";
import { trustScore } from "@/lib/trust";
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

  const shareIdRows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT m.id FROM "MarketListing" AS m
    WHERE ${sqlListingShareOr(viewerId)}
      AND (
        m."sellerId" = ${viewerId}
        OR m."dealStatus" IS NULL
        OR m."dealStatus" <> 'inactive'
      )
    ORDER BY m."createdAt" DESC
    LIMIT 80
  `;
  const haveListing = new Set(marketRows.map((row) => row.id));
  const missingShareIds = shareIdRows
    .map((row) => row.id)
    .filter((id) => !haveListing.has(id));
  const extraShareRows =
    missingShareIds.length === 0
      ? []
      : await prisma.marketListing.findMany({
          where: { id: { in: missingShareIds } },
          include: listingEndorsementsInclude,
        });
  const allMarketRows = [...marketRows, ...extraShareRows];

  const flags = await listingViewerFlags(viewerId, allMarketRows);
  const visibleRows = allMarketRows.filter((row) => !flags.blockedIds.has(row.id));
  const share = await shareAccessForListings(viewerId, visibleRows);

  const listings = visibleRows.flatMap((row) => {
    const mapped = mapVisibleListing(
      row,
      viewerId,
      ctx,
      share.pathByListing.get(row.id),
    );
    if (!mapped) return [];
    return [
      toClientListing(row, viewerId, mapped.trustPath, {
        revealed: flags.revealedIds.has(row.id),
        excludePersonIds: flags.excludeIdsByListing.get(row.id),
        identityRevealedPeerIds: flags.revealPeersByListing.get(row.id),
        ...mapped.reach,
      }),
    ];
  });

  const extraPersonIds = new Set<string>();
  for (const row of extraShareRows) extraPersonIds.add(row.sellerId);
  for (const id of share.bridgeUserIds) extraPersonIds.add(id);
  extraPersonIds.delete(viewerId);
  for (const id of ctx.directIds) extraPersonIds.delete(id);
  Array.from(ctx.networkPeople.keys()).forEach((id) => extraPersonIds.delete(id));
  if (extraPersonIds.size > 0) {
    const extraUsers = await prisma.user.findMany({
      where: { id: { in: Array.from(extraPersonIds) } },
    });
    for (const user of extraUsers) {
      ctx.networkPeople.set(
        user.id,
        personFromNetworkUser(user, {
          relation: "acquaintance",
          level: "C",
          note: "از معرفی",
          inMyCircle: false,
        }),
      );
    }
  }

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
    WHERE (
        ${sqlInViewerNetwork(viewerId, Prisma.raw('m."sellerId"'))}
        OR ${sqlListingShareOr(viewerId)}
      )
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

/** Closed/inactive ads the viewer already messaged — titles for home cards, not feed. */
async function listingIdsFromViewerThreads(
  viewerId: string,
): Promise<string[]> {
  const rows = await prisma.directMessage.findMany({
    where: {
      listingId: { not: null },
      OR: [{ fromUserId: viewerId }, { toUserId: viewerId }],
    },
    distinct: ["listingId"],
    select: { listingId: true },
  });
  const ids: string[] = [];
  for (const row of rows) {
    if (row.listingId) ids.push(row.listingId);
  }
  return ids;
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

  const [feedListingIds, threadListingIds, requestIds, eventIds] =
    await Promise.all([
      homeFeedListingIds(viewerId),
      listingIdsFromViewerThreads(viewerId),
      homeFeedRequestIds(viewerId),
      homeFeedEventIds(viewerId),
    ]);
  const seenListing = new Set(feedListingIds);
  const listingIds = feedListingIds.slice();
  for (const id of threadListingIds) {
    if (seenListing.has(id)) continue;
    seenListing.add(id);
    listingIds.push(id);
  }

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
  const share = await shareAccessForListings(viewerId, visibleRows);

  const listings = visibleRows.flatMap((row) => {
    const mapped = mapVisibleListing(
      row,
      viewerId,
      pathCtx,
      share.pathByListing.get(row.id),
    );
    if (!mapped) return [];
    return [
      toHomeListing(row, viewerId, mapped.trustPath, {
        revealed: flags.revealedIds.has(row.id),
        excludePersonIds: flags.excludeIdsByListing.get(row.id),
        identityRevealedPeerIds: flags.revealPeersByListing.get(row.id),
        ...mapped.reach,
      }),
    ];
  });

  const requests = requestRows.flatMap((row) => {
    const trustPath = trustPathForListing(
      { sellerId: row.requesterId },
      viewerId,
      pathCtx,
    );
    const reach = listingViewerReach(row.requesterId, viewerId, trustPath, pathCtx);
    if (
      !privacyVisibleToViewer({
        viewerId,
        ownerId: row.requesterId,
        privacy: row.privacy,
        trustPath,
        viewerTrustScore: reach.viewerTrustScore,
      })
    ) {
      return [];
    }
    const mapped = toClientRequest(row, viewerId, trustPath);
    if (mapped.description.length <= 180) return [mapped];
    return [
      {
        ...mapped,
        description: `${mapped.description.slice(0, 180).trim()}…`,
      },
    ];
  });
  const offers = requestRows.flatMap((row) => {
    const trustPath = trustPathForListing(
      { sellerId: row.requesterId },
      viewerId,
      pathCtx,
    );
    const reach = listingViewerReach(row.requesterId, viewerId, trustPath, pathCtx);
    if (
      !privacyVisibleToViewer({
        viewerId,
        ownerId: row.requesterId,
        privacy: row.privacy,
        trustPath,
        viewerTrustScore: reach.viewerTrustScore,
      })
    ) {
      return [];
    }
    return row.offers.map((offer) => toClientOffer(offer, viewerId));
  });
  const events = eventRows.flatMap((row) => {
    const trustPath = trustPathForListing(
      { sellerId: row.hostId },
      viewerId,
      pathCtx,
    );
    const reach = listingViewerReach(row.hostId, viewerId, trustPath, pathCtx);
    if (
      !privacyVisibleToViewer({
        viewerId,
        ownerId: row.hostId,
        privacy: row.privacy,
        trustPath,
        viewerTrustScore: reach.viewerTrustScore,
      })
    ) {
      return [];
    }
    const mapped = toClientEvent(row, viewerId, trustPath);
    return [{ ...mapped, description: "" }];
  });

  const fofSellerIds = Array.from(
    new Set(
      [
        ...visibleRows
          .filter((row) => !row.hideIdentity || flags.revealedIds.has(row.id))
          .map((row) => row.sellerId),
        ...share.bridgeUserIds,
      ].filter((id) => id !== viewerId && !direct.directSet.has(id)),
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

const ADDED_YOU_CAP = 12;

/** People who already have me in their circle, while I have not placed them. */
export async function loadAddedYou(userId: string): Promise<Person[]> {
  const inbound = await prisma.circleEdge.findMany({
    where: { toUserId: userId },
    include: { from: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  if (inbound.length === 0) return [];

  const outbound = await prisma.circleEdge.findMany({
    where: {
      fromUserId: userId,
      toUserId: { in: inbound.map((edge) => edge.fromUserId) },
    },
    select: { toUserId: true },
  });
  const placed = new Set(outbound.map((row) => row.toUserId));

  const out: Person[] = [];
  for (const edge of inbound) {
    if (placed.has(edge.fromUserId)) continue;
    out.push(
      personFromNetworkUser(edge.from, {
        relation: edge.relationType,
        level: "B",
        note: "تو را به حلقه‌اش اضافه کرد",
        inMyCircle: false,
      }),
    );
    if (out.length >= ADDED_YOU_CAP) break;
  }
  return out;
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

function listingViewerReach(
  sellerId: string,
  viewerId: string,
  trustPath: TrustHop[],
  ctx: { memberById: Map<string, Person>; directSet: Set<string> },
): { viewerTrustScore: number; viewerDirect: boolean } {
  const viewerDirect = sellerId === viewerId || ctx.directSet.has(sellerId);
  return {
    viewerDirect,
    viewerTrustScore: trustScore(sellerId, trustPath, (id) =>
      ctx.memberById.get(id),
    ),
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

function mapVisibleListing(
  row: {
    id: string;
    sellerId: string;
    privacy: string;
    dealStatus: string | null;
  },
  viewerId: string,
  pathCtx: {
    directSet: Set<string>;
    memberById: Map<string, Person>;
    connectorBySeller: Map<string, Person>;
    viaRelationBySeller?: Map<string, RelationType>;
  },
  sharePath?: TrustHop[],
): {
  trustPath: TrustHop[];
  reach: { viewerTrustScore: number; viewerDirect: boolean };
} | null {
  const trustPath = trustPathForListing(row, viewerId, pathCtx);
  const reach = listingViewerReach(row.sellerId, viewerId, trustPath, pathCtx);
  if (
    privacyVisibleToViewer({
      viewerId,
      ownerId: row.sellerId,
      privacy: row.privacy,
      trustPath,
      viewerTrustScore: reach.viewerTrustScore,
      dealStatus: row.dealStatus,
    })
  ) {
    return { trustPath, reach };
  }
  if (!sharePath?.length) return null;
  if (row.dealStatus === "inactive") return null;
  return {
    trustPath: sharePath,
    reach: { viewerDirect: false, viewerTrustScore: 1 },
  };
}

async function shareAccessForListings(
  viewerId: string,
  rows: Array<{
    id: string;
    sellerId: string;
    privacy: string;
    hideIdentity: boolean;
  }>,
): Promise<{
  pathByListing: Map<string, TrustHop[]>;
  bridgeUserIds: string[];
}> {
  const hits = await listingShareHitsForViewer(viewerId, rows);
  const pathByListing = new Map<string, TrustHop[]>();
  const bridgeUserIds: string[] = [];
  const seenBridge = new Set<string>();
  const hopByBridge = new Map<string, TrustHop[]>();
  for (const hit of Array.from(hits.values())) {
    if (!seenBridge.has(hit.bridgeUserId)) {
      seenBridge.add(hit.bridgeUserId);
      bridgeUserIds.push(hit.bridgeUserId);
      hopByBridge.set(
        hit.bridgeUserId,
        await trustPathViaBridge(viewerId, hit.bridgeUserId),
      );
    }
    const hop = hopByBridge.get(hit.bridgeUserId);
    if (hop) pathByListing.set(hit.listingId, hop);
  }
  return { pathByListing, bridgeUserIds };
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
  const requests = requestRows.flatMap((row) => {
    const trustPath = trustPathForListing(
      { sellerId: row.requesterId },
      viewerId,
      pathCtx,
    );
    const reach = listingViewerReach(row.requesterId, viewerId, trustPath, pathCtx);
    if (
      !privacyVisibleToViewer({
        viewerId,
        ownerId: row.requesterId,
        privacy: row.privacy,
        trustPath,
        viewerTrustScore: reach.viewerTrustScore,
      })
    ) {
      return [];
    }
    const mapped = toClientRequest(row, viewerId, trustPath);
    if (!compact || mapped.description.length <= 180) return [mapped];
    return [
      {
        ...mapped,
        description: `${mapped.description.slice(0, 180).trim()}…`,
      },
    ];
  });
  const offers = requestRows.flatMap((row) => {
    const trustPath = trustPathForListing(
      { sellerId: row.requesterId },
      viewerId,
      pathCtx,
    );
    const reach = listingViewerReach(row.requesterId, viewerId, trustPath, pathCtx);
    if (
      !privacyVisibleToViewer({
        viewerId,
        ownerId: row.requesterId,
        privacy: row.privacy,
        trustPath,
        viewerTrustScore: reach.viewerTrustScore,
      })
    ) {
      return [];
    }
    return row.offers.map((offer) => toClientOffer(offer, viewerId));
  });
  const events = eventRows.flatMap((row) => {
    const trustPath = trustPathForListing(
      { sellerId: row.hostId },
      viewerId,
      pathCtx,
    );
    const reach = listingViewerReach(row.hostId, viewerId, trustPath, pathCtx);
    if (
      !privacyVisibleToViewer({
        viewerId,
        ownerId: row.hostId,
        privacy: row.privacy,
        trustPath,
        viewerTrustScore: reach.viewerTrustScore,
      })
    ) {
      return [];
    }
    const mapped = toClientEvent(row, viewerId, trustPath);
    if (!compact) return [mapped];
    return [{ ...mapped, description: "" }];
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
