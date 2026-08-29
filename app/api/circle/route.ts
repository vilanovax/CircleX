import { prisma } from "@/lib/db";
import { loadAddedYou, loadGraphNetwork } from "@/lib/circle-network";
import { jsonError, withDb } from "@/lib/http";
import {
  inviteExpectedInclude,
  pendingPersonFromInvite,
  toClientInvite,
  toClientJoinRequest,
} from "@/lib/mappers";
import { getSessionUser } from "@/lib/server-auth";
import {
  liveJoinRequests,
  resolveJoinRequestsForMembers,
} from "@/lib/server-join-request";

export const dynamic = "force-dynamic";

/** Roster + map links only — listing bodies stay on /api/home. */
export async function GET() {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const [inviteRows, joinRows, network, addedYou] = await Promise.all([
      prisma.invite.findMany({
        where: { inviterUserId: session.id, status: "pending" },
        orderBy: { createdAt: "desc" },
        include: inviteExpectedInclude,
      }),
      prisma.circleJoinRequest.findMany({
        where: { hostUserId: session.id, status: "pending" },
        include: { guest: true },
        orderBy: { createdAt: "desc" },
      }),
      loadGraphNetwork(session.id),
      loadAddedYou(session.id),
    ]);

    const now = Date.now();
    const live = inviteRows.filter((r) => r.expiresAt.getTime() > now);
    const expiredIds = inviteRows
      .filter((r) => r.expiresAt.getTime() <= now)
      .map((r) => r.id);
    if (expiredIds.length > 0) {
      void prisma.invite
        .updateMany({
          where: { id: { in: expiredIds } },
          data: { status: "expired" },
        })
        .catch(() => {});
    }

    const pending = live.map(toClientInvite);
    const memberIds = network.members.map((m) => m.id);
    const memberIdSet = new Set(memberIds);
    const staleJoins = joinRows.filter((row) => memberIdSet.has(row.guestUserId));
    if (staleJoins.length > 0) {
      void resolveJoinRequestsForMembers(session.id, memberIds).catch(() => {});
    }
    const links = network.links.map((link) => ({
      ...link,
      fromId: link.fromId === session.id ? "me" : link.fromId,
      toId: link.toId === session.id ? "me" : link.toId,
    }));

    return Response.json({
      members: network.members,
      network: network.network,
      links,
      pending,
      pendingPeople: pending.map(pendingPersonFromInvite),
      joinRequests: liveJoinRequests(joinRows, memberIdSet).map(
        toClientJoinRequest,
      ),
      addedYou,
    });
  });
}
