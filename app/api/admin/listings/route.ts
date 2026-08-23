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
    const type = (url.searchParams.get("type") ?? "").trim();
    const q = (url.searchParams.get("q") ?? "").trim();

    const AND: Prisma.MarketListingWhereInput[] = [];
    if (hidden === true) AND.push({ dealStatus: "inactive" });
    if (hidden === false) {
      AND.push({
        OR: [{ dealStatus: null }, { dealStatus: { not: "inactive" } }],
      });
    }
    if (type) AND.push({ type });
    if (q) {
      AND.push({
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { id: q },
        ],
      });
    }
    const where: Prisma.MarketListingWhereInput = AND.length ? { AND } : {};

    const [total, rows] = await Promise.all([
      prisma.marketListing.count({ where }),
      prisma.marketListing.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        select: {
          id: true,
          title: true,
          type: true,
          city: true,
          dealStatus: true,
          image: true,
          createdAt: true,
          seller: {
            select: { id: true, name: true, phoneNormalized: true },
          },
        },
      }),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      city: row.city,
      dealStatus: row.dealStatus,
      hidden: row.dealStatus === "inactive",
      hasImage: Boolean(row.image),
      createdAt: row.createdAt.toISOString(),
      owner: adminPerson(row.seller, fullPhone),
    }));

    return Response.json(listEnvelope(items, { total, take, skip }));
  });
}
