import { writeAdminAudit } from "@/lib/admin-audit";
import { ADMIN_ROLES, requireAdmin, sessionAdminId } from "@/lib/admin-auth";
import { parseAdminReason } from "@/lib/admin-http";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { destroyAllUserSessions } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { roles: [...ADMIN_ROLES.supportWrite] });
    if (!auth.ok) return auth.response;
    const adminId = sessionAdminId(auth.actor);
    if (!adminId) return jsonError("دسترسی نداری", 403, "forbidden");

    const body = await readJson<{ reason?: unknown }>(req);

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!user) return jsonError("کاربر پیدا نشد", 404);

    const revoked = await destroyAllUserSessions(user.id);

    await writeAdminAudit({
      adminUserId: adminId,
      action: "user.sessions.revoke",
      targetType: "User",
      targetId: user.id,
      reason: parseAdminReason(body?.reason) || null,
      meta: { sessionsRevoked: revoked },
    });

    return Response.json({ ok: true, id: user.id, sessionsRevoked: revoked });
  });
}
