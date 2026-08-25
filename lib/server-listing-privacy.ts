import { prisma } from "@/lib/db";
import {
  parseRelationTypes,
  viewerExcludedFromListing,
} from "@/lib/listing-privacy";
import type { RelationType } from "@/lib/types";

export async function sellerRelationToViewer(
  sellerId: string,
  viewerId: string,
): Promise<RelationType | null> {
  const edge = await prisma.circleEdge.findUnique({
    where: {
      fromUserId_toUserId: {
        fromUserId: sellerId,
        toUserId: viewerId,
      },
    },
    select: { relationType: true },
  });
  return edge?.relationType ?? null;
}

export async function listingBlockedForViewer(opts: {
  listingId: string;
  sellerId: string;
  viewerId: string;
  excludeRelationTypes: RelationType[];
}): Promise<boolean> {
  if (opts.viewerId === opts.sellerId) return false;
  const [exclude, relation] = await Promise.all([
    prisma.listingExcludePerson.findUnique({
      where: {
        listingId_personId: {
          listingId: opts.listingId,
          personId: opts.viewerId,
        },
      },
      select: { personId: true },
    }),
    opts.excludeRelationTypes.length
      ? sellerRelationToViewer(opts.sellerId, opts.viewerId)
      : Promise.resolve(null),
  ]);
  return viewerExcludedFromListing({
    viewerId: opts.viewerId,
    excludePersonIds: exclude ? [opts.viewerId] : [],
    excludeRelationTypes: opts.excludeRelationTypes,
    sellerToViewerRelation: relation,
  });
}

export async function replaceListingExcludes(
  listingId: string,
  personIds: string[],
): Promise<void> {
  await prisma.$transaction([
    prisma.listingExcludePerson.deleteMany({ where: { listingId } }),
    ...(personIds.length
      ? [
          prisma.listingExcludePerson.createMany({
            data: personIds.map((personId) => ({ listingId, personId })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);
}

export async function listingViewerFlags(
  viewerId: string,
  rows: Array<{
    id: string;
    sellerId: string;
    excludeRelationTypes: RelationType[] | unknown;
  }>,
): Promise<{
  blockedIds: Set<string>;
  revealedIds: Set<string>;
  excludeIdsByListing: Map<string, string[]>;
  revealPeersByListing: Map<string, string[]>;
}> {
  const blockedIds = new Set<string>();
  const revealedIds = new Set<string>();
  const excludeIdsByListing = new Map<string, string[]>();
  const revealPeersByListing = new Map<string, string[]>();
  if (rows.length === 0) {
    return { blockedIds, revealedIds, excludeIdsByListing, revealPeersByListing };
  }

  const listingIds = rows.map((row) => row.id);
  const sellerIds = Array.from(new Set(rows.map((row) => row.sellerId)));
  const [excludeRows, revealRows, reverseEdges] = await Promise.all([
    prisma.listingExcludePerson.findMany({
      where: { listingId: { in: listingIds } },
      select: { listingId: true, personId: true },
    }),
    prisma.listingIdentityReveal.findMany({
      where: { listingId: { in: listingIds } },
      select: { listingId: true, viewerId: true },
    }),
    prisma.circleEdge.findMany({
      where: { fromUserId: { in: sellerIds }, toUserId: viewerId },
      select: { fromUserId: true, relationType: true },
    }),
  ]);

  const excludesByListing = new Map<string, string[]>();
  for (const row of excludeRows) {
    const list = excludesByListing.get(row.listingId) ?? [];
    list.push(row.personId);
    excludesByListing.set(row.listingId, list);
  }
  for (const [id, ids] of excludesByListing) excludeIdsByListing.set(id, ids);

  const revealsByListing = new Map<string, string[]>();
  for (const row of revealRows) {
    const list = revealsByListing.get(row.listingId) ?? [];
    list.push(row.viewerId);
    revealsByListing.set(row.listingId, list);
    if (row.viewerId === viewerId) revealedIds.add(row.listingId);
  }
  for (const [id, ids] of revealsByListing) revealPeersByListing.set(id, ids);

  const relationBySeller = new Map(
    reverseEdges.map((edge) => [edge.fromUserId, edge.relationType]),
  );

  for (const row of rows) {
    if (row.sellerId === viewerId) continue;
    if (
      viewerExcludedFromListing({
        viewerId,
        excludePersonIds: excludesByListing.get(row.id) ?? [],
        excludeRelationTypes: parseRelationTypes(row.excludeRelationTypes),
        sellerToViewerRelation: relationBySeller.get(row.sellerId) ?? null,
      })
    ) {
      blockedIds.add(row.id);
    }
  }

  return { blockedIds, revealedIds, excludeIdsByListing, revealPeersByListing };
}

export async function assertExcludePeopleInCircle(
  sellerId: string,
  personIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (personIds.length === 0) return { ok: true };
  if (personIds.includes(sellerId)) {
    return { ok: false, error: "نمی‌توانی خودت را از مخاطبان حذف کنی" };
  }
  const edges = await prisma.circleEdge.findMany({
    where: { fromUserId: sellerId, toUserId: { in: personIds } },
    select: { toUserId: true },
  });
  if (edges.length !== personIds.length) {
    return { ok: false, error: "فقط اعضای حلقه‌ات را می‌توانی استثنا کنی" };
  }
  return { ok: true };
}
