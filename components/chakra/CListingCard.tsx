"use client";

import Link from "next/link";
import { Badge, Box, Flex, HStack, Text } from "@chakra-ui/react";
import type { Listing } from "@/lib/types";
import {
  formatPrice,
  listingTypeEmoji,
  listingTypeLabels,
  privacyEmoji,
  privacyLabels,
} from "@/lib/labels";
import CListingImage from "./CListingImage";
import CTrustHighlight from "./CTrustHighlight";
import { listingTypeScheme } from "./shared";

/** Chakra variant of ListingCard. */
export default function CListingCard({
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
    <Box
      bg="chakra-body-bg"
      borderWidth="1px"
      borderColor="chakra-border-color"
      rounded="2xl"
      p={3}
      transition="transform 0.1s"
      _active={{ transform: "scale(0.99)" }}
    >
      {!hideTrust && (
        <CTrustHighlight
          posterId={listing.sellerId}
          trustPath={listing.trustPath}
          endorsements={listing.endorsements}
          variant={compactTrust ? "compact" : "default"}
        />
      )}

      <Box as={Link} href={`/listing/${listing.id}`} display="block">
        <Flex gap={3} align="flex-start">
          <CListingImage image={listing.image} alt={listing.title} size="md" />
          <Box minW={0} flex={1}>
            <Badge colorScheme={listingTypeScheme[listing.type]} variant="subtle" rounded="md" mb={1}>
              {listingTypeEmoji[listing.type]} {listingTypeLabels[listing.type]}
            </Badge>
            <Text fontWeight={600} fontSize="15px" lineHeight={1.3} noOfLines={2}>
              {listing.title}
            </Text>
            <Box mt={1}>
              {listing.price != null ? (
                <Text fontWeight={700} fontSize="sm" color="brand.600" _dark={{ color: "brand.300" }}>
                  {formatPrice(listing.price)}
                </Text>
              ) : (
                <Text fontWeight={500} fontSize="sm" color="green.600" _dark={{ color: "green.300" }}>
                  {isService ? "توافقی" : "رایگان"}
                </Text>
              )}
            </Box>
          </Box>
        </Flex>

        <HStack gap={1.5} mt={2.5} pt={2} borderTopWidth="1px" borderColor="chakra-border-color" color="gray.500" _dark={{ color: "gray.400" }} fontSize="11px">
          <Text>📍 {listing.city}</Text>
          <Text>·</Text>
          <Text>{listing.postedAt}</Text>
          {!compactTrust && (
            <>
              <Text>·</Text>
              <Text title={privacyLabels[listing.privacy]}>
                {privacyEmoji[listing.privacy]} {privacyLabels[listing.privacy]}
              </Text>
            </>
          )}
        </HStack>
      </Box>
    </Box>
  );
}
