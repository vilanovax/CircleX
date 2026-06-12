import type { Person } from "@/lib/types";

/** Direct chat is allowed for circle members or existing threads. */
export function canDirectMessage(peer: Person, hasThread: boolean): boolean {
  if (peer.id === "me") return false;
  return peer.inMyCircle || hasThread;
}
