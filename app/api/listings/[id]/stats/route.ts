import { listingOwnerStats } from "@/lib/listing-stats";
import { prisma } from "@/lib/db";
import { jsonError, withDb } from "@/lib/http";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const row = await prisma.marketListing.findUnique({
      where: { id: params.id },
      select: { id: true, sellerId: true },
    });
    if (!row) return jsonError("آگهی پیدا نشد", 404);
    if (row.sellerId !== session.id) {
      return jsonError("فقط صاحب آگهی آمار را می‌بیند", 403);
    }

    return Response.json(await listingOwnerStats(row.id, row.sellerId));
  });
}
