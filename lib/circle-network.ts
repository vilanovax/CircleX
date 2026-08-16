import { prisma } from "@/lib/db";
import {
  DEMO_FOF,
  DEMO_PHONES,
} from "@/lib/demo-circle-catalog";
import { relationLabels, relationTowardName } from "@/lib/labels";
import { memberFromEdge, toClientListing, toHomeListing } from "@/lib/mappers";
import type { Listing, Person, TrustHop } from "@/lib/types";
import type { CircleEdge, RelationType, User } from "@prisma/client";

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

function personFromNetworkUser(
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
}> {
  const ctx = await loadTrustContext(viewerId);
  const sellerIds = sellerIdsFor(viewerId, ctx);

  const marketRows =
    sellerIds.length === 0
      ? []
      : await prisma.marketListing.findMany({
          where: { sellerId: { in: sellerIds } },
          orderBy: { createdAt: "desc" },
        });

  const listings = marketRows.map((row) =>
    toClientListing(
      row,
      viewerId,
      trustPathForListing(row, viewerId, ctx),
    ),
  );

  return {
    members: ctx.members,
    network: Array.from(ctx.networkPeople.values()),
    listings,
    links: linksFromContext(viewerId, ctx),
  };
}

const HOME_LISTING_SELECT = {
  id: true,
  title: true,
  description: true,
  type: true,
  price: true,
  category: true,
  image: true,
  sellerId: true,
  createdAt: true,
  privacy: true,
  city: true,
} as const;

/** First paint shows 8 seller cards; keep a small buffer for filters. */
const HOME_FEED_LIMIT = 24;

/** Home feed: capped cards, FoF users only for sellers on those cards. */
export async function loadHomeFeed(viewerId: string): Promise<{
  members: Person[];
  network: Person[];
  listings: Listing[];
}> {
  const direct = await loadDirectCircle(viewerId);

  const hopEdges =
    direct.directIds.length === 0
      ? []
      : await prisma.circleEdge.findMany({
          where: {
            fromUserId: { in: direct.directIds },
            toUserId: { not: viewerId },
          },
          select: { fromUserId: true, toUserId: true, relationType: true },
        });

  const connectorBySeller = new Map<string, Person>();
  const viaRelationBySeller = new Map<string, RelationType>();
  for (const edge of hopEdges) {
    if (direct.directSet.has(edge.toUserId)) continue;
    const bridge = direct.memberById.get(edge.fromUserId);
    if (!bridge || connectorBySeller.has(edge.toUserId)) continue;
    connectorBySeller.set(edge.toUserId, bridge);
    viaRelationBySeller.set(edge.toUserId, edge.relationType);
  }

  const sellerIds = [
    viewerId,
    ...direct.directIds,
    ...Array.from(connectorBySeller.keys()),
  ];

  const marketRows =
    sellerIds.length === 0
      ? []
      : await prisma.marketListing.findMany({
          where: { sellerId: { in: sellerIds } },
          orderBy: { createdAt: "desc" },
          take: HOME_FEED_LIMIT,
          select: HOME_LISTING_SELECT,
        });

  const pathCtx = {
    directSet: direct.directSet,
    memberById: direct.memberById,
    connectorBySeller,
    viaRelationBySeller,
  };

  const listings = marketRows.map((row) =>
    toHomeListing(row, viewerId, trustPathForListing(row, viewerId, pathCtx)),
  );

  const fofSellerIds = Array.from(
    new Set(
      marketRows
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

  return { members: direct.members, network, listings };
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
