import { Prisma } from "@prisma/client";
import { ADMIN_ROLES, canSeeFullPhone, requireAdmin } from "@/lib/admin-auth";
import { listEnvelope, parseListParams } from "@/lib/admin-http";
import { redactAdminPhone } from "@/lib/admin-labels";
import { activeBanWhere, isUserBanned } from "@/lib/ban";
import { prisma } from "@/lib/db";
import { withDb } from "@/lib/http";
import { normalizePhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

const READ_ROLES = ADMIN_ROLES.usersRead;

export async function GET(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { roles: [...READ_ROLES] });
    if (!auth.ok) return auth.response;
    const fullPhone = canSeeFullPhone(
      auth.actor.kind === "session" ? auth.actor.admin.role : "superadmin",
    );

    const url = new URL(req.url);
    const { take, skip } = parseListParams(url, 30);
    const q = (url.searchParams.get("q") ?? "").trim();
    const digits = normalizePhone(q);
    const incomplete = url.searchParams.get("profile") === "incomplete";
    const banned = url.searchParams.get("banned") === "1";

    const AND: Prisma.UserWhereInput[] = [];
    if (incomplete) AND.push({ profileCompletedAt: null });
    if (banned) AND.push(activeBanWhere());
    if (q) {
      AND.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          ...(digits.length >= 3
            ? [{ phoneNormalized: { contains: digits } }]
            : []),
          { id: q },
        ],
      });
    }
    const where: Prisma.UserWhereInput = AND.length ? { AND } : {};

    const [total, rows] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        select: {
          id: true,
          name: true,
          phoneNormalized: true,
          city: true,
          profileCompletedAt: true,
          createdAt: true,
          bannedAt: true,
          bannedUntil: true,
          _count: {
            select: {
              edgesFrom: true,
              listings: true,
              invitesSent: true,
            },
          },
        },
      }),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: redactAdminPhone(row.phoneNormalized, fullPhone),
      city: row.city,
      profileCompleted: Boolean(row.profileCompletedAt),
      banned: isUserBanned(row),
      createdAt: row.createdAt.toISOString(),
      circleCount: row._count.edgesFrom,
      listingCount: row._count.listings,
      inviteCount: row._count.invitesSent,
    }));

    return Response.json(listEnvelope(items, { total, take, skip }));
  });
}
