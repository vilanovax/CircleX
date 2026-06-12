"use client";

import Link from "next/link";
import type { Listing } from "@/lib/types";
import { useStore } from "@/lib/store";
import {
  formatPrice,
  listingTypeChip,
  listingTypeEmoji,
  listingTypeLabels,
  privacyEmoji,
  privacyLabels,
} from "@/lib/labels";
import { privacyAudience } from "@/lib/trust";
import ListingImage from "./ListingImage";
import TrustHighlight from "./TrustHighlight";

export default function ListingCard({
  listing,
  compactTrust = false,
  hideTrust = false,
}: {
  listing: Listing;
  /** One-line trust row for feed (default). Full box on detail-adjacent views. */
  compactTrust?: boolean;
  /** Hide trust banner — e.g. on the poster's own profile page. */
  hideTrust?: boolean;
}) {
  const { people } = useStore();
  const circle = people.filter((p) => p.inMyCircle);
  const isService = listing.type === "service";

  return (
    <article className="card p-3 active:scale-[0.99] transition-transform">
      {!hideTrust && (
        <TrustHighlight
          posterId={listing.sellerId}
          trustPath={listing.trustPath}
          endorsements={listing.endorsements}
          variant={compactTrust ? "compact" : "default"}
        />
      )}

      <Link href={`/listing/${listing.id}`} className="block">
        <div className="flex gap-3">
          <ListingImage
            image={listing.image}
            alt={listing.title}
            size="md"
            category={listing.category}
            type={listing.type}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`chip ${listingTypeChip[listing.type]}`}>
                {listingTypeEmoji[listing.type]} {listingTypeLabels[listing.type]}
              </span>
            </div>
            <h3 className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
              {listing.title}
            </h3>
            <div className="mt-1">
              {listing.price != null ? (
                <span className="text-brand-700 dark:text-brand-400 font-bold text-sm nums">
                  {formatPrice(listing.price)}
                </span>
              ) : (
                <span className="text-levelA font-medium text-sm">
                  {isService ? "توافقی" : "رایگان"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span>📍 {listing.city}</span>
          <span>·</span>
          <span>{listing.postedAt}</span>
          <span>·</span>
          <span title={privacyAudience(listing.privacy, circle)}>
            {privacyEmoji[listing.privacy]} {privacyLabels[listing.privacy]}
          </span>
        </div>
      </Link>
    </article>
  );
}
