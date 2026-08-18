import { listingAccess } from "@/lib/circle-network";
import { prisma } from "@/lib/db";
import { jsonError, withDb } from "@/lib/http";
import { toClientOffer, toClientRequest } from "@/lib/mappers";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const row = await prisma.wantRequest.findUnique({
      where: { id: params.id },
      include: { offers: true },
    });
    if (!row) return jsonError("درخواست پیدا نشد", 404);

    const access = await listingAccess(session.id, row.requesterId);
    if (!access.ok) return jsonError("این درخواست در حلقه تو نیست", 403);

    return Response.json({
      request: toClientRequest(row, session.id, access.trustPath),
      offers: row.offers.map((offer) => toClientOffer(offer, session.id)),
    });
  });
}
