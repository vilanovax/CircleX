"use client";

import Link from "next/link";
import { Box, Card, CardActionArea, Chip, Stack, Typography } from "@mui/material";
import type { Listing } from "@/lib/types";
import {
  formatPrice,
  listingTypeEmoji,
  listingTypeLabels,
  privacyEmoji,
  privacyLabels,
} from "@/lib/labels";
import MuiListingImage from "./MuiListingImage";
import MuiTrustHighlight from "./MuiTrustHighlight";
import { listingTypeChipColor } from "./shared";

/** MUI variant of ListingCard. */
export default function MuiListingCard({
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
    <Card sx={{ p: 1.5, borderRadius: 3 }}>
      {!hideTrust && (
        <MuiTrustHighlight
          posterId={listing.sellerId}
          trustPath={listing.trustPath}
          endorsements={listing.endorsements}
          variant={compactTrust ? "compact" : "default"}
        />
      )}

      <CardActionArea
        component={Link}
        href={`/listing/${listing.id}`}
        sx={{ borderRadius: 2, p: 0.5, m: -0.5 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <MuiListingImage image={listing.image} alt={listing.title} size="md" />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Chip
              size="small"
              color={listingTypeChipColor[listing.type]}
              variant="outlined"
              label={`${listingTypeEmoji[listing.type]} ${listingTypeLabels[listing.type]}`}
              sx={{ mb: 0.5, height: 22 }}
            />
            <Typography fontWeight={600} sx={{ fontSize: 15, lineHeight: 1.3 }} className="line-clamp-2">
              {listing.title}
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              {listing.price != null ? (
                <Typography fontWeight={700} variant="body2" color="primary">
                  {formatPrice(listing.price)}
                </Typography>
              ) : (
                <Typography fontWeight={500} variant="body2" color="success.main">
                  {isService ? "توافقی" : "رایگان"}
                </Typography>
              )}
            </Box>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.75} sx={{ mt: 1.25, pt: 1, borderTop: 1, borderColor: "divider", color: "text.secondary" }}>
          <Typography sx={{ fontSize: 11 }}>📍 {listing.city}</Typography>
          <Typography sx={{ fontSize: 11 }}>·</Typography>
          <Typography sx={{ fontSize: 11 }}>{listing.postedAt}</Typography>
          <Typography sx={{ fontSize: 11 }}>·</Typography>
          <Typography sx={{ fontSize: 11 }} title={privacyLabels[listing.privacy]}>
            {privacyEmoji[listing.privacy]} {privacyLabels[listing.privacy]}
          </Typography>
        </Stack>
      </CardActionArea>
    </Card>
  );
}
