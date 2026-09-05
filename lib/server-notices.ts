import { listingBroadcastOpen } from "@/lib/listing-share";
import { prisma } from "@/lib/db";
import { CIRCLO_PEER_ID } from "@/lib/circlo";
import { relativePostedAt } from "@/lib/mappers";
import { viewerCanSeeListing } from "@/lib/server-listing-visibility";
import type { Message } from "@/lib/types";

export const NOTICE_INBOX_CAP = 80;

export const NOTICE_KIND = {
  joinRequest: "join_request",
  inviteAccepted: "invite_accepted",
  watchHit: "watch_hit",
  circleListing: "circle_listing",
  listingReportResolved: "listing_report_resolved",
  messageReportResolved: "message_report_resolved",
  contentHidden: "content_hidden",
  broadcast: "broadcast",
  addedToCircle: "added_to_circle",
  listingShare: "listing_share",
} as const;

function guestLabel(name: string): string {
  const t = name.trim();
  return t || "یک نفر";
}

export async function notifyJoinRequest(opts: {
  hostUserId: string;
  guestUserId: string;
  guestName: string;
  joinRequestId: string;
}): Promise<void> {
  const unread = await prisma.systemNotice.findFirst({
    where: {
      userId: opts.hostUserId,
      kind: NOTICE_KIND.joinRequest,
      actorUserId: opts.guestUserId,
      readAt: null,
    },
    select: { id: true },
  });
  if (unread) return;

  const who = guestLabel(opts.guestName);
  await prisma.systemNotice.create({
    data: {
      userId: opts.hostUserId,
      kind: NOTICE_KIND.joinRequest,
      title: "درخواست ورود به حلقه",
      body: `${who} از لینک دعوت آمد و در فهرست دعوت‌شده‌ها نبود. در حلقه‌ی من بررسی کن.`,
      actionHref: "/circle",
      actionLabel: "بررسی",
      actorUserId: opts.guestUserId,
      joinRequestId: opts.joinRequestId,
    },
  });
}

export async function notifyListingReportResolved(opts: {
  reporterId: string;
  listingId: string;
  listingTitle: string;
  status: "reviewed" | "dismissed";
}): Promise<void> {
  const reviewed = opts.status === "reviewed";
  const title = reviewed ? "گزارش آگهی بررسی شد" : "گزارش آگهی بسته شد";
  const body = reviewed
    ? `گزارش تو درباره «${opts.listingTitle}» بررسی شد.`
    : `گزارش تو درباره «${opts.listingTitle}» بررسی شد و اقدامی لازم نبود.`;
  await prisma.systemNotice.create({
    data: {
      userId: opts.reporterId,
      kind: NOTICE_KIND.listingReportResolved,
      title,
      body,
      actionHref: `/listing/${opts.listingId}`,
      actionLabel: "آگهی",
      listingId: opts.listingId,
    },
  });
}

export async function notifyMessageReportResolved(opts: {
  reporterId: string;
  status: "reviewed" | "dismissed";
  hiddenMessage: boolean;
}): Promise<void> {
  const reviewed = opts.status === "reviewed";
  const title = reviewed ? "گزارش پیام بررسی شد" : "گزارش پیام بسته شد";
  const body = opts.hiddenMessage
    ? "گزارش تو بررسی شد و آن پیام از گفتگو برداشته شد."
    : reviewed
      ? "گزارش تو درباره یک پیام بررسی شد."
      : "گزارش تو درباره یک پیام بررسی شد و اقدامی لازم نبود.";
  await prisma.systemNotice.create({
    data: {
      userId: opts.reporterId,
      kind: NOTICE_KIND.messageReportResolved,
      title,
      body,
      actionHref: "/messages",
      actionLabel: "پیام‌ها",
    },
  });
}

export async function notifyMessageHidden(opts: { senderId: string }): Promise<void> {
  await prisma.systemNotice.create({
    data: {
      userId: opts.senderId,
      kind: NOTICE_KIND.contentHidden,
      title: "یک پیام تو برداشته شد",
      body: "پیامی که فرستاده بودی با مقررات حلقه سازگار نبود و از گفتگو برداشته شد.",
      actionHref: "/messages",
      actionLabel: "پیام‌ها",
    },
  });
}

export async function notifyContentHidden(opts: {
  ownerId: string;
  kind: "listing" | "request" | "event";
  id: string;
  title: string;
}): Promise<void> {
  const noun =
    opts.kind === "listing"
      ? "آگهی"
      : opts.kind === "request"
        ? "درخواست"
        : "رویداد";
  const href =
    opts.kind === "listing"
      ? `/listing/${opts.id}`
      : opts.kind === "request"
        ? `/request/${opts.id}`
        : `/event/${opts.id}`;
  await prisma.systemNotice.create({
    data: {
      userId: opts.ownerId,
      kind: NOTICE_KIND.contentHidden,
      title: `${noun} از دید دیگران مخفی شد`,
      body: `«${opts.title}» فعلاً در فید حلقه دیده نمی‌شود.`,
      actionHref: href,
      actionLabel: noun,
      listingId: opts.kind === "listing" ? opts.id : undefined,
    },
  });
}

export async function notifyAddedToCircle(opts: {
  addedUserId: string;
  actorUserId: string;
  actorName: string;
}): Promise<void> {
  if (opts.addedUserId === opts.actorUserId) return;
  const unread = await prisma.systemNotice.findFirst({
    where: {
      userId: opts.addedUserId,
      kind: NOTICE_KIND.addedToCircle,
      actorUserId: opts.actorUserId,
      readAt: null,
    },
    select: { id: true },
  });
  if (unread) return;

  const who = guestLabel(opts.actorName);
  await prisma.systemNotice.create({
    data: {
      userId: opts.addedUserId,
      kind: NOTICE_KIND.addedToCircle,
      title: `${who} تو را به حلقه‌اش اضافه کرد`,
      body: "اگر می‌شناسی‌اش، جایش را در حلقهٔ خودت مشخص کن.",
      actionHref: `/person/${opts.actorUserId}`,
      actionLabel: "جا بگذار",
      actorUserId: opts.actorUserId,
    },
  });
}

export async function notifyInviteAccepted(opts: {
  hostUserId: string;
  guestUserId: string;
  guestName: string;
  inviteId: string;
}): Promise<void> {
  const who = guestLabel(opts.guestName);
  await prisma.systemNotice.create({
    data: {
      userId: opts.hostUserId,
      kind: NOTICE_KIND.inviteAccepted,
      title: "دعوت پذیرفته شد",
      body: `${who} دعوت را پذیرفت و به حلقه اضافه شد.`,
      actionHref: "/circle",
      actionLabel: "حلقه",
      actorUserId: opts.guestUserId,
      inviteId: opts.inviteId,
    },
  });
}

const CIRCLE_LISTING_FANOUT_CAP = 40;

function shortListingTitle(title: string): string {
  const t = title.trim();
  if (t.length <= 80) return t;
  return `${t.slice(0, 80)}…`;
}

/** Tell people who already have the seller in their circle that a listing is up. */
export async function notifyDirectCircleListing(opts: {
  sellerId: string;
  sellerName: string;
  listingId: string;
  title: string;
  privacy: string;
  dealStatus: string | null;
  hideIdentity?: boolean;
  excludeRelationTypes?: unknown;
}): Promise<void> {
  const [outbound, inbound] = await Promise.all([
    prisma.circleEdge.findMany({
      where: { fromUserId: opts.sellerId },
      select: { toUserId: true },
      take: CIRCLE_LISTING_FANOUT_CAP,
    }),
    prisma.circleEdge.findMany({
      where: { toUserId: opts.sellerId },
      select: { fromUserId: true },
      take: CIRCLE_LISTING_FANOUT_CAP,
    }),
  ]);
  const viewerIds = Array.from(
    new Set([
      ...outbound.map((row) => row.toUserId),
      ...inbound.map((row) => row.fromUserId),
    ]),
  )
    .filter((id) => id !== opts.sellerId)
    .slice(0, CIRCLE_LISTING_FANOUT_CAP);

  if (viewerIds.length === 0) return;

  const who = opts.hideIdentity
    ? "یکی از حلقه‌ات"
    : guestLabel(opts.sellerName);
  const body = shortListingTitle(opts.title);

  for (const viewerId of viewerIds) {
    const visible = await viewerCanSeeListing({
      viewerId,
      sellerId: opts.sellerId,
      privacy: opts.privacy,
      dealStatus: opts.dealStatus,
      listingId: opts.listingId,
      hideIdentity: opts.hideIdentity,
      excludeRelationTypes: opts.excludeRelationTypes,
    });
    if (!visible) continue;

    const already = await prisma.systemNotice.findFirst({
      where: {
        userId: viewerId,
        listingId: opts.listingId,
        kind: {
          in: [NOTICE_KIND.circleListing, NOTICE_KIND.watchHit],
        },
      },
      select: { id: true },
    });
    if (already) continue;

    await prisma.systemNotice.create({
      data: {
        userId: viewerId,
        kind: NOTICE_KIND.circleListing,
        title: `${who} آگهی گذاشت`,
        body,
        actionHref: `/listing/${opts.listingId}`,
        actionLabel: "آگهی",
        actorUserId: opts.sellerId,
        listingId: opts.listingId,
      },
    });
  }
}

/** C in B's circle: B vouched an open listing, so it can show in C's feed. */
export async function notifyEndorsementOpenedListing(opts: {
  listingId: string;
  title: string;
  sellerId: string;
  endorserId: string;
  endorserName: string;
  privacy: string;
  dealStatus: string | null;
  hideIdentity: boolean;
  excludeRelationTypes?: unknown;
}): Promise<void> {
  if (!listingBroadcastOpen(opts.privacy, opts.hideIdentity)) return;

  const members = await prisma.circleEdge.findMany({
    where: { fromUserId: opts.endorserId },
    select: { toUserId: true },
    take: CIRCLE_LISTING_FANOUT_CAP,
  });
  const viewerIds = members
    .map((row) => row.toUserId)
    .filter(
      (id) => id !== opts.endorserId && id !== opts.sellerId,
    )
    .slice(0, CIRCLE_LISTING_FANOUT_CAP);
  if (viewerIds.length === 0) return;

  const who = guestLabel(opts.endorserName);
  const body = shortListingTitle(opts.title);

  for (const viewerId of viewerIds) {
    const visible = await viewerCanSeeListing({
      viewerId,
      sellerId: opts.sellerId,
      privacy: opts.privacy,
      dealStatus: opts.dealStatus,
      listingId: opts.listingId,
      hideIdentity: opts.hideIdentity,
      excludeRelationTypes: opts.excludeRelationTypes,
    });
    if (!visible) continue;

    const already = await prisma.systemNotice.findFirst({
      where: {
        userId: viewerId,
        listingId: opts.listingId,
        kind: NOTICE_KIND.listingShare,
      },
      select: { id: true },
    });
    if (already) continue;

    await prisma.systemNotice.create({
      data: {
        userId: viewerId,
        kind: NOTICE_KIND.listingShare,
        title: `${who} این آگهی را تأیید کرد`,
        body,
        actionHref: `/listing/${opts.listingId}`,
        actionLabel: "آگهی",
        actorUserId: opts.endorserId,
        listingId: opts.listingId,
      },
    });
  }
}

export function toClientNotice(
  row: {
    id: string;
    title: string;
    body: string;
    actionHref: string | null;
    actionLabel: string | null;
    readAt: Date | null;
    createdAt: Date;
  },
  now = Date.now(),
): Message {
  const text = row.title ? `${row.title}\n${row.body}` : row.body;
  return {
    id: `notice:${row.id}`,
    peerId: CIRCLO_PEER_ID,
    fromMe: false,
    text,
    postedAt: relativePostedAt(row.createdAt, now),
    sentAt: row.createdAt.getTime(),
    read: Boolean(row.readAt),
    kind: "notice",
    actionHref: row.actionHref ?? undefined,
    actionLabel: row.actionLabel ?? undefined,
  };
}

export async function loadNoticeRows(userId: string) {
  const rows = await prisma.systemNotice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: NOTICE_INBOX_CAP,
  });
  return rows.reverse();
}

export async function markNoticesRead(userId: string): Promise<number> {
  const result = await prisma.systemNotice.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count;
}
