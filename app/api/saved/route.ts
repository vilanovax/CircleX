import { listingAccess } from "@/lib/circle-network";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const body = await readJson<{ listingId?: unknown }>(req);
    const listingId =
      typeof body?.listingId === "string" ? body.listingId.trim() : "";
    if (!listingId) return jsonError("آگهی نامعتبر است", 400);

    const listing = await prisma.marketListing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true, dealStatus: true },
    });
    if (!listing) return jsonError("آگهی پیدا نشد", 404);
    if (listing.dealStatus === "inactive" && listing.sellerId !== session.id) {
      return jsonError("آگهی پیدا نشد", 404);
    }

    const access = await listingAccess(session.id, listing.sellerId);
    if (!access.ok) return jsonError("این آگهی در حلقه تو نیست", 403);

    const existing = await prisma.savedListing.findUnique({
      where: {
        userId_listingId: { userId: session.id, listingId: listing.id },
      },
    });
    if (existing) {
      await prisma.savedListing.delete({ where: { id: existing.id } });
    } else {
      await prisma.savedListing.create({
        data: { userId: session.id, listingId: listing.id },
      });
    }

    const rows = await prisma.savedListing.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      select: { listingId: true },
    });
    return Response.json({ saved: rows.map((row) => row.listingId) });
  });
}
