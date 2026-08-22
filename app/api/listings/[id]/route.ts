import { Prisma } from "@prisma/client";
import { listingAccess } from "@/lib/circle-network";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { listingEndorsementsInclude, toClientListing } from "@/lib/mappers";
import { parseDealStatus, parseListingWrite } from "@/lib/listing-payload";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const row = await prisma.marketListing.findUnique({
      where: { id: params.id },
      include: listingEndorsementsInclude,
    });
    if (!row) return jsonError("آگهی پیدا نشد", 404);
    if (row.dealStatus === "inactive" && row.sellerId !== session.id) {
      return jsonError("آگهی پیدا نشد", 404);
    }

    const access = await listingAccess(session.id, row.sellerId);
    if (!access.ok) {
      const viaMessage = await prisma.directMessage.findFirst({
        where: {
          listingId: row.id,
          OR: [{ toUserId: session.id }, { fromUserId: session.id }],
        },
        select: { id: true },
      });
      if (!viaMessage) {
        return jsonError("این آگهی در حلقه تو نیست", 403);
      }
    }

    return Response.json({
      listing: toClientListing(row, session.id, access.trustPath),
    });
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const row = await prisma.marketListing.findUnique({
    where: { id: params.id },
  });
  if (!row) return jsonError("آگهی پیدا نشد", 404);
  if (row.sellerId !== session.id) {
    return jsonError("فقط صاحب آگهی می‌تواند آگهی را تغییر دهد", 403);
  }

  const body = await readJson<Record<string, unknown>>(req);
  if (!body || typeof body !== "object") {
    return jsonError("بدنه نامعتبر است", 400);
  }

  const dealStatus = parseDealStatus(body.dealStatus);
  const isWrite =
    body.title != null ||
    body.description != null ||
    body.type != null ||
    body.image != null;

  if (isWrite) {
    const parsed = parseListingWrite(body);
    if (!parsed.ok) return jsonError(parsed.error, 400);
    const updated = await prisma.marketListing.update({
      where: { id: row.id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        type: parsed.data.type,
        price: parsed.data.price ?? null,
        category: parsed.data.category,
        image: parsed.data.image,
        images: parsed.data.images,
        condition: parsed.data.condition ?? null,
        privacy: parsed.data.privacy,
        specs: parsed.data.specs
          ? (parsed.data.specs as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        area: parsed.data.area ?? null,
        ...(dealStatus ? { dealStatus } : {}),
      },
      include: listingEndorsementsInclude,
    });
    return Response.json({ listing: toClientListing(updated, session.id) });
  }

  if (!dealStatus) return jsonError("وضعیت معامله نامعتبر است", 400);

  const updated = await prisma.marketListing.update({
    where: { id: row.id },
    data: { dealStatus },
    include: listingEndorsementsInclude,
  });

  return Response.json({ listing: toClientListing(updated, session.id) });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const row = await prisma.marketListing.findUnique({
    where: { id: params.id },
    select: { id: true, sellerId: true },
  });
  if (!row) return jsonError("آگهی پیدا نشد", 404);
  if (row.sellerId !== session.id) {
    return jsonError("فقط صاحب آگهی می‌تواند آگهی را حذف کند", 403);
  }

  await prisma.marketListing.delete({ where: { id: row.id } });
  return Response.json({ ok: true });
}
