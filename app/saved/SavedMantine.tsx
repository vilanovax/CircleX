"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Card, Group, Loader, Stack, Text } from "@mantine/core";
import MHeader from "@/components/mantine/MHeader";

/** Mantine variant — نشان‌شده‌ها فقط در پروفایل نمایش داده می‌شود. */
export default function SavedMantine() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile#saved");
  }, [router]);

  return (
    <Box component="main" pb={96} mih="100dvh">
      <MHeader title="نشان‌شده‌ها" />
      <Box px="md" pt="md">
        <Card withBorder radius="lg" p="lg">
          <Group gap="sm" wrap="nowrap" justify="center">
            <Loader size="sm" color="brand" />
            <Stack gap={2}>
              <Text fw={600} fz="sm">
                در حال انتقال به پروفایل…
              </Text>
              <Text fz="xs" c="dimmed">
                نشان‌شده‌ها در پروفایل شما نمایش داده می‌شود.
              </Text>
            </Stack>
          </Group>
        </Card>
      </Box>
    </Box>
  );
}
