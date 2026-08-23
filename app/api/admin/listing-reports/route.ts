import type { ListingReportStatus } from "@prisma/client";
import { actorRole, canSeeFullPhone, requireAdmin } from "@/lib/admin-auth";
import { listEnvelope, parseListParams } from "@/lib/admin-http";
import { redactAdminPhone } from "@/lib/admin-labels";
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

    const where = statusFilter ? { status: statusFilter } : {};

    const [total, rows] = await Promise.all([
      prisma.listingReport.count({ where }),
      prisma.listingReport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              type: true,
              dealStatus: true,
              sellerId: true,
              seller: { select: { id: true, name: true, phoneNormalized: true } },
            },
          },
          reporter: { select: { id: true, name: true, phoneNormalized: true } },
        },
      }),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      reason: row.reason,
      note: row.note,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      listing: {
        id: row.listing.id,
        title: row.listing.title,
        type: row.listing.type,
        dealStatus: row.listing.dealStatus,
        seller: {
          id: row.listing.seller.id,
          name: row.listing.seller.name,
          phone: redactAdminPhone(row.listing.seller.phoneNormalized, fullPhone),
        },
      },
      reporter: {
        id: row.reporter.id,
        name: row.reporter.name,
        phone: redactAdminPhone(row.reporter.phoneNormalized, fullPhone),
      },
    }));

    return Response.json(listEnvelope(items, { total, take, skip }));
  });
}
