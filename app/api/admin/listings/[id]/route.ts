import { writeAdminAudit } from "@/lib/admin-audit";
import { ADMIN_ROLES, requireAdmin, sessionAdminId } from "@/lib/admin-auth";
import { parseAdminReason } from "@/lib/admin-http";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { notifyContentHidden } from "@/lib/server-notices";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { roles: [...ADMIN_ROLES.contentWrite] });
    if (!auth.ok) return auth.response;
    const adminId = sessionAdminId(auth.actor);
    if (!adminId) return jsonError("دسترسی نداری", 403, "forbidden");

    const body = await readJson<{
      hidden?: unknown;
      clearImage?: unknown;
      noticeToOwner?: unknown;
      reason?: unknown;
    }>(req);

    const listing = await prisma.marketListing.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        sellerId: true,
        dealStatus: true,
        image: true,
      },
    });
    if (!listing) return jsonError("آگهی پیدا نشد", 404);

    const reason = parseAdminReason(body?.reason);
    const clearImage = body?.clearImage === true;
    const noticeToOwner = body?.noticeToOwner !== false;
    const wantsHidden =
      typeof body?.hidden === "boolean" ? body.hidden : undefined;

    if (wantsHidden === undefined && !clearImage) {
      return jsonError("تغییری مشخص نشده", 400);
    }

    const nextStatus =
      wantsHidden === true
        ? "inactive"
        : wantsHidden === false
          ? "available"
          : undefined;

    const updated = await prisma.marketListing.update({
      where: { id: listing.id },
      data: {
        ...(nextStatus ? { dealStatus: nextStatus } : {}),
        ...(clearImage ? { image: "", images: [] } : {}),
      },
      select: { id: true, dealStatus: true, image: true },
    });

    if (
      wantsHidden === true &&
      listing.dealStatus !== "inactive" &&
      noticeToOwner
    ) {
      await notifyContentHidden({
        ownerId: listing.sellerId,
        kind: "listing",
        id: listing.id,
        title: listing.title,
      });
    }

    await writeAdminAudit({
      adminUserId: adminId,
      action: "listing.moderate",
      targetType: "MarketListing",
      targetId: listing.id,
      reason: reason || null,
      meta: {
        hidden: wantsHidden ?? listing.dealStatus === "inactive",
        clearImage,
        previousDealStatus: listing.dealStatus,
        nextDealStatus: updated.dealStatus,
      },
    });

    return Response.json({
      ok: true,
      id: updated.id,
      hidden: updated.dealStatus === "inactive",
      dealStatus: updated.dealStatus,
      hasImage: Boolean(updated.image),
    });
  });
}
