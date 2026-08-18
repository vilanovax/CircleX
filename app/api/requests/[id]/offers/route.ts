import { listingAccess } from "@/lib/circle-network";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { toClientOffer } from "@/lib/mappers";
import { parseOfferWrite } from "@/lib/social-payload";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const request = await prisma.wantRequest.findUnique({
      where: { id: params.id },
      select: { id: true, requesterId: true },
    });
    if (!request) return jsonError("درخواست پیدا نشد", 404);
    if (request.requesterId === session.id) {
      return jsonError("روی درخواست خودت پیشنهاد نمی‌گذاری", 403);
    }

    const access = await listingAccess(session.id, request.requesterId);
    if (!access.ok) return jsonError("این درخواست در حلقه تو نیست", 403);

    const parsed = parseOfferWrite(await readJson(req));
    if (!parsed.ok) return jsonError(parsed.error, 400);

    const row = await prisma.wantOffer.upsert({
      where: {
        requestId_fromId: { requestId: request.id, fromId: session.id },
      },
      create: {
        requestId: request.id,
        fromId: session.id,
        message: parsed.data.message,
        price: parsed.data.price ?? null,
      },
      update: {
        message: parsed.data.message,
        price: parsed.data.price ?? null,
      },
    });

    return Response.json({ offer: toClientOffer(row, session.id) });
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    await prisma.wantOffer.deleteMany({
      where: { requestId: params.id, fromId: session.id },
    });
    return Response.json({ ok: true });
  });
}
