"use client";

import Link from "next/link";
import type { Listing } from "@/lib/types";
import {
  formatPrice,
  listingTypeChip,
  listingTypeEmoji,
  listingTypeLabels,
  privacyEmoji,
  privacyLabels,
} from "@/lib/labels";
import TrustHighlight from "./TrustHighlight";

export default function ListingCard({ listing }: { listing: Listing }) {
  const isService = listing.type === "service";
  return (
    <Link
      href={`/listing/${listing.id}`}
      className="card block p-3 active:scale-[0.99] transition-transform"
    >
      <TrustHighlight
        posterId={listing.sellerId}
        trustPath={listing.trustPath}
        endorsements={listing.endorsements}
      />

      <div className="flex gap-3">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center text-4xl shrink-0">
          {listing.image}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`chip ${listingTypeChip[listing.type]}`}>
              {listingTypeEmoji[listing.type]} {listingTypeLabels[listing.type]}
            </span>
            <span className="text-[11px] text-zinc-400" title={privacyLabels[listing.privacy]}>
              {privacyEmoji[listing.privacy]}
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
      </div>
    </Link>
  );
}
