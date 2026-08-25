import { jsonError, readJson, withDb } from "@/lib/http";
import { prisma } from "@/lib/db";
import { listingEndorsementsInclude, toClientDirectMessage, toClientListing } from "@/lib/mappers";
import { getSessionUser } from "@/lib/server-auth";
import { listingViewerFlags } from "@/lib/server-listing-privacy";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const listing = await prisma.marketListing.findUnique({
      where: { id: params.id },
      include: listingEndorsementsInclude,
    });
    if (!listing) return jsonError("آگهی پیدا نشد", 404);
    if (listing.sellerId !== session.id) {
      return jsonError("فقط صاحب آگهی می‌تواند هویت را نمایش دهد", 403);
    }
    if (!listing.hideIdentity) {
      return jsonError("هویت این آگهی پنهان نیست", 400);
    }

    const body = await readJson<{ peerId?: unknown }>(req);
    const peerId = typeof body?.peerId === "string" ? body.peerId.trim() : "";
    if (!peerId || peerId === session.id) {
      return jsonError("مخاطب نامعتبر است", 400);
    }

    const thread = await prisma.directMessage.findFirst({
      where: {
        listingId: listing.id,
        listingScoped: true,
        hiddenAt: null,
        OR: [
          { fromUserId: session.id, toUserId: peerId },
          { fromUserId: peerId, toUserId: session.id },
        ],
      },
      select: { id: true },
    });
    if (!thread) {
      return jsonError("ابتدا در این گفتگو پیام رد و بدل شود", 400);
    }

    await prisma.listingIdentityReveal.upsert({
      where: {
        listingId_viewerId: { listingId: listing.id, viewerId: peerId },
      },
      create: { listingId: listing.id, viewerId: peerId },
      update: {},
    });

    const system = await prisma.directMessage.create({
      data: {
        fromUserId: session.id,
        toUserId: peerId,
        text: "",
        listingId: listing.id,
        listingScoped: true,
        kind: "system",
      },
    });

    const flags = await listingViewerFlags(session.id, [listing]);
    return Response.json({
      listing: toClientListing(listing, session.id, [], {
        revealed: flags.revealedIds.has(listing.id),
        excludePersonIds: flags.excludeIdsByListing.get(listing.id),
        identityRevealedPeerIds: flags.revealPeersByListing.get(listing.id),
      }),
      message: toClientDirectMessage(system, session.id),
    });
  });
}
