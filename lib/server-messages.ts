import { listingAccess, personFromNetworkUser } from "@/lib/circle-network";
import { prisma } from "@/lib/db";
import { memberFromEdge, toClientDirectMessage } from "@/lib/mappers";
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
  const unique = Array.from(new Set(peerIds.filter(Boolean)));
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
): Promise<SendAuth> {
  if (!peerId) return { ok: false, error: "مخاطب نامعتبر است", status: 400 };
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
    const access = await listingAccess(viewerId, listing.sellerId);
    if (!access.ok) {
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
  const rows = await prisma.directMessage.findMany({
    where: {
      OR: [{ fromUserId: viewerId }, { toUserId: viewerId }],
    },
    orderBy: { createdAt: "desc" },
    take: DM_INBOX_CAP,
  });
  const now = Date.now();
  const messages = rows
    .slice()
    .reverse()
    .map((row) => toClientDirectMessage(row, viewerId, now));
  const peerIds = Array.from(new Set(messages.map((m) => m.peerId)));
  const people = await peopleForMessagePeers(viewerId, peerIds);
  return { messages, people };
}
