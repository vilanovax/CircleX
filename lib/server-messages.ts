import { listingAccess, personFromNetworkUser } from "@/lib/circle-network";
import { isCircloPeer } from "@/lib/circlo";
import { prisma } from "@/lib/db";
import { memberFromEdge, toClientDirectMessage } from "@/lib/mappers";
import { CIRCLE_MEMBER_AVATAR, CIRCLE_MEMBER_NAME } from "@/lib/listing-privacy";
import { viewerCanSeeListing } from "@/lib/server-listing-visibility";
import { loadNoticeRows, toClientNotice } from "@/lib/server-notices";
import type { Message, Person } from "@/lib/types";

export const DM_TEXT_MAX = 2000;
export const DM_INBOX_CAP = 400;

export type SendAuth =
  | { ok: true }
  | { ok: false; error: string; status: number };

export async function peopleForMessagePeers(
  viewerId: string,
  peerIds: string[],
): Promise<Person[]> {
  const unique = Array.from(
    new Set(peerIds.filter((id) => id && !isCircloPeer(id))),
  );
  if (unique.length === 0) return [];

  const edges = await prisma.circleEdge.findMany({
    where: { fromUserId: viewerId, toUserId: { in: unique } },
    include: { to: true },
  });
  const fromCircle = edges.map(memberFromEdge);
  const have = new Set(fromCircle.map((p) => p.id));
  const missing = unique.filter((id) => !have.has(id));
  if (missing.length === 0) return fromCircle;

  const users = await prisma.user.findMany({ where: { id: { in: missing } } });
  const extras = users.map((user) =>
    personFromNetworkUser(user, {
      relation: "acquaintance",
      level: "C",
      inMyCircle: false,
      note: "از پیام",
    }),
  );
  return [...fromCircle, ...extras];
}

async function peerHasVisibleOffering(
  viewerId: string,
  peerId: string,
): Promise<boolean> {
  const access = await listingAccess(viewerId, peerId);
  if (!access.ok) return false;

  const [listing, request] = await Promise.all([
    prisma.marketListing.findFirst({
      where: {
        sellerId: peerId,
        NOT: { dealStatus: "inactive" },
      },
      select: { id: true },
    }),
    prisma.wantRequest.findFirst({
      where: { requesterId: peerId },
      select: { id: true },
    }),
  ]);
  return Boolean(listing || request);
}

export async function assertCanSendDm(
  viewerId: string,
  peerId: string,
  listingId?: string | null,
  listingScoped = false,
): Promise<SendAuth> {
  if (!peerId) return { ok: false, error: "مخاطب نامعتبر است", status: 400 };
  if (isCircloPeer(peerId)) {
    return { ok: false, error: "به سیرکلو نمی‌توان پیام داد", status: 400 };
  }
  if (peerId === viewerId) {
    return { ok: false, error: "نمی‌توانی به خودت پیام بدهی", status: 400 };
  }

  const peer = await prisma.user.findUnique({
    where: { id: peerId },
    select: { id: true },
  });
  if (!peer) return { ok: false, error: "این شخص پیدا نشد", status: 404 };

  const [outEdge, inEdge, prior] = await Promise.all([
    prisma.circleEdge.findUnique({
      where: {
        fromUserId_toUserId: { fromUserId: viewerId, toUserId: peerId },
      },
      select: { fromUserId: true },
    }),
    prisma.circleEdge.findUnique({
      where: {
        fromUserId_toUserId: { fromUserId: peerId, toUserId: viewerId },
      },
      select: { fromUserId: true },
    }),
    prisma.directMessage.findFirst({
      where: {
        hiddenAt: null,
        OR: [
          { fromUserId: viewerId, toUserId: peerId },
          { fromUserId: peerId, toUserId: viewerId },
        ],
      },
      select: { id: true },
    }),
  ]);

  const related = Boolean(outEdge || inEdge || prior);

  if (listingId) {
    const listing = await prisma.marketListing.findUnique({
      where: { id: listingId },
    });
    if (!listing) return { ok: false, error: "آگهی پیدا نشد", status: 404 };
    if (listing.dealStatus === "inactive" && listing.sellerId !== viewerId) {
      return { ok: false, error: "آگهی پیدا نشد", status: 404 };
    }
    const visible = await viewerCanSeeListing({
      viewerId,
      sellerId: listing.sellerId,
      privacy: listing.privacy,
      dealStatus: listing.dealStatus,
      listingId: listing.id,
      excludeRelationTypes: listing.excludeRelationTypes,
    });
    if (listing.sellerId !== viewerId && !visible) {
      return { ok: false, error: "این آگهی برای شما قابل مشاهده نیست", status: 403 };
    }
    if (listing.hideIdentity && !listingScoped) {
      return {
        ok: false,
        error: "گفتگوی این آگهی جدا از چت قبلی است",
        status: 403,
      };
    }
    const access = await listingAccess(viewerId, listing.sellerId);
    if (!access.ok && listing.sellerId !== viewerId) {
      return { ok: false, error: "این آگهی در حلقه تو نیست", status: 403 };
    }
    const peerIsSeller = listing.sellerId === peerId;
    const viewerIsSeller = listing.sellerId === viewerId;
    if (peerIsSeller || viewerIsSeller || related) return { ok: true };
    return {
      ok: false,
      error: "نمی‌توانی این آگهی را برای این نفر بفرستی",
      status: 403,
    };
  }

  if (prior) return { ok: true };
  if (!outEdge) {
    return { ok: false, error: "این نفر در حلقه تو نیست", status: 403 };
  }

  const hasOffering = await peerHasVisibleOffering(viewerId, peerId);
  if (hasOffering) return { ok: true };
  return {
    ok: false,
    error: "این نفر آگهی یا درخواست فعالی ندارد",
    status: 403,
  };
}

export async function loadInbox(viewerId: string): Promise<{
  messages: Message[];
  people: Person[];
}> {
  const [rows, noticeRows] = await Promise.all([
    prisma.directMessage.findMany({
      where: {
        hiddenAt: null,
        OR: [{ fromUserId: viewerId }, { toUserId: viewerId }],
      },
      orderBy: { createdAt: "desc" },
      take: DM_INBOX_CAP,
    }),
    loadNoticeRows(viewerId),
  ]);
  const now = Date.now();
  const scopedIds = Array.from(
    new Set(
      rows
        .filter((row) => row.listingScoped && row.listingId)
        .map((row) => row.listingId as string),
    ),
  );
  const [scopedListings, reveals] = scopedIds.length
    ? await Promise.all([
        prisma.marketListing.findMany({
          where: { id: { in: scopedIds } },
          select: { id: true, sellerId: true, hideIdentity: true },
        }),
        prisma.listingIdentityReveal.findMany({
          where: { listingId: { in: scopedIds }, viewerId },
          select: { listingId: true },
        }),
      ])
    : [[], []];
  const listingById = new Map(scopedListings.map((row) => [row.id, row]));
  const revealed = new Set(reveals.map((row) => row.listingId));

  const stamped: { at: number; message: Message }[] = rows
    .slice()
    .reverse()
    .map((row) => {
      const listing = row.listingId ? listingById.get(row.listingId) : undefined;
      const viewerIsSeller = listing?.sellerId === viewerId;
      const peerHidden = Boolean(
        row.listingScoped &&
          listing?.hideIdentity &&
          !viewerIsSeller &&
          !revealed.has(listing.id),
      );
      return {
        at: row.createdAt.getTime(),
        message: toClientDirectMessage(row, viewerId, now, { peerHidden }),
      };
    });
  for (const row of noticeRows) {
    stamped.push({
      at: row.createdAt.getTime(),
      message: toClientNotice(row, now),
    });
  }
  stamped.sort((a, b) => a.at - b.at);
  const messages = stamped.map((s) => s.message);
  const peerIds = Array.from(new Set(messages.map((m) => m.peerId)));
  const people = await peopleForMessagePeers(viewerId, peerIds);
  return { messages, people };
}
