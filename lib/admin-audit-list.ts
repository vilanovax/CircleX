import { Prisma } from "@prisma/client";
import { cache } from "react";
import {
  AUDIT_GROUP_TYPES,
  type AuditGroup,
} from "@/lib/admin-labels";
import { prisma } from "@/lib/db";

export const ADMIN_AUDIT_PAGE_SIZE = 50;
const LIST_TTL_MS = 8_000;
const CACHE_CAP = 20;

export type AdminAuditActor = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type AdminAuditRow = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string | null;
  reason: string | null;
  meta: unknown;
  createdAt: string;
  actor: AdminAuditActor;
};

export type AdminAuditList = {
  items: AdminAuditRow[];
  total: number;
  take: number;
  skip: number;
};

export type ListAdminAuditParams = {
  group?: AuditGroup;
  take: number;
  skip: number;
  actorId?: string;
  aboutUser?: string;
  aboutListing?: string;
  targetType?: string;
  targetId?: string;
};

type SqlAuditRow = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string | null;
  reason: string | null;
  meta: unknown;
  createdAt: Date | string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  total: unknown;
};

type CountRow = { n: unknown };

type Memo = { at: number; value: AdminAuditList };

const g = globalThis as typeof globalThis & {
  __circleAdminAudit?: Map<string, Memo>;
};

export function parseAuditGroup(raw: string | null | undefined): AuditGroup {
  if (raw === "users" || raw === "content" || raw === "invites" || raw === "ops") {
    return raw;
  }
  return "all";
}

function num(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function asIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

function cacheKey(params: ListAdminAuditParams): string {
  return JSON.stringify([
    params.group ?? "all",
    params.take,
    params.skip,
    params.actorId ?? "",
    params.aboutUser ?? "",
    params.aboutListing ?? "",
    params.targetType ?? "",
    params.targetId ?? "",
  ]);
}

function readCache(key: string): AdminAuditList | null {
  const map = g.__circleAdminAudit;
  if (!map) return null;
  const hit = map.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at >= LIST_TTL_MS) {
    map.delete(key);
    return null;
  }
  return hit.value;
}

function writeCache(key: string, value: AdminAuditList): void {
  const map = (g.__circleAdminAudit ??= new Map());
  map.set(key, { at: Date.now(), value });
  if (map.size > CACHE_CAP) {
    const oldest = map.keys().next().value;
    if (oldest) map.delete(oldest);
  }
}

export function invalidateAdminAuditCache(): void {
  g.__circleAdminAudit?.clear();
}

function buildWhere(params: ListAdminAuditParams): Prisma.Sql {
  const parts: Prisma.Sql[] = [];
  const group = params.group ?? "all";
  const actorId = params.actorId?.trim() ?? "";
  const aboutUser = params.aboutUser?.trim().slice(0, 64) ?? "";
  const aboutListing = params.aboutListing?.trim().slice(0, 64) ?? "";
  const targetType = params.targetType?.trim() ?? "";
  const targetId = params.targetId?.trim().slice(0, 64) ?? "";

  if (aboutUser) {
    parts.push(Prisma.sql`(
      (a."targetType" = 'User' AND a."targetId" = ${aboutUser})
      OR (
        a."targetType" = 'MarketListing'
        AND EXISTS (
          SELECT 1 FROM "MarketListing" x
          WHERE x.id = a."targetId" AND x."sellerId" = ${aboutUser}
        )
      )
      OR (
        a."targetType" = 'WantRequest'
        AND EXISTS (
          SELECT 1 FROM "WantRequest" x
          WHERE x.id = a."targetId" AND x."requesterId" = ${aboutUser}
        )
      )
      OR (
        a."targetType" = 'Gathering'
        AND EXISTS (
          SELECT 1 FROM "Gathering" x
          WHERE x.id = a."targetId" AND x."hostId" = ${aboutUser}
        )
      )
      OR (
        a."targetType" = 'Invite'
        AND EXISTS (
          SELECT 1 FROM "Invite" x
          WHERE x.id = a."targetId" AND x."inviterUserId" = ${aboutUser}
        )
      )
      OR (
        a."targetType" = 'ListingReport'
        AND EXISTS (
          SELECT 1 FROM "ListingReport" r
          JOIN "MarketListing" l ON l.id = r."listingId"
          WHERE r.id = a."targetId" AND l."sellerId" = ${aboutUser}
        )
      )
    )`);
  } else if (aboutListing) {
    parts.push(Prisma.sql`(
      (a."targetType" = 'MarketListing' AND a."targetId" = ${aboutListing})
      OR (
        a."targetType" = 'ListingReport'
        AND EXISTS (
          SELECT 1 FROM "ListingReport" r
          WHERE r.id = a."targetId" AND r."listingId" = ${aboutListing}
        )
      )
    )`);
  } else if (targetType && targetId) {
    parts.push(Prisma.sql`a."targetType" = ${targetType} AND a."targetId" = ${targetId}`);
  } else if (group !== "all") {
    const types = AUDIT_GROUP_TYPES[group];
    parts.push(
      Prisma.sql`a."targetType" IN (${Prisma.join(types.map((t) => Prisma.sql`${t}`))})`,
    );
  }

  if (actorId) {
    parts.push(Prisma.sql`a."adminUserId" = ${actorId}`);
  }

  if (!parts.length) return Prisma.sql`TRUE`;
  return Prisma.join(parts, " AND ");
}

function mapRows(rows: SqlAuditRow[]): AdminAuditRow[] {
  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    targetLabel: row.targetLabel?.trim() ? row.targetLabel : null,
    reason: row.reason,
    meta: row.meta,
    createdAt: asIso(row.createdAt),
    actor: {
      id: row.actorId,
      name: row.actorName,
      email: row.actorEmail,
      role: row.actorRole,
    },
  }));
}

async function queryAdminAudit(params: ListAdminAuditParams): Promise<AdminAuditList> {
  const take = Math.min(Math.max(params.take, 1), 100);
  const skip = Math.max(params.skip, 0);
  const where = buildWhere(params);

  const rows = await prisma.$queryRaw<SqlAuditRow[]>`
    SELECT
      a.id,
      a.action,
      a."targetType" AS "targetType",
      a."targetId" AS "targetId",
      CASE a."targetType"
        WHEN 'User' THEN NULLIF(u.name, '')
        WHEN 'MarketListing' THEN ml.title
        WHEN 'WantRequest' THEN wr.title
        WHEN 'Gathering' THEN g.title
        WHEN 'ListingReport' THEN lr_ml.title
        WHEN 'MessageReport' THEN COALESCE(NULLIF(acc.name, ''), LEFT(mr."textSnapshot", 48))
        WHEN 'ListingWatch' THEN COALESCE(NULLIF(lw.phrase, ''), tw.name)
        WHEN 'Invite' THEN inv.code
        WHEN 'Broadcast' THEN bc.title
        WHEN 'admin_user' THEN COALESCE(NULLIF(op.name, ''), op.email)
        WHEN 'AppSetting' THEN 'تنظیمات زنده'
        ELSE NULL
      END AS "targetLabel",
      a.reason,
      a.meta,
      a."createdAt" AS "createdAt",
      actor.id AS "actorId",
      actor.name AS "actorName",
      actor.email AS "actorEmail",
      actor.role::text AS "actorRole",
      COUNT(*) OVER()::int AS total
    FROM "AdminAuditLog" a
    JOIN "AdminUser" actor ON actor.id = a."adminUserId"
    LEFT JOIN "User" u
      ON a."targetType" = 'User' AND u.id = a."targetId"
    LEFT JOIN "MarketListing" ml
      ON a."targetType" = 'MarketListing' AND ml.id = a."targetId"
    LEFT JOIN "WantRequest" wr
      ON a."targetType" = 'WantRequest' AND wr.id = a."targetId"
    LEFT JOIN "Gathering" g
      ON a."targetType" = 'Gathering' AND g.id = a."targetId"
    LEFT JOIN "ListingReport" lr
      ON a."targetType" = 'ListingReport' AND lr.id = a."targetId"
    LEFT JOIN "MarketListing" lr_ml
      ON lr."listingId" = lr_ml.id
    LEFT JOIN "MessageReport" mr
      ON a."targetType" = 'MessageReport' AND mr.id = a."targetId"
    LEFT JOIN "User" acc
      ON mr."accusedId" = acc.id
    LEFT JOIN "ListingWatch" lw
      ON a."targetType" = 'ListingWatch' AND lw.id = a."targetId"
    LEFT JOIN "User" tw
      ON lw."targetUserId" = tw.id
    LEFT JOIN "Invite" inv
      ON a."targetType" = 'Invite' AND inv.id = a."targetId"
    LEFT JOIN "Broadcast" bc
      ON a."targetType" = 'Broadcast' AND bc.id = a."targetId"
    LEFT JOIN "AdminUser" op
      ON a."targetType" = 'admin_user' AND op.id = a."targetId"
    WHERE ${where}
    ORDER BY a."createdAt" DESC
    LIMIT ${take} OFFSET ${skip}
  `;

  if (!rows.length) {
    if (skip === 0) return { items: [], total: 0, take, skip };
    const countRows = await prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::int AS n
      FROM "AdminAuditLog" a
      WHERE ${where}
    `;
    return { items: [], total: num(countRows[0]?.n), take, skip };
  }

  return {
    items: mapRows(rows),
    total: num(rows[0]?.total),
    take,
    skip,
  };
}

export async function listAdminAudit(
  params: ListAdminAuditParams,
): Promise<AdminAuditList> {
  const cacheable =
    params.skip === 0 &&
    params.take <= ADMIN_AUDIT_PAGE_SIZE &&
    !params.actorId &&
    !params.aboutUser &&
    !params.aboutListing &&
    !params.targetType &&
    !params.targetId;
  const key = cacheable ? cacheKey(params) : "";
  if (cacheable) {
    const hit = readCache(key);
    if (hit) return hit;
  }
  const value = await queryAdminAudit(params);
  if (cacheable) writeCache(key, value);
  return value;
}

export const loadAdminAuditPage = cache(
  async (group: AuditGroup): Promise<AdminAuditList> =>
    listAdminAudit({
      group,
      take: ADMIN_AUDIT_PAGE_SIZE,
      skip: 0,
    }),
);
