"use client";

import Link from "next/link";
import { Badge, Group, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
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
import MAvatar from "./MAvatar";

/** Mantine variant of TrustHighlight — the trust signal shown on cards. */
export default function MTrustHighlight({
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
  const trust = trustHighlightMessage(
    posterId,
    trustPath,
    getPerson,
    posterRole,
    contentKind,
  );
  if (!trust) return null;
  const poster = getPerson(posterId);
  if (!poster) return null;

  const endorsementLine = endorsementHighlightLine(
    endorsements,
    getPerson,
    contentKind,
  );
  const isOwn = posterId === "me";
  const relation = posterCardRelation(poster, { isOwn, contentKind });

  if (variant === "compact") {
    const identity = (
      <Group gap="xs" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
        <MAvatar name={poster.name} level={isOwn ? undefined : poster.level} size="sm" />
        <div style={{ minWidth: 0 }}>
          <Text fz="sm" fw={600} truncate>
            {poster.name}
          </Text>
          <Text fz={11} c={isOwn ? "dimmed" : "brand.7"} truncate>
            {relation}
          </Text>
        </div>
      </Group>
    );

    return (
      <Stack
        gap={4}
        pb="xs"
        mb="xs"
        style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
      >
        <Group gap="xs" wrap="nowrap">
          {isOwn ? (
            identity
          ) : (
            <Link href={`/person/${posterId}`} style={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}>
              {identity}
            </Link>
          )}
          {!isOwn && poster.level && (
            <Badge size="xs" variant="light" color="gray">
              {levelShort[poster.level]}
            </Badge>
          )}
          <ThemeIcon size="sm" variant="transparent" color="brand">
            <ShieldCheckIcon className="w-4 h-4" />
          </ThemeIcon>
        </Group>
        {endorsementLine && !isOwn && (
          <Text fz={11} fw={500} c="green.7">
            ✓ {endorsementLine}
          </Text>
        )}
      </Stack>
    );
  }

  return (
    <Paper
      withBorder
      p="sm"
      mb="xs"
      radius="md"
      bg={isOwn ? "var(--mantine-color-default-hover)" : "var(--mantine-color-brand-light)"}
    >
      <Group align="flex-start" gap="sm" wrap="nowrap">
        <ThemeIcon
          size={36}
          radius="xl"
          variant="light"
          color={isOwn ? "gray" : "brand"}
        >
          <ShieldCheckIcon className="w-5 h-5" />
        </ThemeIcon>
        <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
          <Text fz="sm" fw={700} lh={1.3} c={isOwn ? undefined : "brand.9"}>
            {trust.headline}
          </Text>
          {trust.subline && (
            <Text fz="xs" fw={600} c={isOwn ? "dimmed" : "brand.7"}>
              {trust.subline}
            </Text>
          )}
          {endorsementLine && !isOwn && (
            <Text fz={11} fw={500} c="green.7">
              ✓ {endorsementLine}
            </Text>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}
