"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Indicator,
  Modal,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import { useStore } from "@/lib/store";
import MHeader from "@/components/mantine/MHeader";
import MBottomNav from "@/components/mantine/MBottomNav";
import MAvatar from "@/components/mantine/MAvatar";
import { ChatIcon, PencilIcon, ShieldCheckIcon } from "@/components/Icons";
import { relationEmoji, relationLabels } from "@/lib/labels";
import { threadPreview } from "@/lib/message-preview";
import { toPersianDigits } from "@/lib/persian";
import type { Message, Person } from "@/lib/types";

export default function MessagesMantine() {
  const { getPerson, getThread, getListing, threadPeers, unreadCount, totalUnread, hydrated } =
    useStore();
  const peers = threadPeers();
  const unreadTotal = totalUnread();
  const [showCompose, setShowCompose] = useState(false);

  const subtitle = useMemo(() => {
    if (!hydrated || peers.length === 0) return undefined;
    if (unreadTotal > 0) {
      return `${toPersianDigits(unreadTotal)} پیام خوانده‌نشده`;
    }
    return `${toPersianDigits(peers.length)} گفتگو`;
  }, [hydrated, peers.length, unreadTotal]);

  return (
    <Box component="main" pb={96} mih="100dvh">
      <MHeader
        title="پیام‌ها"
        subtitle={subtitle}
        action={
          <Button
            variant="filled"
            color="brand"
            radius="xl"
            w={36}
            h={36}
            p={0}
            onClick={() => setShowCompose(true)}
            aria-label="گفتگوی جدید"
          >
            <PencilIcon className="w-5 h-5" />
          </Button>
        }
      />

      <Stack px="md" pt="sm" gap="sm">
        {hydrated && peers.length > 0 && (
          <Group
            gap="xs"
            wrap="nowrap"
            p="xs"
            style={{
              borderRadius: 12,
              background: "var(--mantine-color-brand-light)",
              border: "1px solid var(--mantine-color-brand-light-hover)",
            }}
          >
            <ThemeIcon size="sm" variant="transparent" color="brand">
              <ShieldCheckIcon className="w-4 h-4" />
            </ThemeIcon>
            <Text fz={11} c="brand.8" style={{ lineHeight: 1.6 }}>
              فقط با افراد حلقه‌ات — بدون پیام از غریبه‌ها
            </Text>
          </Group>
        )}

        {!hydrated ? (
          <Stack gap="xs">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} withBorder radius="lg" p="sm">
                <Group gap="sm" wrap="nowrap">
                  <Box w={48} h={48} style={{ borderRadius: "9999px", background: "var(--mantine-color-default-hover)" }} />
                  <Stack gap={6} style={{ flex: 1 }}>
                    <Box w="60%" h={12} style={{ borderRadius: 6, background: "var(--mantine-color-default-hover)" }} />
                    <Box w="85%" h={10} style={{ borderRadius: 6, background: "var(--mantine-color-default-hover)" }} />
                  </Stack>
                </Group>
              </Card>
            ))}
          </Stack>
        ) : peers.length === 0 ? (
          <EmptyState onStart={() => setShowCompose(true)} />
        ) : (
          <Card withBorder radius="lg" p={0} style={{ overflow: "hidden" }}>
            <Stack gap={0}>
              {peers.map((peerId, idx) => {
                const p = getPerson(peerId);
                if (!p) return null;
                const thread = getThread(peerId);
                const last = thread[thread.length - 1];
                const unread = unreadCount(peerId);
                return (
                  <Box key={peerId}>
                    {idx > 0 && (
                      <Box style={{ borderTop: "1px solid var(--mantine-color-default-border)" }} />
                    )}
                    <ThreadRow
                      peer={p}
                      peerId={peerId}
                      last={last}
                      unread={unread}
                      preview={threadPreview(last, getListing)}
                    />
                  </Box>
                );
              })}
            </Stack>
          </Card>
        )}
      </Stack>

      <ComposeModal opened={showCompose} onClose={() => setShowCompose(false)} />
      <MBottomNav />
    </Box>
  );
}

function ThreadRow({
  peer,
  peerId,
  last,
  unread,
  preview,
}: {
  peer: Person;
  peerId: string;
  last: Message | undefined;
  unread: number;
  preview: string;
}) {
  const hasUnread = unread > 0;

  return (
    <UnstyledButton
      component={Link}
      href={`/messages/${peerId}`}
      style={{
        display: "block",
        padding: "14px 12px",
        background: hasUnread ? "var(--mantine-color-brand-light)" : undefined,
      }}
    >
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <Indicator disabled={!hasUnread} color="brand" size={12} offset={4} withBorder>
          <MAvatar name={peer.name} level={peer.level} size="md" />
        </Indicator>

        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" gap="xs" wrap="nowrap" mb={4}>
            <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
              <Text fz="sm" fw={hasUnread ? 700 : 600} truncate>
                {peer.name}
              </Text>
              <Badge size="xs" variant="default" radius="sm" style={{ flexShrink: 0 }}>
                {relationEmoji[peer.relation]} {relationLabels[peer.relation]}
              </Badge>
            </Group>
            <Text
              fz={11}
              fw={hasUnread ? 600 : 400}
              c={hasUnread ? "brand.6" : "dimmed"}
              style={{ flexShrink: 0 }}
            >
              {last?.postedAt}
            </Text>
          </Group>

          <Group gap="xs" wrap="nowrap">
            <Text
              fz={13}
              c={hasUnread ? undefined : "dimmed"}
              fw={hasUnread ? 500 : 400}
              truncate
              style={{ flex: 1, lineHeight: 1.4 }}
            >
              {preview}
            </Text>
            {hasUnread ? (
              <Badge size="sm" circle variant="filled" color="brand" style={{ flexShrink: 0 }}>
                {toPersianDigits(unread)}
              </Badge>
            ) : (
              <Text c="dimmed" fz="sm" aria-hidden style={{ flexShrink: 0 }}>
                ‹
              </Text>
            )}
          </Group>
        </Box>
      </Group>
    </UnstyledButton>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <Card withBorder radius="lg" p="lg" ta="center" mt="md">
      <ThemeIcon size={56} radius="xl" variant="light" color="brand" mx="auto" mb="sm">
        <ChatIcon className="w-7 h-7" />
      </ThemeIcon>
      <Text fw={700}>هنوز گفتگویی نداری</Text>
      <Text fz="sm" c="dimmed" mt={6} style={{ lineHeight: 1.7, maxWidth: 320, marginInline: "auto" }}>
        از یک آگهی یا پروفایل پیام بده، یا همین‌جا با کسی از حلقه‌ات گفتگو را شروع کن.
      </Text>
      <Button onClick={onStart} mt="md">
        شروع گفتگو
      </Button>
      <Anchor component={Link} href="/circle" display="block" fz="xs" fw={500} mt="sm" c="brand">
        یا اول حلقه‌ات را بساز ›
      </Anchor>
    </Card>
  );
}

function ComposeModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const router = useRouter();
  const { people } = useStore();
  const circle = people.filter((p) => p.inMyCircle);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="گفتگوی جدید"
      centered
      radius="lg"
      styles={{ title: { fontWeight: 700, fontSize: 18 } }}
    >
      <Text fz="xs" c="dimmed" mb="sm">
        با چه کسی از حلقه‌ات گفتگو می‌کنی؟
      </Text>
      {circle.length === 0 ? (
        <Stack gap="md" align="center" py="md">
          <Text fz="sm" c="dimmed">
            هنوز کسی در حلقه‌ی شما نیست.
          </Text>
          <Button component={Link} href="/circle" size="sm">
            ساخت حلقه‌ی اعتماد
          </Button>
        </Stack>
      ) : (
        <Stack gap={4}>
          {circle.map((p) => (
            <UnstyledButton
              key={p.id}
              onClick={() => {
                onClose();
                router.push(`/messages/${p.id}`);
              }}
              style={{ padding: 12, borderRadius: 12 }}
            >
              <Group gap="sm" wrap="nowrap">
                <MAvatar name={p.name} level={p.level} size="sm" />
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text fz="sm" fw={600} truncate>
                    {p.name}
                  </Text>
                  <Text fz={11} c="dimmed">
                    {relationEmoji[p.relation]} {relationLabels[p.relation]}
                  </Text>
                </Box>
                <ThemeIcon variant="transparent" color="brand">
                  <ChatIcon className="w-5 h-5" />
                </ThemeIcon>
              </Group>
            </UnstyledButton>
          ))}
        </Stack>
      )}
      <Button variant="default" fullWidth mt="md" onClick={onClose}>
        انصراف
      </Button>
    </Modal>
  );
}
