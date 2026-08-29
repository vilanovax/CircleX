import { loadAddedYou, loadFeedPrefs, loadHomeFeed } from "@/lib/circle-network";
import { notifyAddedToCircle } from "@/lib/server-notices";
import { prisma } from "@/lib/db";
import {
  toClientInvite,
  toClientJoinRequest,
} from "@/lib/mappers";
import type { SessionUser } from "@/lib/server-auth";
import {
  liveJoinRequests,
  resolveJoinRequestsForMembers,
} from "@/lib/server-join-request";
import type { HomeBootPayload } from "@/lib/home-types";

/** One home snapshot: feed + prefs + invites. Safe to call from RSC or the API. */
export async function loadHomePayload(
  session: SessionUser,
): Promise<HomeBootPayload> {
  const started = Date.now();
  const [inviteRows, joinRows, feed, prefs, addedYou] = await Promise.all([
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
    loadAddedYou(session.id),
  ]);

  if (addedYou.length > 0) {
    void Promise.all(
      addedYou.map((person) =>
        notifyAddedToCircle({
          addedUserId: session.id,
          actorUserId: person.id,
          actorName: person.name,
        }),
      ),
    ).catch(() => {});
  }

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
  const memberIds = feed.members.map((m) => m.id);
  const memberIdSet = new Set(memberIds);
  const staleJoins = joinRows.filter((row) => memberIdSet.has(row.guestUserId));
  if (staleJoins.length > 0) {
    void resolveJoinRequestsForMembers(session.id, memberIds).catch(() => {});
  }

  const payload: HomeBootPayload = {
    members: feed.members,
    network: feed.network,
    pending,
    listings: feed.listings,
    requests: feed.requests,
    offers: feed.offers,
    events: feed.events,
    joinRequests: liveJoinRequests(joinRows, memberIdSet).map(
      toClientJoinRequest,
    ),
    saved: prefs.saved,
    hiddenListings: prefs.hiddenListings,
    hiddenPeople: prefs.hiddenPeople,
    listingNotes: prefs.listingNotes,
    showOwnListingsInFeed: prefs.showOwnListingsInFeed,
    addedYou,
  };

  if (
    process.env.HOME_QUERY_LOG === "1" ||
    process.env.NODE_ENV === "development"
  ) {
    console.info(
      `[home] ${Date.now() - started}ms listings=${payload.listings.length} members=${payload.members.length}`,
    );
  }

  return payload;
}
