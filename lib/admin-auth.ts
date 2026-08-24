import type { AdminRole, AdminUser } from "@prisma/client";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./db";
import { jsonError } from "./http";
import { hashToken, newSessionToken } from "./server-auth";

export const ADMIN_SESSION_COOKIE = "circle_admin_session";
export const ADMIN_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type AdminSessionUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};

export function toAdminSessionUser(admin: AdminUser): AdminSessionUser {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  };
}

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

export const getAdminSession = cache(async (): Promise<AdminSessionUser | null> => {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now() || session.admin.disabledAt) {
    await prisma.adminSession
      .delete({ where: { id: session.id } })
      .catch(() => {});
    return null;
  }
  return toAdminSessionUser(session.admin);
});

export async function createAdminSession(adminUserId: string): Promise<void> {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS);
  await prisma.adminSession.create({
    data: {
      tokenHash: hashToken(token),
      adminUserId,
      expiresAt,
    },
  });
  cookies().set(
    ADMIN_SESSION_COOKIE,
    token,
    cookieOpts(Math.floor(ADMIN_SESSION_TTL_MS / 1000)),
  );
}

export async function destroyAdminSession(): Promise<void> {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (token) {
    await prisma.adminSession
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => {});
  }
  cookies().set(ADMIN_SESSION_COOKIE, "", cookieOpts(0));
}

export function adminSecretMatches(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return token.length > 0 && token === secret;
}

export type AdminActor =
  | { kind: "session"; admin: AdminSessionUser }
  | { kind: "secret" };

export type AdminAuthOk = { ok: true; actor: AdminActor };
export type AdminAuthFail = { ok: false; response: Response };

export async function requireAdmin(
  req: Request,
  opts?: { roles?: AdminRole[]; allowSecret?: boolean },
): Promise<AdminAuthOk | AdminAuthFail> {
  if (opts?.allowSecret && adminSecretMatches(req)) {
    return { ok: true, actor: { kind: "secret" } };
  }

  const admin = await getAdminSession();
  if (!admin) {
    return {
      ok: false,
      response: jsonError("وارد نشده‌ای", 401, "unauthorized"),
    };
  }
  if (opts?.roles && opts.roles.length > 0 && !opts.roles.includes(admin.role)) {
    return {
      ok: false,
      response: jsonError("دسترسی نداری", 403, "forbidden"),
    };
  }
  return { ok: true, actor: { kind: "session", admin } };
}

export function actorRole(actor: AdminActor): AdminRole {
  return actor.kind === "secret" ? "superadmin" : actor.admin.role;
}

export function canSeeFullPhone(role: AdminRole): boolean {
  return role !== "analyst";
}

export function sessionAdminId(actor: AdminActor): string | null {
  return actor.kind === "session" ? actor.admin.id : null;
}

export const ADMIN_ROLES = {
  all: ["analyst", "support", "moderator", "superadmin"] as const,
  usersRead: ["support", "moderator", "superadmin"] as const,
  contentWrite: ["moderator", "superadmin"] as const,
  supportWrite: ["support", "moderator", "superadmin"] as const,
  settingsWrite: ["superadmin"] as const,
  broadcastWrite: ["moderator", "superadmin"] as const,
  operatorsWrite: ["superadmin"] as const,
  auditRead: ["moderator", "superadmin"] as const,
};
