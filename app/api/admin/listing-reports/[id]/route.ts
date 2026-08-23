import type { ListingReportStatus } from "@prisma/client";
import { writeAdminAudit } from "@/lib/admin-audit";
import { requireAdmin, sessionAdminId } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { notifyListingReportResolved } from "@/lib/server-notices";

export const dynamic = "force-dynamic";

const WRITE_ROLES = ["moderator", "superadmin"] as const;

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { roles: [...WRITE_ROLES] });
    if (!auth.ok) return auth.response;
    const adminId = sessionAdminId(auth.actor);
    if (!adminId) return jsonError("دسترسی نداری", 403, "forbidden");

    const body = await readJson<{
      status?: unknown;
      hideListing?: unknown;
      noticeToReporter?: unknown;
      reason?: unknown;
    }>(req);

    const statusRaw = body?.status;
    if (statusRaw !== "reviewed" && statusRaw !== "dismissed") {
      return jsonError("وضعیت نامعتبر است", 400);
    }
    const status: Exclude<ListingReportStatus, "open"> = statusRaw;
    const hideListing = body?.hideListing === true;
    const noticeToReporter = body?.noticeToReporter === true;
    const reason =
      typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";

    const report = await prisma.listingReport.findUnique({
      where: { id: params.id },
      include: { listing: { select: { id: true, title: true, dealStatus: true } } },
    });
    if (!report) return jsonError("گزارش پیدا نشد", 404);

    await prisma.$transaction(async (tx) => {
      await tx.listingReport.update({
        where: { id: report.id },
        data: { status },
      });
      if (hideListing && report.listing.dealStatus !== "inactive") {
        await tx.marketListing.update({
          where: { id: report.listingId },
          data: { dealStatus: "inactive" },
        });
      }
    });

    if (noticeToReporter) {
      await notifyListingReportResolved({
        reporterId: report.reporterId,
        listingId: report.listingId,
        listingTitle: report.listing.title,
        status,
      });
    }

    await writeAdminAudit({
      adminUserId: adminId,
      action: "listing_report.update",
      targetType: "ListingReport",
      targetId: report.id,
      reason: reason || null,
      meta: {
        status,
        hideListing,
        noticeToReporter,
        listingId: report.listingId,
      },
    });

    return Response.json({
      ok: true,
      id: report.id,
      status,
      hideListing,
      noticeToReporter,
    });
  });
}
