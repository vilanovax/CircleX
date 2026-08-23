import { Prisma } from "@prisma/client";
import { ADMIN_ROLES, requireAdmin } from "@/lib/admin-auth";
import { AUDIT_GROUP_TYPES, type AuditGroup } from "@/lib/admin-labels";
import { listEnvelope, parseListParams } from "@/lib/admin-http";
import { prisma } from "@/lib/db";
import { withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

function parseGroup(raw: string | null): AuditGroup {
  if (raw === "users" || raw === "content" || raw === "invites" || raw === "ops") {
    return raw;
  }
  return "all";
}

async function targetLabels(
  rows: { targetType: string; targetId: string }[],
): Promise<Map<string, string>> {
  const ids = (type: string) =>
    Array.from(new Set(rows.filter((r) => r.targetType === type).map((r) => r.targetId)));

  const [
    users,
    listings,
    requests,
    events,
    reports,
    invites,
    broadcasts,
    operators,
  ] = await Promise.all([
    ids("User").length
      ? prisma.user.findMany({
          where: { id: { in: ids("User") } },
          select: { id: true, name: true },
        })
      : [],
    ids("MarketListing").length
      ? prisma.marketListing.findMany({
          where: { id: { in: ids("MarketListing") } },
          select: { id: true, title: true },
        })
      : [],
    ids("WantRequest").length
      ? prisma.wantRequest.findMany({
          where: { id: { in: ids("WantRequest") } },
          select: { id: true, title: true },
        })
      : [],
    ids("Gathering").length
      ? prisma.gathering.findMany({
          where: { id: { in: ids("Gathering") } },
          select: { id: true, title: true },
        })
      : [],
    ids("ListingReport").length
      ? prisma.listingReport.findMany({
          where: { id: { in: ids("ListingReport") } },
          select: { id: true, listing: { select: { title: true } } },
        })
      : [],
    ids("Invite").length
      ? prisma.invite.findMany({
          where: { id: { in: ids("Invite") } },
          select: { id: true, code: true },
        })
      : [],
    ids("Broadcast").length
      ? prisma.broadcast.findMany({
          where: { id: { in: ids("Broadcast") } },
          select: { id: true, title: true },
        })
      : [],
    ids("admin_user").length
      ? prisma.adminUser.findMany({
          where: { id: { in: ids("admin_user") } },
          select: { id: true, name: true, email: true },
        })
      : [],
  ]);

  const map = new Map<string, string>();
  const key = (type: string, id: string) => `${type}:${id}`;
  for (const row of users) map.set(key("User", row.id), row.name || "بدون نام");
  for (const row of listings) map.set(key("MarketListing", row.id), row.title);
  for (const row of requests) map.set(key("WantRequest", row.id), row.title);
  for (const row of events) map.set(key("Gathering", row.id), row.title);
  for (const row of reports) {
    map.set(key("ListingReport", row.id), row.listing.title);
  }
  for (const row of invites) map.set(key("Invite", row.id), row.code);
  for (const row of broadcasts) map.set(key("Broadcast", row.id), row.title);
  for (const row of operators) {
    map.set(key("admin_user", row.id), row.name || row.email);
  }
  map.set(key("AppSetting", "app"), "تنظیمات زنده");
  return map;
}

const AUDIT_TARGET_TYPES = new Set([
  "User",
  "MarketListing",
  "WantRequest",
  "Gathering",
  "ListingReport",
  "Invite",
  "Broadcast",
  "AppSetting",
  "admin_user",
]);

async function aboutUserWhere(
  userId: string,
): Promise<Prisma.AdminAuditLogWhereInput> {
  const [listings, requests, events, invites, reports] = await Promise.all([
    prisma.marketListing.findMany({
      where: { sellerId: userId },
      select: { id: true },
    }),
    prisma.wantRequest.findMany({
      where: { requesterId: userId },
      select: { id: true },
    }),
    prisma.gathering.findMany({
      where: { hostId: userId },
      select: { id: true },
    }),
    prisma.invite.findMany({
      where: { inviterUserId: userId },
      select: { id: true },
    }),
    prisma.listingReport.findMany({
      where: { listing: { sellerId: userId } },
      select: { id: true },
    }),
  ]);

  const or: Prisma.AdminAuditLogWhereInput[] = [
    { targetType: "User", targetId: userId },
  ];
  const pushIn = (targetType: string, rows: { id: string }[]) => {
    if (!rows.length) return;
    or.push({ targetType, targetId: { in: rows.map((row) => row.id) } });
  };
  pushIn("MarketListing", listings);
  pushIn("WantRequest", requests);
  pushIn("Gathering", events);
  pushIn("Invite", invites);
  pushIn("ListingReport", reports);
  return { OR: or };
}

export async function GET(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { roles: [...ADMIN_ROLES.auditRead] });
    if (!auth.ok) return auth.response;

    const url = new URL(req.url);
    const { take, skip } = parseListParams(url, 50);
    const group = parseGroup(url.searchParams.get("group"));
    const actorId = (url.searchParams.get("actor") ?? "").trim();
    const aboutUser = (url.searchParams.get("aboutUser") ?? "").trim().slice(0, 64);
    const targetType = (url.searchParams.get("targetType") ?? "").trim();
    const targetId = (url.searchParams.get("targetId") ?? "").trim();

    const where: Prisma.AdminAuditLogWhereInput = {};
    if (aboutUser) {
      Object.assign(where, await aboutUserWhere(aboutUser));
    } else if (AUDIT_TARGET_TYPES.has(targetType) && targetId) {
      where.targetType = targetType;
      where.targetId = targetId.slice(0, 64);
    } else if (group !== "all") {
      where.targetType = { in: AUDIT_GROUP_TYPES[group] };
    }
    if (actorId) where.adminUserId = actorId;

    const [total, rows] = await Promise.all([
      prisma.adminAuditLog.count({ where }),
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          reason: true,
          meta: true,
          createdAt: true,
          admin: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
    ]);

    const labels = await targetLabels(rows);
    const items = rows.map((row) => ({
      id: row.id,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      targetLabel:
        labels.get(`${row.targetType}:${row.targetId}`) ?? null,
      reason: row.reason,
      meta: row.meta,
      createdAt: row.createdAt.toISOString(),
      actor: {
        id: row.admin.id,
        name: row.admin.name,
        email: row.admin.email,
        role: row.admin.role,
      },
    }));

    return Response.json(listEnvelope(items, { total, take, skip }));
  });
}
