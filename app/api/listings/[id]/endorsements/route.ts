import { listingAccess } from "@/lib/circle-network";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import {
  listingEndorsementsInclude,
  toClientEndorsements,
} from "@/lib/mappers";
import { parseEndorsementVisibility, parseEndorsementWrite } from "@/lib/listing-payload";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

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
      return jsonError("روی آگهی خودت حرف نمی‌گذاری", 403);
    }

    const access = await listingAccess(session.id, listing.sellerId);
    if (!access.ok) {
      return jsonError("این آگهی در حلقه تو نیست", 403);
    }

    const parsed = parseEndorsementWrite(await readJson(req));
    if (!parsed.ok) return jsonError(parsed.error, 400);

    if (parsed.clear) {
      await prisma.listingEndorsement.deleteMany({
        where: { listingId: listing.id, personId: session.id },
      });
    } else {
      await prisma.listingEndorsement.upsert({
        where: {
          listingId_personId: {
            listingId: listing.id,
            personId: session.id,
          },
        },
        create: {
          listingId: listing.id,
          personId: session.id,
          types: parsed.types,
          note: parsed.note ?? null,
        },
        update: {
          types: parsed.types,
          note: parsed.note ?? null,
        },
      });
    }

    const row = await prisma.marketListing.findUnique({
      where: { id: listing.id },
      include: listingEndorsementsInclude,
    });

    return Response.json({
      endorsements: toClientEndorsements(
        row?.endorsements,
        session.id,
        listing.sellerId,
      ),
    });
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const listing = await prisma.marketListing.findUnique({
      where: { id: params.id },
      select: { id: true, sellerId: true },
    });
    if (!listing) return jsonError("آگهی پیدا نشد", 404);
    if (listing.sellerId !== session.id) {
      return jsonError("فقط صاحب آگهی می‌تواند نمایش حرف را عوض کند", 403);
    }

    const parsed = parseEndorsementVisibility(await readJson(req));
    if (!parsed.ok) return jsonError(parsed.error, 400);
    if (parsed.personId === session.id) {
      return jsonError("نظر نامعتبر است", 400);
    }

    const updated = await prisma.listingEndorsement.updateMany({
      where: { listingId: listing.id, personId: parsed.personId },
      data: { hidden: parsed.hidden },
    });
    if (updated.count === 0) return jsonError("این حرف پیدا نشد", 404);

    const row = await prisma.marketListing.findUnique({
      where: { id: listing.id },
      include: listingEndorsementsInclude,
    });

    return Response.json({
      endorsements: toClientEndorsements(
        row?.endorsements,
        session.id,
        listing.sellerId,
      ),
    });
  });
}
