"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { useStore } from "@/lib/store";
import MHeader from "@/components/mantine/MHeader";
import MBottomNav from "@/components/mantine/MBottomNav";
import MTrustHighlight from "@/components/mantine/MTrustHighlight";
import { eventKindColor, privacyColor } from "@/components/mantine/shared";
// Reuse the existing classic AddEventSheet overlay as-is (out of scope to rebuild).
import AddEventSheet from "@/components/AddEventSheet";
import { PlusIcon } from "@/components/Icons";
import { canView, privacyAudience } from "@/lib/trust";
import {
  eventKindEmoji,
  eventKindLabels,
  privacyEmoji,
  privacyLabels,
} from "@/lib/labels";
import { formatEventDateDisplay, toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";
import type { CircleEvent } from "@/lib/types";

function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { events, getPerson, addEvent, hydrated } = useStore();
  const { show } = useToast();
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (searchParams.get("compose") === "1") {
      setShowAdd(true);
    }
  }, [searchParams]);

  function closeAddSheet() {
    setShowAdd(false);
    if (searchParams.get("compose") === "1") {
      router.replace("/events");
    }
  }

  const visible = useMemo(
    () => events.filter((e) => canView(e, getPerson)),
    [events, getPerson],
  );

  return (
    <Box component="main" pb={96} mih="100dvh">
      <MHeader
        title="رویدادها و دورهمی‌ها"
        subtitle="با حلقه‌ات وقت بگذران"
        back
        action={
          <ActionIcon
            color="brand"
            radius="xl"
            size={36}
            onClick={() => setShowAdd(true)}
            aria-label="ساخت رویداد"
          >
            <PlusIcon className="w-5 h-5" />
          </ActionIcon>
        }
      />

      <Box px="md" pt="sm">
        <Card
          radius="lg"
          p="md"
          style={{
            background:
              "linear-gradient(270deg, var(--mantine-color-brand-5), var(--mantine-color-brand-7))",
            color: "var(--mantine-color-white)",
          }}
        >
          <Text fw={800} fz="sm" c="white">
            سیرکل فقط خریدوفروش نیست
          </Text>
          <Text fz="xs" mt={4} style={{ lineHeight: 1.7, color: "var(--mantine-color-brand-0)" }}>
            کلاس، دورهمی خانوادگی، بازارچه‌ی خیریه، بازی کودکان و سفر گروهی — همه
            بین آدم‌هایی که می‌شناسی و بهشان اعتماد داری.
          </Text>
        </Card>
      </Box>

      <Box component="section" px="md" pt="sm">
        {!hydrated ? (
          <Stack gap="sm">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} withBorder radius="lg" p="md" h={140} />
            ))}
          </Stack>
        ) : visible.length === 0 ? (
          <Card withBorder radius="lg" p="xl" ta="center">
            <Text fz={40}>🎉</Text>
            <Text fw={700} fz="md" mt="xs">
              رویدادی نیست
            </Text>
            <Text fz="sm" c="dimmed" mt={4} style={{ lineHeight: 1.7 }}>
              کلاس، دورهمی، بازارچه یا سفر گروهی — بین آدم‌هایی که می‌شناسی.
            </Text>
            <Button mt="md" onClick={() => setShowAdd(true)}>
              ساخت اولین رویداد
            </Button>
          </Card>
        ) : (
          <Stack gap="sm">
            {visible.map((e) => (
              <MEventCard key={e.id} event={e} />
            ))}
          </Stack>
        )}
      </Box>

      {showAdd && (
        <AddEventSheet
          onClose={closeAddSheet}
          onAdd={(input) => {
            addEvent(input);
            closeAddSheet();
            show("رویداد شما ساخته شد ✓");
          }}
        />
      )}

      <MBottomNav />
    </Box>
  );
}

/** Mantine variant of EventCard. */
function MEventCard({ event }: { event: CircleEvent }) {
  const { isAttending, people } = useStore();
  const circle = people.filter((p) => p.inMyCircle);
  const going = isAttending(event.id);
  const count = event.attendees.length;

  return (
    <Card withBorder padding="sm" radius="lg">
      <MTrustHighlight
        posterId={event.hostId}
        trustPath={event.trustPath}
        endorsements={event.endorsements}
        posterRole="میزبان"
        contentKind="event"
        variant="compact"
      />

      <Card.Section
        component={Link}
        href={`/event/${event.id}`}
        inheritPadding
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <Box
            w={64}
            h={64}
            style={{
              borderRadius: 12,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              background:
                "linear-gradient(135deg, var(--mantine-color-brand-light), var(--mantine-color-default-hover))",
            }}
          >
            {event.image}
          </Box>
          <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
            <Group gap={6}>
              <Badge
                size="sm"
                variant="light"
                color={eventKindColor[event.kind]}
                radius="sm"
              >
                {eventKindEmoji[event.kind]} {eventKindLabels[event.kind]}
              </Badge>
              {going && (
                <Badge size="sm" variant="light" color="green" radius="sm">
                  ✓ می‌آیم
                </Badge>
              )}
            </Group>
            <Text fw={600} fz={15} lh={1.3} lineClamp={2}>
              {event.title}
            </Text>
            <Text fz="xs" fw={500} c="brand.7">
              📅 {formatEventDateDisplay(event.date)}
              {event.time ? ` · ${event.time}` : ""}
            </Text>
          </Stack>
        </Group>

        <Stack
          gap={4}
          mt="sm"
          pt="xs"
          style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
        >
          <Group justify="space-between" gap={6}>
            <Text fz={11} c="dimmed">
              📍 {event.location}
            </Text>
            <Text fz={11} c="dimmed">
              {toPersianDigits(count)} نفر
              {event.capacity ? ` از ${toPersianDigits(event.capacity)}` : ""}
            </Text>
          </Group>
          <Text
            fz={11}
            c={privacyColor[event.privacy] + ".7"}
            title={privacyAudience(event.privacy, circle)}
          >
            {privacyEmoji[event.privacy]} {privacyLabels[event.privacy]}
          </Text>
        </Stack>
      </Card.Section>
    </Card>
  );
}

export default function EventsMantine() {
  return (
    <Suspense>
      <EventsContent />
    </Suspense>
  );
}
