import { prisma } from "@/lib/db";
import {
  DEMO_FOF,
  DEMO_PHONES,
} from "@/lib/demo-circle-catalog";
import { relationLabels } from "@/lib/labels";
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

type Connector = { edge: CircleEdge & { to: User }; bridge: Person };

type TrustContext = {
  members: Person[];
  directIds: string[];
  directSet: Set<string>;
  memberById: Map<string, Person>;
  hopEdges: Array<CircleEdge & { to: User }>;
  connectorBySeller: Map<string, Connector>;
  networkPeople: Map<string, Person>;
};

async function loadTrustContext(viewerId: string): Promise<TrustContext> {
  const myEdges = await prisma.circleEdge.findMany({
    where: { fromUserId: viewerId },
    include: { to: true },
    orderBy: { createdAt: "desc" },
  });

  const members = myEdges.map(memberFromEdge);
  const directIds = myEdges.map((e) => e.toUserId);
  const directSet = new Set(directIds);
  const memberById = new Map(members.map((m) => [m.id, m]));

  const hopEdges =
    directIds.length === 0
      ? []
      : await prisma.circleEdge.findMany({
          where: {
            fromUserId: { in: directIds },
            toUserId: { not: viewerId },
          },
          include: { to: true },
        });

  const connectorBySeller = new Map<string, Connector>();
  const networkPeople = new Map<string, Person>();

  for (const edge of hopEdges) {
    if (directSet.has(edge.toUserId)) continue;
    const bridge = memberById.get(edge.fromUserId);
    if (!bridge) continue;
    if (!connectorBySeller.has(edge.toUserId)) {
      connectorBySeller.set(edge.toUserId, { edge, bridge });
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
    members,
    directIds,
    directSet,
    memberById,
    hopEdges,
    connectorBySeller,
    networkPeople,
  };
}

function sellerIdsFor(viewerId: string, ctx: TrustContext): string[] {
  return [viewerId, ...ctx.directIds, ...Array.from(ctx.connectorBySeller.keys())];
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

  return {
    members: ctx.members,
    network: Array.from(ctx.networkPeople.values()),
    listings,
    links,
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

/** Home feed: card fields only, FoF people who actually appear as sellers. */
export async function loadHomeFeed(viewerId: string): Promise<{
  members: Person[];
  network: Person[];
  listings: Listing[];
}> {
  const ctx = await loadTrustContext(viewerId);
  const sellerIds = sellerIdsFor(viewerId, ctx);

  const marketRows =
    sellerIds.length === 0
      ? []
      : await prisma.marketListing.findMany({
          where: { sellerId: { in: sellerIds } },
          orderBy: { createdAt: "desc" },
          select: HOME_LISTING_SELECT,
        });

  const listings = marketRows.map((row) =>
    toHomeListing(row, viewerId, trustPathForListing(row, viewerId, ctx)),
  );

  const sellerSet = new Set(
    listings.map((row) => (row.sellerId === "me" ? viewerId : row.sellerId)),
  );
  const network = Array.from(ctx.networkPeople.values()).filter((p) =>
    sellerSet.has(p.id),
  );

  return { members: ctx.members, network, listings };
}

export async function listingTrustPath(
  viewerId: string,
  sellerId: string,
): Promise<TrustHop[]> {
  const ctx = await loadTrustContext(viewerId);
  return trustPathForListing({ sellerId }, viewerId, ctx);
}

function trustPathForListing(
  row: { sellerId: string },
  viewerId: string,
  ctx: TrustContext,
): TrustHop[] {
  if (row.sellerId === viewerId) return [];
  if (ctx.directSet.has(row.sellerId)) return [];

  const hit = ctx.connectorBySeller.get(row.sellerId);
  if (!hit) return [];

  const bridge = hit.bridge;
  const myRelation = ctx.memberById.get(bridge.id)?.relation;
  const label = myRelation
    ? `${relationLabels[myRelation]} من`
    : "آشنای من";

  return [{ personId: bridge.id, relationLabel: label }];
}

/** True when viewer may open a listing (direct circle or one FoF hop). */
export async function canViewListing(
  viewerId: string,
  sellerId: string,
): Promise<boolean> {
  if (sellerId === viewerId) return true;
  const direct = await prisma.circleEdge.findUnique({
    where: {
      fromUserId_toUserId: {
        fromUserId: viewerId,
        toUserId: sellerId,
      },
    },
  });
  if (direct) return true;

  const myEdges = await prisma.circleEdge.findMany({
    where: { fromUserId: viewerId },
    select: { toUserId: true },
  });
  const directIds = myEdges.map((e) => e.toUserId);
  if (directIds.length === 0) return false;

  const hop = await prisma.circleEdge.findFirst({
    where: {
      fromUserId: { in: directIds },
      toUserId: sellerId,
    },
  });
  return Boolean(hop);
}
