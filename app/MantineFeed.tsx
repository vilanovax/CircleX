"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Anchor,
  Badge,
  Box,
  Card,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { useStore } from "@/lib/store";
import MListingCard from "@/components/mantine/MListingCard";
import MBottomNav from "@/components/mantine/MBottomNav";
import MAvatar from "@/components/mantine/MAvatar";
import Onboarding from "@/components/Onboarding";
import { CircleUsersIcon, SearchIcon, ShieldCheckIcon } from "@/components/Icons";
import { formatPrice, listingTypeEmoji, listingTypeLabels } from "@/lib/labels";
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

export default function MantineFeed() {
  const { listings, requests, events, people, getPerson, hydrated, onboarded } =
    useStore();
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
      if (q && !normalizeFa(`${l.title} ${l.description} ${l.category}`).includes(q))
        return false;
      return true;
    });
  }, [allowed, filter, query]);

  const hasFilter = filter !== "all" || query.trim().length > 0;

  return (
    <Box component="main" pb={96} mih="100dvh">
      {/* Sticky header */}
      <Box
        component="header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(8px)",
          background: "color-mix(in srgb, var(--mantine-color-body) 90%, transparent)",
          borderBottom: "1px solid var(--mantine-color-default-border)",
        }}
      >
        <Box px="md" pt="sm" pb="xs">
          <Group gap="xs" wrap="nowrap">
            <ThemeIcon size={36} radius="xl" color="brand">
              <ShieldCheckIcon className="w-5 h-5" />
            </ThemeIcon>
            <Box style={{ minWidth: 0 }}>
              <Text fw={800} fz="lg" lh={1} c="brand.7">
                سیرکل
              </Text>
              <Text fz={11} c="dimmed" mt={2}>
                خرید و فروش بین آدم‌های مورد اعتماد
              </Text>
            </Box>
          </Group>

          <TextInput
            mt="sm"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="جستجو در آگهی‌های حلقه‌ی شما…"
            leftSection={<SearchIcon className="w-5 h-5" />}
            radius="md"
          />
        </Box>

        <ScrollArea scrollbarSize={0} type="never">
          <Group gap="xs" px="md" pb="xs" wrap="nowrap">
            {FILTERS.map((f) => (
              <Badge
                key={f.key}
                component="button"
                variant={filter === f.key ? "filled" : "light"}
                color={filter === f.key ? "brand" : "gray"}
                size="lg"
                radius="xl"
                style={{ cursor: "pointer", flexShrink: 0 }}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </Badge>
            ))}
          </Group>
        </ScrollArea>
      </Box>

      {/* Trust banner — before onboarding */}
      {!onboarded && (
        <Box px="md" pt="sm">
          <Paper
            radius="lg"
            p="md"
            style={{
              background:
                "linear-gradient(to left, var(--mantine-color-brand-6), var(--mantine-color-brand-5))",
              color: "#fff",
            }}
          >
            <Text fw={700} fz="sm">
              اینجا کسی غریبه نیست
            </Text>
            <Text fz="xs" mt={4} style={{ opacity: 0.9, lineHeight: 1.7 }}>
              هر آگهی از مسیر اعتمادی به شما می‌رسد: «این فروشنده، دوستِ همکارِ خواهرِ شماست.»
            </Text>
          </Paper>
        </Box>
      )}

      {/* Quick access — while circle is small */}
      {circleCount <= 2 && (
        <Group grow gap="xs" px="md" pt="sm">
          <Shortcut href="/requests" emoji="🔎" label="درخواست‌ها" color="orange" />
          <Shortcut href="/events" emoji="🎉" label="رویدادها" color="brand" />
        </Group>
      )}

      {/* New-user first step */}
      {hydrated && circleCount === 0 && (
        <Box px="md" pt="md">
          <Card withBorder radius="lg" p="md" ta="center">
            <ThemeIcon size={48} radius="xl" variant="light" color="brand" mx="auto" mb="xs">
              <CircleUsersIcon className="w-6 h-6" />
            </ThemeIcon>
            <Text fw={700} fz="sm">
              اول حلقه‌ات را بساز
            </Text>
            <Text fz="xs" c="dimmed" mt={4} style={{ lineHeight: 1.7 }}>
              با افزودن خانواده و دوستان مورد اعتماد، آگهی‌ها و رویدادهای آن‌ها اینجا ظاهر می‌شود.
            </Text>
            <Anchor component={Link} href="/circle" mt="sm" fz="sm" fw={600}>
              افزودن به حلقه ←
            </Anchor>
          </Card>
        </Box>
      )}

      {/* Listings feed */}
      <Box px="md" pt="lg">
        <Text fw={700} fz="sm" c="dimmed" mb="xs">
          آگهی‌ها
        </Text>
        {!hydrated ? (
          <Stack gap="sm">
            {[0, 1, 2].map((i) => (
              <Card key={i} withBorder radius="lg" p="sm" h={120} />
            ))}
          </Stack>
        ) : visible.length === 0 ? (
          <FeedEmptyState
            hasFilter={hasFilter}
            onClear={() => {
              setFilter("all");
              setQuery("");
            }}
          />
        ) : (
          <Stack gap="sm">
            {visible.map((l) => (
              <MListingCard key={l.id} listing={l} compactTrust />
            ))}
          </Stack>
        )}

        {hidden > 0 && (
          <Group justify="center" gap={6} py="sm" c="dimmed">
            <CircleUsersIcon className="w-4 h-4" />
            <Text fz={11}>
              {toPersianDigits(hidden)} آگهی به‌دلیل تنظیمات حریم خصوصی برای شما قابل نمایش نیست
            </Text>
          </Group>
        )}
      </Box>

      {/* Events strip */}
      {visibleEvents.length > 0 && (
        <StripSection title="رویدادهای پیش‌رو" href="/events">
          {visibleEvents.map((ev) => (
            <EventStripCard key={ev.id} event={ev} />
          ))}
        </StripSection>
      )}

      {/* Requests strip */}
      {visibleRequests.length > 0 && (
        <StripSection title="درخواست‌های حلقه" href="/requests">
          {visibleRequests.map((r) => (
            <RequestStripCard key={r.id} request={r} />
          ))}
        </StripSection>
      )}

      <Onboarding />
      <MBottomNav />
    </Box>
  );
}

function Shortcut({
  href,
  emoji,
  label,
  color,
}: {
  href: string;
  emoji: string;
  label: string;
  color: string;
}) {
  return (
    <Card
      component={Link}
      href={href}
      withBorder
      radius="lg"
      p="sm"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Stack gap={6} align="center">
        <ThemeIcon size={40} radius="xl" variant="light" color={color} style={{ fontSize: 18 }}>
          {emoji}
        </ThemeIcon>
        <Text fz="xs" fw={700}>
          {label}
        </Text>
      </Stack>
    </Card>
  );
}

function StripSection({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <Box pt="lg">
      <Group justify="space-between" px="md" mb="xs">
        <Text fw={700} fz="sm" c="dimmed">
          {title}
        </Text>
        {href && (
          <Anchor component={Link} href={href} fz="xs" fw={500}>
            همه
          </Anchor>
        )}
      </Group>
      <ScrollArea scrollbarSize={0} type="never">
        <Group gap="sm" px="md" pb={4} wrap="nowrap" align="stretch">
          {children}
        </Group>
      </ScrollArea>
    </Box>
  );
}

function FeedEmptyState({
  hasFilter,
  onClear,
}: {
  hasFilter: boolean;
  onClear: () => void;
}) {
  return (
    <Card withBorder radius="lg" p="lg" ta="center">
      <ThemeIcon size={48} radius="xl" variant="light" color="gray" mx="auto" mb="sm" style={{ fontSize: 20 }}>
        🔍
      </ThemeIcon>
      <Text fw={700} fz="sm">
        {hasFilter ? "نتیجه‌ای پیدا نشد" : "هنوز آگهی‌ای نیست"}
      </Text>
      <Text fz="xs" c="dimmed" mt={6} style={{ lineHeight: 1.7 }}>
        {hasFilter
          ? "فیلتر یا جستجو را عوض کن، یا اولین آگهی را ثبت کن."
          : "با ثبت آگهی یا گسترش حلقه، فیدت پر می‌شود."}
      </Text>
      <Stack gap="xs" mt="md">
        {hasFilter && (
          <Anchor component="button" type="button" onClick={onClear} fz="sm">
            پاک کردن فیلتر و جستجو
          </Anchor>
        )}
        <Anchor component={Link} href="/new" fz="sm" fw={600}>
          ثبت آگهی
        </Anchor>
      </Stack>
    </Card>
  );
}

function EventStripCard({ event }: { event: CircleEvent }) {
  const { getPerson } = useStore();
  const host = getPerson(event.hostId);
  const count = event.attendees.length;

  return (
    <Card
      component={Link}
      href={`/event/${event.id}`}
      withBorder
      radius="lg"
      p="sm"
      w={192}
      style={{ flexShrink: 0, textDecoration: "none", color: "inherit" }}
    >
      {host && (
        <Group gap="xs" mb="xs" wrap="nowrap">
          <MAvatar name={host.name} level={host.level} size="sm" />
          <Text fz={11} c="dimmed" truncate>
            {host.name}
          </Text>
        </Group>
      )}
      <Box
        h={56}
        style={{
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          background:
            "linear-gradient(135deg, var(--mantine-color-brand-0), var(--mantine-color-default-hover))",
        }}
        mb="xs"
      >
        {event.image}
      </Box>
      <Text fz={13} fw={600} lineClamp={2} lh={1.3}>
        {event.title}
      </Text>
      <Text fz={11} fw={500} c="brand.7" mt={4}>
        📅 {formatEventDateDisplay(event.date)}
      </Text>
      <Text fz={11} c="dimmed" mt={2} lineClamp={1}>
        📍 {event.location}
      </Text>
      <Text fz={10} c="dimmed" mt={4}>
        {toPersianDigits(count)} نفر
        {event.capacity ? ` از ${toPersianDigits(event.capacity)}` : ""}
      </Text>
    </Card>
  );
}

function RequestStripCard({ request }: { request: Request }) {
  const { getPerson, getOffers } = useStore();
  const requester = getPerson(request.requesterId);
  const offers = getOffers(request.id);

  return (
    <Card
      component={Link}
      href={`/request/${request.id}`}
      withBorder
      radius="lg"
      p="sm"
      w={192}
      style={{ flexShrink: 0, textDecoration: "none", color: "inherit" }}
    >
      {requester && (
        <Group gap="xs" mb="xs" wrap="nowrap">
          <MAvatar name={requester.name} level={requester.level} size="sm" />
          <Text fz={11} c="dimmed" truncate>
            {requester.name}
          </Text>
        </Group>
      )}
      <Box
        h={56}
        style={{
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          background:
            "linear-gradient(135deg, var(--mantine-color-orange-0), var(--mantine-color-default-hover))",
        }}
        mb="xs"
      >
        {request.image}
      </Box>
      <Text fz={13} fw={600} lineClamp={2} lh={1.3}>
        {request.title}
      </Text>
      <Text fz={11} c="dimmed" mt={4} lineClamp={1}>
        {request.category}
      </Text>
      {request.budget != null && (
        <Text fz={11} fw={700} c="brand.7" mt={2}>
          تا {formatPrice(request.budget)}
        </Text>
      )}
      {offers.length > 0 && (
        <Text fz={10} fw={500} c="brand.6" mt={4}>
          {toPersianDigits(offers.length)} پیشنهاد
        </Text>
      )}
    </Card>
  );
}
