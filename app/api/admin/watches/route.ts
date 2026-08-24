import { Prisma } from "@prisma/client";
import { actorRole, canSeeFullPhone, requireAdmin } from "@/lib/admin-auth";
import {
  listEnvelope,
  parseBoolParam,
  parseListParams,
} from "@/lib/admin-http";
import { adminPerson } from "@/lib/admin-labels";
import { prisma } from "@/lib/db";
import { withDb } from "@/lib/http";
import { normalizePhone } from "@/lib/phone";
import { NOTICE_KIND } from "@/lib/server-notices";
import { WATCH_KIND } from "@/lib/watch-match";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { allowSecret: true });
    if (!auth.ok) return auth.response;

    const fullPhone = canSeeFullPhone(actorRole(auth.actor));
    const url = new URL(req.url);
    const { take, skip } = parseListParams(url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const digits = normalizePhone(q);
    const kindRaw = url.searchParams.get("kind") ?? "all";
    const kind =
      kindRaw === WATCH_KIND.phrase || kindRaw === WATCH_KIND.person
        ? kindRaw
        : undefined;
    const enabled = parseBoolParam(url, "enabled");
    const adminLocked = parseBoolParam(url, "locked");

    const AND: Prisma.ListingWatchWhereInput[] = [];
    if (kind) AND.push({ kind });
    if (enabled !== undefined) AND.push({ enabled });
    if (adminLocked === true) AND.push({ adminDisabledAt: { not: null } });
    if (adminLocked === false) AND.push({ adminDisabledAt: null });
    if (q) {
      AND.push({
        OR: [
          { phrase: { contains: q, mode: "insensitive" } },
          { phraseNorm: { contains: q, mode: "insensitive" } },
          { user: { name: { contains: q, mode: "insensitive" } } },
          { target: { name: { contains: q, mode: "insensitive" } } },
          { userId: q },
          { id: q },
          ...(digits.length >= 3
            ? [
                { user: { phoneNormalized: { contains: digits } } },
                { target: { phoneNormalized: { contains: digits } } },
              ]
            : []),
        ],
      });
    }
    const where: Prisma.ListingWatchWhereInput = AND.length ? { AND } : {};

    const [total, rows] = await Promise.all([
      prisma.listingWatch.count({ where }),
      prisma.listingWatch.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          user: { select: { id: true, name: true, phoneNormalized: true } },
          target: { select: { id: true, name: true, phoneNormalized: true } },
        },
      }),
    ]);

    const ids = rows.map((row) => row.id);
    const hits =
      ids.length === 0
        ? []
        : await prisma.systemNotice.groupBy({
            by: ["watchId"],
            where: {
              kind: NOTICE_KIND.watchHit,
              watchId: { in: ids },
            },
            _count: { _all: true },
          });
    const hitById = new Map(
      hits
        .filter((row) => row.watchId)
        .map((row) => [row.watchId as string, row._count._all]),
    );

    const items = rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      phrase: row.phrase,
      enabled: row.enabled,
      adminLocked: Boolean(row.adminDisabledAt),
      hitCount: hitById.get(row.id) ?? 0,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      owner: adminPerson(row.user, fullPhone),
      target: row.target ? adminPerson(row.target, fullPhone) : null,
    }));

    return Response.json(listEnvelope(items, { total, take, skip }));
  });
}
