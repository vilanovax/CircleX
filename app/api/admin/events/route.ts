import { Prisma } from "@prisma/client";
import { ADMIN_ROLES, actorRole, canSeeFullPhone, requireAdmin } from "@/lib/admin-auth";
import { listEnvelope, parseHiddenParam, parseListParams } from "@/lib/admin-http";
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
    const hidden = parseHiddenParam(url);
    const q = (url.searchParams.get("q") ?? "").trim();

    const AND: Prisma.GatheringWhereInput[] = [];
    if (hidden === true) AND.push({ hidden: true });
    if (hidden === false) AND.push({ hidden: false });
    if (q) {
      AND.push({
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { id: q },
        ],
      });
    }
    const where: Prisma.GatheringWhereInput = AND.length ? { AND } : {};

    const [total, rows] = await Promise.all([
      prisma.gathering.count({ where }),
      prisma.gathering.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        select: {
          id: true,
          title: true,
          kind: true,
          city: true,
          dateLabel: true,
          hidden: true,
          image: true,
          createdAt: true,
          host: { select: { id: true, name: true, phoneNormalized: true } },
        },
      }),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      title: row.title,
      kind: row.kind,
      city: row.city,
      dateLabel: row.dateLabel,
      hidden: row.hidden,
      hasImage: Boolean(row.image),
      createdAt: row.createdAt.toISOString(),
      owner: adminPerson(row.host, fullPhone),
    }));

    return Response.json(listEnvelope(items, { total, take, skip }));
  });
}
