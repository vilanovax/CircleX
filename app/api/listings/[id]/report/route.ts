import { listingAccess } from "@/lib/circle-network";
import { notifyAdminOfListingReport } from "@/lib/admin-notify";
import { assertFlag } from "@/lib/app-settings";
import { prisma } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { getSessionUser } from "@/lib/server-auth";
import type { ListingReportReason } from "@prisma/client";

export const dynamic = "force-dynamic";

const REASONS = new Set<ListingReportReason>([
  "inappropriate",
  "misleading",
  "spam",
  "other",
]);

function parseReason(raw: unknown): ListingReportReason | null {
  if (typeof raw !== "string") return null;
  return REASONS.has(raw as ListingReportReason)
    ? (raw as ListingReportReason)
    : null;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");
  const blocked = await assertFlag("listingReports");
  if (blocked !== true) return blocked;

  const listing = await prisma.marketListing.findUnique({
    where: { id: params.id },
    include: { seller: true },
  });
  if (!listing) return jsonError("آگهی پیدا نشد", 404);

  if (listing.sellerId === session.id) {
    return jsonError("نمی‌توانی آگهی خودت را گزارش کنی", 400);
  }

  const access = await listingAccess(session.id, listing.sellerId);
  if (!access.ok) {
    return jsonError("این آگهی در حلقه تو نیست", 403);
  }

  const body = await readJson<{ reason?: unknown; note?: unknown }>(req);
  const reason = parseReason(body?.reason);
  if (!reason) return jsonError("دلیل گزارش نامعتبر است", 400);

  const noteRaw = typeof body?.note === "string" ? body.note.trim() : "";
  const note = noteRaw.length > 0 ? noteRaw.slice(0, 500) : null;

  const existing = await prisma.listingReport.findUnique({
    where: {
      listingId_reporterId: {
        listingId: listing.id,
        reporterId: session.id,
      },
    },
  });
  if (existing) {
    return Response.json({
      ok: true,
      alreadyReported: true,
      reportId: existing.id,
    });
  }

  const report = await prisma.listingReport.create({
    data: {
      listingId: listing.id,
      reporterId: session.id,
      reason,
      note,
    },
  });

  await notifyAdminOfListingReport({
    reportId: report.id,
    reason: report.reason,
    note: report.note,
    listing: {
      id: listing.id,
      title: listing.title,
      sellerId: listing.sellerId,
      sellerName: listing.seller.name || "—",
      sellerPhone: listing.seller.phoneNormalized,
    },
    reporter: {
      id: session.id,
      name: session.name || "—",
      phone: session.phoneNormalized,
    },
    createdAt: report.createdAt.toISOString(),
  });

  return Response.json({ ok: true, alreadyReported: false, reportId: report.id });
}
