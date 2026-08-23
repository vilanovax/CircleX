import type { AdminRole, Prisma } from "@prisma/client";
import { writeAdminAudit } from "@/lib/admin-audit";
import { ADMIN_ROLES, requireAdmin, sessionAdminId } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/admin-password";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

const ROLES: AdminRole[] = ["superadmin", "moderator", "support", "analyst"];

function parseRole(value: unknown): AdminRole | null {
  return typeof value === "string" && ROLES.includes(value as AdminRole)
    ? (value as AdminRole)
    : null;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { roles: [...ADMIN_ROLES.operatorsWrite] });
    if (!auth.ok) return auth.response;
    const actorId = sessionAdminId(auth.actor);
    if (!actorId) return jsonError("دسترسی نداری", 403, "forbidden");

    const body = await readJson<{
      name?: unknown;
      role?: unknown;
      password?: unknown;
      disabled?: unknown;
    }>(req);

    const target = await prisma.adminUser.findUnique({
      where: { id: params.id },
    });
    if (!target) return jsonError("اپراتور پیدا نشد", 404, "not_found");

    const data: {
      name?: string;
      role?: AdminRole;
      passwordHash?: string;
      disabledAt?: Date | null;
    } = {};
    const meta: {
      name?: string;
      role?: AdminRole;
      passwordReset?: boolean;
      disabled?: boolean;
    } = {};

    if (typeof body?.name === "string") {
      const name = body.name.trim().slice(0, 80);
      if (name.length < 2) return jsonError("نام را بنویس", 400, "invalid");
      data.name = name;
      meta.name = name;
    }

    if (body?.role !== undefined) {
      const role = parseRole(body.role);
      if (!role) return jsonError("نقش نامعتبر است", 400, "invalid");
      if (target.role === "superadmin" && role !== "superadmin") {
        const remaining = await prisma.adminUser.count({
          where: {
            role: "superadmin",
            disabledAt: null,
            id: { not: target.id },
          },
        });
        if (remaining === 0) {
          return jsonError("آخرین مدیر کل را نمی‌شود پایین آورد", 400, "last_superadmin");
        }
      }
      data.role = role;
      meta.role = role;
    }

    if (typeof body?.password === "string") {
      if (body.password.length < 8) {
        return jsonError("رمز حداقل ۸ نویسه باشد", 400, "invalid");
      }
      data.passwordHash = hashPassword(body.password);
      meta.passwordReset = true;
    }

    if (typeof body?.disabled === "boolean") {
      if (body.disabled && target.id === actorId) {
        return jsonError("حساب خودت را نمی‌شود غیرفعال کرد", 400, "self");
      }
      if (body.disabled && target.role === "superadmin") {
        const remaining = await prisma.adminUser.count({
          where: {
            role: "superadmin",
            disabledAt: null,
            id: { not: target.id },
          },
        });
        if (remaining === 0) {
          return jsonError("آخرین مدیر کل را نمی‌شود غیرفعال کرد", 400, "last_superadmin");
        }
      }
      data.disabledAt = body.disabled ? new Date() : null;
      meta.disabled = body.disabled;
    }

    if (Object.keys(data).length === 0) {
      return jsonError("چیزی برای ذخیره نبود", 400, "invalid");
    }

    const updated = await prisma.adminUser.update({
      where: { id: target.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLoginAt: true,
        disabledAt: true,
        createdAt: true,
        _count: { select: { sessions: true } },
      },
    });

    if (data.passwordHash || data.disabledAt) {
      await prisma.adminSession.deleteMany({ where: { adminUserId: target.id } });
    }

    await writeAdminAudit({
      adminUserId: actorId,
      action: "operator.update",
      targetType: "admin_user",
      targetId: target.id,
      meta: meta as Prisma.InputJsonValue,
    });

    return Response.json({
      item: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        lastLoginAt: updated.lastLoginAt?.toISOString() ?? null,
        disabled: Boolean(updated.disabledAt),
        createdAt: updated.createdAt.toISOString(),
        sessions: data.passwordHash || data.disabledAt ? 0 : updated._count.sessions,
      },
    });
  });
}
