"use client";

import Link from "next/link";
import type { Listing } from "@/lib/types";
import { useStore } from "@/lib/store";
import { formatPrice, privacyLabels } from "@/lib/labels";
import { endorsementHighlightLine, privacyAudience } from "@/lib/trust";
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
  const { people, getPerson } = useStore();
  const circle = people.filter((p) => p.inMyCircle);
  const isService = listing.type === "service";
  const endorsed =
    !!endorsementHighlightLine(listing.endorsements, getPerson, "listing") &&
    listing.sellerId !== "me";
  /** Signature rail only when someone in the circle endorsed this listing. */
  const showRail = compactTrust && !hideTrust && endorsed;

  return (
    <article
      className={`card p-3 active:scale-[0.99] transition-transform duration-150 ${
        showRail ? "trust-card" : ""
      }`}
    >
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
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-ink-muted dark:text-zinc-400 mt-2.5 pt-2 border-t border-stone-200/50 dark:border-zinc-800">
          <span className="truncate">{listing.city}</span>
          <span className="text-stone-400 dark:text-zinc-600" aria-hidden>
            ·
          </span>
          <span className="shrink-0">{listing.postedAt}</span>
          <span
            className="mr-auto shrink-0 text-[10px] text-ink-muted dark:text-zinc-500"
            title={privacyAudience(listing.privacy, circle)}
          >
            {privacyLabels[listing.privacy]}
          </span>
        </div>
      </Link>
    </article>
  );
}
