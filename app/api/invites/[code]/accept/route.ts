import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { effectiveDbInviteStatus, personFromUser, toClientInvite } from "@/lib/mappers";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { code: string } },
) {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const code = String(params.code ?? "").trim().toLowerCase();
  const row = await prisma.invite.findFirst({
    where: { code: { equals: code, mode: "insensitive" } },
    include: { inviter: true },
  });
  if (!row) return jsonError("این دعوت معتبر نیست", 404, "invalid");

  if (row.inviterUserId === session.id) {
    return jsonError("این لینک دعوت خودت است", 409, "own");
  }

  const status = effectiveDbInviteStatus(row);
  if (status === "expired") {
    if (row.status === "pending") {
      await prisma.invite.update({
        where: { id: row.id },
        data: { status: "expired" },
      });
    }
    return jsonError("این دعوت منقضی شده", 410, "expired");
  }
  if (status === "revoked") {
    return jsonError("این دعوت لغو شده", 409, "revoked");
  }
  if (status === "accepted") {
    if (row.acceptedByUserId === session.id) {
      return jsonError("تو از قبل در این حلقه هستی", 409, "already");
    }
    return jsonError("این دعوت قبلاً استفاده شده", 409, "accepted");
  }

  const existingEdge = await prisma.circleEdge.findUnique({
    where: {
      fromUserId_toUserId: {
        fromUserId: row.inviterUserId,
        toUserId: session.id,
      },
    },
  });
  if (existingEdge) {
    return jsonError("تو از قبل در این حلقه هستی", 409, "already");
  }

  const acceptedAt = new Date();
  const [invite] = await prisma.$transaction([
    prisma.invite.update({
      where: { id: row.id },
      data: {
        status: "accepted",
        acceptedByUserId: session.id,
        acceptedAt,
      },
    }),
    prisma.circleEdge.create({
      data: {
        fromUserId: row.inviterUserId,
        toUserId: session.id,
        trustGroup: row.trustGroup,
        relationType: row.relationType,
      },
    }),
  ]);

  return Response.json({
    invite: toClientInvite(invite),
    inviter: personFromUser(row.inviter, {
      relation: "friend",
      level: "B",
    }),
    edgeCreated: true,
  });
}
