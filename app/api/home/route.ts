import { loadFeedPrefs, loadHomeFeed } from "@/lib/circle-network";
import { prisma } from "@/lib/db";
import { jsonError, withDb } from "@/lib/http";
import {
  toClientInvite,
  toClientJoinRequest,
} from "@/lib/mappers";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const [inviteRows, joinRows, feed, prefs] = await Promise.all([
      prisma.invite.findMany({
        where: { inviterUserId: session.id, status: "pending" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.circleJoinRequest.findMany({
        where: { hostUserId: session.id, status: "pending" },
        include: { guest: true },
        orderBy: { createdAt: "desc" },
      }),
      loadHomeFeed(session.id),
      loadFeedPrefs(session.id),
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

    return Response.json({
      members: feed.members,
      network: feed.network,
      pending,
      listings: feed.listings,
      requests: feed.requests,
      offers: feed.offers,
      events: feed.events,
      joinRequests: joinRows.map(toClientJoinRequest),
      saved: prefs.saved,
      hiddenListings: prefs.hiddenListings,
      hiddenPeople: prefs.hiddenPeople,
      listingNotes: prefs.listingNotes,
      showOwnListingsInFeed: prefs.showOwnListingsInFeed,
    });
  });
}
