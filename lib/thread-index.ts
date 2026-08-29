import { isCircloPeer } from "./circlo";
import { messageSentAt } from "./mappers";
import type { Message } from "./types";
import { parseThreadKey, threadKey } from "./listing-privacy";

export type ThreadIndex = {
  peerIds: string[];
  threadByPeer: Map<string, Message[]>;
  lastByPeer: Map<string, Message>;
  unreadByPeer: Map<string, number>;
  listingIdByPeer: Map<string, string>;
  /** Unique peers per `listingId` on inbox messages (same as listingConversationCountMap). */
  conversationCountByListing: Map<string, number>;
  totalUnread: number;
};

export const EMPTY_THREAD: Message[] = [];

/** Any inbox thread with this peer (plain key or `peerId::listingId`). */
export function indexHasPeer(peerIds: string[], peerId: string): boolean {
  const prefix = `${peerId}::`;
  for (let i = 0; i < peerIds.length; i++) {
    const key = peerIds[i];
    if (key === peerId || key.startsWith(prefix)) return true;
  }
  return false;
}

/** Viewer already has inbox messages tied to this listing. */
export function indexHasListing(
  threadIndex: ThreadIndex,
  listingId: string,
): boolean {
  if (!listingId) return false;
  if ((threadIndex.conversationCountByListing.get(listingId) ?? 0) > 0) {
    return true;
  }
  const threads = Array.from(threadIndex.threadByPeer.values());
  for (let t = 0; t < threads.length; t++) {
    const thread = threads[t];
    for (let i = 0; i < thread.length; i++) {
      const msg = thread[i];
      if (msg.listingId === listingId || msg.threadListingId === listingId) {
        return true;
      }
    }
  }
  return false;
}

const EMPTY_LISTING_COUNTS = new Map<string, number>();

const EMPTY_INDEX: ThreadIndex = {
  peerIds: [],
  threadByPeer: new Map(),
  lastByPeer: new Map(),
  unreadByPeer: new Map(),
  listingIdByPeer: new Map(),
  conversationCountByListing: EMPTY_LISTING_COUNTS,
  totalUnread: 0,
};

/** Listing this DM belongs to — explicit, else the last listing in that peer stream. */
export function stickyListingTopic(
  msg: Message,
  previousTopic: string | undefined,
): string | undefined {
  return msg.threadListingId || msg.listingId || previousTopic;
}

function indexKey(msg: Message, topic: string | undefined): string {
  return topic ? threadKey(msg.peerId, topic) : msg.peerId;
}

/** Open the newest conversation with this peer (listing-scoped when the DMs are). */
export function peerThreadHref(threadIndex: ThreadIndex, peerId: string): string {
  let bestKey: string | undefined;
  let bestAt = -1;
  const prefix = `${peerId}::`;
  for (let i = 0; i < threadIndex.peerIds.length; i++) {
    const key = threadIndex.peerIds[i]!;
    if (key !== peerId && !key.startsWith(prefix)) continue;
    const last = threadIndex.lastByPeer.get(key);
    const at = last ? messageSentAt(last) : 0;
    if (at < bestAt) continue;
    bestAt = at;
    bestKey = key;
  }
  if (!bestKey) return `/messages/${encodeURIComponent(peerId)}`;
  const parsed = parseThreadKey(bestKey);
  if (!parsed.listingId) {
    return `/messages/${encodeURIComponent(parsed.peerId)}`;
  }
  return `/messages/${encodeURIComponent(parsed.peerId)}?listing=${encodeURIComponent(parsed.listingId)}&scoped=1`;
}

function sameMessageList(a: Message[], b: Message[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function sameIdList(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** Keep previous Maps/arrays when a reload did not change that thread. */
function reuseThreadIndex(prev: ThreadIndex, next: ThreadIndex): ThreadIndex {
  if (prev === next) return prev;
  if (
    prev.totalUnread === next.totalUnread &&
    sameIdList(prev.peerIds, next.peerIds)
  ) {
    let identical = true;
    for (const key of next.peerIds) {
      const prevThread = prev.threadByPeer.get(key);
      const nextThread = next.threadByPeer.get(key);
      if (
        !prevThread ||
        !nextThread ||
        !sameMessageList(prevThread, nextThread) ||
        prev.lastByPeer.get(key) !== next.lastByPeer.get(key) ||
        (prev.unreadByPeer.get(key) ?? 0) !== (next.unreadByPeer.get(key) ?? 0) ||
        prev.listingIdByPeer.get(key) !== next.listingIdByPeer.get(key)
      ) {
        identical = false;
        break;
      }
    }
    if (identical) return prev;
  }

  const threadByPeer = new Map(next.threadByPeer);
  const lastByPeer = new Map(next.lastByPeer);
  for (const [key, thread] of Array.from(threadByPeer.entries())) {
    const old = prev.threadByPeer.get(key);
    if (old && sameMessageList(old, thread)) {
      threadByPeer.set(key, old);
      const oldLast = prev.lastByPeer.get(key);
      if (oldLast && oldLast === thread[thread.length - 1]) {
        lastByPeer.set(key, oldLast);
      }
    }
  }

  const peerIds = sameIdList(prev.peerIds, next.peerIds)
    ? prev.peerIds
    : next.peerIds;

  return {
    peerIds,
    threadByPeer,
    lastByPeer,
    unreadByPeer: next.unreadByPeer,
    listingIdByPeer: next.listingIdByPeer,
    conversationCountByListing: sameCountMap(
      prev.conversationCountByListing,
      next.conversationCountByListing,
    )
      ? prev.conversationCountByListing
      : next.conversationCountByListing,
    totalUnread: next.totalUnread,
  };
}

function sameCountMap(
  a: Map<string, number>,
  b: Map<string, number>,
): boolean {
  if (a === b) return true;
  if (a.size !== b.size) return false;
  let equal = true;
  a.forEach((value, key) => {
    if (b.get(key) !== value) equal = false;
  });
  return equal;
}

/** One pass over inbox messages: peers, last message, unread, listing topic. */
export function buildThreadIndex(
  messages: Message[],
  prev?: ThreadIndex,
): ThreadIndex {
  if (messages.length === 0) return EMPTY_INDEX;

  const threadByPeer = new Map<string, Message[]>();
  const lastIndex = new Map<string, number>();
  const lastByPeer = new Map<string, Message>();
  const unreadByPeer = new Map<string, number>();
  const listingIdByPeer = new Map<string, string>();
  const peersByListing = new Map<string, Set<string>>();
  const stickyByPeer = new Map<string, string>();
  let totalUnread = 0;

  const order = messages.map((_, i) => i);
  order.sort((a, b) => {
    const delta = messageSentAt(messages[a]!) - messageSentAt(messages[b]!);
    if (delta !== 0) return delta;
    return a - b;
  });

  for (let n = 0; n < order.length; n++) {
    const i = order[n]!;
    const msg = messages[i]!;
    const topic = stickyListingTopic(msg, stickyByPeer.get(msg.peerId));
    if (topic) stickyByPeer.set(msg.peerId, topic);
    const key = indexKey(msg, topic);
    let thread = threadByPeer.get(key);
    if (!thread) {
      thread = [];
      threadByPeer.set(key, thread);
    }
    thread.push(msg);
    lastIndex.set(key, i);
    if (topic) listingIdByPeer.set(key, topic);
    if (msg.listingId) {
      listingIdByPeer.set(key, msg.listingId);
      let peers = peersByListing.get(msg.listingId);
      if (!peers) {
        peers = new Set();
        peersByListing.set(msg.listingId, peers);
      }
      peers.add(msg.peerId);
    }
    if (msg.threadListingId) listingIdByPeer.set(key, msg.threadListingId);
    if (!msg.fromMe && !msg.read) {
      unreadByPeer.set(key, (unreadByPeer.get(key) ?? 0) + 1);
      // Circlo listing notices stay in inbox; they are not person DMs.
      if (!isCircloPeer(msg.peerId) && msg.kind !== "notice") {
        totalUnread += 1;
      }
    }
  }

  const conversationCountByListing = new Map<string, number>();
  peersByListing.forEach((peers, listingId) => {
    conversationCountByListing.set(listingId, peers.size);
  });

  for (const [key, thread] of Array.from(threadByPeer.entries())) {
    thread.sort((a, b) => {
      const delta = messageSentAt(a) - messageSentAt(b);
      if (delta !== 0) return delta;
      return 0;
    });
    lastByPeer.set(key, thread[thread.length - 1]!);
  }

  const peerIds = Array.from(lastIndex.keys());
  peerIds.sort((a, b) => {
    const tb = messageSentAt(lastByPeer.get(b)!);
    const ta = messageSentAt(lastByPeer.get(a)!);
    if (tb !== ta) return tb - ta;
    return (lastIndex.get(b) ?? 0) - (lastIndex.get(a) ?? 0);
  });

  const next: ThreadIndex = {
    peerIds,
    threadByPeer,
    lastByPeer,
    unreadByPeer,
    listingIdByPeer,
    conversationCountByListing,
    totalUnread,
  };
  return prev ? reuseThreadIndex(prev, next) : next;
}
