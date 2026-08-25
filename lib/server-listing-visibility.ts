import { listingAccess } from "@/lib/circle-network";
import { prisma } from "@/lib/db";
import { LISTING_PRIVACY } from "@/lib/listing-payload";
import { parseRelationTypes } from "@/lib/listing-privacy";
import { listingBlockedForViewer } from "@/lib/server-listing-privacy";
import { requiredScore } from "@/lib/trust";
import type { Privacy } from "@/lib/types";

const LEVEL = { A: 3, B: 2, C: 1 } as const;

function asPrivacy(value: string): Privacy {
  return LISTING_PRIVACY.includes(value as Privacy)
    ? (value as Privacy)
    : "ABC";
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
  const score = Math.max(0, LEVEL[bridge.trustGroup] - 1);
  return score >= requiredScore(privacy);
}
