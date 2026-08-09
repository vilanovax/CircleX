"use client";

import { useMemo } from "react";
import { Box, Card, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { useStore } from "@/lib/store";
import MHeader from "@/components/mantine/MHeader";
import MBottomNav from "@/components/mantine/MBottomNav";
import { lazyUi } from "@/lib/lazy-ui";
import { toPersianDigits } from "@/lib/persian";
import { buildTrustGraph, graphInsights } from "@/lib/graph";

// Reuse the classic interactive trust-graph visualization as-is — do NOT rebuild.
const TrustGraph = lazyUi(() => import("@/components/TrustGraph"));

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
      <MHeader title="گراف اعتماد" subtitle="نقشه‌ی شبکه‌ی شما" back />

      {/* Intro hero */}
      <Box px="md" pt="md">
        <Card
          withBorder
          radius="lg"
          p="md"
          style={{
            background:
              "linear-gradient(270deg, var(--mantine-color-brand-7), var(--mantine-color-brand-5))",
            color: "white",
          }}
        >
          <Text fw={800}>حلقه‌ی اعتماد من</Text>
          <Text fz="xs" mt={4} style={{ lineHeight: 1.7, color: "white" }}>
            <Text span className="nums">
              {toPersianDigits(circleCount)}
            </Text>{" "}
            نفر مستقیم، و دسترسی به{" "}
            <Text span className="nums">
              {toPersianDigits(reach)}
            </Text>{" "}
            نفر از طریق مسیرهای اعتماد. هیچ‌کس غریبه نیست.
          </Text>
        </Card>
      </Box>

      {/* Reused classic interactive visualization, wrapped in a Mantine card. */}
      <Box px="sm" pt="md">
        <Card withBorder radius="lg" p="sm">
          <TrustGraph />
        </Card>
      </Box>

      {/* Insights */}
      <Box px="md" pt="sm">
        <SimpleGrid cols={3} spacing="xs">
          <StatCard value={toPersianDigits(reach)} label="دسترسی کل" color="brand.7" />
          <StatCard
            value={toPersianDigits(insights.levelA)}
            label="نزدیک‌ترین (A)"
            color="green.7"
          />
          <StatCard
            value={insights.hub ? insights.hub.name : "—"}
            label="پل اصلی اعتماد"
            color="brand.7"
            truncate
          />
        </SimpleGrid>
        {insights.hub && insights.hub.count > 0 && (
          <Text fz={11} c="dimmed" mt="xs" ta="center" style={{ lineHeight: 1.7 }}>
            بیشترین مسیرهای اعتماد از طریق{" "}
            <Text span fw={700} c="dimmed">
              {insights.hub.name}
            </Text>{" "}
            به شما می‌رسد.
          </Text>
        )}
      </Box>

      {/* Legend */}
      <Group justify="center" gap="md" px="md" pt="sm">
        <LegendDot color="#16a34a" label="سطح A" />
        <LegendDot color="#2563eb" label="سطح B" />
        <LegendDot color="#d97706" label="سطح C" />
      </Group>

      <MBottomNav />
    </Box>
  );
}

function StatCard({
  value,
  label,
  color,
  truncate,
}: {
  value: string;
  label: string;
  color: string;
  truncate?: boolean;
}) {
  return (
    <Card withBorder radius="lg" p="sm" ta="center">
      <Text fz="lg" fw={800} c={color} className={truncate ? undefined : "nums"} truncate={truncate}>
        {value}
      </Text>
      <Text fz={11} c="dimmed" mt={2}>
        {label}
      </Text>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <Group gap={6} wrap="nowrap">
      <Box w={12} h={12} style={{ borderRadius: "50%", background: color }} />
      <Text fz="xs" c="dimmed">
        {label}
      </Text>
    </Group>
  );
}
