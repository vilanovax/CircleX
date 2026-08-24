import { prisma } from "./db";

export type ListingOwnerStats = {
  views: number;
  saves: number;
  conversations: number;
  messages: number;
  unread: number;
  endorsements: number;
};

export async function recordListingView(opts: {
  listingId: string;
  viewerId: string;
  sellerId: string;
}): Promise<void> {
  if (opts.viewerId === opts.sellerId) return;
  await prisma.listingView.upsert({
    where: {
      listingId_viewerId: {
        listingId: opts.listingId,
        viewerId: opts.viewerId,
      },
    },
    create: { listingId: opts.listingId, viewerId: opts.viewerId },
    update: {},
  });
}

export async function listingOwnerStats(
  listingId: string,
  sellerId: string,
): Promise<ListingOwnerStats> {
  const [views, saves, endorsements, rows] = await Promise.all([
    prisma.listingView.count({ where: { listingId } }),
    prisma.savedListing.count({ where: { listingId } }),
    prisma.listingEndorsement.count({
      where: { listingId, hidden: false },
    }),
    prisma.directMessage.findMany({
      where: { listingId, hiddenAt: null },
      select: { fromUserId: true, toUserId: true, readAt: true },
    }),
  ]);

  const peers = new Set<string>();
  let unread = 0;
  for (const row of rows) {
    const peer = row.fromUserId === sellerId ? row.toUserId : row.fromUserId;
    peers.add(peer);
    if (row.toUserId === sellerId && row.readAt == null) unread += 1;
  }

  return {
    views,
    saves,
    conversations: peers.size,
    messages: rows.length,
    unread,
    endorsements,
  };
}
