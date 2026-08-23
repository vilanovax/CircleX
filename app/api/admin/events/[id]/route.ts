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
      noticeToOwner?: unknown;
      reason?: unknown;
    }>(req);

    if (typeof body?.hidden !== "boolean") {
      return jsonError("وضعیت مخفی نامعتبر است", 400);
    }

    const row = await prisma.gathering.findUnique({
      where: { id: params.id },
      select: { id: true, title: true, hostId: true, hidden: true },
    });
    if (!row) return jsonError("رویداد پیدا نشد", 404);

    const updated = await prisma.gathering.update({
      where: { id: row.id },
      data: { hidden: body.hidden },
      select: { id: true, hidden: true },
    });

    if (body.hidden && !row.hidden && body?.noticeToOwner !== false) {
      await notifyContentHidden({
        ownerId: row.hostId,
        kind: "event",
        id: row.id,
        title: row.title,
      });
    }

    await writeAdminAudit({
      adminUserId: adminId,
      action: "event.moderate",
      targetType: "Gathering",
      targetId: row.id,
      reason: parseAdminReason(body?.reason) || null,
      meta: { hidden: updated.hidden, previousHidden: row.hidden },
    });

    return Response.json({ ok: true, id: updated.id, hidden: updated.hidden });
  });
}
