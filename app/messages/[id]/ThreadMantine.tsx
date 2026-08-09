"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
  UnstyledButton,
} from "@mantine/core";
import { useStore } from "@/lib/store";
import MHeader from "@/components/mantine/MHeader";
import MAvatar from "@/components/mantine/MAvatar";
import MListingImage from "@/components/mantine/MListingImage";
import LockedMessaging from "@/components/LockedMessaging";
import { SendIcon, ShieldCheckIcon } from "@/components/Icons";
import { relationLabels, levelShort, formatPrice } from "@/lib/labels";
import { canDirectMessage } from "@/lib/messaging";
import type { Message } from "@/lib/types";

export default function ThreadMantine({ params }: { params: { id: string } }) {
  const peerId = String(params.id);
  const { getPerson, getThread, addMessage, markThreadRead } = useStore();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const peer = getPerson(peerId);
  const thread = getThread(peerId);

  useEffect(() => {
    markThreadRead(peerId);
  }, [peerId, markThreadRead]);

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length]);

  if (!peer) {
    return (
      <Box
        component="main"
        mih="100dvh"
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Text fz="sm" c="dimmed">
          کاربر پیدا نشد.
        </Text>
      </Box>
    );
  }

  if (!canDirectMessage(peer, thread.length > 0)) {
    return (
      <Box component="main" mih="100dvh" pb="xl">
        <MHeader
          back
          title={peer.name}
          subtitle="پیام قفل است"
          fallbackHref="/messages"
        />
        <LockedMessaging peer={peer} />
      </Box>
    );
  }

  function send() {
    const t = text.trim();
    if (!t) return;
    addMessage(peerId, t);
    setText("");
  }

  return (
    <Box
      component="main"
      style={{ display: "flex", flexDirection: "column", height: "100dvh" }}
    >
      <MHeader back fallbackHref="/messages">
        <UnstyledButton
          component={Link}
          href={`/person/${peerId}`}
          style={{ display: "block", minWidth: 0 }}
        >
          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
            <MAvatar name={peer.name} level={peer.level} size="sm" />
            <Box style={{ minWidth: 0 }}>
              <Text fw={800} fz="sm" lh={1.2} truncate>
                {peer.name}
              </Text>
              <Group gap={6} wrap="nowrap" mt={2}>
                <Text fz={11} c="dimmed" truncate>
                  {relationLabels[peer.relation]}
                </Text>
                <Badge size="xs" variant="light" color="brand">
                  {levelShort[peer.level]}
                </Badge>
              </Group>
            </Box>
          </Group>
        </UnstyledButton>
      </MHeader>

      <Box
        py={6}
        px="sm"
        style={{
          background: "var(--mantine-color-teal-0)",
          borderBottom: "1px solid var(--mantine-color-teal-2)",
        }}
      >
        <Group gap={6} justify="center" wrap="nowrap">
          <Box c="teal.7" style={{ display: "flex" }}>
            <ShieldCheckIcon className="w-3.5 h-3.5" />
          </Box>
          <Text fz={11} fw={500} c="teal.7">
            گفتگوی امن داخل حلقه
          </Text>
        </Group>
      </Box>

      <Box
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px",
          background: "var(--mantine-color-default-hover)",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      >
        {thread.length === 0 ? (
          <Stack align="center" gap={6} pt={64} px="lg" ta="center">
            <MAvatar name={peer.name} level={peer.level} size="lg" />
            <Text fw={700} mt="sm">
              گفتگو با {peer.name}
            </Text>
            <Text fz="sm" c="dimmed" style={{ lineHeight: 1.7, maxWidth: 280 }}>
              اولین پیام را بفرست — فقط افراد حلقه‌ات اینجا هستند.
            </Text>
          </Stack>
        ) : (
          <Stack gap={4}>
            {thread.map((msg, i) => {
              const prev = thread[i - 1];
              const next = thread[i + 1];
              const showDay =
                !prev || dayKey(prev.postedAt) !== dayKey(msg.postedAt);
              const samePrev = Boolean(prev && prev.fromMe === msg.fromMe);
              const sameNext = Boolean(next && next.fromMe === msg.fromMe);
              const showAvatar = !msg.fromMe && !sameNext;
              const showTime = !sameNext && isClockStamp(msg.postedAt);

              return (
                <Box key={msg.id} mt={samePrev && !showDay ? 2 : 10}>
                  {showDay && <DayDivider label={dayKey(msg.postedAt)} />}
                  <Group
                    gap="xs"
                    align="flex-end"
                    wrap="nowrap"
                    justify={msg.fromMe ? "flex-end" : "flex-start"}
                  >
                    {!msg.fromMe && (
                      <Box w={32} style={{ flexShrink: 0 }}>
                        {showAvatar ? (
                          <MAvatar name={peer.name} level={peer.level} size="sm" />
                        ) : null}
                      </Box>
                    )}
                    <Bubble
                      msg={msg}
                      clusteredTop={samePrev && !showDay}
                      clusteredBottom={sameNext}
                      showTime={showTime}
                    />
                  </Group>
                </Box>
              );
            })}
          </Stack>
        )}
        <div ref={bottomRef} />
      </Box>

      <Box
        style={{
          flexShrink: 0,
          background: "var(--mantine-color-body)",
          borderTop: "1px solid var(--mantine-color-default-border)",
          padding: 10,
          paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))",
        }}
      >
        <Group gap="xs" align="flex-end" wrap="nowrap">
          <Textarea
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            autosize
            minRows={1}
            maxRows={4}
            placeholder="پیام بنویس…"
            radius="xl"
            style={{ flex: 1 }}
          />
          <ActionIcon
            onClick={send}
            disabled={!text.trim()}
            color="brand"
            variant="filled"
            radius="xl"
            size={44}
            aria-label="ارسال"
          >
            <SendIcon className="w-5 h-5" />
          </ActionIcon>
        </Group>
      </Box>
    </Box>
  );
}

function dayKey(postedAt: string): string {
  return postedAt.trim() || "—";
}

function isClockStamp(postedAt: string): boolean {
  return /[:：]/.test(postedAt) || postedAt.includes("همین");
}

function DayDivider({ label }: { label: string }) {
  return (
    <Group justify="center" my="sm">
      <Badge variant="default" radius="xl" size="sm">
        {label}
      </Badge>
    </Group>
  );
}

function Bubble({
  msg,
  clusteredTop,
  clusteredBottom,
  showTime,
}: {
  msg: Message;
  clusteredTop: boolean;
  clusteredBottom: boolean;
  showTime: boolean;
}) {
  return (
    <Paper
      px={14}
      py={10}
      style={{
        maxWidth: "78%",
        background: msg.fromMe
          ? "var(--mantine-color-brand-6)"
          : "var(--mantine-color-body)",
        color: msg.fromMe ? "#fff" : undefined,
        border: msg.fromMe ? "none" : "1px solid var(--mantine-color-default-border)",
        borderRadius: 16,
        borderBottomRightRadius: msg.fromMe
          ? 16
          : clusteredTop
            ? 6
            : 16,
        borderTopRightRadius: msg.fromMe
          ? 16
          : clusteredBottom
            ? 6
            : 16,
        borderBottomLeftRadius: msg.fromMe
          ? clusteredTop
            ? 6
            : 16
          : 16,
        borderTopLeftRadius: msg.fromMe
          ? clusteredBottom
            ? 6
            : 16
          : 16,
      }}
    >
      {msg.listingId ? (
        <>
          <Text fz={11} fw={500} mb={6} style={{ opacity: 0.8 }}>
            {msg.fromMe ? "آگهی‌ای که فرستادی:" : "آگهی معرفی‌شده:"}
          </Text>
          <ReferralCard listingId={msg.listingId} fromMe={msg.fromMe} />
          {msg.text.trim() && (
            <Text fz={13} mt="xs" style={{ whiteSpace: "pre-line", opacity: 0.95 }}>
              {msg.text}
            </Text>
          )}
        </>
      ) : (
        <Text fz="sm" style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>
          {msg.text}
        </Text>
      )}
      {showTime && (
        <Text
          fz={10}
          mt={6}
          c={msg.fromMe ? undefined : "dimmed"}
          style={{
            display: "block",
            color: msg.fromMe ? "rgba(255,255,255,0.75)" : undefined,
          }}
        >
          {msg.postedAt}
        </Text>
      )}
    </Paper>
  );
}

function ReferralCard({
  listingId,
  fromMe,
}: {
  listingId: string;
  fromMe?: boolean;
}) {
  const { getListing } = useStore();
  const listing = getListing(listingId);
  if (!listing) return null;
  return (
    <UnstyledButton
      component={Link}
      href={`/listing/${listing.id}`}
      style={{
        display: "block",
        borderRadius: 12,
        padding: 10,
        border: fromMe
          ? "1px solid rgba(255,255,255,0.25)"
          : "1px solid var(--mantine-color-default-border)",
        background: fromMe
          ? "rgba(255,255,255,0.15)"
          : "var(--mantine-color-default-hover)",
      }}
    >
      <Group gap="xs" wrap="nowrap">
        <MListingImage image={listing.image} alt={listing.title} size="lg" />
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text
            fz={13}
            fw={600}
            truncate
            style={{ color: fromMe ? "#fff" : undefined }}
          >
            {listing.title}
          </Text>
          <Text
            fz={11}
            fw={700}
            style={{
              color: fromMe
                ? "var(--mantine-color-brand-1)"
                : "var(--mantine-color-brand-7)",
            }}
          >
            {listing.price != null
              ? formatPrice(listing.price)
              : listing.type === "service"
                ? "توافقی"
                : "رایگان"}
          </Text>
        </Box>
        <Text
          fz="lg"
          style={{
            color: fromMe
              ? "rgba(255,255,255,0.6)"
              : "var(--mantine-color-dimmed)",
          }}
        >
          ‹
        </Text>
      </Group>
    </UnstyledButton>
  );
}
