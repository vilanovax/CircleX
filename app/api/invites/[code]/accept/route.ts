import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import {
  effectiveDbInviteStatus,
  inviteIsFull,
  personFromUser,
  toClientInvite,
} from "@/lib/mappers";
import { getSessionUser } from "@/lib/server-auth";
import { Prisma } from "@prisma/client";

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

  if (row.kind === "personal") {
    if (status === "accepted") {
      if (row.acceptedByUserId === session.id) {
        return jsonError("تو از قبل در این حلقه هستی", 409, "already");
      }
      return jsonError("این دعوت قبلاً استفاده شده", 409, "accepted");
    }
  } else if (inviteIsFull(row) || status === "accepted") {
    return jsonError("سقف این لینک پر شده", 409, "full");
  }

  const acceptedAt = new Date();

  try {
    const invite = await prisma.$transaction(async (tx) => {
      const current = await tx.invite.findUnique({ where: { id: row.id } });
      if (!current) throw new Error("invalid");

      if (current.kind === "wave") {
        if (current.useCount >= current.maxUses || current.status !== "pending") {
          const err = new Error("full");
          (err as Error & { inviteCode?: string }).inviteCode = "full";
          throw err;
        }
        await tx.inviteAcceptance.create({
          data: { inviteId: current.id, userId: session.id },
        });
        const nextCount = current.useCount + 1;
        const updated = await tx.invite.update({
          where: { id: current.id },
          data: {
            useCount: nextCount,
            status: nextCount >= current.maxUses ? "accepted" : "pending",
            acceptedAt: nextCount >= current.maxUses ? acceptedAt : undefined,
          },
        });
        await tx.circleEdge.create({
          data: {
            fromUserId: current.inviterUserId,
            toUserId: session.id,
            trustGroup: current.trustGroup,
            relationType: current.relationType,
          },
        });
        return updated;
      }

      await tx.inviteAcceptance.create({
        data: { inviteId: current.id, userId: session.id },
      });
      const updated = await tx.invite.update({
        where: { id: current.id },
        data: {
          status: "accepted",
          acceptedByUserId: session.id,
          acceptedAt,
          useCount: 1,
        },
      });
      await tx.circleEdge.create({
        data: {
          fromUserId: current.inviterUserId,
          toUserId: session.id,
          trustGroup: current.trustGroup,
          relationType: current.relationType,
        },
      });
      return updated;
    });

    return Response.json({
      invite: toClientInvite(invite),
      inviter: personFromUser(row.inviter, {
        relation: "friend",
        level: "B",
      }),
      edgeCreated: true,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return jsonError("تو از قبل در این حلقه هستی", 409, "already");
    }
    if (err instanceof Error && (err as Error & { inviteCode?: string }).inviteCode === "full") {
      return jsonError("سقف این لینک پر شده", 409, "full");
    }
    throw err;
  }
}
