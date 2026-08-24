import type { ListingReportStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { actorRole, canSeeFullPhone, requireAdmin } from "@/lib/admin-auth";
import {
  listEnvelope,
  parseListParams,
} from "@/lib/admin-http";
import { adminPerson } from "@/lib/admin-labels";
import { prisma } from "@/lib/db";
import { withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { allowSecret: true });
    if (!auth.ok) return auth.response;

    const fullPhone = canSeeFullPhone(actorRole(auth.actor));
    const url = new URL(req.url);
    const { take, skip } = parseListParams(url);
    const statusParam = url.searchParams.get("status") ?? "open";

    const statusFilter: ListingReportStatus | undefined =
      statusParam === "all"
        ? undefined
        : statusParam === "reviewed" || statusParam === "dismissed"
          ? statusParam
          : "open";

    const where: Prisma.MessageReportWhereInput = statusFilter
      ? { status: statusFilter }
      : {};

    const [total, rows] = await Promise.all([
      prisma.messageReport.count({ where }),
      prisma.messageReport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          reporter: { select: { id: true, name: true, phoneNormalized: true } },
          accused: { select: { id: true, name: true, phoneNormalized: true } },
          message: { select: { id: true, hiddenAt: true } },
        },
      }),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      reason: row.reason,
      note: row.note,
      status: row.status,
      textSnapshot: row.textSnapshot,
      hiddenMessage: row.hiddenMessage || Boolean(row.message?.hiddenAt),
      messageGone: !row.messageId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      accused: adminPerson(row.accused, fullPhone),
      reporter: adminPerson(row.reporter, fullPhone),
    }));

    return Response.json(listEnvelope(items, { total, take, skip }));
  });
}
