"use client";

import Link from "next/link";
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import LockedAccess from "@/components/LockedAccess";
import { canView, privacyAudience } from "@/lib/trust";
import { formatEventDateDisplay, toPersianDigits } from "@/lib/persian";
import {
  eventKindEmoji,
  eventKindLabels,
  privacyEmoji,
  privacyLabels,
  relationLabels,
} from "@/lib/labels";
import type { EventKind } from "@/lib/types";
import MHeader from "@/components/mantine/MHeader";
import MAvatar from "@/components/mantine/MAvatar";
import MTrustHighlight from "@/components/mantine/MTrustHighlight";
import { eventKindColor, SHELL_MAX } from "@/components/mantine/shared";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
} from "@/components/Icons";

const eventHeroTint: Record<EventKind, string> = {
  class: "linear-gradient(145deg, var(--mantine-color-teal-1), var(--mantine-color-body))",
  family: "linear-gradient(145deg, var(--mantine-color-pink-1), var(--mantine-color-body))",
  charity: "linear-gradient(145deg, var(--mantine-color-grape-1), var(--mantine-color-body))",
  kids: "linear-gradient(145deg, var(--mantine-color-cyan-1), var(--mantine-color-body))",
  trip: "linear-gradient(145deg, var(--mantine-color-green-1), var(--mantine-color-body))",
  social: "linear-gradient(145deg, var(--mantine-color-violet-1), var(--mantine-color-body))",
};

/** Mantine variant of the event detail page. Classic stays in EventClassic.tsx. */
export default function EventMantine({ params }: { params: { id: string } }) {
  const id = params.id;
  const { getEvent, getPerson, people, toggleRsvp, isAttending } = useStore();
  const { show } = useToast();

  const event = getEvent(id);
  if (!event) {
    return (
      <Box component="main" mih="100dvh">
        <MHeader title="رویداد" back />
        <Text ta="center" c="dimmed" fz="sm" py={80}>
          رویداد پیدا نشد.
        </Text>
      </Box>
    );
  }

  const host = getPerson(event.hostId);
  const isMine = event.hostId === "me";
  const circle = people.filter((p) => p.inMyCircle);

  if (!isMine && !canView(event, getPerson)) {
    return (
      <Box component="main" mih="100dvh">
        <MHeader title="جزئیات رویداد" back />
        <LockedAccess
          itemTitle={event.title}
          itemKind="event"
          privacy={event.privacy}
        />
      </Box>
    );
  }

  const going = isAttending(id);
  const count = event.attendees.length;
  const spotsLeft = event.capacity != null ? event.capacity - count : null;
  const full = spotsLeft != null && spotsLeft <= 0 && !going;
  const kindColor = eventKindColor[event.kind];
  const fillPct =
    event.capacity && event.capacity > 0
      ? Math.min(100, Math.round((count / event.capacity) * 100))
      : null;

  return (
    <Box component="main" pb={112} mih="100dvh">
      <MHeader title="جزئیات رویداد" back />

      {/* Full-bleed hero */}
      <Box
        h={208}
        pos="relative"
        style={{
          background: eventHeroTint[event.kind],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 84,
          overflow: "hidden",
        }}
      >
        <Box
          pos="absolute"
          style={{
            insetInlineStart: -32,
            top: -40,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "color-mix(in srgb, white 40%, transparent)",
            filter: "blur(28px)",
            pointerEvents: "none",
          }}
          aria-hidden
        />
        <span aria-hidden>{event.image}</span>
      </Box>

      <Stack gap={0} px="md" pt="md" style={{ marginTop: -12, position: "relative" }}>
        <Group gap="xs" mb={8} align="center">
          <Badge variant="light" color={kindColor} radius="sm">
            {eventKindEmoji[event.kind]} {eventKindLabels[event.kind]}
          </Badge>
          <Badge
            variant="outline"
            color="gray"
            radius="sm"
            title={privacyAudience(event.privacy, circle)}
          >
            {privacyEmoji[event.privacy]} {privacyLabels[event.privacy]}
          </Badge>
          {going && (
            <Badge variant="light" color="green" radius="sm">
              ✓ می‌آیم
            </Badge>
          )}
        </Group>

        <Text component="h1" fz={22} fw={800} lh={1.35}>
          {event.title}
        </Text>

        <Stack gap={10} mt="md">
          <Group gap="sm" wrap="nowrap" align="flex-start">
            <ThemeIcon variant="light" color="brand" radius="md" size={32}>
              <CalendarIcon className="w-4 h-4" />
            </ThemeIcon>
            <Box>
              <Text fz="sm" fw={600} className="nums">
                {formatEventDateDisplay(event.date)}
              </Text>
              <Text fz={11} c="dimmed">
                تاریخ برگزاری
              </Text>
            </Box>
          </Group>
          {event.time && (
            <Group gap="sm" wrap="nowrap" align="flex-start">
              <ThemeIcon variant="light" color="brand" radius="md" size={32}>
                <ClockIcon className="w-4 h-4" />
              </ThemeIcon>
              <Box>
                <Text fz="sm" fw={600} className="nums">
                  ساعت {event.time}
                </Text>
                <Text fz={11} c="dimmed">
                  زمان شروع
                </Text>
              </Box>
            </Group>
          )}
          <Group gap="sm" wrap="nowrap" align="flex-start">
            <ThemeIcon variant="light" color="brand" radius="md" size={32}>
              <MapPinIcon className="w-4 h-4" />
            </ThemeIcon>
            <Box>
              <Text fz="sm" fw={600}>
                {event.location}
              </Text>
              <Text fz={11} c="dimmed">
                محل رویداد
              </Text>
            </Box>
          </Group>
        </Stack>

        <Text fz="sm" c="dimmed" mt="md" style={{ lineHeight: 1.75, whiteSpace: "pre-line" }}>
          {event.description}
        </Text>
      </Stack>

      {/* Trust + host */}
      <Box px="md" pt="lg">
        <Card withBorder radius="lg" p="md">
          <Text fw={700} fz="sm" mb={4}>
            مسیر اعتماد
          </Text>
          <Text fz={11} c="dimmed" mb="sm">
            چطور به میزبان وصلی
          </Text>
          <MTrustHighlight
            posterId={event.hostId}
            trustPath={event.trustPath}
            endorsements={event.endorsements}
            posterRole="میزبان"
            contentKind="event"
            variant="default"
          />

          {host && !isMine && (
            <Box
              component={Link}
              href={`/person/${event.hostId}`}
              mt="md"
              pt="md"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                textDecoration: "none",
                color: "inherit",
                borderTop: "1px solid var(--mantine-color-default-border)",
              }}
            >
              <MAvatar name={host.name} src={host.avatar} level={host.level} size="lg" />
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text fw={700}>{host.name}</Text>
                <Text fz="xs" c="dimmed" mt={2} truncate>
                  میزبان · {relationLabels[host.relation]}
                  {host.city ? ` · ${host.city}` : ""}
                </Text>
              </Box>
              <Text c="brand" fw={700} fz="xs">
                پروفایل ‹
              </Text>
            </Box>
          )}
        </Card>
      </Box>

      {/* Attendees */}
      <Box px="md" pt="sm">
        <Card withBorder radius="lg" p="md">
          <Group justify="space-between" mb="xs" wrap="nowrap">
            <Text fw={700} fz="sm">
              شرکت‌کننده‌ها
            </Text>
            <Text fz="xs" c="dimmed" className="nums">
              {toPersianDigits(count)}
              {event.capacity ? ` / ${toPersianDigits(event.capacity)}` : " نفر"}
            </Text>
          </Group>

          {fillPct != null && (
            <Box mb="sm">
              <Progress
                value={fillPct}
                color={full ? "orange" : "teal"}
                size="sm"
                radius="xl"
              />
              <Text fz={11} c="dimmed" mt={6} className="nums">
                {full
                  ? "ظرفیت تکمیل است"
                  : spotsLeft != null
                    ? `${toPersianDigits(spotsLeft)} جای خالی`
                    : null}
              </Text>
            </Box>
          )}

          {count === 0 ? (
            <Text fz="sm" c="dimmed">
              هنوز کسی ثبت‌نام نکرده. اولین نفر باش!
            </Text>
          ) : (
            <Group gap="md">
              {event.attendees.map((aid) => {
                const p = getPerson(aid);
                const me = aid === "me";
                const name = me ? "شما" : p?.name ?? "؟";
                const body = (
                  <Stack gap={4} align="center" w={56}>
                    {p || me ? (
                      <MAvatar
                        name={name}
                        src={p?.avatar}
                        level={me ? undefined : p!.level}
                        size="sm"
                      />
                    ) : (
                      <Box
                        w={36}
                        h={36}
                        style={{
                          borderRadius: "50%",
                          background: "var(--mantine-color-default-hover)",
                        }}
                      />
                    )}
                    <Text fz={11} c="dimmed" ta="center" truncate w="100%">
                      {name}
                    </Text>
                  </Stack>
                );
                if (me || !p) {
                  return <Box key={aid}>{body}</Box>;
                }
                return (
                  <Box
                    key={aid}
                    component={Link}
                    href={`/person/${aid}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {body}
                  </Box>
                );
              })}
            </Group>
          )}
        </Card>
      </Box>

      {/* Sticky RSVP */}
      {!isMine && (
        <Box
          style={{
            position: "fixed",
            bottom: 0,
            insetInline: 0,
            zIndex: 30,
            pointerEvents: "none",
          }}
        >
          <Box mx="auto" maw={SHELL_MAX} style={{ pointerEvents: "auto" }}>
            <Paper
              p="sm"
              style={{
                background: "color-mix(in srgb, var(--mantine-color-body) 95%, transparent)",
                backdropFilter: "blur(8px)",
                borderTop: "1px solid var(--mantine-color-default-border)",
                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
              }}
              radius={0}
            >
              {going ? (
                <Group gap="xs" wrap="nowrap">
                  <Button
                    variant="light"
                    color="green"
                    style={{ flex: 1 }}
                    component="div"
                  >
                    ✓ حضور شما ثبت شد
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      toggleRsvp(id);
                      show("حضور لغو شد");
                    }}
                  >
                    لغو
                  </Button>
                </Group>
              ) : (
                <Button
                  fullWidth
                  size="md"
                  color="brand"
                  disabled={full}
                  onClick={() => {
                    if (full) return;
                    toggleRsvp(id);
                    show("حضور شما ثبت شد ✓ منتظرت هستیم!");
                  }}
                >
                  {full ? "ظرفیت تکمیل است" : "من می‌آیم"}
                </Button>
              )}
            </Paper>
          </Box>
        </Box>
      )}
    </Box>
  );
}
