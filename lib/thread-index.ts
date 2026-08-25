import type { Message } from "./types";
import { threadKey } from "./listing-privacy";

export type ThreadIndex = {
  peerIds: string[];
  threadByPeer: Map<string, Message[]>;
  lastByPeer: Map<string, Message>;
  unreadByPeer: Map<string, number>;
  listingIdByPeer: Map<string, string>;
  totalUnread: number;
};

export const EMPTY_THREAD: Message[] = [];

const EMPTY_INDEX: ThreadIndex = {
  peerIds: [],
  threadByPeer: new Map(),
  lastByPeer: new Map(),
  unreadByPeer: new Map(),
  listingIdByPeer: new Map(),
  totalUnread: 0,
};

function indexKey(msg: Message): string {
  return msg.threadListingId
    ? threadKey(msg.peerId, msg.threadListingId)
    : msg.peerId;
}

/** One pass over inbox messages: peers, last message, unread, listing topic. */
export function buildThreadIndex(messages: Message[]): ThreadIndex {
  if (messages.length === 0) return EMPTY_INDEX;

  const threadByPeer = new Map<string, Message[]>();
  const lastIndex = new Map<string, number>();
  const lastByPeer = new Map<string, Message>();
  const unreadByPeer = new Map<string, number>();
  const listingIdByPeer = new Map<string, string>();
  let totalUnread = 0;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const key = indexKey(msg);
    let thread = threadByPeer.get(key);
    if (!thread) {
      thread = [];
      threadByPeer.set(key, thread);
    }
    thread.push(msg);
    lastIndex.set(key, i);
    lastByPeer.set(key, msg);
    if (msg.listingId) listingIdByPeer.set(key, msg.listingId);
    if (msg.threadListingId) listingIdByPeer.set(key, msg.threadListingId);
    if (!msg.fromMe && !msg.read) {
      unreadByPeer.set(key, (unreadByPeer.get(key) ?? 0) + 1);
      totalUnread += 1;
    }
  }

  const peerIds = Array.from(lastIndex.keys());
  peerIds.sort((a, b) => (lastIndex.get(b) ?? 0) - (lastIndex.get(a) ?? 0));

  return {
    peerIds,
    threadByPeer,
    lastByPeer,
    unreadByPeer,
    listingIdByPeer,
    totalUnread,
  };
}
