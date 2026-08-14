import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { effectiveDbInviteStatus } from "@/lib/mappers";
import type { PublicInvitePayload } from "@/lib/mappers";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { code: string } },
) {
  const code = String(params.code ?? "").trim().toLowerCase();
  if (!code) return jsonError("این دعوت معتبر نیست", 404, "invalid");

  const row = await prisma.invite.findFirst({
    where: { code: { equals: code, mode: "insensitive" } },
    include: { inviter: true },
  });
  if (!row) return jsonError("این دعوت معتبر نیست", 404, "invalid");

  let status = effectiveDbInviteStatus(row);
  if (status === "expired" && row.status === "pending") {
    await prisma.invite.update({
      where: { id: row.id },
      data: { status: "expired" },
    });
  }

  const session = await getSessionUser();
  const isOwn = session?.id === row.inviterUserId;
  let alreadyMember = false;
  if (session && !isOwn) {
    const edge = await prisma.circleEdge.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: row.inviterUserId,
          toUserId: session.id,
        },
      },
    });
    alreadyMember = Boolean(edge);
  }

  const payload: PublicInvitePayload = {
    code: row.code,
    status,
    expiresAt: row.expiresAt.toISOString(),
    inviter: {
      name: row.inviter.name || "یک آشنا",
      avatar: row.inviter.avatar || "/avatars/01.webp",
    },
    isOwn,
    alreadyMember,
  };
  return Response.json(payload);
}
