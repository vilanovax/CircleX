import type { Prisma } from "@prisma/client";

export type BanFields = {
  bannedAt: Date | null;
  bannedUntil: Date | null;
  banReason?: string | null;
};

export function isUserBanned(user: BanFields, now = Date.now()): boolean {
  if (!user.bannedAt) return false;
  if (!user.bannedUntil) return true;
  return user.bannedUntil.getTime() > now;
}

export function banPublicState(user: BanFields, now = Date.now()) {
  const banned = isUserBanned(user, now);
  return {
    banned,
    bannedAt: user.bannedAt?.toISOString() ?? null,
    bannedUntil: user.bannedUntil?.toISOString() ?? null,
    banReason: banned ? (user.banReason ?? null) : null,
    permanent: banned && !user.bannedUntil,
  };
}

export function activeBanWhere(now = new Date()): Prisma.UserWhereInput {
  return {
    bannedAt: { not: null },
    OR: [{ bannedUntil: null }, { bannedUntil: { gt: now } }],
  };
}

export function notBannedWhere(now = new Date()): Prisma.UserWhereInput {
  return {
    OR: [{ bannedAt: null }, { bannedUntil: { lte: now } }],
  };
}
