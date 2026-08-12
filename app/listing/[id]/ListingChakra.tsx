"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  IconButton,
  Text,
  VStack,
  Wrap,
} from "@chakra-ui/react";
import { useStore } from "@/lib/store";
import CHeader from "@/components/chakra/CHeader";
import CListingImage from "@/components/chakra/CListingImage";
import CAvatar from "@/components/chakra/CAvatar";
// Complex interactive widgets reused as-is from the classic UI (out of scope to rebuild).
import ReferSheet from "@/components/ReferSheet";
import TrustPath from "@/components/TrustPath";
import { EndorsementList } from "@/components/Endorsements";
import LockedAccess from "@/components/LockedAccess";
import { ChatIcon, HeartIcon, ShieldCheckIcon } from "@/components/Icons";
import {
  badgeEmoji,
  badgeLabels,
  formatPrice,
  listingTypeEmoji,
  listingTypeLabels,
  privacyEmoji,
  privacyLabels,
  relationLabels,
} from "@/lib/labels";
import type { BadgeType } from "@/lib/types";
import { toPersianDigits } from "@/lib/persian";
import { canView } from "@/lib/trust";
import { useToast } from "@/components/Toast";
import { listingTypeScheme, SHELL_MAX } from "@/components/chakra/shared";

const ALL_BADGES: BadgeType[] = ["verify_item", "know_seller", "verify_quality", "dealt_before"];

export default function ListingChakra(_props: { params: { id: string } }) {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { getListing, getPerson, toggleEndorsement, toggleSaved, isSaved } = useStore();
  const { show } = useToast();
  const [showRefer, setShowRefer] = useState(false);
  const saved = isSaved(id);

  const listing = getListing(id);
  if (!listing) {
    return (
      <Box as="main" minH="100dvh">
        <CHeader title="آگهی" back />
        <Text textAlign="center" color="gray.400" py={20} fontSize="sm">
          آگهی پیدا نشد.
        </Text>
      </Box>
    );
  }

  const seller = getPerson(listing.sellerId);
  const isMine = listing.sellerId === "me";

  if (!isMine && !canView(listing, getPerson)) {
    return (
      <Box as="main" minH="100dvh">
        <CHeader title="جزئیات آگهی" back />
        <LockedAccess itemTitle={listing.title} itemKind="listing" privacy={listing.privacy} />
      </Box>
    );
  }

  return (
    <Box as="main" pb={28} minH="100dvh">
      <CHeader
        title="جزئیات آگهی"
        back
        action={
          <IconButton
            aria-label={saved ? "حذف از نشان‌شده‌ها" : "نشان کردن"}
            aria-pressed={saved}
            variant="ghost"
            size="sm"
            color={saved ? "pink.500" : "gray.400"}
            onClick={() => {
              toggleSaved(id);
              show(saved ? "از نشان‌شده‌های پروفایل حذف شد" : "در پروفایل ذخیره شد ✓");
            }}
            icon={<HeartIcon className="w-6 h-6" filled={saved} />}
          />
        }
      />

      <Box mx={4} mt={4}>
        <CListingImage image={listing.image} alt={listing.title} size="hero" />
      </Box>

      <Box px={4} pt={4}>
        <HStack gap={2} mb={2} flexWrap="wrap">
          <Badge colorScheme={listingTypeScheme[listing.type]} variant="subtle" rounded="md">
            {listingTypeEmoji[listing.type]} {listingTypeLabels[listing.type]}
          </Badge>
          <Badge colorScheme="gray" variant="subtle" rounded="md">
            {listing.category}
          </Badge>
          {listing.condition && (
            <Badge colorScheme="gray" variant="subtle" rounded="md">
              {listing.condition}
            </Badge>
          )}
        </HStack>

        <Text as="h1" fontSize="xl" fontWeight="bold" lineHeight={1.4}>
          {listing.title}
        </Text>

        <Box mt={2}>
          {listing.price != null ? (
            <Text fontSize="2xl" fontWeight={800} color="brand.700" _dark={{ color: "brand.300" }}>
              {formatPrice(listing.price)}
            </Text>
          ) : (
            <Text fontSize="xl" fontWeight="bold" color="green.600" _dark={{ color: "green.300" }}>
              {listing.type === "service" ? "توافقی" : "رایگان"}
            </Text>
          )}
        </Box>

        <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }} lineHeight={1.8} mt={3} whiteSpace="pre-line">
          {listing.description}
        </Text>

        <HStack gap={3} fontSize="xs" color="gray.400" mt={3}>
          <Text>📍 {listing.city}</Text>
          <Text>·</Text>
          <Text>{listing.postedAt}</Text>
          <Text>·</Text>
          <Text title={privacyLabels[listing.privacy]}>
            {privacyEmoji[listing.privacy]} {privacyLabels[listing.privacy]}
          </Text>
        </HStack>
      </Box>

      {/* Trust path */}
      <Box px={4} pt={5}>
        <Box borderWidth="1px" borderColor="chakra-border-color" rounded="2xl" p={4} bg="chakra-body-bg">
          <HStack gap={2} mb={3}>
            <Box as={ShieldCheckIcon} className="w-5 h-5" color="brand.600" />
            <Text fontWeight={700} fontSize="sm">
              مسیر اعتماد
            </Text>
          </HStack>
          <TrustPath posterId={listing.sellerId} trustPath={listing.trustPath} variant="full" />
        </Box>
      </Box>

      {/* Quick referral */}
      <Box px={4} pt={3}>
        <Flex borderWidth="1px" borderColor="chakra-border-color" rounded="2xl" p={4} align="center" gap={3} bg="chakra-body-bg">
          <Center w="40px" h="40px" rounded="full" bg="brand.50" color="brand.600" _dark={{ bg: "whiteAlpha.100" }} fontSize="xl" flexShrink={0}>
            📨
          </Center>
          <Box flex={1} minW={0}>
            <Text fontWeight={700} fontSize="sm">
              این آگهی مناسب کسیه که می‌شناسی؟
            </Text>
            <Text fontSize="11px" color="gray.400">
              داخل حلقه‌ی اعتمادت معرفی کن — نه اشتراک عمومی
            </Text>
          </Box>
          <Button colorScheme="brand" size="sm" flexShrink={0} onClick={() => setShowRefer(true)}>
            معرفی به دوست
          </Button>
        </Flex>
      </Box>

      {/* Seller */}
      {seller && !isMine && (
        <Box px={4} pt={3}>
          <Flex as={Link} href={`/person/${listing.sellerId}`} borderWidth="1px" borderColor="chakra-border-color" rounded="2xl" p={4} align="center" gap={3} bg="chakra-body-bg" _active={{ transform: "scale(0.99)" }} transition="transform 0.1s">
            <CAvatar name={seller.name} src={seller.avatar} level={seller.level} size="lg" />
            <Box flex={1} minW={0}>
              <Text fontWeight={700}>{seller.name}</Text>
              <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }} mt={0.5}>
                {seller.note ? `${seller.note} · ` : ""}
                {relationLabels[seller.relation]}
              </Text>
              <Text fontSize="xs" color="gray.400" mt={1}>
                {toPersianDigits(seller.deals)} معامله‌ی موفق · {seller.city}
              </Text>
            </Box>
            <Text color="gray.300" fontSize="lg">‹</Text>
          </Flex>
        </Box>
      )}

      {/* Endorsements */}
      <Box px={4} pt={3}>
        <Box borderWidth="1px" borderColor="chakra-border-color" rounded="2xl" p={4} bg="chakra-body-bg">
          <Text fontWeight={700} fontSize="sm" mb={3}>
            🛡️ تأیید و توصیه‌ها
          </Text>
          <EndorsementList endorsements={listing.endorsements} />

          {!isMine && (
            <Box mt={4} pt={4} borderTopWidth="1px" borderColor="chakra-border-color">
              <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }} mb={2}>
                اگر این فروشنده یا کالا را تأیید می‌کنید، نشان خود را اضافه کنید:
              </Text>
              <Wrap spacing={2}>
                {ALL_BADGES.map((b) => {
                  const active = listing.endorsements.some((e) => e.personId === "me" && e.type === b);
                  return (
                    <Badge
                      key={b}
                      as="button"
                      onClick={() => toggleEndorsement(listing.id, b)}
                      px={3}
                      py={1.5}
                      rounded="full"
                      borderWidth="1px"
                      cursor="pointer"
                      colorScheme={active ? "green" : "gray"}
                      variant={active ? "subtle" : "outline"}
                    >
                      {badgeEmoji[b]} {badgeLabels[b]}
                    </Badge>
                  );
                })}
              </Wrap>
            </Box>
          )}
        </Box>
      </Box>

      {/* Sticky action bar */}
      {!isMine && (
        <Box position="fixed" insetInline={0} bottom={0} zIndex={30} pointerEvents="none">
          <Box mx="auto" maxW={SHELL_MAX} pointerEvents="auto">
            <Box
              backdropFilter="blur(8px)"
              bg="rgba(255,255,255,0.95)"
              _dark={{ bg: "rgba(24,24,27,0.95)", borderColor: "whiteAlpha.200" }}
              borderTopWidth="1px"
              borderColor="blackAlpha.100"
              p={3}
              pb="max(0.75rem, env(safe-area-inset-bottom))"
            >
              <Button
                colorScheme="brand"
                w="full"
                py={6}
                leftIcon={<Box as={ChatIcon} className="w-5 h-5" />}
                onClick={() => router.push(`/messages/${listing.sellerId}`)}
              >
                {listing.type === "donation"
                  ? "پیام برای درخواست این کالا"
                  : listing.type === "service"
                    ? "پیام برای رزرو خدمت"
                    : "پیام به فروشنده"}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {showRefer && (
        <ReferSheet listingId={listing.id} listingTitle={listing.title} onClose={() => setShowRefer(false)} />
      )}
    </Box>
  );
}
