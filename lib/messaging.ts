import { isActiveCircleMember } from "@/lib/circle-member";
import { canView } from "@/lib/trust";
import type { Listing, Person } from "@/lib/types";

/** Free private chat: circle members, or continue an existing thread. */
export function canDirectMessage(peer: Person, hasThread: boolean): boolean {
  if (peer.id === "me") return false;
  return isActiveCircleMember(peer) || hasThread;
}

/**
 * Message tied to a listing the viewer can see (including FoF sellers).
 * Seller may also reply in that listing context.
 */
export function canMessageAboutListing(
  peer: Person,
  listing: Listing,
  getPerson: (id: string) => Person | undefined,
): boolean {
  if (peer.id === "me") return false;

  // Buyer → seller about this listing
  if (listing.sellerId === peer.id) {
    return canView(listing, getPerson);
  }

  // Seller → someone who opened a thread about the seller's own listing
  if (listing.sellerId === "me") {
    return Boolean(getPerson(peer.id));
  }

  return false;
}

/** Open a thread: circle chat, existing thread, or listing-context follow-up. */
export function canOpenThread(
  peer: Person,
  opts: {
    hasThread: boolean;
    listing?: Listing | null;
    getPerson: (id: string) => Person | undefined;
  },
): boolean {
  if (canDirectMessage(peer, opts.hasThread)) return true;
  if (opts.listing) {
    return canMessageAboutListing(peer, opts.listing, opts.getPerson);
  }
  return false;
}
