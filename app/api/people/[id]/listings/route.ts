import { listingAccess } from "@/lib/circle-network";
import { prisma } from "@/lib/db";
import { jsonError, withDb } from "@/lib/http";
import { listingEndorsementsInclude, toClientListing } from "@/lib/mappers";
import { getSessionUser } from "@/lib/server-auth";
import { listingViewerFlags } from "@/lib/server-listing-privacy";
import { viewerMayReadListing } from "@/lib/server-listing-visibility";
import {
  listingShareHitsForViewer,
  sellerReachableViaForward,
  trustPathViaBridge,
} from "@/lib/listing-share-access";

export const dynamic = "force-dynamic";

/** Seller catalog for a person page — live plus closed, if the viewer can reach them. */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const sellerId = params.id?.trim();
    if (!sellerId) return jsonError("فرد مشخص نیست", 400);

    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true },
    });
    if (!seller) return jsonError("این فرد پیدا نشد", 404);

    const isMe = sellerId === session.id;
    const access = await listingAccess(session.id, sellerId);
    const viaForward =
      !access.ok && !isMe
        ? await sellerReachableViaForward(session.id, sellerId)
        : false;
    if (!access.ok && !viaForward) {
      return jsonError("این فرد از مسیر حلقه‌ات به تو نمی‌رسد", 403);
    }

    const rows = await prisma.marketListing.findMany({
      where: { sellerId },
      include: listingEndorsementsInclude,
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    const flags = await listingViewerFlags(session.id, rows);
    const viewerEdge = isMe
      ? null
      : await prisma.circleEdge.findUnique({
          where: {
            fromUserId_toUserId: {
              fromUserId: session.id,
              toUserId: sellerId,
            },
          },
          select: { trustGroup: true },
        });
    const groupScore = { A: 3, B: 2, C: 1 } as const;

    const privacyOk = await Promise.all(
      rows.map(async (row) => {
        if (flags.blockedIds.has(row.id)) return false;
        if (isMe) return true;
        return viewerMayReadListing({
          viewerId: session.id,
          sellerId: row.sellerId,
          privacy: row.privacy,
          dealStatus: row.dealStatus,
          listingId: row.id,
          hideIdentity: row.hideIdentity,
          excludeRelationTypes: row.excludeRelationTypes,
        });
      }),
    );

    const visibleRows = rows.filter((_, i) => privacyOk[i]);
    const shareHits = isMe
      ? new Map()
      : await listingShareHitsForViewer(session.id, visibleRows);
    const hopByBridge = new Map<string, Awaited<ReturnType<typeof trustPathViaBridge>>>();
    for (const hit of Array.from(shareHits.values())) {
      if (hopByBridge.has(hit.bridgeUserId)) continue;
      hopByBridge.set(
        hit.bridgeUserId,
        await trustPathViaBridge(session.id, hit.bridgeUserId),
      );
    }

    const listings = visibleRows.map((row) => {
      const hit = shareHits.get(row.id);
      const trustPath =
        access.trustPath.length > 0
          ? access.trustPath
          : hit
            ? (hopByBridge.get(hit.bridgeUserId) ?? [])
            : [];
      return toClientListing(row, session.id, trustPath, {
        revealed: flags.revealedIds.has(row.id),
        excludePersonIds: flags.excludeIdsByListing.get(row.id),
        identityRevealedPeerIds: flags.revealPeersByListing.get(row.id),
        viewerDirect: isMe || Boolean(viewerEdge),
        viewerTrustScore: isMe
          ? undefined
          : viewerEdge
            ? groupScore[viewerEdge.trustGroup]
            : 1,
      });
    });

    return Response.json({ listings });
  });
}
