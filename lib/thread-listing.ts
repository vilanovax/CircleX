import type { Message } from "@/lib/types";

const storageKey = (peerId: string) => `circle.threadListing.${peerId}`;

/** Remember which listing a peer thread is about (survives leaving ?listing=). */
export function rememberThreadListing(peerId: string, listingId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(peerId), listingId);
  } catch {
    /* private mode / quota */
  }
}

export function recalledThreadListing(peerId: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return sessionStorage.getItem(storageKey(peerId)) ?? undefined;
  } catch {
    return undefined;
  }
}

export function clearThreadListing(peerId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(peerId));
  } catch {
    /* ignore */
  }
}

/** Most recent message that carries a listing attachment. */
export function latestListingIdInThread(
  thread: Message[],
): string | undefined {
  for (let i = thread.length - 1; i >= 0; i--) {
    const id = thread[i]?.listingId;
    if (id) return id;
  }
  return undefined;
}

/**
 * Active listing for a peer thread:
 * 1) explicit ?listing= (user opened from an ad)
 * 2) last attached listing in the thread
 * 3) session memory from a prior visit
 */
export function resolveThreadListingId(opts: {
  peerId: string;
  queryListingId?: string | null;
  thread: Message[];
}): string | undefined {
  const fromQuery = opts.queryListingId?.trim() || undefined;
  if (fromQuery) {
    rememberThreadListing(opts.peerId, fromQuery);
    return fromQuery;
  }

  const fromThread = latestListingIdInThread(opts.thread);
  if (fromThread) {
    rememberThreadListing(opts.peerId, fromThread);
    return fromThread;
  }

  return recalledThreadListing(opts.peerId);
}

/** Peers who sent or received a message attached to this listing, newest first. */
export function listingThreadPeers(
  messages: Message[],
  listingId: string,
): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const about =
      msg.threadListingId === listingId ||
      (!msg.threadListingId && msg.listingId === listingId);
    if (!about) continue;
    if (seen.has(msg.peerId)) continue;
    seen.add(msg.peerId);
    order.push(msg.peerId);
  }
  return order;
}

/** One pass over inbox: listing id → unique peer count. */
export function listingConversationCountMap(
  messages: Message[],
): Map<string, number> {
  const peersByListing = new Map<string, Set<string>>();
  for (let i = 0; i < messages.length; i++) {
    const listingId = messages[i].listingId;
    if (!listingId) continue;
    let peers = peersByListing.get(listingId);
    if (!peers) {
      peers = new Set();
      peersByListing.set(listingId, peers);
    }
    peers.add(messages[i].peerId);
  }
  const counts = new Map<string, number>();
  peersByListing.forEach((peers, listingId) => {
    counts.set(listingId, peers.size);
  });
  return counts;
}

/** True if any inbox message is with this peer (short-circuits). */
export function hasPeerThread(messages: Message[], peerId: string): boolean {
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].peerId === peerId) return true;
  }
  return false;
}

export function listingMessageCount(
  messages: Message[],
  listingId: string,
): number {
  return messages.reduce(
    (n, msg) => (msg.listingId === listingId ? n + 1 : n),
    0,
  );
}

/** Last message in a peer thread that belongs to this listing. */
export function lastListingMessage(
  thread: Message[],
  listingId: string,
): Message | undefined {
  for (let i = thread.length - 1; i >= 0; i--) {
    const msg = thread[i];
    if (msg.listingId === listingId) return msg;
  }
  return undefined;
}

export function listingThreadPreview(
  thread: Message[],
  listingId: string,
): string {
  const last = lastListingMessage(thread, listingId);
  if (!last) return "درباره این آگهی";
  const prefix = last.fromMe ? "شما: " : "";
  const text = last.text.trim();
  if (!text) return last.fromMe ? "شما پیام دادید" : "پیام جدید";
  return `${prefix}${text.length > 72 ? `${text.slice(0, 72)}…` : text}`;
}

/** Attach listing card on send only when this listing is new to the thread. */
export function shouldAttachListingOnSend(
  thread: Message[],
  listingId: string | undefined,
): boolean {
  if (!listingId) return false;
  return !thread.some((m) => m.listingId === listingId);
}
