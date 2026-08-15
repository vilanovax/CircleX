import { loadHomeFeed } from "@/lib/circle-network";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import {
  inviteExpectedInclude,
  pendingPersonFromInvite,
  toClientInvite,
  toClientJoinRequest,
} from "@/lib/mappers";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const [inviteRows, joinRows, feed] = await Promise.all([
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
    loadHomeFeed(session.id),
  ]);

  const now = Date.now();
  const live = inviteRows.filter((r) => r.expiresAt.getTime() > now);
  const expiredIds = inviteRows
    .filter((r) => r.expiresAt.getTime() <= now)
    .map((r) => r.id);
  if (expiredIds.length > 0) {
    await prisma.invite.updateMany({
      where: { id: { in: expiredIds } },
      data: { status: "expired" },
    });
  }

  const pending = live.map(toClientInvite);

  return Response.json({
    members: feed.members,
    network: feed.network,
    pending,
    pendingPeople: pending.map(pendingPersonFromInvite),
    listings: feed.listings,
    joinRequests: joinRows.map(toClientJoinRequest),
  });
}
