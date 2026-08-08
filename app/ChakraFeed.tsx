"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Box,
  Center,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Link as CLink,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useStore } from "@/lib/store";
import CListingCard from "@/components/chakra/CListingCard";
import CBottomNav from "@/components/chakra/CBottomNav";
import CAvatar from "@/components/chakra/CAvatar";
import Onboarding from "@/components/Onboarding";
import { CircleUsersIcon, SearchIcon, ShieldCheckIcon } from "@/components/Icons";
import { formatPrice, listingTypeLabels } from "@/lib/labels";
import type { CircleEvent, ListingType, Request } from "@/lib/types";
import { formatEventDateDisplay, normalizeFa, toPersianDigits } from "@/lib/persian";
import { canView, filterByAccess } from "@/lib/trust";

const PREVIEW_LIMIT = 8;

const FILTERS: { key: ListingType | "all"; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "sale", label: listingTypeLabels.sale },
  { key: "service", label: listingTypeLabels.service },
  { key: "donation", label: listingTypeLabels.donation },
  { key: "exchange", label: listingTypeLabels.exchange },
  { key: "loan", label: listingTypeLabels.loan },
];

export default function ChakraFeed() {
  const { listings, requests, events, people, getPerson, hydrated, onboarded } = useStore();
  const [filter, setFilter] = useState<ListingType | "all">("all");
  const [query, setQuery] = useState("");

  const circleCount = people.filter((p) => p.inMyCircle).length;

  const { allowed, hidden } = useMemo(() => {
    const { visible, hidden } = filterByAccess(listings, getPerson);
    return { allowed: visible, hidden };
  }, [listings, getPerson]);

  const visibleRequests = useMemo(
    () => requests.filter((r) => canView(r, getPerson)).slice(0, PREVIEW_LIMIT),
    [requests, getPerson],
  );
  const visibleEvents = useMemo(
    () => events.filter((e) => canView(e, getPerson)).slice(0, PREVIEW_LIMIT),
    [events, getPerson],
  );

  const visible = useMemo(() => {
    const q = normalizeFa(query);
    return allowed.filter((l) => {
      if (filter !== "all" && l.type !== filter) return false;
      if (q && !normalizeFa(`${l.title} ${l.description} ${l.category}`).includes(q)) return false;
      return true;
    });
  }, [allowed, filter, query]);

  const hasFilter = filter !== "all" || query.trim().length > 0;

  return (
    <Box as="main" pb={24} minH="100dvh">
      {/* Sticky header */}
      <Box
        as="header"
        position="sticky"
        top={0}
        zIndex={20}
        backdropFilter="blur(8px)"
        bg="rgba(255,255,255,0.9)"
        _dark={{ bg: "rgba(24,24,27,0.9)", borderColor: "whiteAlpha.200" }}
        borderBottomWidth="1px"
        borderColor="blackAlpha.100"
      >
        <Box px={4} pt={3} pb={2}>
          <HStack gap={2}>
            <Center w="36px" h="36px" rounded="full" bg="brand.600" color="white">
              <Box as={ShieldCheckIcon} className="w-5 h-5" />
            </Center>
            <Box minW={0}>
              <Text fontWeight={800} fontSize="lg" lineHeight={1} color="brand.600" _dark={{ color: "brand.300" }}>
                سیرکل
              </Text>
              <Text fontSize="11px" color="gray.500" _dark={{ color: "gray.400" }} mt={0.5}>
                خرید و فروش بین آدم‌های مورد اعتماد
              </Text>
            </Box>
          </HStack>

          <InputGroup mt={3}>
            <InputLeftElement pointerEvents="none">
              <Box as={SearchIcon} className="w-5 h-5" color="gray.400" />
            </InputLeftElement>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجو در آگهی‌های حلقه‌ی شما…"
              rounded="xl"
              bg="gray.50"
              _dark={{ bg: "whiteAlpha.50" }}
              focusBorderColor="brand.400"
            />
          </InputGroup>
        </Box>

        <HStack gap={2} px={4} pb={2} overflowX="auto" css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
          {FILTERS.map((f) => (
            <Badge
              key={f.key}
              as="button"
              onClick={() => setFilter(f.key)}
              colorScheme={filter === f.key ? "brand" : "gray"}
              variant={filter === f.key ? "solid" : "subtle"}
              rounded="full"
              px={3}
              py={1.5}
              flexShrink={0}
              cursor="pointer"
              fontSize="sm"
            >
              {f.label}
            </Badge>
          ))}
        </HStack>
      </Box>

      {/* Trust banner */}
      {!onboarded && (
        <Box px={4} pt={3}>
          <Box rounded="2xl" p={4} color="white" bgGradient="linear(to-l, brand.600, brand.500)">
            <Text fontWeight={700} fontSize="sm">
              اینجا کسی غریبه نیست
            </Text>
            <Text fontSize="xs" mt={1} opacity={0.9} lineHeight={1.7}>
              هر آگهی از مسیر اعتمادی به شما می‌رسد: «این فروشنده، دوستِ همکارِ خواهرِ شماست.»
            </Text>
          </Box>
        </Box>
      )}

      {/* Quick access */}
      {circleCount <= 2 && (
        <HStack gap={2.5} px={4} pt={3} align="stretch">
          <Shortcut href="/requests" emoji="🔎" label="درخواست‌ها" scheme="orange" />
          <Shortcut href="/events" emoji="🎉" label="رویدادها" scheme="brand" />
        </HStack>
      )}

      {/* New-user first step */}
      {hydrated && circleCount === 0 && (
        <Box px={4} pt={4}>
          <Box borderWidth="1px" borderColor="chakra-border-color" rounded="2xl" p={4} textAlign="center" bg="chakra-body-bg">
            <Center w="48px" h="48px" rounded="full" bg="brand.50" color="brand.600" _dark={{ bg: "whiteAlpha.100" }} mx="auto" mb={2}>
              <Box as={CircleUsersIcon} className="w-6 h-6" />
            </Center>
            <Text fontWeight={700} fontSize="sm">
              اول حلقه‌ات را بساز
            </Text>
            <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }} mt={1} lineHeight={1.7}>
              با افزودن خانواده و دوستان مورد اعتماد، آگهی‌ها و رویدادهای آن‌ها اینجا ظاهر می‌شود.
            </Text>
            <CLink as={Link} href="/circle" display="inline-block" mt={3} fontSize="sm" fontWeight={600} color="brand.600">
              افزودن به حلقه ←
            </CLink>
          </Box>
        </Box>
      )}

      {/* Listings feed */}
      <Box px={4} pt={5}>
        <Text fontWeight={700} fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }} mb={2.5}>
          آگهی‌ها
        </Text>
        {!hydrated ? (
          <VStack gap={3} align="stretch">
            {[0, 1, 2].map((i) => (
              <Box key={i} borderWidth="1px" borderColor="chakra-border-color" rounded="2xl" h="120px" />
            ))}
          </VStack>
        ) : visible.length === 0 ? (
          <FeedEmptyState hasFilter={hasFilter} onClear={() => { setFilter("all"); setQuery(""); }} />
        ) : (
          <VStack gap={3} align="stretch">
            {visible.map((l) => (
              <CListingCard key={l.id} listing={l} compactTrust />
            ))}
          </VStack>
        )}

        {hidden > 0 && (
          <HStack justify="center" gap={2} py={2} color="gray.400">
            <Box as={CircleUsersIcon} className="w-4 h-4" />
            <Text fontSize="11px">
              {toPersianDigits(hidden)} آگهی به‌دلیل تنظیمات حریم خصوصی برای شما قابل نمایش نیست
            </Text>
          </HStack>
        )}
      </Box>

      {/* Events strip */}
      {visibleEvents.length > 0 && (
        <StripSection title="رویدادهای پیش‌رو" href="/events">
          {visibleEvents.map((ev) => <EventStripCard key={ev.id} event={ev} />)}
        </StripSection>
      )}

      {/* Requests strip */}
      {visibleRequests.length > 0 && (
        <StripSection title="درخواست‌های حلقه" href="/requests">
          {visibleRequests.map((r) => <RequestStripCard key={r.id} request={r} />)}
        </StripSection>
      )}

      <Onboarding />
      <CBottomNav />
    </Box>
  );
}

function Shortcut({ href, emoji, label, scheme }: { href: string; emoji: string; label: string; scheme: string }) {
  return (
    <Box as={Link} href={href} flex={1} borderWidth="1px" borderColor="chakra-border-color" rounded="2xl" p={3} bg="chakra-body-bg">
      <VStack gap={1.5}>
        <Center w="40px" h="40px" rounded="full" fontSize="18px" bg={`${scheme}.50`} color={`${scheme}.600`} _dark={{ bg: "whiteAlpha.100" }}>
          {emoji}
        </Center>
        <Text fontSize="xs" fontWeight={700}>
          {label}
        </Text>
      </VStack>
    </Box>
  );
}

function StripSection({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <Box pt={5}>
      <Flex justify="space-between" align="center" px={4} mb={2.5}>
        <Text fontWeight={700} fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>
          {title}
        </Text>
        {href && (
          <CLink as={Link} href={href} fontSize="xs" fontWeight={500} color="brand.600">
            همه
          </CLink>
        )}
      </Flex>
      <HStack gap={3} px={4} pb={1} overflowX="auto" align="stretch" css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
        {children}
      </HStack>
    </Box>
  );
}

function FeedEmptyState({ hasFilter, onClear }: { hasFilter: boolean; onClear: () => void }) {
  return (
    <Box borderWidth="1px" borderColor="chakra-border-color" rounded="2xl" p={6} textAlign="center" bg="chakra-body-bg">
      <Center w="48px" h="48px" rounded="full" bg="gray.100" _dark={{ bg: "whiteAlpha.100" }} fontSize="xl" mx="auto" mb={3}>
        🔍
      </Center>
      <Text fontWeight={700} fontSize="sm">
        {hasFilter ? "نتیجه‌ای پیدا نشد" : "هنوز آگهی‌ای نیست"}
      </Text>
      <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }} mt={1.5} lineHeight={1.7}>
        {hasFilter ? "فیلتر یا جستجو را عوض کن، یا اولین آگهی را ثبت کن." : "با ثبت آگهی یا گسترش حلقه، فیدت پر می‌شود."}
      </Text>
      <VStack gap={2} mt={4}>
        {hasFilter && (
          <CLink as="button" onClick={onClear} fontSize="sm" color="brand.600">
            پاک کردن فیلتر و جستجو
          </CLink>
        )}
        <CLink as={Link} href="/new" fontSize="sm" fontWeight={600} color="brand.600">
          ثبت آگهی
        </CLink>
      </VStack>
    </Box>
  );
}

function EventStripCard({ event }: { event: CircleEvent }) {
  const { getPerson } = useStore();
  const host = getPerson(event.hostId);
  const count = event.attendees.length;

  return (
    <Box as={Link} href={`/event/${event.id}`} borderWidth="1px" borderColor="chakra-border-color" rounded="2xl" p={3} w="192px" flexShrink={0} bg="chakra-body-bg">
      {host && (
        <HStack gap={2} mb={2}>
          <CAvatar name={host.name} level={host.level} size="sm" />
          <Text fontSize="11px" color="gray.500" _dark={{ color: "gray.400" }} noOfLines={1}>
            {host.name}
          </Text>
        </HStack>
      )}
      <Center h="56px" rounded="xl" fontSize="24px" mb={2} bgGradient="linear(to-br, brand.50, blackAlpha.50)" _dark={{ bgGradient: "linear(to-br, whiteAlpha.100, whiteAlpha.50)" }}>
        {event.image}
      </Center>
      <Text fontSize="13px" fontWeight={600} noOfLines={2} lineHeight={1.3}>
        {event.title}
      </Text>
      <Text fontSize="11px" fontWeight={500} color="brand.600" _dark={{ color: "brand.300" }} mt={1}>
        📅 {formatEventDateDisplay(event.date)}
      </Text>
      <Text fontSize="11px" color="gray.400" mt={0.5} noOfLines={1}>
        📍 {event.location}
      </Text>
      <Text fontSize="10px" color="gray.400" mt={1}>
        {toPersianDigits(count)} نفر{event.capacity ? ` از ${toPersianDigits(event.capacity)}` : ""}
      </Text>
    </Box>
  );
}

function RequestStripCard({ request }: { request: Request }) {
  const { getPerson, getOffers } = useStore();
  const requester = getPerson(request.requesterId);
  const offers = getOffers(request.id);

  return (
    <Box as={Link} href={`/request/${request.id}`} borderWidth="1px" borderColor="chakra-border-color" rounded="2xl" p={3} w="192px" flexShrink={0} bg="chakra-body-bg">
      {requester && (
        <HStack gap={2} mb={2}>
          <CAvatar name={requester.name} level={requester.level} size="sm" />
          <Text fontSize="11px" color="gray.500" _dark={{ color: "gray.400" }} noOfLines={1}>
            {requester.name}
          </Text>
        </HStack>
      )}
      <Center h="56px" rounded="xl" fontSize="24px" mb={2} bgGradient="linear(to-br, orange.50, blackAlpha.50)" _dark={{ bgGradient: "linear(to-br, whiteAlpha.100, whiteAlpha.50)" }}>
        {request.image}
      </Center>
      <Text fontSize="13px" fontWeight={600} noOfLines={2} lineHeight={1.3}>
        {request.title}
      </Text>
      <Text fontSize="11px" color="gray.500" _dark={{ color: "gray.400" }} mt={1} noOfLines={1}>
        {request.category}
      </Text>
      {request.budget != null && (
        <Text fontSize="11px" fontWeight={700} color="brand.600" _dark={{ color: "brand.300" }} mt={0.5}>
          تا {formatPrice(request.budget)}
        </Text>
      )}
      {offers.length > 0 && (
        <Text fontSize="10px" fontWeight={500} color="brand.600" mt={1}>
          {toPersianDigits(offers.length)} پیشنهاد
        </Text>
      )}
    </Box>
  );
}
