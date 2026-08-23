import { requireAdmin } from "@/lib/admin-auth";
import {
  enumerateTehranDays,
  faDayLabel,
  tehranDayKey,
  tehranMidnight,
} from "@/lib/admin-day";
import { prisma } from "@/lib/db";
import { withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

function parseDays(raw: string | null): 7 | 14 | 30 {
  if (raw === "7") return 7;
  if (raw === "30") return 30;
  return 14;
}

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export async function GET(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const url = new URL(req.url);
    const days = parseDays(url.searchParams.get("days"));
    const keys = enumerateTehranDays(days);
    const since = tehranMidnight(keys[0] ?? tehranDayKey(new Date()));
    const now = new Date();

    const [users, listings, invites, accepts, joinPending, joinAccepted, joinRejected] =
      await Promise.all([
        prisma.user.findMany({
          where: { createdAt: { gte: since } },
          select: { createdAt: true },
        }),
        prisma.marketListing.findMany({
          where: { createdAt: { gte: since } },
          select: { createdAt: true },
        }),
        prisma.invite.findMany({
          where: { createdAt: { gte: since } },
          select: { createdAt: true, status: true, expiresAt: true },
        }),
        prisma.invite.findMany({
          where: { acceptedAt: { gte: since } },
          select: { acceptedAt: true },
        }),
        prisma.circleJoinRequest.count({ where: { status: "pending" } }),
        prisma.circleJoinRequest.count({
          where: { status: "accepted", resolvedAt: { gte: since } },
        }),
        prisma.circleJoinRequest.count({
          where: { status: "rejected", resolvedAt: { gte: since } },
        }),
      ]);

    const userMap = new Map<string, number>();
    const listingMap = new Map<string, number>();
    const inviteMap = new Map<string, number>();
    const acceptMap = new Map<string, number>();
    for (const row of users) bump(userMap, tehranDayKey(row.createdAt));
    for (const row of listings) bump(listingMap, tehranDayKey(row.createdAt));
    for (const row of invites) bump(inviteMap, tehranDayKey(row.createdAt));
    for (const row of accepts) {
      if (row.acceptedAt) bump(acceptMap, tehranDayKey(row.acceptedAt));
    }

    const series = keys.map((day) => ({
      day,
      label: faDayLabel(day),
      users: userMap.get(day) ?? 0,
      listings: listingMap.get(day) ?? 0,
      invites: inviteMap.get(day) ?? 0,
      accepts: acceptMap.get(day) ?? 0,
    }));

    let live = 0;
    let expired = 0;
    let revoked = 0;
    let accepted = 0;
    for (const row of invites) {
      if (row.status === "accepted") accepted += 1;
      else if (row.status === "revoked") revoked += 1;
      else if (row.status === "expired" || row.expiresAt.getTime() <= now.getTime()) {
        expired += 1;
      } else {
        live += 1;
      }
    }

    return Response.json({
      rangeDays: days,
      series,
      funnel: {
        created: invites.length,
        accepted,
        live,
        expired,
        revoked,
      },
      joins: {
        pending: joinPending,
        accepted: joinAccepted,
        rejected: joinRejected,
      },
      totals: {
        users: users.length,
        listings: listings.length,
        invites: invites.length,
        accepts: accepts.length,
      },
    });
  });
}
