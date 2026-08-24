import { writeAdminAudit } from "@/lib/admin-audit";
import { ADMIN_ROLES, requireAdmin, sessionAdminId } from "@/lib/admin-auth";
import { invalidateAdminUsersCache } from "@/lib/admin-users";
import { parseAdminReason } from "@/lib/admin-http";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";

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

    const body = await readJson<{ reason?: unknown }>(req);

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, bannedAt: true, bannedUntil: true, banReason: true },
    });
    if (!user) return jsonError("کاربر پیدا نشد", 404);
    if (!user.bannedAt) return jsonError("این حساب مسدود نیست", 409);

    await prisma.user.update({
      where: { id: user.id },
      data: { bannedAt: null, bannedUntil: null, banReason: null },
    });

    await writeAdminAudit({
      adminUserId: adminId,
      action: "user.unban",
      targetType: "User",
      targetId: user.id,
      reason: parseAdminReason(body?.reason) || null,
      meta: {
        previousBannedAt: user.bannedAt.toISOString(),
        previousBannedUntil: user.bannedUntil?.toISOString() ?? null,
      },
    });

    invalidateAdminUsersCache();

    return Response.json({
      ok: true,
      id: user.id,
      ban: {
        banned: false,
        bannedAt: null,
        bannedUntil: null,
        banReason: null,
        permanent: false,
      },
    });
  });
}
