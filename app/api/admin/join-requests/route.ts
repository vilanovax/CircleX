import type { JoinRequestStatus } from "@prisma/client";
import { ADMIN_ROLES, actorRole, canSeeFullPhone, requireAdmin } from "@/lib/admin-auth";
import { listEnvelope, parseListParams } from "@/lib/admin-http";
import { adminPerson } from "@/lib/admin-labels";
import { prisma } from "@/lib/db";
import { withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { roles: [...ADMIN_ROLES.all] });
    if (!auth.ok) return auth.response;
    const fullPhone = canSeeFullPhone(actorRole(auth.actor));

    const url = new URL(req.url);
    const { take, skip } = parseListParams(url, 40);
    const statusParam = url.searchParams.get("status") ?? "pending";
    const status: JoinRequestStatus | undefined =
      statusParam === "all"
        ? undefined
        : statusParam === "accepted" || statusParam === "rejected"
          ? statusParam
          : "pending";

    const where = status ? { status } : {};

    const [total, rows] = await Promise.all([
      prisma.circleJoinRequest.count({ where }),
      prisma.circleJoinRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        select: {
          id: true,
          status: true,
          createdAt: true,
          host: { select: { id: true, name: true, phoneNormalized: true } },
          guest: { select: { id: true, name: true, phoneNormalized: true } },
          invite: { select: { id: true, code: true, kind: true } },
        },
      }),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      host: adminPerson(row.host, fullPhone),
      guest: adminPerson(row.guest, fullPhone),
      invite: row.invite,
    }));

    return Response.json(listEnvelope(items, { total, take, skip }));
  });
}
