import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { toClientInvite } from "@/lib/mappers";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { code: string } },
) {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const key = String(params.code ?? "");
  const row = await prisma.invite.findFirst({
    where: {
      inviterUserId: session.id,
      OR: [
        { id: key },
        { code: { equals: key, mode: "insensitive" } },
      ],
    },
  });
  if (!row) return jsonError("این دعوت پیدا نشد", 404, "invalid");
  if (row.status !== "pending") {
    return jsonError("این دعوت دیگر قابل لغو نیست", 409, row.status);
  }

  const invite = await prisma.invite.update({
    where: { id: row.id },
    data: { status: "revoked" },
  });
  return Response.json({ invite: toClientInvite(invite) });
}
