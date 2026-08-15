import { canViewListing, listingTrustPath } from "@/lib/circle-network";
import { prisma } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { toClientListing } from "@/lib/mappers";
import { parseDealStatus } from "@/lib/listing-payload";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const row = await prisma.marketListing.findUnique({
    where: { id: params.id },
  });
  if (!row) return jsonError("آگهی پیدا نشد", 404);

  if (!(await canViewListing(session.id, row.sellerId))) {
    return jsonError("این آگهی در حلقه تو نیست", 403);
  }

  const trustPath = await listingTrustPath(session.id, row.sellerId);
  return Response.json({
    listing: toClientListing(row, session.id, trustPath),
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
    return jsonError("فقط صاحب آگهی می‌تواند وضعیت را عوض کند", 403);
  }

  const body = await readJson<{ dealStatus?: unknown }>(req);
  const dealStatus = parseDealStatus(body?.dealStatus);
  if (!dealStatus) return jsonError("وضعیت معامله نامعتبر است", 400);

  const updated = await prisma.marketListing.update({
    where: { id: row.id },
    data: { dealStatus },
  });

  return Response.json({ listing: toClientListing(updated, session.id) });
}
