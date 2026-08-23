import { writeAdminAudit } from "@/lib/admin-audit";
import { ADMIN_ROLES, requireAdmin, sessionAdminId } from "@/lib/admin-auth";
import { parseAdminReason } from "@/lib/admin-http";
import { banPublicState } from "@/lib/ban";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { destroyAllUserSessions } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { roles: [...ADMIN_ROLES.contentWrite] });
    if (!auth.ok) return auth.response;
    const adminId = sessionAdminId(auth.actor);
    if (!adminId) return jsonError("دسترسی نداری", 403, "forbidden");

    const body = await readJson<{ until?: unknown; reason?: unknown }>(req);
    const reason = parseAdminReason(body?.reason);
    if (reason.length < 3) {
      return jsonError("دلیل مسدودسازی لازم است", 400);
    }

    let bannedUntil: Date | null = null;
    if (body?.until != null && body.until !== "" && body.until !== "permanent") {
      if (typeof body.until !== "string") {
        return jsonError("تاریخ پایان نامعتبر است", 400);
      }
      const parsed = new Date(body.until);
      if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
        return jsonError("تاریخ پایان باید در آینده باشد", 400);
      }
      bannedUntil = parsed;
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, bannedAt: true },
    });
    if (!user) return jsonError("کاربر پیدا نشد", 404);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        bannedAt: new Date(),
        bannedUntil,
        banReason: reason,
      },
      select: { bannedAt: true, bannedUntil: true, banReason: true },
    });

    const revoked = await destroyAllUserSessions(user.id);

    await writeAdminAudit({
      adminUserId: adminId,
      action: "user.ban",
      targetType: "User",
      targetId: user.id,
      reason,
      meta: {
        permanent: bannedUntil === null,
        bannedUntil: bannedUntil?.toISOString() ?? null,
        sessionsRevoked: revoked,
      },
    });

    return Response.json({
      ok: true,
      id: user.id,
      sessionsRevoked: revoked,
      ban: banPublicState(updated),
    });
  });
}
