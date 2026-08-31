import { listingAccess } from "@/lib/circle-network";
import { prisma } from "@/lib/db";
import { jsonError, withDb } from "@/lib/http";
import { toClientEvent } from "@/lib/mappers";
import { getSessionUser } from "@/lib/server-auth";
import { viewerMayReadListing } from "@/lib/server-listing-visibility";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const row = await prisma.gathering.findUnique({
      where: { id: params.id },
      include: { rsvps: { select: { personId: true } } },
    });
    if (!row) return jsonError("رویداد پیدا نشد", 404);
    if (row.hidden && row.hostId !== session.id) {
      return jsonError("رویداد پیدا نشد", 404);
    }

    const access = await listingAccess(session.id, row.hostId);
    if (!access.ok) return jsonError("این رویداد در حلقه تو نیست", 403);

    const allowed = await viewerMayReadListing({
      viewerId: session.id,
      sellerId: row.hostId,
      privacy: row.privacy,
      dealStatus: null,
    });
    if (!allowed) {
      return jsonError("این رویداد برای شما قابل مشاهده نیست", 403, "event_privacy");
    }

    return Response.json({
      event: toClientEvent(row, session.id, access.trustPath),
    });
  });
}
