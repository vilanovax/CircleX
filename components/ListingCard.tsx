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
import TrustPath from "./TrustPath";
import { EndorsementSummary } from "./Endorsements";

export default function ListingCard({ listing }: { listing: Listing }) {
  const isService = listing.type === "service";
  return (
    <Link
      href={`/listing/${listing.id}`}
      className="card block p-3 active:scale-[0.99] transition-transform"
    >
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
          <h3 className="font-semibold text-[15px] text-zinc-900 leading-snug line-clamp-2">
            {listing.title}
          </h3>
          <div className="mt-1">
            {listing.price != null ? (
              <span className="text-brand-700 font-bold text-sm nums">
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

      <div className="mt-2.5 pt-2.5 border-t border-zinc-100 space-y-1.5">
        <TrustPath
          posterId={listing.sellerId}
          trustPath={listing.trustPath}
          variant="compact"
        />
        <EndorsementSummary endorsements={listing.endorsements} />
        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          <span>📍 {listing.city}</span>
          <span>·</span>
          <span>{listing.postedAt}</span>
        </div>
      </div>
    </Link>
  );
}
