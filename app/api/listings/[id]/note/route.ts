import { listingAccess } from "@/lib/circle-network";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { parsePersonalNote } from "@/lib/listing-payload";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

async function savedIds(userId: string): Promise<string[]> {
  const rows = await prisma.savedListing.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { listingId: true },
  });
  return rows.map((row) => row.listingId);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const listing = await prisma.marketListing.findUnique({
      where: { id: params.id },
      select: { id: true, sellerId: true, dealStatus: true },
    });
    if (!listing) return jsonError("آگهی پیدا نشد", 404);
    if (listing.dealStatus === "inactive" && listing.sellerId !== session.id) {
      return jsonError("آگهی پیدا نشد", 404);
    }
    if (listing.sellerId === session.id) {
      return jsonError("روی آگهی خودت یادداشت خصوصی نمی‌گذاری", 403);
    }

    const access = await listingAccess(session.id, listing.sellerId);
    if (!access.ok) return jsonError("این آگهی در حلقه تو نیست", 403);

    const parsed = parsePersonalNote(await readJson(req));
    if (!parsed.ok) return jsonError(parsed.error, 400);

    await prisma.$transaction(async (tx) => {
      if (!parsed.note) {
        await tx.listingPersonalNote.deleteMany({
          where: { userId: session.id, listingId: listing.id },
        });
        return;
      }
      await tx.listingPersonalNote.upsert({
        where: {
          userId_listingId: {
            userId: session.id,
            listingId: listing.id,
          },
        },
        create: {
          userId: session.id,
          listingId: listing.id,
          body: parsed.note,
        },
        update: { body: parsed.note },
      });
      await tx.savedListing.upsert({
        where: {
          userId_listingId: {
            userId: session.id,
            listingId: listing.id,
          },
        },
        create: {
          userId: session.id,
          listingId: listing.id,
        },
        update: {},
      });
    });

    return Response.json({
      note: parsed.note || null,
      saved: await savedIds(session.id),
    });
  });
}
