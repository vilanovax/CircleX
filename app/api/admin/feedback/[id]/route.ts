import type { AppFeedbackStatus } from "@prisma/client";
import { writeAdminAudit } from "@/lib/admin-audit";
import { ADMIN_ROLES, requireAdmin, sessionAdminId } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const auth = await requireAdmin(req, {
      roles: [...ADMIN_ROLES.supportWrite],
    });
    if (!auth.ok) return auth.response;
    const adminId = sessionAdminId(auth.actor);
    if (!adminId) return jsonError("دسترسی نداری", 403, "forbidden");

    const body = await readJson<{ status?: unknown; reason?: unknown }>(req);
    const statusRaw = body?.status;
    if (
      statusRaw !== "open" &&
      statusRaw !== "reviewed" &&
      statusRaw !== "closed"
    ) {
      return jsonError("وضعیت نامعتبر است", 400);
    }
    const status: AppFeedbackStatus = statusRaw;
    const reason =
      typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";

    const existing = await prisma.appFeedback.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) return jsonError("پیام پیدا نشد", 404);

    const row = await prisma.appFeedback.update({
      where: { id: existing.id },
      data: { status },
    });

    await writeAdminAudit({
      adminUserId: adminId,
      action: "app_feedback.update",
      targetType: "AppFeedback",
      targetId: row.id,
      reason: reason || null,
      meta: { status },
    });

    return Response.json({
      ok: true,
      id: row.id,
      status: row.status,
    });
  });
}
