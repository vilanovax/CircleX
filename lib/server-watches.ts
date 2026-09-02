import { prisma } from "@/lib/db";
import { NOTICE_KIND } from "@/lib/server-notices";
import { viewerCanSeeListing } from "@/lib/server-listing-visibility";
import {
  WATCH_HIT_PER_DAY,
  WATCH_KIND,
  pickBestPhraseWatch,
} from "@/lib/watch-match";

function tehranDayStart(now = new Date()): Date {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return new Date(`${day}T00:00:00+03:30`);
}

function shortTitle(title: string): string {
  const t = title.trim();
  if (t.length <= 80) return t;
  return `${t.slice(0, 80)}…`;
}

type WatchListing = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  privacy: string;
  dealStatus: string | null;
  hideIdentity?: boolean;
  excludeRelationTypes?: unknown;
};

export async function fanoutListingWatches(listing: WatchListing): Promise<void> {
  if (listing.dealStatus === "inactive") return;

  const [personWatches, phraseWatches, seller] = await Promise.all([
    prisma.listingWatch.findMany({
      where: {
        kind: WATCH_KIND.person,
        enabled: true,
        targetUserId: listing.sellerId,
        userId: { not: listing.sellerId },
      },
    }),
    prisma.listingWatch.findMany({
      where: {
        kind: WATCH_KIND.phrase,
        enabled: true,
        userId: { not: listing.sellerId },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: listing.sellerId },
      select: { name: true },
    }),
  ]);

  const phrasesByUser = new Map<string, typeof phraseWatches>();
  for (const watch of phraseWatches) {
    if (!watch.phraseNorm) continue;
    const list = phrasesByUser.get(watch.userId) ?? [];
    list.push(watch);
    phrasesByUser.set(watch.userId, list);
  }

  const personByUser = new Map(personWatches.map((w) => [w.userId, w]));
  const viewerIds = Array.from(
    new Set([...Array.from(personByUser.keys()), ...Array.from(phrasesByUser.keys())]),
  );

  const sellerName = listing.hideIdentity
    ? "یکی از اعضای سیرکل"
    : seller?.name.trim() || "یکی از حلقه";
  const body = shortTitle(listing.title);
  const dayStart = tehranDayStart();

  for (const viewerId of viewerIds) {
    const personWatch = personByUser.get(viewerId);
    const phraseWatch = pickBestPhraseWatch(
      listing.title,
      listing.description,
      (phrasesByUser.get(viewerId) ?? []).map((w) => ({
        ...w,
        phraseNorm: w.phraseNorm ?? "",
      })),
    );
    const chosen = listing.hideIdentity
      ? phraseWatch
      : personWatch ?? phraseWatch;
    if (!chosen) continue;

    const visible = await viewerCanSeeListing({
      viewerId,
      sellerId: listing.sellerId,
      privacy: listing.privacy,
      dealStatus: listing.dealStatus,
      listingId: listing.id,
      hideIdentity: listing.hideIdentity,
      excludeRelationTypes: listing.excludeRelationTypes,
    });
    if (!visible) continue;

    const already = await prisma.systemNotice.findFirst({
      where: {
        userId: viewerId,
        kind: NOTICE_KIND.watchHit,
        listingId: listing.id,
      },
      select: { id: true },
    });
    if (already) continue;

    const todayCount = await prisma.systemNotice.count({
      where: {
        userId: viewerId,
        kind: NOTICE_KIND.watchHit,
        watchId: chosen.id,
        createdAt: { gte: dayStart },
      },
    });
    if (todayCount >= WATCH_HIT_PER_DAY) continue;

    const isPerson = chosen.kind === WATCH_KIND.person;
    const phraseLabel = chosen.phrase?.trim() || chosen.phraseNorm || "";
    await prisma.systemNotice.create({
      data: {
        userId: viewerId,
        kind: NOTICE_KIND.watchHit,
        title: isPerson
          ? `گوش‌به‌زنگ: ${sellerName}`
          : `گوش‌به‌زنگ: ${phraseLabel}`,
        body,
        actionHref: `/listing/${listing.id}`,
        actionLabel: "دیدن آگهی",
        actorUserId: listing.hideIdentity ? null : listing.sellerId,
        listingId: listing.id,
        watchId: chosen.id,
      },
    });
  }
}
