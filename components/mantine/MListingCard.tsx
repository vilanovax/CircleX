"use client";

import Link from "next/link";
import { Badge, Card, Group, Stack, Text } from "@mantine/core";
import type { Listing } from "@/lib/types";
import {
  formatPrice,
  listingTypeEmoji,
  listingTypeLabels,
  privacyEmoji,
  privacyLabels,
} from "@/lib/labels";
import MListingImage from "./MListingImage";
import MTrustHighlight from "./MTrustHighlight";
import { listingTypeColor } from "./shared";

/** Mantine variant of ListingCard. */
export default function MListingCard({
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
    <Card withBorder padding="sm" radius="lg">
      {!hideTrust && (
        <MTrustHighlight
          posterId={listing.sellerId}
          trustPath={listing.trustPath}
          endorsements={listing.endorsements}
          variant={compactTrust ? "compact" : "default"}
        />
      )}

      <Card.Section
        component={Link}
        href={`/listing/${listing.id}`}
        inheritPadding
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <MListingImage
            image={listing.image}
            alt={listing.title}
            size="md"
          />
          <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
            <Badge
              size="sm"
              variant="light"
              color={listingTypeColor[listing.type]}
              radius="sm"
            >
              {listingTypeEmoji[listing.type]} {listingTypeLabels[listing.type]}
            </Badge>
            <Text fw={600} fz={15} lh={1.3} lineClamp={2}>
              {listing.title}
            </Text>
            {listing.price != null ? (
              <Text fw={700} fz="sm" c="brand.7">
                {formatPrice(listing.price)}
              </Text>
            ) : (
              <Text fw={500} fz="sm" c="green.7">
                {isService ? "توافقی" : "رایگان"}
              </Text>
            )}
          </Stack>
        </Group>

        <Group
          gap={6}
          mt="sm"
          pt="xs"
          style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
        >
          <Text fz={11} c="dimmed">
            📍 {listing.city}
          </Text>
          <Text fz={11} c="dimmed">·</Text>
          <Text fz={11} c="dimmed">{listing.postedAt}</Text>
          <Text fz={11} c="dimmed">·</Text>
          <Text fz={11} c="dimmed" title={privacyLabels[listing.privacy]}>
            {privacyEmoji[listing.privacy]} {privacyLabels[listing.privacy]}
          </Text>
        </Group>
      </Card.Section>
    </Card>
  );
}
