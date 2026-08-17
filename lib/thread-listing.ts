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

/** Attach listing card on send only when this listing is new to the thread. */
export function shouldAttachListingOnSend(
  thread: Message[],
  listingId: string | undefined,
): boolean {
  if (!listingId) return false;
  return !thread.some((m) => m.listingId === listingId);
}
