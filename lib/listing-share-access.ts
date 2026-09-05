import { prisma } from "@/lib/db";
import { relationLabels } from "@/lib/labels";
import {
  listingBroadcastOpen,
  listingForwardUnlocksThis,
} from "@/lib/listing-share";
import type { TrustHop } from "@/lib/types";
import { Prisma } from "@prisma/client";

export type ListingShareHit = {
  listingId: string;
  bridgeUserId: string;
};

export async function recordListingForwardGrant(opts: {
  listingId: string;
  sellerId: string;
  granteeId: string;
  sourceId: string;
  privacy: string;
  hideIdentity: boolean;
}): Promise<void> {
  if (opts.granteeId === opts.sourceId) return;
  if (opts.granteeId === opts.sellerId) return;
  if (opts.sourceId === opts.sellerId) return;
  if (!listingForwardUnlocksThis(opts.privacy, opts.hideIdentity)) return;

  const opensCatalog = listingBroadcastOpen(opts.privacy, opts.hideIdentity);

  await prisma.listingVisibilityGrant.upsert({
    where: {
      listingId_granteeId_sourceId: {
        listingId: opts.listingId,
        granteeId: opts.granteeId,
        sourceId: opts.sourceId,
      },
    },
    create: {
      kind: "forward",
      listingId: opts.listingId,
      sellerId: opts.sellerId,
      granteeId: opts.granteeId,
      sourceId: opts.sourceId,
      opensCatalog,
    },
    update: { opensCatalog },
  });
}

export async function sellerReachableViaForward(
  viewerId: string,
  sellerId: string,
): Promise<boolean> {
  if (viewerId === sellerId) return true;
  const row = await prisma.listingVisibilityGrant.findFirst({
    where: { granteeId: viewerId, sellerId, opensCatalog: true },
    select: { id: true },
  });
  return Boolean(row);
}

export async function listingVisibleViaShare(opts: {
  viewerId: string;
  listingId: string;
  sellerId: string;
  privacy: string;
  hideIdentity: boolean;
}): Promise<{ ok: boolean; bridgeUserId?: string }> {
  if (opts.viewerId === opts.sellerId) return { ok: false };
  if (opts.hideIdentity) return { ok: false };

  const broadcast = listingBroadcastOpen(opts.privacy, opts.hideIdentity);
  const forwardThis = listingForwardUnlocksThis(opts.privacy, opts.hideIdentity);

  if (broadcast) {
    const endorsement = await prisma.listingEndorsement.findFirst({
      where: {
        listingId: opts.listingId,
        personId: { notIn: [opts.viewerId, opts.sellerId] },
        person: {
          edgesFrom: { some: { toUserId: opts.viewerId } },
        },
      },
      select: { personId: true },
    });
    if (endorsement) {
      return { ok: true, bridgeUserId: endorsement.personId };
    }
  }

  if (!forwardThis && !broadcast) return { ok: false };

  const grant = await prisma.listingVisibilityGrant.findFirst({
    where: {
      granteeId: opts.viewerId,
      OR: [
        ...(forwardThis ? [{ listingId: opts.listingId }] : []),
        ...(broadcast ? [{ sellerId: opts.sellerId, opensCatalog: true }] : []),
      ],
    },
    select: { sourceId: true, listingId: true },
  });
  if (!grant) return { ok: false };
  return { ok: true, bridgeUserId: grant.sourceId };
}

export async function listingShareHitsForViewer(
  viewerId: string,
  listings: Array<{
    id: string;
    sellerId: string;
    privacy: string;
    hideIdentity: boolean;
  }>,
): Promise<Map<string, ListingShareHit>> {
  const hits = new Map<string, ListingShareHit>();
  if (listings.length === 0) return hits;

  const listingIds = listings.map((row) => row.id);
  const sellerIds = Array.from(new Set(listings.map((row) => row.sellerId)));
  const byId = new Map(listings.map((row) => [row.id, row]));

  const [endorsements, grants] = await Promise.all([
    prisma.listingEndorsement.findMany({
      where: {
        listingId: { in: listingIds },
        personId: { not: viewerId },
        person: { edgesFrom: { some: { toUserId: viewerId } } },
      },
      select: { listingId: true, personId: true, listing: { select: { sellerId: true } } },
    }),
    prisma.listingVisibilityGrant.findMany({
      where: {
        granteeId: viewerId,
        OR: [
          { listingId: { in: listingIds } },
          { sellerId: { in: sellerIds } },
        ],
      },
      select: { listingId: true, sellerId: true, sourceId: true, opensCatalog: true },
    }),
  ]);

  for (const row of endorsements) {
    const listing = byId.get(row.listingId);
    if (!listing) continue;
    if (row.personId === listing.sellerId) continue;
    if (!listingBroadcastOpen(listing.privacy, listing.hideIdentity)) continue;
    if (!hits.has(row.listingId)) {
      hits.set(row.listingId, {
        listingId: row.listingId,
        bridgeUserId: row.personId,
      });
    }
  }

  for (const grant of grants) {
    for (const listing of listings) {
      if (hits.has(listing.id)) continue;
      const thisListing =
        grant.listingId === listing.id &&
        listingForwardUnlocksThis(listing.privacy, listing.hideIdentity);
      const catalog =
        grant.opensCatalog &&
        grant.sellerId === listing.sellerId &&
        listingBroadcastOpen(listing.privacy, listing.hideIdentity);
      if (!thisListing && !catalog) continue;
      hits.set(listing.id, {
        listingId: listing.id,
        bridgeUserId: grant.sourceId,
      });
    }
  }

  return hits;
}

export async function trustPathViaBridge(
  viewerId: string,
  bridgeUserId: string,
): Promise<TrustHop[]> {
  const [outEdge, inEdge] = await Promise.all([
    prisma.circleEdge.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: viewerId,
          toUserId: bridgeUserId,
        },
      },
      select: { relationType: true },
    }),
    prisma.circleEdge.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: bridgeUserId,
          toUserId: viewerId,
        },
      },
      select: { relationType: true },
    }),
  ]);
  const label = outEdge
    ? `${relationLabels[outEdge.relationType]} من`
    : inEdge
      ? "از حلقه‌اش"
      : "از معرفی";
  return [{ personId: bridgeUserId, relationLabel: label }];
}

/** Extra listings that reach the viewer only via endorsement or forward. */
export function sqlListingShareOr(viewerId: string): Prisma.Sql {
  return Prisma.sql`(
    (
      m.privacy = 'ABC'
      AND m."hideIdentity" = false
      AND EXISTS (
        SELECT 1 FROM "ListingEndorsement" AS e
        INNER JOIN "CircleEdge" AS ce
          ON ce."fromUserId" = e."personId"
         AND ce."toUserId" = ${viewerId}
        WHERE e."listingId" = m.id
          AND e."personId" <> ${viewerId}
          AND e."personId" <> m."sellerId"
      )
    )
    OR EXISTS (
      SELECT 1 FROM "ListingVisibilityGrant" AS g
      WHERE g."granteeId" = ${viewerId}
        AND (
          (
            g."listingId" = m.id
            AND m."hideIdentity" = false
            AND m.privacy IN ('ABC', 'referral')
          )
          OR (
            g."sellerId" = m."sellerId"
            AND g."opensCatalog" = true
            AND m."hideIdentity" = false
            AND m.privacy = 'ABC'
          )
        )
    )
  )`;
}
