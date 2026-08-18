import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";
import type { User } from "@prisma/client";

export const SESSION_COOKIE = "circle_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_RESEND_MS = 45 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_LEN = 5;

export function otpDevCode(): string {
  const raw = process.env.OTP_DEV_CODE?.trim() || "12345";
  return raw.replace(/\D/g, "").slice(0, OTP_LEN).padStart(OTP_LEN, "0");
}

export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret === "change-me") {
    throw new Error("SESSION_SECRET is missing");
  }
  return secret;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hashOtp(phone: string, code: string): string {
  return createHash("sha256")
    .update(`${phone}:${code}:${sessionSecret()}`)
    .digest("hex");
}

export function newSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export type SessionUser = {
  id: string;
  phoneNormalized: string;
  name: string;
  avatar: string;
  city: string | null;
  profileCompletedAt: string | null;
  showOwnListingsInFeed: boolean;
};

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    phoneNormalized: user.phoneNormalized,
    name: user.name,
    avatar: user.avatar,
    city: user.city,
    profileCompletedAt: user.profileCompletedAt
      ? user.profileCompletedAt.toISOString()
      : null,
    showOwnListingsInFeed: user.showOwnListingsInFeed,
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return toSessionUser(session.user);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const err = new Error("unauthorized") as Error & { status: number };
    err.status = 401;
    throw err;
  }
  return user;
}

export async function createSession(userId: string): Promise<void> {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
    },
  });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => {});
  }
  cookies().set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}
