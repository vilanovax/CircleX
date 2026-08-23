import { prisma } from "@/lib/db";
import { CIRCLO_PEER_ID } from "@/lib/circlo";
import { relativePostedAt } from "@/lib/mappers";
import type { Message } from "@/lib/types";

export const NOTICE_INBOX_CAP = 80;

export const NOTICE_KIND = {
  joinRequest: "join_request",
  inviteAccepted: "invite_accepted",
  watchHit: "watch_hit",
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
    read: Boolean(row.readAt),
    kind: "notice",
    actionHref: row.actionHref ?? undefined,
    actionLabel: row.actionLabel ?? undefined,
  };
}

export async function loadNoticeRows(userId: string) {
  return prisma.systemNotice.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: NOTICE_INBOX_CAP,
  });
}

export async function markNoticesRead(userId: string): Promise<number> {
  const result = await prisma.systemNotice.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count;
}
