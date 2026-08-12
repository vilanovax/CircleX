"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Box, Card, Group, Text, ThemeIcon } from "@mantine/core";
import { useStore } from "@/lib/store";
import MHeader from "@/components/mantine/MHeader";
import MBottomNav from "@/components/mantine/MBottomNav";
import { lazyUi } from "@/lib/lazy-ui";
import { GraphIcon } from "@/components/Icons";
import { toPersianDigits } from "@/lib/persian";
import { buildTrustGraph, graphInsights } from "@/lib/graph";

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

  const insights = useMemo(
    () => graphInsights(buildTrustGraph(people, listings, requests, getPerson)),
    [people, listings, requests, getPerson],
  );

  return (
    <Box component="main" pb={96} mih="100dvh">
      <MHeader
        title="شبکه من"
        subtitle={`${toPersianDigits(insights.reach)} نفر · ${toPersianDigits(insights.direct)} ارتباط مستقیم`}
        back
      />

      <Box px="md" pt="sm">
        {insights.hub && insights.hub.count > 0 && (
          <Card
            component={Link}
            href={`/person/${insights.hub.id}`}
            withBorder
            radius="lg"
            p="sm"
            mb="sm"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon size={32} radius="md" variant="light" color="brand">
                <GraphIcon className="w-4 h-4" />
              </ThemeIcon>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text fw={700} fz={12}>
                  بیشترین ارتباط از طریق {insights.hub.name} است
                </Text>
                <Text fz={11} c="dimmed" className="nums">
                  {insights.hub.name} شما را به{" "}
                  {toPersianDigits(insights.hub.count)} نفر دیگر متصل می‌کند
                </Text>
              </Box>
              <Text c="brand" fw={700} fz={11}>
                پروفایل ‹
              </Text>
            </Group>
          </Card>
        )}

        <Card withBorder radius="lg" p="sm">
          <Group justify="space-between" mb={6} px={4}>
            <Text fw={700} fz="sm">
              نقشه ارتباطات
            </Text>
            <Text fz={11} c="dimmed">
              نزدیک‌تر به مرکز = مستقیم‌تر
            </Text>
          </Group>
          <TrustGraph />
        </Card>
      </Box>

      <MBottomNav />
    </Box>
  );
}
