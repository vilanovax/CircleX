"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { useStore } from "@/lib/store";
import MHeader from "@/components/mantine/MHeader";
import MListingImage from "@/components/mantine/MListingImage";
import MAvatar from "@/components/mantine/MAvatar";
import { listingTypeColor } from "@/components/mantine/shared";
// Out-of-scope interactive overlays reused as-is from the classic design.
import ReferSheet from "@/components/ReferSheet";
import TrustPath from "@/components/TrustPath";
import { EndorsementList } from "@/components/Endorsements";
import LockedAccess from "@/components/LockedAccess";
import { ChatIcon, HeartIcon, ShieldCheckIcon } from "@/components/Icons";
import {
  badgeEmoji,
  badgeLabels,
  formatPrice,
  listingTypeEmoji,
  listingTypeLabels,
  privacyEmoji,
  privacyLabels,
  relationLabels,
} from "@/lib/labels";
import type { BadgeType } from "@/lib/types";
import { toPersianDigits } from "@/lib/persian";
import { canView } from "@/lib/trust";
import { useToast } from "@/components/Toast";

const ALL_BADGES: BadgeType[] = [
  "verify_item",
  "know_seller",
  "verify_quality",
  "dealt_before",
];

export default function ListingMantine({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = String(params.id);
  const { getListing, getPerson, toggleEndorsement, toggleSaved, isSaved } =
    useStore();
  const { show } = useToast();
  const [showRefer, setShowRefer] = useState(false);
  const saved = isSaved(id);

  const listing = getListing(id);
  if (!listing) {
    return (
      <Box component="main" mih="100dvh">
        <MHeader title="آگهی" back />
        <Text ta="center" c="dimmed" py={80} fz="sm">
          آگهی پیدا نشد.
        </Text>
      </Box>
    );
  }

  const seller = getPerson(listing.sellerId);
  const isMine = listing.sellerId === "me";

  if (!isMine && !canView(listing, getPerson)) {
    return (
      <Box component="main" mih="100dvh">
        <MHeader title="جزئیات آگهی" back />
        <LockedAccess
          itemTitle={listing.title}
          itemKind="listing"
          privacy={listing.privacy}
        />
      </Box>
    );
  }

  return (
    <Box component="main" pb={!isMine ? 96 : 32} mih="100dvh">
      <MHeader
        title="جزئیات آگهی"
        back
        action={
          <ActionIcon
            variant="subtle"
            color={saved ? "pink" : "gray"}
            size="lg"
            onClick={() => {
              toggleSaved(id);
              show(
                saved
                  ? "از نشان‌شده‌های پروفایل حذف شد"
                  : "در پروفایل ذخیره شد ✓",
              );
            }}
            aria-label={saved ? "حذف از نشان‌شده‌ها" : "نشان کردن"}
            aria-pressed={saved}
          >
            <HeartIcon className="w-6 h-6" filled={saved} />
          </ActionIcon>
        }
      />

      <Box px="md" pt="md">
        <MListingImage image={listing.image} alt={listing.title} size="hero" />
      </Box>

      <Stack gap={0} px="md" pt="md">
        <Group gap="xs" mb={8}>
          <Badge variant="light" color={listingTypeColor[listing.type]} radius="sm">
            {listingTypeEmoji[listing.type]} {listingTypeLabels[listing.type]}
          </Badge>
          <Badge variant="light" color="gray" radius="sm">
            {listing.category}
          </Badge>
          {listing.condition && (
            <Badge variant="light" color="gray" radius="sm">
              {listing.condition}
            </Badge>
          )}
        </Group>

        <Text component="h1" fz="xl" fw={700} lh={1.3}>
          {listing.title}
        </Text>

        <Box mt={8}>
          {listing.price != null ? (
            <Text fz={26} fw={800} c="brand.7">
              {formatPrice(listing.price)}
            </Text>
          ) : (
            <Text fz="xl" fw={700} c="green.7">
              {listing.type === "service" ? "توافقی" : "رایگان"}
            </Text>
          )}
        </Box>

        <Text fz="sm" c="dimmed" mt={12} style={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>
          {listing.description}
        </Text>

        <Group gap={8} mt={12} c="dimmed">
          <Text fz="xs" c="dimmed">📍 {listing.city}</Text>
          <Text fz="xs" c="dimmed">·</Text>
          <Text fz="xs" c="dimmed">{listing.postedAt}</Text>
          <Text fz="xs" c="dimmed">·</Text>
          <Text fz="xs" c="dimmed" title={privacyLabels[listing.privacy]}>
            {privacyEmoji[listing.privacy]} {privacyLabels[listing.privacy]}
          </Text>
        </Group>
      </Stack>

      {/* Trust path */}
      <Box px="md" pt="lg">
        <Card withBorder radius="lg" p="md">
          <Group gap="xs" mb="sm">
            <ThemeIcon variant="transparent" color="brand" size="sm">
              <ShieldCheckIcon className="w-5 h-5" />
            </ThemeIcon>
            <Text fw={700} fz="sm">مسیر اعتماد</Text>
          </Group>
          {/* Reused classic TrustPath — complex trust visualization out of scope. */}
          <TrustPath
            posterId={listing.sellerId}
            trustPath={listing.trustPath}
            variant="full"
          />
        </Card>
      </Box>

      {/* Quick referral */}
      <Box px="md" pt="sm">
        <Card withBorder radius="lg" p="md">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon size={40} radius="xl" variant="light" color="brand">
              <Text fz="xl">📨</Text>
            </ThemeIcon>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text fw={700} fz="sm">
                این آگهی مناسب کسیه که می‌شناسی؟
              </Text>
              <Text fz={11} c="dimmed">
                داخل حلقه‌ی اعتمادت معرفی کن — نه اشتراک عمومی
              </Text>
            </Box>
            <Button
              color="brand"
              size="sm"
              radius="md"
              onClick={() => setShowRefer(true)}
              style={{ flexShrink: 0 }}
            >
              معرفی به دوست
            </Button>
          </Group>
        </Card>
      </Box>

      {/* Seller */}
      {seller && !isMine && (
        <Box px="md" pt="sm">
          <Card
            withBorder
            radius="lg"
            p="md"
            component={Link}
            href={`/person/${listing.sellerId}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Group gap="sm" wrap="nowrap">
              <MAvatar name={seller.name} src={seller.avatar} level={seller.level} size="lg" />
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text fw={700}>{seller.name}</Text>
                <Text fz="xs" c="dimmed" mt={2}>
                  {seller.note ? `${seller.note} · ` : ""}
                  {relationLabels[seller.relation]}
                </Text>
                <Text fz="xs" c="dimmed" mt={4}>
                  {toPersianDigits(seller.deals)} معامله‌ی موفق · {seller.city}
                </Text>
              </Box>
              <Text c="dimmed" fz="lg">‹</Text>
            </Group>
          </Card>
        </Box>
      )}

      {/* Endorsements */}
      <Box px="md" pt="sm">
        <Card withBorder radius="lg" p="md">
          <Text fw={700} fz="sm" mb="sm">
            🛡️ تأیید و توصیه‌ها
          </Text>
          {/* Reused classic EndorsementList — endorsement widget out of scope. */}
          <EndorsementList endorsements={listing.endorsements} />

          {!isMine && (
            <Box mt="md" pt="md" style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}>
              <Text fz="xs" c="dimmed" mb="xs">
                اگر این فروشنده یا کالا را تأیید می‌کنید، نشان خود را اضافه کنید:
              </Text>
              <Group gap="xs">
                {ALL_BADGES.map((b) => {
                  const active = listing.endorsements.some(
                    (e) => e.personId === "me" && e.type === b,
                  );
                  return (
                    <Badge
                      key={b}
                      component="button"
                      variant={active ? "light" : "outline"}
                      color={active ? "green" : "gray"}
                      radius="sm"
                      size="lg"
                      onClick={() => toggleEndorsement(listing.id, b)}
                      style={{ cursor: "pointer" }}
                    >
                      {badgeEmoji[b]} {badgeLabels[b]}
                    </Badge>
                  );
                })}
              </Group>
            </Box>
          )}
        </Card>
      </Box>

      {/* Sticky action bar — single CTA (refer lives in card above) */}
      {!isMine && (
        <Paper
          style={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: 480,
            zIndex: 30,
            backdropFilter: "blur(8px)",
            background: "color-mix(in srgb, var(--mantine-color-body) 95%, transparent)",
            borderTop: "1px solid var(--mantine-color-default-border)",
          }}
          p="sm"
        >
          <Button
            color="brand"
            size="md"
            radius="md"
            fullWidth
            leftSection={<ChatIcon className="w-5 h-5" />}
            onClick={() => router.push(`/messages/${listing.sellerId}`)}
          >
            {listing.type === "donation"
              ? "پیام برای درخواست این کالا"
              : listing.type === "service"
                ? "پیام برای رزرو خدمت"
                : "پیام به فروشنده"}
          </Button>
        </Paper>
      )}

      {showRefer && (
        <ReferSheet
          listingId={listing.id}
          listingTitle={listing.title}
          onClose={() => setShowRefer(false)}
        />
      )}
    </Box>
  );
}
