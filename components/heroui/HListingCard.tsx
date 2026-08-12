"use client";

import Link from "next/link";
import { Card, CardBody, Chip } from "@heroui/react";
import type { Listing } from "@/lib/types";
import {
  formatPrice,
  listingTypeEmoji,
  listingTypeLabels,
  privacyEmoji,
  privacyLabels,
} from "@/lib/labels";
import HListingImage from "./HListingImage";
import HTrustHighlight from "./HTrustHighlight";
import { listingTypeColor } from "./shared";

/** HeroUI variant of ListingCard. */
export default function HListingCard({
  listing,
  compactTrust = false,
  hideTrust = false,
}: {
  listing: Listing;
  compactTrust?: boolean;
  hideTrust?: boolean;
}) {
  const isService = listing.type === "service";

  return (
    <Card shadow="sm" radius="lg">
      <CardBody className="p-3">
        {!hideTrust && (
          <HTrustHighlight
            posterId={listing.sellerId}
            trustPath={listing.trustPath}
            endorsements={listing.endorsements}
            variant={compactTrust ? "compact" : "default"}
          />
        )}

        <Link href={`/listing/${listing.id}`} className="block">
          <div className="flex gap-3">
            <HListingImage image={listing.image} alt={listing.title} size="md" />
            <div className="min-w-0 flex-1">
              <Chip size="sm" variant="flat" color={listingTypeColor[listing.type]} className="mb-1">
                {listingTypeEmoji[listing.type]} {listingTypeLabels[listing.type]}
              </Chip>
              <h3 className="font-semibold text-[15px] leading-snug line-clamp-2">{listing.title}</h3>
              <div className="mt-1">
                {listing.price != null ? (
                  <span className="text-primary font-bold text-sm">{formatPrice(listing.price)}</span>
                ) : (
                  <span className="text-success font-medium text-sm">{isService ? "توافقی" : "رایگان"}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-default-500 mt-2.5 pt-2 border-t border-divider">
            <span>📍 {listing.city}</span>
            <span>·</span>
            <span>{listing.postedAt}</span>
            {!compactTrust && (
              <>
                <span>·</span>
                <span title={privacyLabels[listing.privacy]}>
                  {privacyEmoji[listing.privacy]} {privacyLabels[listing.privacy]}
                </span>
              </>
            )}
          </div>
        </Link>
      </CardBody>
    </Card>
  );
}
