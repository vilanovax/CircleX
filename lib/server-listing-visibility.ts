import { listingAccess } from "@/lib/circle-network";
import { prisma } from "@/lib/db";
import { LISTING_PRIVACY } from "@/lib/listing-payload";
import { parseRelationTypes } from "@/lib/listing-privacy";
import { listingVisibleViaShare } from "@/lib/listing-share-access";
import { listingBlockedForViewer } from "@/lib/server-listing-privacy";
import { requiredScore } from "@/lib/trust";
import type { Privacy, TrustHop } from "@/lib/types";

const LEVEL = { A: 3, B: 2, C: 1 } as const;

function asPrivacy(value: string): Privacy {
  return LISTING_PRIVACY.includes(value as Privacy)
    ? (value as Privacy)
    : "ABC";
}

/**
 * Sync privacy gate matching client `canView` (owner always allowed).
 * Use when trustPath + viewerTrustScore are already computed.
 */
export function privacyVisibleToViewer(opts: {
  viewerId: string;
  ownerId: string;
  privacy: string;
  trustPath: TrustHop[];
  viewerTrustScore: number;
  dealStatus?: string | null;
}): boolean {
  if (opts.viewerId === opts.ownerId) return true;
  if (opts.dealStatus === "inactive") return false;
  const privacy = asPrivacy(opts.privacy);
  if (privacy === "approved" && opts.trustPath.length > 0) return false;
  return opts.viewerTrustScore >= requiredScore(privacy);
}

/**
 * Owner may always read; others need the same rules as feed `canView`.
 */
export async function viewerMayReadListing(opts: {
  viewerId: string;
  sellerId: string;
  privacy: string;
  dealStatus: string | null;
  listingId?: string;
  hideIdentity?: boolean;
  excludeRelationTypes?: string[] | unknown;
}): Promise<boolean> {
  if (opts.viewerId === opts.sellerId) return true;
  return viewerCanSeeListing(opts);
}

/**
 * Same rules as feed `canView`: network reach + trust group + listing privacy.
 * Owner is never a watch target (caller should skip seller).
 */
export async function viewerCanSeeListing(opts: {
  viewerId: string;
  sellerId: string;
  privacy: string;
  dealStatus: string | null;
  listingId?: string;
  hideIdentity?: boolean;
  excludeRelationTypes?: string[] | unknown;
}): Promise<boolean> {
  if (opts.dealStatus === "inactive") return false;
  if (opts.viewerId === opts.sellerId) return false;

  if (opts.listingId) {
    const blocked = await listingBlockedForViewer({
      listingId: opts.listingId,
      sellerId: opts.sellerId,
      viewerId: opts.viewerId,
      excludeRelationTypes: parseRelationTypes(opts.excludeRelationTypes),
    });
    if (blocked) return false;

    let hideIdentity = opts.hideIdentity;
    if (hideIdentity === undefined) {
      const row = await prisma.marketListing.findUnique({
        where: { id: opts.listingId },
        select: { hideIdentity: true },
      });
      hideIdentity = row?.hideIdentity ?? false;
    }
    const share = await listingVisibleViaShare({
      viewerId: opts.viewerId,
      listingId: opts.listingId,
      sellerId: opts.sellerId,
      privacy: opts.privacy,
      hideIdentity,
    });
    if (share.ok) return true;
  }

  const privacy = asPrivacy(opts.privacy);
  const access = await listingAccess(opts.viewerId, opts.sellerId);
  if (!access.ok) return false;
  if (privacy === "approved" && access.trustPath.length > 0) return false;

  const direct = await prisma.circleEdge.findUnique({
    where: {
      fromUserId_toUserId: {
        fromUserId: opts.viewerId,
        toUserId: opts.sellerId,
      },
    },
    select: { trustGroup: true },
  });
  if (direct) {
    return LEVEL[direct.trustGroup] >= requiredScore(privacy);
  }

  const hopId = access.trustPath[0]?.personId;
  if (!hopId) return false;
  const bridge = await prisma.circleEdge.findUnique({
    where: {
      fromUserId_toUserId: {
        fromUserId: opts.viewerId,
        toUserId: hopId,
      },
    },
    select: { trustGroup: true },
  });
  if (!bridge) return false;
  // Same as client trustScore: one-hop FoF keeps the connector's group.
  const hopPenalty = Math.max(0, access.trustPath.length - 1);
  const score = Math.max(0, LEVEL[bridge.trustGroup] - hopPenalty);
  return score >= requiredScore(privacy);
}
