import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const row = await prisma.circleJoinRequest.findUnique({
    where: { id: params.id },
  });
  if (!row || row.hostUserId !== session.id) {
    return jsonError("این درخواست پیدا نشد", 404);
  }
  if (row.status !== "pending") {
    return jsonError("این درخواست قبلاً بررسی شده", 409, "resolved");
  }

  await prisma.circleJoinRequest.update({
    where: { id: row.id },
    data: { status: "rejected", resolvedAt: new Date() },
  });

  return Response.json({ ok: true });
}
