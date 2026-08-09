"use client";

import Link from "next/link";
import { Badge, Box, Flex, HStack, Text } from "@chakra-ui/react";
import type { Endorsement, TrustHop } from "@/lib/types";
import { useStore } from "@/lib/store";
import {
  endorsementHighlightLine,
  posterCardRelation,
  trustHighlightMessage,
  type TrustContentKind,
} from "@/lib/trust";
import { levelShort } from "@/lib/labels";
import { ShieldCheckIcon } from "@/components/Icons";
import CAvatar from "./CAvatar";

/** Chakra variant of TrustHighlight — the trust signal shown on cards. */
export default function CTrustHighlight({
  posterId,
  trustPath,
  endorsements = [],
  posterRole = "فروشنده",
  contentKind = "listing",
  variant = "default",
}: {
  posterId: string;
  trustPath: TrustHop[];
  endorsements?: Endorsement[];
  posterRole?: string;
  contentKind?: TrustContentKind;
  variant?: "default" | "compact";
}) {
  const { getPerson } = useStore();
  const trust = trustHighlightMessage(posterId, trustPath, getPerson, posterRole, contentKind);
  if (!trust) return null;
  const poster = getPerson(posterId);
  if (!poster) return null;

  const endorsementLine = endorsementHighlightLine(endorsements, getPerson, contentKind);
  const isOwn = posterId === "me";
  const relation = posterCardRelation(poster, { isOwn, contentKind });

  if (variant === "compact") {
    const identity = (
      <HStack gap={2} minW={0} flex={1}>
        <CAvatar name={poster.name} level={isOwn ? undefined : poster.level} size="sm" />
        <Box minW={0}>
          <Text fontSize="sm" fontWeight={600} noOfLines={1}>
            {poster.name}
          </Text>
          <Text fontSize="11px" color={isOwn ? "gray.500" : "brand.600"} _dark={{ color: isOwn ? "gray.400" : "brand.300" }} noOfLines={1}>
            {relation}
          </Text>
        </Box>
      </HStack>
    );

    return (
      <Box pb={2} mb={2} borderBottomWidth="1px" borderColor="chakra-border-color">
        <HStack gap={2}>
          {isOwn ? identity : <Box as={Link} href={`/person/${posterId}`} flex={1} minW={0}>{identity}</Box>}
          {!isOwn && poster.level && (
            <Badge colorScheme="gray" variant="subtle" fontSize="10px" rounded="full">
              {levelShort[poster.level]}
            </Badge>
          )}
          <Box as={ShieldCheckIcon} className="w-4 h-4" color="brand.500" flexShrink={0} />
        </HStack>
        {endorsementLine && !isOwn && (
          <Text fontSize="11px" fontWeight={500} color="green.600" _dark={{ color: "green.300" }} mt={1}>
            ✓ {endorsementLine}
          </Text>
        )}
      </Box>
    );
  }

  return (
    <Box
      rounded="xl"
      borderWidth="1px"
      px={3}
      py={2.5}
      mb={2.5}
      bg={isOwn ? "blackAlpha.50" : "brand.50"}
      borderColor={isOwn ? "chakra-border-color" : "brand.200"}
      _dark={{
        bg: isOwn ? "whiteAlpha.100" : "rgba(124,58,237,0.12)",
        borderColor: isOwn ? "whiteAlpha.300" : "rgba(124,58,237,0.3)",
      }}
    >
      <Flex align="flex-start" gap={2.5}>
        <Box as={ShieldCheckIcon} className="w-5 h-5" color={isOwn ? "gray.500" : "brand.600"} mt={1} flexShrink={0} />
        <Box minW={0} flex={1}>
          <Text fontSize="sm" fontWeight={700} lineHeight={1.4} color={isOwn ? undefined : "brand.800"} _dark={{ color: isOwn ? undefined : "brand.100" }}>
            {trust.headline}
          </Text>
          {trust.subline && (
            <Text fontSize="xs" fontWeight={600} mt={0.5} color={isOwn ? "gray.500" : "brand.600"} _dark={{ color: isOwn ? "gray.400" : "brand.300" }}>
              {trust.subline}
            </Text>
          )}
          {endorsementLine && !isOwn && (
            <Text fontSize="11px" fontWeight={500} color="green.600" _dark={{ color: "green.300" }} mt={1.5}>
              ✓ {endorsementLine}
            </Text>
          )}
        </Box>
      </Flex>
    </Box>
  );
}
