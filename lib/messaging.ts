import { isActiveCircleMember } from "@/lib/circle-member";
import { isCircloPeer } from "@/lib/circlo";
import { canView } from "@/lib/trust";
import type { Listing, Person } from "@/lib/types";

/** Free private chat: circle members, or continue an existing thread. */
export function canDirectMessage(peer: Person, hasThread: boolean): boolean {
  if (peer.id === "me") return false;
  if (isCircloPeer(peer.id)) return false;
  return isActiveCircleMember(peer) || hasThread;
}

/**
 * Profile CTA: continue a thread, or message someone who currently has a
 * visible listing/request. No cold DM on an empty profile.
 */
export function canMessageFromProfile(
  peer: Person,
  opts: {
    hasThread: boolean;
    hasVisibleListings: boolean;
    hasVisibleRequests: boolean;
  },
): boolean {
  if (!canDirectMessage(peer, opts.hasThread)) return false;
  return (
    opts.hasThread || opts.hasVisibleListings || opts.hasVisibleRequests
  );
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
  if (listing.dealStatus === "inactive") return false;

  if (listing.privatePublish && listing.sellerId !== "me") {
    return canView(listing, getPerson);
  }
  if (!canView(listing, getPerson) && listing.sellerId !== "me") return false;

  // Buyer → seller about this listing
  if (listing.sellerId === peer.id) return true;

  // Seller → someone who opened a thread about the seller's own listing
  if (listing.sellerId === "me") {
    return Boolean(getPerson(peer.id));
  }

  // Viewer ↔ the person who opened this listing to them (forward / vouch).
  for (let i = 0; i < listing.trustPath.length; i++) {
    if (listing.trustPath[i]?.personId === peer.id) return true;
  }

  return false;
}

/** Open a thread: existing thread, listing follow-up, or circle + live offering. */
export function canOpenThread(
  peer: Person,
  opts: {
    hasThread: boolean;
    listing?: Listing | null;
    getPerson: (id: string) => Person | undefined;
    hasVisibleOfferings?: boolean;
  },
): boolean {
  if (peer.id === "me") return false;
  if (isCircloPeer(peer.id)) return true;
  if (opts.hasThread) return true;
  if (opts.listing) {
    return canMessageAboutListing(peer, opts.listing, opts.getPerson);
  }
  if (opts.hasVisibleOfferings && isActiveCircleMember(peer)) return true;
  return false;
}
