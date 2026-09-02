import { LISTING_PRIVACY } from "@/lib/listing-payload";
import type { Privacy } from "@/lib/types";

function asPrivacy(value: string): Privacy {
  return LISTING_PRIVACY.includes(value as Privacy)
    ? (value as Privacy)
    : "ABC";
}

/** Seller left the listing open to every circle level — not a tight or private post. */
export function listingBroadcastOpen(
  privacy: string,
  hideIdentity: boolean,
): boolean {
  if (hideIdentity) return false;
  return asPrivacy(privacy) === "ABC";
}

/**
 * Forwarding this listing may unlock it for the named recipient.
 * Tight circles, approval, and private-publish stay closed.
 */
export function listingForwardUnlocksThis(
  privacy: string,
  hideIdentity: boolean,
): boolean {
  if (hideIdentity) return false;
  const value = asPrivacy(privacy);
  return value === "ABC" || value === "referral";
}
