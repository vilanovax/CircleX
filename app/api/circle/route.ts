import { prisma } from "@/lib/db";
import { loadCircleNetwork, loadViewerPrefs } from "@/lib/circle-network";
import { jsonError, withDb } from "@/lib/http";
import {
  inviteExpectedInclude,
  pendingPersonFromInvite,
  toClientInvite,
  toClientJoinRequest,
} from "@/lib/mappers";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return withDb(async () => {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const [inviteRows, joinRows, network, prefs] = await Promise.all([
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
    loadCircleNetwork(session.id),
    loadViewerPrefs(session.id),
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
    listings: network.listings,
    requests: network.requests,
    offers: network.offers,
    events: network.events,
    joinRequests: joinRows.map(toClientJoinRequest),
    saved: prefs.saved,
    hiddenListings: prefs.hiddenListings,
    listingNotes: prefs.listingNotes,
    archivedThreads: prefs.archivedThreads,
    pinnedThreads: prefs.pinnedThreads,
    deletedThreads: prefs.deletedThreads,
    showOwnListingsInFeed: prefs.showOwnListingsInFeed,
  });
  });
}
