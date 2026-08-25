import { listingAccess } from "@/lib/circle-network";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

async function hiddenIds(userId: string): Promise<string[]> {
  const rows = await prisma.hiddenListing.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { listingId: true },
  });
  return rows.map((row) => row.listingId);
}

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
    if (listing.sellerId === session.id) {
      return jsonError("آگهی خودت را از فید پنهان نمی‌کنی", 403);
    }
    if (listing.dealStatus === "inactive") {
      return jsonError("آگهی پیدا نشد", 404);
    }

    const access = await listingAccess(session.id, listing.sellerId);
    if (!access.ok) return jsonError("این آگهی در حلقه تو نیست", 403);

    const existing = await prisma.hiddenListing.findUnique({
      where: {
        userId_listingId: { userId: session.id, listingId: listing.id },
      },
    });
    if (existing) {
      await prisma.hiddenListing.delete({ where: { id: existing.id } });
    } else {
      await prisma.hiddenListing.create({
        data: { userId: session.id, listingId: listing.id },
      });
    }

    return Response.json({ hidden: await hiddenIds(session.id) });
  });
}
