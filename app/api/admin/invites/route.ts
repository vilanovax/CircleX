import { Prisma } from "@prisma/client";
import { ADMIN_ROLES, actorRole, canSeeFullPhone, requireAdmin } from "@/lib/admin-auth";
import { listEnvelope, parseListParams } from "@/lib/admin-http";
import { adminPerson, redactAdminPhone } from "@/lib/admin-labels";
import { prisma } from "@/lib/db";
import { withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

const BURST_WINDOW_MS = 24 * 60 * 60 * 1000;
const BURST_THRESHOLD = 8;

export async function GET(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { roles: [...ADMIN_ROLES.all] });
    if (!auth.ok) return auth.response;
    const fullPhone = canSeeFullPhone(actorRole(auth.actor));

    const url = new URL(req.url);
    const { take, skip } = parseListParams(url, 40);
    const status = (url.searchParams.get("status") ?? "").trim();
    const kind = (url.searchParams.get("kind") ?? "").trim();
    const q = (url.searchParams.get("q") ?? "").trim();
    const now = new Date();
    const since = new Date(now.getTime() - BURST_WINDOW_MS);

    const AND: Prisma.InviteWhereInput[] = [];
    if (
      status === "pending" ||
      status === "accepted" ||
      status === "expired" ||
      status === "revoked"
    ) {
      AND.push({ status });
    }
    if (kind === "personal" || kind === "wave") AND.push({ kind });
    if (q) {
      AND.push({
        OR: [
          { code: { contains: q, mode: "insensitive" } },
          { invitedName: { contains: q, mode: "insensitive" } },
          { id: q },
          { inviter: { name: { contains: q, mode: "insensitive" } } },
        ],
      });
    }
    const where: Prisma.InviteWhereInput = AND.length ? { AND } : {};

    const [total, rows, grouped] = await Promise.all([
      prisma.invite.count({ where }),
      prisma.invite.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        select: {
          id: true,
          code: true,
          kind: true,
          status: true,
          useCount: true,
          maxUses: true,
          invitedName: true,
          invitedPhone: true,
          expiresAt: true,
          createdAt: true,
          inviter: {
            select: { id: true, name: true, phoneNormalized: true },
          },
        },
      }),
      prisma.invite.groupBy({
        by: ["inviterUserId"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
    ]);

    const bursts = grouped
      .filter((row) => row._count._all >= BURST_THRESHOLD)
      .map((row) => ({
        inviterUserId: row.inviterUserId,
        count: row._count._all,
      }));
    const burstIds = new Set(bursts.map((row) => row.inviterUserId));

    const items = rows.map((row) => ({
      id: row.id,
      code: row.code,
      kind: row.kind,
      status: row.status,
      useCount: row.useCount,
      maxUses: row.maxUses,
      invitedName: row.invitedName,
      invitedPhone: row.invitedPhone
        ? redactAdminPhone(row.invitedPhone, fullPhone)
        : null,
      expiresAt: row.expiresAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      live: row.status === "pending" && row.expiresAt.getTime() > now.getTime(),
      burst: burstIds.has(row.inviter.id),
      inviter: adminPerson(row.inviter, fullPhone),
    }));

    return Response.json({
      ...listEnvelope(items, { total, take, skip }),
      bursts,
    });
  });
}
