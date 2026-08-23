import { writeAdminAudit } from "@/lib/admin-audit";
import { ADMIN_ROLES, requireAdmin, sessionAdminId } from "@/lib/admin-auth";
import { parseAdminReason } from "@/lib/admin-http";
import { getAppSettings, inviteTtlMs } from "@/lib/app-settings";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { roles: [...ADMIN_ROLES.supportWrite] });
    if (!auth.ok) return auth.response;
    const adminId = sessionAdminId(auth.actor);
    if (!adminId) return jsonError("دسترسی نداری", 403, "forbidden");

    const body = await readJson<{ action?: unknown; reason?: unknown }>(req);
    const action = body?.action;
    if (action !== "revoke" && action !== "extend") {
      return jsonError("عمل نامعتبر است", 400);
    }

    const invite = await prisma.invite.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        inviterUserId: true,
      },
    });
    if (!invite) return jsonError("دعوت پیدا نشد", 404);

    if (action === "revoke") {
      if (invite.status !== "pending") {
        return jsonError("این دعوت دیگر قابل لغو نیست", 409, invite.status);
      }
      const updated = await prisma.invite.update({
        where: { id: invite.id },
        data: { status: "revoked" },
        select: { id: true, status: true, expiresAt: true },
      });
      await writeAdminAudit({
        adminUserId: adminId,
        action: "invite.revoke",
        targetType: "Invite",
        targetId: invite.id,
        reason: parseAdminReason(body?.reason) || null,
        meta: { previousStatus: invite.status },
      });
      return Response.json({
        ok: true,
        id: updated.id,
        status: updated.status,
        expiresAt: updated.expiresAt.toISOString(),
      });
    }

    if (invite.status !== "pending" && invite.status !== "expired") {
      return jsonError("فقط دعوت در انتظار یا منقضی تمدید می‌شود", 409, invite.status);
    }

    const settings = await getAppSettings();
    const expiresAt = new Date(
      Date.now() + inviteTtlMs(settings.growth.inviteTtlDays),
    );
    const updated = await prisma.invite.update({
      where: { id: invite.id },
      data: { status: "pending", expiresAt },
      select: { id: true, status: true, expiresAt: true },
    });
    await writeAdminAudit({
      adminUserId: adminId,
      action: "invite.extend",
      targetType: "Invite",
      targetId: invite.id,
      reason: parseAdminReason(body?.reason) || null,
      meta: {
        previousStatus: invite.status,
        previousExpiresAt: invite.expiresAt.toISOString(),
        expiresAt: updated.expiresAt.toISOString(),
      },
    });
    return Response.json({
      ok: true,
      id: updated.id,
      status: updated.status,
      expiresAt: updated.expiresAt.toISOString(),
    });
  });
}
