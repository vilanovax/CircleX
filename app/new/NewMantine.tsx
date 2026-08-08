"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Card, Group, Stack, Text } from "@mantine/core";
import { useStore } from "@/lib/store";
import ListingComposeForm from "@/components/ListingComposeForm";
import { useToast } from "@/components/Toast";
import MHeader from "@/components/mantine/MHeader";

/** Mantine variant — full-page route for deep links; primary flow is + → CreateSheet. */
export default function NewMantine() {
  const router = useRouter();
  const { addListing } = useStore();
  const { show } = useToast();

  return (
    <Box component="main" pb={112} mih="100dvh">
      <MHeader title="ثبت آگهی جدید" back />

      <Stack gap="lg" px="md" pt="md">
        <Card
          component={Link}
          href="/requests?compose=1"
          withBorder
          radius="lg"
          p="sm"
          style={{
            textDecoration: "none",
            color: "inherit",
            borderColor: "var(--mantine-color-yellow-3)",
            background: "var(--mantine-color-yellow-light)",
          }}
        >
          <Group gap="xs" wrap="nowrap">
            <Text fz="md">🔎</Text>
            <Text fz="xs" c="yellow.9" style={{ lineHeight: 1.7, flex: 1 }}>
              دنبال چیزی می‌گردی (مثل «کلاس نقاشی کودک»)؟ به‌جای آگهی، اینجا{" "}
              <Text span fw={700}>
                درخواست
              </Text>{" "}
              ثبت کن.
            </Text>
            <Text c="yellow.5" fz="lg">
              ‹
            </Text>
          </Group>
        </Card>

        <ListingComposeForm
          submitLabel="انتشار آگهی در حلقه"
          onSubmit={(input) => {
            const id = addListing(input);
            show("آگهی شما در حلقه منتشر شد ✓");
            router.push(`/listing/${id}`);
          }}
        />
      </Stack>
    </Box>
  );
}
