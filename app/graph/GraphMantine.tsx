"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Box, Card, Group, SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import { useStore } from "@/lib/store";
import MHeader from "@/components/mantine/MHeader";
import MBottomNav from "@/components/mantine/MBottomNav";
import { lazyUi } from "@/lib/lazy-ui";
import { GraphIcon, ShieldCheckIcon } from "@/components/Icons";
import { toPersianDigits } from "@/lib/persian";
import { buildTrustGraph, graphInsights } from "@/lib/graph";

// Reuse the classic interactive trust-graph visualization as-is — do NOT rebuild.
const TrustGraph = lazyUi(() => import("@/components/TrustGraph"), {
  loading: () => (
    <Box
      w="100%"
      style={{
        aspectRatio: "1",
        maxHeight: 340,
        borderRadius: 12,
        background: "var(--mantine-color-default-hover)",
      }}
      aria-hidden
    />
  ),
});

export default function GraphMantine() {
  const { people, listings, requests, getPerson } = useStore();
  const circleCount = people.filter((p) => p.inMyCircle).length;

  const insights = useMemo(
    () => graphInsights(buildTrustGraph(people, listings, requests, getPerson)),
    [people, listings, requests, getPerson],
  );
  const reach = insights.reach;

  return (
    <Box component="main" pb={96} mih="100dvh">
      <MHeader
        title="گراف اعتماد"
        subtitle={`${toPersianDigits(circleCount)} مستقیم · ${toPersianDigits(reach)} دسترسی`}
        back
      />

      <Box px="md" pt="sm">
        <Card withBorder radius="lg" p={0} style={{ overflow: "hidden" }}>
          <Box p="md">
            <Group gap="sm" wrap="nowrap" mb="sm" align="flex-start">
              <ThemeIcon
                size={36}
                radius="md"
                variant="light"
                color="teal"
              >
                <ShieldCheckIcon className="w-[18px] h-[18px]" />
              </ThemeIcon>
              <Box style={{ minWidth: 0 }}>
                <Text fw={700} fz="sm">
                  حلقه‌ی اعتماد من
                </Text>
                <Text fz={11} c="dimmed" mt={2} style={{ lineHeight: 1.6 }}>
                  هیچ‌کس غریبه نیست — هر نفر از یک مسیر اعتماد به تو می‌رسد.
                </Text>
              </Box>
            </Group>

            <SimpleGrid cols={3} spacing="xs">
              <StatPill
                value={toPersianDigits(reach)}
                label="دسترسی کل"
                color="brand"
              />
              <StatPill
                value={toPersianDigits(insights.levelA)}
                label="نزدیک‌ترین"
                color="green"
              />
              <StatPill
                value={toPersianDigits(circleCount)}
                label="مستقیم"
                color="blue"
              />
            </SimpleGrid>
          </Box>

          {insights.hub && insights.hub.count > 0 && (
            <Box
              component={Link}
              href={`/person/${insights.hub.id}`}
              px="md"
              py="sm"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                textDecoration: "none",
                color: "inherit",
                borderTop: "1px solid var(--mantine-color-default-border)",
              }}
            >
              <ThemeIcon size={36} radius="md" variant="light" color="brand">
                <GraphIcon className="w-5 h-5" />
              </ThemeIcon>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text fw={700} fz="sm">
                  پل اصلی: {insights.hub.name}
                </Text>
                <Text fz={11} c="dimmed" className="nums">
                  {toPersianDigits(insights.hub.count)} مسیر اعتماد از طریق او
                </Text>
              </Box>
              <Text c="brand" fw={700} fz="xs">
                پروفایل ‹
              </Text>
            </Box>
          )}
        </Card>
      </Box>

      <Box px="md" pt="sm">
        <Card withBorder radius="lg" p="sm">
          <Group justify="space-between" mb={6} px={4}>
            <Text fw={700} fz="sm">
              نقشه‌ی شبکه
            </Text>
            <Text fz={11} c="dimmed" className="nums">
              {toPersianDigits(reach + 1)} گره
            </Text>
          </Group>
          <TrustGraph />
        </Card>
      </Box>

      <MBottomNav />
    </Box>
  );
}

function StatPill({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <Stack
      gap={4}
      align="center"
      p={8}
      style={{
        borderRadius: 12,
        background: `var(--mantine-color-${color}-light)`,
      }}
    >
      <Text fz="lg" fw={800} c={color} className="nums" lh={1}>
        {value}
      </Text>
      <Text fz={10} c="dimmed" fw={600}>
        {label}
      </Text>
    </Stack>
  );
}
