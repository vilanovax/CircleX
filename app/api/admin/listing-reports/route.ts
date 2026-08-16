import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Simple inbox for platform admin.
 * Header: `Authorization: Bearer <ADMIN_SECRET>`
 */
export async function GET(req: Request) {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) {
    return jsonError("ادمین پیکربندی نشده", 503);
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (token !== secret) {
    return jsonError("دسترسی نداری", 401, "unauthorized");
  }

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status") ?? "open";
  const take = Math.min(
    Number(url.searchParams.get("limit") ?? 50) || 50,
    100,
  );

  const statusFilter =
    statusParam === "all"
      ? undefined
      : statusParam === "reviewed" || statusParam === "dismissed"
        ? statusParam
        : "open";

  const reports = await prisma.listingReport.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    orderBy: { createdAt: "desc" },
    take,
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          type: true,
          sellerId: true,
          seller: { select: { name: true, phoneNormalized: true } },
        },
      },
      reporter: { select: { id: true, name: true, phoneNormalized: true } },
    },
  });

  return Response.json({ reports });
}
