"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { useStore } from "@/lib/store";
import MHeader from "@/components/mantine/MHeader";
import MBottomNav from "@/components/mantine/MBottomNav";
import MTrustHighlight from "@/components/mantine/MTrustHighlight";
import { privacyColor } from "@/components/mantine/shared";
// Reuse the existing classic AddRequestSheet overlay as-is (out of scope to rebuild).
import AddRequestSheet from "@/components/AddRequestSheet";
import { PlusIcon } from "@/components/Icons";
import { canView, privacyAudience } from "@/lib/trust";
import { formatPrice, privacyEmoji, privacyLabels } from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";
import type { Request } from "@/lib/types";

function RequestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { requests, getPerson, addRequest, hydrated } = useStore();
  const { show } = useToast();
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (searchParams.get("compose") === "1") {
      setShowAdd(true);
    }
  }, [searchParams]);

  function closeAddSheet() {
    setShowAdd(false);
    if (searchParams.get("compose") === "1") {
      router.replace("/requests");
    }
  }

  const visible = useMemo(
    () => requests.filter((r) => canView(r, getPerson)),
    [requests, getPerson],
  );

  return (
    <Box component="main" pb={96} mih="100dvh">
      <MHeader
        title="درخواست‌ها"
        subtitle="چیزهایی که حلقه‌ی شما دنبالش می‌گردد"
        back
        action={
          <ActionIcon
            color="brand"
            radius="xl"
            size={36}
            onClick={() => setShowAdd(true)}
            aria-label="ثبت درخواست"
          >
            <PlusIcon className="w-5 h-5" />
          </ActionIcon>
        }
      />

      <Box px="md" pt="sm">
        <Card
          radius="lg"
          p="md"
          withBorder
          style={{
            background: "var(--mantine-color-yellow-light)",
            borderColor: "var(--mantine-color-yellow-light-hover)",
          }}
        >
          <Text fw={700} fz="sm" c="yellow.9">
            یک نیاز داری؟ از حلقه بپرس
          </Text>
          <Text fz="xs" c="yellow.8" mt={4} style={{ lineHeight: 1.7 }}>
            به‌جای جستجو بین غریبه‌ها، درخواستت را بین آدم‌های مورد اعتمادت بگذار تا
            خودشان یا آشناهاشان کمکت کنند.
          </Text>
        </Card>
      </Box>

      <Box component="section" px="md" pt="sm">
        {!hydrated ? (
          <Stack gap="sm">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} withBorder radius="lg" p="md" h={140} />
            ))}
          </Stack>
        ) : visible.length === 0 ? (
          <Card withBorder radius="lg" p="xl" ta="center">
            <Text fz={40}>🔎</Text>
            <Text fw={700} fz="md" mt="xs">
              هنوز درخواستی نیست
            </Text>
            <Text fz="sm" c="dimmed" mt={4} style={{ lineHeight: 1.7 }}>
              نیازت را بین حلقه‌ی اعتمادت بگذار تا دیگران یا آشناهایشان کمکت کنند.
            </Text>
            <Button mt="md" onClick={() => setShowAdd(true)}>
              ثبت اولین درخواست
            </Button>
          </Card>
        ) : (
          <Stack gap="sm">
            {visible.map((r) => (
              <MRequestCard key={r.id} request={r} />
            ))}
          </Stack>
        )}
      </Box>

      {showAdd && (
        <AddRequestSheet
          onClose={closeAddSheet}
          onAdd={(input) => {
            addRequest(input);
            closeAddSheet();
            show("درخواست شما ثبت شد ✓");
          }}
        />
      )}

      <MBottomNav />
    </Box>
  );
}

/** Mantine variant of RequestCard. */
function MRequestCard({ request }: { request: Request }) {
  const { getOffers, hasOffered, people } = useStore();
  const circle = people.filter((p) => p.inMyCircle);
  const offers = getOffers(request.id);
  const offered = hasOffered(request.id);

  return (
    <Card withBorder padding="sm" radius="lg">
      <MTrustHighlight
        posterId={request.requesterId}
        trustPath={request.trustPath}
        endorsements={request.endorsements}
        posterRole="درخواست‌دهنده"
        contentKind="request"
        variant="compact"
      />

      <Card.Section
        component={Link}
        href={`/request/${request.id}`}
        inheritPadding
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <Box
            w={64}
            h={64}
            style={{
              borderRadius: 12,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              background:
                "linear-gradient(135deg, var(--mantine-color-yellow-light), var(--mantine-color-default-hover))",
            }}
          >
            {request.image}
          </Box>
          <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
            <Group gap={6}>
              <Badge size="sm" variant="light" color="yellow" radius="sm">
                🔎 درخواست
              </Badge>
              <Badge size="sm" variant="light" color="gray" radius="sm">
                {request.category}
              </Badge>
            </Group>
            <Text fw={600} fz={15} lh={1.3} lineClamp={2}>
              {request.title}
            </Text>
          </Stack>
        </Group>

        <Text fz="sm" c="dimmed" mt="xs" lineClamp={2} style={{ lineHeight: 1.7 }}>
          {request.description}
        </Text>

        <Group
          justify="space-between"
          align="flex-start"
          gap={6}
          mt="sm"
          pt="xs"
          style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
        >
          <Group gap={6} style={{ flex: 1, minWidth: 0 }}>
            <Text fz={11} c="dimmed">
              📍 {request.city}
            </Text>
            <Text fz={11} c="dimmed">·</Text>
            <Text fz={11} c="dimmed">{request.postedAt}</Text>
            <Text fz={11} c="dimmed">·</Text>
            <Text
              fz={11}
              c={privacyColor[request.privacy] + ".7"}
              title={privacyAudience(request.privacy, circle)}
            >
              {privacyEmoji[request.privacy]} {privacyLabels[request.privacy]}
            </Text>
            {offers.length > 0 && (
              <>
                <Text fz={11} c="dimmed">·</Text>
                <Text fz={11} fw={500} c="brand.6">
                  {toPersianDigits(offers.length)} پیشنهاد
                </Text>
              </>
            )}
          </Group>
          {request.budget != null && (
            <Text fz="xs" fw={700} c="brand.7" style={{ flexShrink: 0 }}>
              تا {formatPrice(request.budget)}
            </Text>
          )}
        </Group>

        {offered && (
          <Group gap={4} mt="xs">
            <ThemeIcon size="xs" variant="transparent" color="green">
              ✓
            </ThemeIcon>
            <Text fz={11} fw={500} c="green.7">
              شما پیشنهاد داده‌اید
            </Text>
          </Group>
        )}
      </Card.Section>
    </Card>
  );
}

export default function RequestsMantine() {
  return (
    <Suspense>
      <RequestsContent />
    </Suspense>
  );
}
