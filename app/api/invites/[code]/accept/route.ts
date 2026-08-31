import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import {
  effectiveDbInviteStatus,
  inviteExpectedInclude,
  personFromUser,
  toClientInvite,
  isRosterComplete,
} from "@/lib/mappers";
import { getSessionUser } from "@/lib/server-auth";
import { isExpectedInvitee } from "@/lib/server-invite";
import {
  notifyInviteAccepted,
  notifyJoinRequest,
} from "@/lib/server-notices";
import { ensureFamilyReciprocal } from "@/lib/server-family-reciprocal";
import { seedFamilyCircle } from "@/lib/server-family-seed";
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
    include: { inviter: true, expected: true },
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

  const inviter = personFromUser(row.inviter, {
    relation: "friend",
    level: "B",
  });

  const existingEdge = await prisma.circleEdge.findUnique({
    where: {
      fromUserId_toUserId: {
        fromUserId: row.inviterUserId,
        toUserId: session.id,
      },
    },
  });
  const reverseEdge = await prisma.circleEdge.findUnique({
    where: {
      fromUserId_toUserId: {
        fromUserId: session.id,
        toUserId: row.inviterUserId,
      },
    },
  });
  if (existingEdge) {
    if (existingEdge.relationType === "family") {
      await ensureFamilyReciprocal(
        prisma,
        row.inviterUserId,
        session.id,
        existingEdge.trustGroup,
      );
    }
    if (reverseEdge) {
      return jsonError("تو از قبل در این حلقه هستی", 409, "already");
    }
    await prisma.circleJoinRequest.updateMany({
      where: {
        hostUserId: row.inviterUserId,
        guestUserId: session.id,
        status: "pending",
      },
      data: { status: "accepted", resolvedAt: new Date() },
    });
    return Response.json({
      invite: toClientInvite(row),
      inviter,
      edgeCreated: false,
      requested: false,
    });
  }

  const expected = isExpectedInvitee(row, session.phoneNormalized);
  const waveFull =
    row.kind === "wave" &&
    (status === "accepted" ||
      row.useCount >= row.maxUses ||
      isRosterComplete(row.expected));
  if (waveFull && !existingEdge) {
    return jsonError("سقف این لینک پر شده", 409, "full");
  }

  if (!expected) {
    const joinReq = await prisma.circleJoinRequest.upsert({
      where: {
        hostUserId_guestUserId: {
          hostUserId: row.inviterUserId,
          guestUserId: session.id,
        },
      },
      create: {
        hostUserId: row.inviterUserId,
        guestUserId: session.id,
        inviteId: row.id,
        status: "pending",
      },
      update: {
        status: "pending",
        inviteId: row.id,
        resolvedAt: null,
      },
    });
    await notifyJoinRequest({
      hostUserId: row.inviterUserId,
      guestUserId: session.id,
      guestName: session.name,
      joinRequestId: joinReq.id,
    }).catch(() => {});
    return Response.json({
      invite: toClientInvite(row),
      inviter,
      edgeCreated: false,
      requested: true,
    });
  }

  if (row.kind === "personal") {
    if (status === "accepted") {
      if (row.acceptedByUserId === session.id) {
        return jsonError("تو از قبل در این حلقه هستی", 409, "already");
      }
      return jsonError("این دعوت قبلاً استفاده شده", 409, "accepted");
    }
  } else if (
    row.useCount >= row.maxUses ||
    status === "accepted" ||
    isRosterComplete(row.expected)
  ) {
    return jsonError("سقف این لینک پر شده", 409, "full");
  }

  const acceptedAt = new Date();

  try {
    const invite = await prisma.$transaction(async (tx) => {
      const current = await tx.invite.findUnique({
        where: { id: row.id },
        include: { expected: true },
      });
      if (!current) throw new Error("invalid");

      if (current.kind === "wave") {
        if (
          current.useCount >= current.maxUses ||
          current.status !== "pending" ||
          isRosterComplete(current.expected)
        ) {
          const err = new Error("full");
          (err as Error & { inviteCode?: string }).inviteCode = "full";
          throw err;
        }
        await tx.inviteAcceptance.create({
          data: { inviteId: current.id, userId: session.id },
        });
        const nextCount = current.useCount + 1;
        await tx.circleEdge.create({
          data: {
            fromUserId: current.inviterUserId,
            toUserId: session.id,
            trustGroup: current.trustGroup,
            relationType: current.relationType,
          },
        });
        if (current.relationType === "family") {
          await ensureFamilyReciprocal(
            tx,
            current.inviterUserId,
            session.id,
            current.trustGroup,
          );
        }
        await markExpectedJoined(tx, current.id, session.id, session.phoneNormalized);
        await resolveJoinRequest(tx, current.inviterUserId, session.id);
        const after = await tx.invite.findUniqueOrThrow({
          where: { id: current.id },
          include: { expected: true },
        });
        const rosterDone = isRosterComplete(after.expected);
        const capDone = nextCount >= current.maxUses || rosterDone;
        await tx.invite.update({
          where: { id: current.id },
          data: {
            useCount: nextCount,
            maxUses: rosterDone
              ? Math.min(current.maxUses, after.expected.length)
              : current.maxUses,
            status: capDone ? "accepted" : "pending",
            acceptedAt: capDone ? acceptedAt : undefined,
          },
        });
        return tx.invite.findUniqueOrThrow({
          where: { id: current.id },
          include: inviteExpectedInclude,
        });
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
      if (current.relationType === "family") {
        await ensureFamilyReciprocal(
          tx,
          current.inviterUserId,
          session.id,
          current.trustGroup,
        );
      }
      await markExpectedJoined(tx, current.id, session.id, session.phoneNormalized);
      await resolveJoinRequest(tx, current.inviterUserId, session.id);
      return tx.invite.findUniqueOrThrow({
        where: { id: updated.id },
        include: inviteExpectedInclude,
      });
    });

    await notifyInviteAccepted({
      hostUserId: row.inviterUserId,
      guestUserId: session.id,
      guestName: session.name,
      inviteId: row.id,
    }).catch(() => {});

    if (row.relationType === "family") {
      const host = await prisma.user.findUnique({
        where: { id: row.inviterUserId },
        select: { phoneNormalized: true },
      });
      if (host) {
        await seedFamilyCircle(row.inviterUserId, host.phoneNormalized).catch(
          () => {},
        );
      }
    }

    return Response.json({
      invite: toClientInvite(invite),
      inviter,
      edgeCreated: true,
      requested: false,
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

async function resolveJoinRequest(
  tx: Prisma.TransactionClient,
  hostUserId: string,
  guestUserId: string,
) {
  await tx.circleJoinRequest.updateMany({
    where: { hostUserId, guestUserId, status: "pending" },
    data: { status: "accepted", resolvedAt: new Date() },
  });
}

async function markExpectedJoined(
  tx: Prisma.TransactionClient,
  inviteId: string,
  userId: string,
  phone: string,
) {
  if (!phone) return;
  await tx.inviteExpected.updateMany({
    where: { inviteId, phone, joinedUserId: null },
    data: { joinedUserId: userId },
  });
}
