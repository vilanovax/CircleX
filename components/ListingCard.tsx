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
          variant={compactTrust ? "line" : "default"}
        />
      )}

      <Link href={`/listing/${listing.id}`} className="block">
        <div className="flex gap-3">
          <ListingImage
            image={listing.image}
            alt={listing.title}
            size={compactTrust ? "feed" : "md"}
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
                <span className="text-brand-700 dark:text-brand-400 font-bold text-[15px] nums">
                  {formatPrice(listing.price)}
                </span>
              ) : (
                <span className="text-levelA font-medium text-sm">
                  {isService ? "توافقی" : "رایگان"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-1.5">
              <span className="truncate min-w-0">📍 {listing.city}</span>
              <span aria-hidden>·</span>
              <span className="shrink-0">{listing.postedAt}</span>
              <span aria-hidden>·</span>
              <span
                className="shrink-0"
                title={privacyAudience(listing.privacy, circle)}
                aria-label={privacyLabels[listing.privacy]}
              >
                {privacyEmoji[listing.privacy]}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
