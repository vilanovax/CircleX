import type { Message } from "./types";

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
    let thread = threadByPeer.get(msg.peerId);
    if (!thread) {
      thread = [];
      threadByPeer.set(msg.peerId, thread);
    }
    thread.push(msg);
    lastIndex.set(msg.peerId, i);
    lastByPeer.set(msg.peerId, msg);
    if (msg.listingId) listingIdByPeer.set(msg.peerId, msg.listingId);
    if (!msg.fromMe && !msg.read) {
      unreadByPeer.set(
        msg.peerId,
        (unreadByPeer.get(msg.peerId) ?? 0) + 1,
      );
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
