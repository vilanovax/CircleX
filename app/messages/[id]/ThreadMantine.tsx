"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
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
import { relationLabels, levelShort, formatPrice } from "@/lib/labels";
import { canDirectMessage } from "@/lib/messaging";

export default function ThreadMantine({ params }: { params: { id: string } }) {
  const peerId = String(params.id);
  const { getPerson, getThread, addMessage, markThreadRead } = useStore();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const peer = getPerson(peerId);
  const thread = getThread(peerId);

  // Mark incoming messages as read when the thread is opened.
  useEffect(() => {
    markThreadRead(peerId);
  }, [peerId, markThreadRead]);

  // Keep the latest message in view.
  useEffect(() => {
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
      <Box component="main" mih="100dvh">
        <MHeader back title="پیام" />
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
    <Box component="main" style={{ display: "flex", flexDirection: "column", height: "100dvh" }}>
      {/* Conversation header */}
      <MHeader back fallbackHref="/messages">
        <UnstyledButton
          component={Link}
          href={`/person/${peerId}`}
          style={{ display: "block", minWidth: 0 }}
        >
          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
            <MAvatar name={peer.name} level={peer.level} size="sm" />
            <Box style={{ minWidth: 0 }}>
              <Text fw={700} lh={1.2} truncate>
                {peer.name}
              </Text>
              <Text fz={11} c="dimmed">
                {relationLabels[peer.relation]} · {levelShort[peer.level]}
              </Text>
            </Box>
          </Group>
        </UnstyledButton>
      </MHeader>

      {/* Messages */}
      <Box
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 12px",
          background: "var(--mantine-color-default-hover)",
        }}
      >
        {thread.length === 0 ? (
          <Stack align="center" gap={6} pt={64} px="lg" ta="center">
            <MAvatar name={peer.name} level={peer.level} size="lg" />
            <Text fw={600} mt="sm">
              گفتگو با {peer.name}
            </Text>
            <Text fz="sm" c="dimmed" style={{ lineHeight: 1.7 }}>
              اولین پیام را بفرست — در حلقه‌ی اعتمادت امن است.
            </Text>
          </Stack>
        ) : (
          <Stack gap="sm">
            {thread.map((msg) => (
              <Group
                key={msg.id}
                gap="xs"
                align="flex-end"
                wrap="nowrap"
                justify={msg.fromMe ? "flex-end" : "flex-start"}
              >
                {!msg.fromMe && <MAvatar name={peer.name} level={peer.level} size="sm" />}
                <Paper
                  radius="lg"
                  px={14}
                  py={10}
                  style={{
                    maxWidth: "76%",
                    background: msg.fromMe
                      ? "var(--mantine-color-brand-6)"
                      : "var(--mantine-color-body)",
                    color: msg.fromMe ? "#fff" : undefined,
                    border: msg.fromMe ? "none" : "1px solid var(--mantine-color-default-border)",
                    borderBottomRightRadius: msg.fromMe ? undefined : 6,
                    borderBottomLeftRadius: msg.fromMe ? 6 : undefined,
                  }}
                >
                  {msg.listingId ? (
                    <>
                      <Text fz={11} fw={500} mb={6} style={{ opacity: 0.8 }}>
                        {msg.fromMe ? "آگهی‌ای که فرستادی:" : "آگهی معرفی‌شده:"}
                      </Text>
                      <ReferralCard listingId={msg.listingId} fromMe={msg.fromMe} />
                      {msg.text.trim() && (
                        <Text fz={13} mt="xs" style={{ whiteSpace: "pre-line", opacity: 0.9 }}>
                          {msg.text}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text fz="sm" style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>
                      {msg.text}
                    </Text>
                  )}
                  <Text
                    fz={10}
                    mt={6}
                    c={msg.fromMe ? undefined : "dimmed"}
                    style={{
                      display: "block",
                      color: msg.fromMe ? "rgba(255,255,255,0.85)" : undefined,
                    }}
                  >
                    {msg.postedAt}
                  </Text>
                </Paper>
              </Group>
            ))}
          </Stack>
        )}
        <div ref={bottomRef} />
      </Box>

      {/* Composer */}
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
            radius="lg"
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

/** Compact listing preview attached to a referral message. */
function ReferralCard({ listingId, fromMe }: { listingId: string; fromMe?: boolean }) {
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
        background: fromMe ? "rgba(255,255,255,0.15)" : "var(--mantine-color-default-hover)",
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
            style={{ color: fromMe ? "var(--mantine-color-brand-1)" : "var(--mantine-color-brand-7)" }}
          >
            {listing.price != null
              ? formatPrice(listing.price)
              : listing.type === "service"
                ? "توافقی"
                : "رایگان"}
          </Text>
        </Box>
        <Text fz="lg" style={{ color: fromMe ? "rgba(255,255,255,0.6)" : "var(--mantine-color-dimmed)" }}>
          ‹
        </Text>
      </Group>
    </UnstyledButton>
  );
}

function SendIcon({ className }: { className?: string }) {
  // Arrow pointing right→ flipped for RTL send direction (points left).
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 4 3 11l6 2 2 6 9-15Z" />
      <path d="M9 13l4-4" />
    </svg>
  );
}
