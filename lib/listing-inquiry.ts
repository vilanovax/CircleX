import { isCircloPeer } from "@/lib/circlo";
import { listingChatHref, parseThreadKey } from "@/lib/listing-privacy";
import { DEAL_NOTE } from "@/lib/listing-prompts";
import type { ThreadIndex } from "@/lib/thread-index";
import type { Listing, Message, Person } from "@/lib/types";

export type ListingInquiry = {
  peerId: string;
  peerName: string;
  listingId: string;
  listingTitle: string;
  href: string;
  closed?: boolean;
};

function quotedTitleFromThread(thread: Message[] | undefined): string | undefined {
  if (!thread?.length) return undefined;
  for (let i = thread.length - 1; i >= 0; i--) {
    const hit = thread[i]!.text.match(/«([^»]{2,80})»/);
    if (hit?.[1]) return hit[1].trim();
  }
  return undefined;
}

function inquiryTitle(
  listing: Listing | undefined,
  threadIndex: ThreadIndex,
  key: string,
): string {
  return (
    listing?.title?.trim() ||
    quotedTitleFromThread(threadIndex.threadByPeer.get(key)) ||
    "آگهی"
  );
}

/** Newest unread DM about one of the viewer's own listings. */
export function unreadOwnListingInquiry(
  threadIndex: ThreadIndex,
  listings: Listing[],
  people: Person[],
): ListingInquiry | null {
  const mine = new Set<string>();
  const titleById = new Map<string, Listing>();
  for (let i = 0; i < listings.length; i++) {
    const row = listings[i];
    if (row.sellerId !== "me") continue;
    mine.add(row.id);
    titleById.set(row.id, row);
  }
  if (mine.size === 0) return null;

  const nameById = new Map(people.map((p) => [p.id, p.name]));
  let best: ListingInquiry | null = null;
  let bestSent = 0;

  for (const key of threadIndex.peerIds) {
    const unread = threadIndex.unreadByPeer.get(key) ?? 0;
    if (unread <= 0) continue;
    const last = threadIndex.lastByPeer.get(key);
    if (!last || last.fromMe || last.kind) continue;
    const listingId =
      last.listingId ||
      last.threadListingId ||
      threadIndex.listingIdByPeer.get(key);
    if (!listingId || !mine.has(listingId)) continue;
    const { peerId } = parseThreadKey(key);
    if (!peerId || isCircloPeer(peerId) || peerId === "me") continue;
    const sent = last.sentAt ?? 0;
    if (sent < bestSent) continue;
    const listing = titleById.get(listingId);
    bestSent = sent;
    best = {
      peerId,
      peerName: nameById.get(peerId) || "یک آشنا",
      listingId,
      listingTitle: inquiryTitle(listing, threadIndex, key),
      href: listingChatHref(
        {
          id: listingId,
          sellerId: "me",
          privatePublish: listing?.privatePublish,
        },
        { peerId },
      ),
    };
  }
  return best;
}

/** Newest unread reply on a listing the viewer asked about (not their own). */
export function unreadListingReply(
  threadIndex: ThreadIndex,
  listings: Listing[],
  people: Person[],
): ListingInquiry | null {
  const others = new Map<string, Listing>();
  for (let i = 0; i < listings.length; i++) {
    const row = listings[i];
    if (row.sellerId === "me") continue;
    others.set(row.id, row);
  }

  const nameById = new Map(people.map((p) => [p.id, p.name]));
  let best: ListingInquiry | null = null;
  let bestSent = 0;

  for (const key of threadIndex.peerIds) {
    const unread = threadIndex.unreadByPeer.get(key) ?? 0;
    if (unread <= 0) continue;
    const last = threadIndex.lastByPeer.get(key);
    if (!last || last.fromMe || last.kind) continue;
    const listingId =
      last.listingId ||
      last.threadListingId ||
      threadIndex.listingIdByPeer.get(key);
    if (!listingId) continue;
    const listing = others.get(listingId);
    const { peerId } = parseThreadKey(key);
    if (!peerId || isCircloPeer(peerId) || peerId === "me") continue;
    const sent = last.sentAt ?? 0;
    if (sent < bestSent) continue;
    bestSent = sent;
    const closed = last.text.trim() === DEAL_NOTE.done;
    best = {
      peerId,
      peerName: nameById.get(peerId) || "آگهی‌دهنده",
      listingId,
      listingTitle: inquiryTitle(listing, threadIndex, key),
      href: listing
        ? listingChatHref(listing)
        : listingChatHref(
            { id: listingId, sellerId: peerId, privatePublish: false },
          ),
      closed,
    };
  }
  return best;
}
