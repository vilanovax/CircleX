"use client";

import Link from "next/link";
import type { Listing } from "@/lib/types";
import { activeCircle } from "@/lib/circle-member";
import { useStore } from "@/lib/store";
import { formatPrice, privacyLabels } from "@/lib/labels";
import { privacyAudience } from "@/lib/trust";
import ListingImage from "./ListingImage";
import TrustHighlight from "./TrustHighlight";

export default function ListingCard({
  listing,
  compactTrust = false,
  hideTrust = false,
  audienceHint,
  showOpenHint = false,
}: {
  listing: Listing;
  /** One-line trust row for feed (default). Full box on detail-adjacent views. */
  compactTrust?: boolean;
  /** Hide trust banner — e.g. on the poster's own profile page. */
  hideTrust?: boolean;
  /** Visibility status inside the card (empty-circle own listings). */
  audienceHint?: string;
  /** Small chevron so the card reads as tappable. */
  showOpenHint?: boolean;
}) {
  const { people } = useStore();
  const circle = activeCircle(people);
  const isService = listing.type === "service";

  return (
    <article className="card p-3 active:scale-[0.99] transition-transform duration-150">
      {!hideTrust && (
        <TrustHighlight
          posterId={listing.sellerId}
          trustPath={listing.trustPath}
          endorsements={listing.endorsements}
          variant={compactTrust ? "compact" : "default"}
        />
      )}

      <Link href={`/listing/${listing.id}`} className="block group">
        <div className="flex gap-3 items-center">
          <ListingImage
            image={listing.image}
            alt={listing.title}
            size="md"
            category={listing.category}
            type={listing.type}
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-[15px] text-ink dark:text-zinc-50 leading-snug line-clamp-2 group-active:opacity-80">
              {listing.title}
            </h3>
            <div className="mt-1">
              {listing.price != null ? (
                <span className="text-ink dark:text-zinc-100 font-extrabold text-[14px] nums tracking-tight">
                  {formatPrice(listing.price)}
                </span>
              ) : (
                <span className="text-levelA font-bold text-[14px]">
                  {isService ? "توافقی" : "رایگان"}
                </span>
              )}
            </div>
          </div>
          {showOpenHint && (
            <svg
              className="w-4 h-4 shrink-0 text-ink-faint dark:text-zinc-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-ink-muted dark:text-zinc-400 mt-2.5 pt-2 border-t border-stone-200/50 dark:border-zinc-800">
          <span className="truncate">{listing.city}</span>
          <span className="text-stone-400 dark:text-zinc-600" aria-hidden>
            ·
          </span>
          <span className="shrink-0">{listing.postedAt}</span>
          {/* Feed: privacy lives on the detail page — keep the footer to place + time. */}
          {!compactTrust && !audienceHint && (
            <span
              className="mr-auto max-w-[9.5rem] truncate text-[10px] text-ink-muted dark:text-zinc-500"
              title={privacyAudience(listing.privacy, circle)}
            >
              {privacyLabels[listing.privacy]}
            </span>
          )}
        </div>
        {audienceHint && (
          <span className="chip mt-2 bg-stone-100 text-ink-muted dark:bg-zinc-800 dark:text-zinc-400">
            {audienceHint}
          </span>
        )}
      </Link>
    </article>
  );
}
