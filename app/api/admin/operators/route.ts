import type { AdminRole } from "@prisma/client";
import { writeAdminAudit } from "@/lib/admin-audit";
import { ADMIN_ROLES, requireAdmin, sessionAdminId } from "@/lib/admin-auth";
import { listEnvelope } from "@/lib/admin-http";
import {
  hashPassword,
  isValidAdminEmail,
  normalizeAdminEmail,
} from "@/lib/admin-password";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

const ROLES: AdminRole[] = ["superadmin", "moderator", "support", "analyst"];

function parseRole(value: unknown): AdminRole | null {
  return typeof value === "string" && ROLES.includes(value as AdminRole)
    ? (value as AdminRole)
    : null;
}

export async function GET(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { roles: [...ADMIN_ROLES.operatorsWrite] });
    if (!auth.ok) return auth.response;

    const rows = await prisma.adminUser.findMany({
      orderBy: { createdAt: "asc" },
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

    const items = rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
      disabled: Boolean(row.disabledAt),
      createdAt: row.createdAt.toISOString(),
      sessions: row._count.sessions,
    }));

    return Response.json(listEnvelope(items, { total: items.length, take: items.length, skip: 0 }));
  });
}

export async function POST(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { roles: [...ADMIN_ROLES.operatorsWrite] });
    if (!auth.ok) return auth.response;
    const actorId = sessionAdminId(auth.actor);
    if (!actorId) return jsonError("دسترسی نداری", 403, "forbidden");

    const body = await readJson<{
      email?: unknown;
      name?: unknown;
      role?: unknown;
      password?: unknown;
    }>(req);
    const email = normalizeAdminEmail(
      typeof body?.email === "string" ? body.email : "",
    );
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
    const role = parseRole(body?.role);
    const password = typeof body?.password === "string" ? body.password : "";

    if (!isValidAdminEmail(email)) {
      return jsonError("ایمیل معتبر نیست", 400, "invalid");
    }
    if (name.length < 2) {
      return jsonError("نام را بنویس", 400, "invalid");
    }
    if (!role) {
      return jsonError("نقش نامعتبر است", 400, "invalid");
    }
    if (password.length < 8) {
      return jsonError("رمز حداقل ۸ نویسه باشد", 400, "invalid");
    }

    const exists = await prisma.adminUser.findUnique({ where: { email } });
    if (exists) {
      return jsonError("این ایمیل قبلاً ثبت شده", 409, "conflict");
    }

    const created = await prisma.adminUser.create({
      data: {
        email,
        name,
        role,
        passwordHash: hashPassword(password),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLoginAt: true,
        disabledAt: true,
        createdAt: true,
      },
    });

    await writeAdminAudit({
      adminUserId: actorId,
      action: "operator.create",
      targetType: "admin_user",
      targetId: created.id,
      meta: { email: created.email, role: created.role },
    });

    return Response.json({
      item: {
        id: created.id,
        email: created.email,
        name: created.name,
        role: created.role,
        lastLoginAt: null,
        disabled: false,
        createdAt: created.createdAt.toISOString(),
        sessions: 0,
      },
    });
  });
}
