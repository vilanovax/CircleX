import { Prisma } from "@prisma/client";
import { cache } from "react";
import { redactAdminPhone } from "@/lib/admin-labels";
import { isUserBanned } from "@/lib/ban";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";

export const ADMIN_USERS_PAGE_SIZE = 40;
const LIST_TTL_MS = 12_000;
const CACHE_CAP = 40;

export type AdminUserRow = {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  profileCompleted: boolean;
  createdAt: string;
  circleCount: number;
  listingCount: number;
  inviteCount: number;
  banned: boolean;
};

export type AdminUserList = {
  items: AdminUserRow[];
  total: number;
  take: number;
  skip: number;
};

export type ListAdminUsersParams = {
  q?: string;
  incomplete?: boolean;
  banned?: boolean;
  take: number;
  skip: number;
  fullPhone: boolean;
  includeTotal?: boolean;
};

type SqlUserRow = {
  id: string;
  name: string;
  phoneNormalized: string;
  city: string | null;
  profileCompletedAt: Date | string | null;
  createdAt: Date | string;
  bannedAt: Date | string | null;
  bannedUntil: Date | string | null;
  circleCount: unknown;
  listingCount: unknown;
  inviteCount: unknown;
  total: unknown;
};

type CountRow = { n: unknown };

type Memo = { at: number; value: AdminUserList };

const g = globalThis as typeof globalThis & {
  __circleAdminUsers?: Map<string, Memo>;
};

function num(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function asDate(value: Date | string | null): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function asIso(value: Date | string): string {
  const date = asDate(value);
  return date ? date.toISOString() : new Date(0).toISOString();
}

function likeContains(raw: string): string {
  return `%${raw.replace(/[%_\\]/g, "").slice(0, 80)}%`;
}

function cacheKey(params: ListAdminUsersParams): string {
  return JSON.stringify([
    params.q?.trim() ?? "",
    Boolean(params.incomplete),
    Boolean(params.banned),
    params.take,
    params.skip,
    params.fullPhone,
    params.includeTotal !== false,
  ]);
}

function readCache(key: string): AdminUserList | null {
  const map = g.__circleAdminUsers;
  if (!map) return null;
  const hit = map.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at >= LIST_TTL_MS) {
    map.delete(key);
    return null;
  }
  return hit.value;
}

function writeCache(key: string, value: AdminUserList): void {
  const map = (g.__circleAdminUsers ??= new Map());
  map.set(key, { at: Date.now(), value });
  if (map.size > CACHE_CAP) {
    const oldest = map.keys().next().value;
    if (oldest) map.delete(oldest);
  }
}

export function invalidateAdminUsersCache(): void {
  g.__circleAdminUsers?.clear();
}

function buildWhere(
  q: string,
  incomplete: boolean,
  banned: boolean,
  now: Date,
): Prisma.Sql {
  const parts: Prisma.Sql[] = [];
  if (incomplete) {
    parts.push(Prisma.sql`u."profileCompletedAt" IS NULL`);
  }
  if (banned) {
    parts.push(
      Prisma.sql`u."bannedAt" IS NOT NULL AND (u."bannedUntil" IS NULL OR u."bannedUntil" > ${now})`,
    );
  }
  const trimmed = q.trim();
  if (trimmed) {
    const needle = likeContains(trimmed);
    const digits = normalizePhone(trimmed);
    const search: Prisma.Sql[] = [
      Prisma.sql`u.name ILIKE ${needle}`,
      Prisma.sql`u.id = ${trimmed}`,
    ];
    if (digits.length >= 3) {
      search.push(Prisma.sql`u."phoneNormalized" LIKE ${likeContains(digits)}`);
    }
    parts.push(Prisma.sql`(${Prisma.join(search, " OR ")})`);
  }
  if (!parts.length) return Prisma.sql`TRUE`;
  return Prisma.join(parts, " AND ");
}

function mapRows(rows: SqlUserRow[], fullPhone: boolean): AdminUserRow[] {
  return rows.map((row) => {
    const bannedAt = asDate(row.bannedAt);
    const bannedUntil = asDate(row.bannedUntil);
    return {
      id: row.id,
      name: row.name,
      phone: redactAdminPhone(row.phoneNormalized, fullPhone),
      city: row.city,
      profileCompleted: Boolean(row.profileCompletedAt),
      createdAt: asIso(row.createdAt),
      circleCount: num(row.circleCount),
      listingCount: num(row.listingCount),
      inviteCount: num(row.inviteCount),
      banned: isUserBanned({ bannedAt, bannedUntil }),
    };
  });
}

async function queryAdminUsers(params: ListAdminUsersParams): Promise<AdminUserList> {
  const q = params.q?.trim() ?? "";
  const incomplete = Boolean(params.incomplete);
  const banned = Boolean(params.banned);
  const take = Math.min(Math.max(params.take, 1), 5000);
  const skip = Math.max(params.skip, 0);
  const includeTotal = params.includeTotal !== false;
  const now = new Date();
  const where = buildWhere(q, incomplete, banned, now);

  const rows = await prisma.$queryRaw<SqlUserRow[]>`
    SELECT
      u.id,
      u.name,
      u."phoneNormalized" AS "phoneNormalized",
      u.city,
      u."profileCompletedAt" AS "profileCompletedAt",
      u."createdAt" AS "createdAt",
      u."bannedAt" AS "bannedAt",
      u."bannedUntil" AS "bannedUntil",
      (SELECT COUNT(*)::int FROM "CircleEdge" e WHERE e."fromUserId" = u.id) AS "circleCount",
      (SELECT COUNT(*)::int FROM "MarketListing" l WHERE l."sellerId" = u.id) AS "listingCount",
      (SELECT COUNT(*)::int FROM "Invite" i WHERE i."inviterUserId" = u.id) AS "inviteCount",
      ${includeTotal ? Prisma.sql`COUNT(*) OVER()::int` : Prisma.sql`0::int`} AS total
    FROM "User" u
    WHERE ${where}
    ORDER BY u."createdAt" DESC
    LIMIT ${take} OFFSET ${skip}
  `;

  if (!rows.length) {
    if (!includeTotal || skip === 0) {
      return { items: [], total: 0, take, skip };
    }
    const countRows = await prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::int AS n FROM "User" u WHERE ${where}
    `;
    return { items: [], total: num(countRows[0]?.n), take, skip };
  }

  return {
    items: mapRows(rows, params.fullPhone),
    total: includeTotal ? num(rows[0]?.total) : rows.length + skip,
    take,
    skip,
  };
}

export async function listAdminUsers(
  params: ListAdminUsersParams,
): Promise<AdminUserList> {
  const cacheable =
    params.skip === 0 &&
    params.take <= ADMIN_USERS_PAGE_SIZE &&
    params.includeTotal !== false;
  const key = cacheable ? cacheKey(params) : "";
  if (cacheable) {
    const hit = readCache(key);
    if (hit) return hit;
  }
  const value = await queryAdminUsers(params);
  if (cacheable) writeCache(key, value);
  return value;
}

export const loadAdminUsersPage = cache(
  async (
    q: string,
    incomplete: boolean,
    banned: boolean,
    fullPhone: boolean,
  ): Promise<AdminUserList> =>
    listAdminUsers({
      q,
      incomplete,
      banned,
      take: ADMIN_USERS_PAGE_SIZE,
      skip: 0,
      fullPhone,
    }),
);
