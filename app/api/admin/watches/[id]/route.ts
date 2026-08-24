import { writeAdminAudit } from "@/lib/admin-audit";
import { ADMIN_ROLES, requireAdmin, sessionAdminId } from "@/lib/admin-auth";
import { parseAdminReason } from "@/lib/admin-http";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";

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

    const id = String(params.id ?? "").trim();
    if (!id) return jsonError("نامعتبر است", 400);

    const body = await readJson<{ enabled?: unknown; reason?: unknown }>(req);
    if (typeof body?.enabled !== "boolean") {
      return jsonError("وضعیت نامعتبر است", 400);
    }
    const reason = parseAdminReason(body?.reason);

    const row = await prisma.listingWatch.findUnique({
      where: { id },
      select: { id: true, enabled: true, adminDisabledAt: true, userId: true },
    });
    if (!row) return jsonError("پیدا نشد", 404);

    const enabled = body.enabled;
    const updated = await prisma.listingWatch.update({
      where: { id: row.id },
      data: enabled
        ? { enabled: true, adminDisabledAt: null }
        : { enabled: false, adminDisabledAt: new Date() },
    });

    await writeAdminAudit({
      adminUserId: adminId,
      action: enabled ? "watch.enable" : "watch.disable",
      targetType: "ListingWatch",
      targetId: row.id,
      reason: reason || null,
      meta: {
        enabled,
        previousEnabled: row.enabled,
        ownerId: row.userId,
      },
    });

    return Response.json({
      ok: true,
      id: updated.id,
      enabled: updated.enabled,
      adminLocked: Boolean(updated.adminDisabledAt),
    });
  });
}
