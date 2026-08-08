"use client";

import Link from "next/link";
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import LockedAccess from "@/components/LockedAccess";
import { canView } from "@/lib/trust";
import { formatEventDateDisplay, toPersianDigits } from "@/lib/persian";
import {
  eventKindEmoji,
  eventKindLabels,
  privacyEmoji,
  privacyLabels,
  relationLabels,
} from "@/lib/labels";
import MHeader from "@/components/mantine/MHeader";
import MAvatar from "@/components/mantine/MAvatar";
import MTrustHighlight from "@/components/mantine/MTrustHighlight";
import { eventKindColor, SHELL_MAX } from "@/components/mantine/shared";

/** Mantine variant of the event detail page. Classic stays in EventClassic.tsx. */
export default function EventMantine({ params }: { params: { id: string } }) {
  const id = params.id;
  const { getEvent, getPerson, toggleRsvp, isAttending } = useStore();
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

  return (
    <Box component="main" pb={32} mih="100dvh">
      <MHeader title="جزئیات رویداد" back />

      {/* Hero */}
      <Box
        mx="md"
        mt="md"
        h={160}
        style={{
          borderRadius: 16,
          background:
            "linear-gradient(135deg, var(--mantine-color-brand-light), var(--mantine-color-default-hover))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 64,
        }}
      >
        {event.image}
      </Box>

      <Stack gap={0} px="md" pt="md">
        <Group gap="xs" mb={4} align="center">
          <Badge variant="light" color={kindColor} radius="sm">
            {eventKindEmoji[event.kind]} {eventKindLabels[event.kind]}
          </Badge>
          <Text fz={11} c="dimmed" title={privacyLabels[event.privacy]}>
            {privacyEmoji[event.privacy]} {privacyLabels[event.privacy]}
          </Text>
        </Group>

        <Text component="h1" fz="xl" fw={700} lh={1.35}>
          {event.title}
        </Text>

        {/* Date / location */}
        <Stack gap={6} mt="xs">
          <Group gap="xs" wrap="nowrap">
            <Text>📅</Text>
            <Text fz="sm" fw={500}>
              {formatEventDateDisplay(event.date)}
              {event.time ? ` · ساعت ${event.time}` : ""}
            </Text>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <Text>📍</Text>
            <Text fz="sm">{event.location}</Text>
          </Group>
        </Stack>

        <Text fz="sm" c="dimmed" mt="xs" style={{ lineHeight: 1.7, whiteSpace: "pre-line" }}>
          {event.description}
        </Text>
      </Stack>

      {/* Trust path */}
      <Box px="md" pt="lg">
        <Card withBorder radius="lg" p="md">
          <Text fw={700} fz="sm" mb="sm">
            میزبان و مسیر اعتماد
          </Text>
          <MTrustHighlight
            posterId={event.hostId}
            trustPath={event.trustPath}
            endorsements={event.endorsements}
            posterRole="میزبان"
            contentKind="event"
            variant="default"
          />
        </Card>
      </Box>

      {/* Host */}
      {host && !isMine && (
        <Box px="md" pt="xs">
          <Card
            component={Link}
            href={`/person/${event.hostId}`}
            withBorder
            radius="lg"
            p="md"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Group gap="sm" wrap="nowrap">
              <MAvatar name={host.name} level={host.level} size="lg" />
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text fw={700}>{host.name}</Text>
                <Text fz="xs" c="dimmed" mt={2}>
                  میزبان · {relationLabels[host.relation]}
                </Text>
              </Box>
              <Text c="dimmed" fz="lg">
                ‹
              </Text>
            </Group>
          </Card>
        </Box>
      )}

      {/* Attendees */}
      <Box px="md" pt="xs">
        <Card withBorder radius="lg" p="md">
          <Group justify="space-between" mb="sm" wrap="nowrap">
            <Text fw={700} fz="sm">
              شرکت‌کننده‌ها
            </Text>
            <Text fz="xs" c="dimmed">
              {toPersianDigits(count)} نفر
              {event.capacity ? ` از ${toPersianDigits(event.capacity)}` : ""}
              {spotsLeft != null && spotsLeft > 0
                ? ` · ${toPersianDigits(spotsLeft)} جای خالی`
                : ""}
            </Text>
          </Group>
          {count === 0 ? (
            <Text fz="sm" c="dimmed">
              هنوز کسی ثبت‌نام نکرده. اولین نفر باش!
            </Text>
          ) : (
            <SimpleGrid cols={6} spacing="xs" verticalSpacing="sm">
              {event.attendees.map((aid) => {
                const p = getPerson(aid);
                const me = aid === "me";
                return (
                  <Stack key={aid} gap={4} align="center">
                    {p || me ? (
                      <MAvatar
                        name={me ? "شما" : p!.name}
                        level={me ? undefined : p!.level}
                        size="sm"
                      />
                    ) : (
                      <Box
                        w={36}
                        h={36}
                        style={{ borderRadius: "50%", background: "var(--mantine-color-default-hover)" }}
                      />
                    )}
                    <Text fz={11} c="dimmed" ta="center" truncate w="100%">
                      {me ? "شما" : p?.name ?? "؟"}
                    </Text>
                  </Stack>
                );
              })}
            </SimpleGrid>
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
