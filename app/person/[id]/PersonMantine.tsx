"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Paper,
  Progress,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { useStore } from "@/lib/store";
import { canDirectMessage } from "@/lib/messaging";
import MHeader from "@/components/mantine/MHeader";
import MAvatar from "@/components/mantine/MAvatar";
import MListingCard from "@/components/mantine/MListingCard";
import { levelColor } from "@/components/mantine/shared";
// Complex interactive overlays reused as-is from the classic UI (out of scope to port).
import IntroRequestSheet from "@/components/IntroRequestSheet";
import AddToCircleSheet from "@/components/AddToCircleSheet";
// Self-contained classic components reused as-is.
import RequestCard from "@/components/RequestCard";
import TrustPath from "@/components/TrustPath";
import { ChatIcon, ShieldCheckIcon, UserPlusIcon } from "@/components/Icons";
import {
  badgeEmoji,
  badgeLabels,
  levelShort,
  relationEmoji,
  relationLabels,
} from "@/lib/labels";
import { buildSocialCredit, formatPercent } from "@/lib/social-credit";
import { canView } from "@/lib/trust";
import { toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";
import type {
  BadgeType,
  Endorsement,
  Listing,
  Person,
  TrustHop,
  TrustLevel,
} from "@/lib/types";

const LEVELS: TrustLevel[] = ["A", "B", "C"];
const ENDORSE_BADGES: BadgeType[] = [
  "know_seller",
  "verify_quality",
  "verify_item",
  "dealt_before",
];
type ContentTab = "listings" | "requests";

export default function PersonMantine({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = String(params.id);
  const {
    getPerson,
    listings,
    requests,
    removePerson,
    setLevel,
    addToCircle,
    getThread,
    toggleEndorsement,
    hydrated,
  } = useStore();
  const { show } = useToast();
  const [showIntro, setShowIntro] = useState(false);
  const [showAddToCircle, setShowAddToCircle] = useState(false);
  const [contentTab, setContentTab] = useState<ContentTab>("listings");

  const person = getPerson(id);

  if (!hydrated) {
    return (
      <Box component="main" pb={32} mih="100dvh">
        <MHeader title="پروفایل اعتماد" back />
        <Stack px="md" pt="md" gap="md">
          <Card withBorder radius="lg" p="lg" h={120} />
          <Card withBorder radius="lg" p="lg" h={200} />
        </Stack>
      </Box>
    );
  }

  if (!person || id === "me") {
    return (
      <Box component="main" mih="100dvh">
        <MHeader title="پروفایل" back />
        <Text ta="center" c="dimmed" py={80} fz="sm">
          کاربر پیدا نشد.
        </Text>
      </Box>
    );
  }

  const thread = getThread(id);
  const canMessage = canDirectMessage(person, thread.length > 0);

  const theirListings = listings.filter(
    (l) => l.sellerId === id && canView(l, getPerson),
  );
  const theirRequests = requests.filter(
    (r) => r.requesterId === id && canView(r, getPerson),
  );

  const pathSource =
    theirListings.find((l) => l.trustPath.length > 0) ??
    theirRequests.find((r) => r.trustPath.length > 0);
  const trustPath = pathSource?.trustPath ?? [];

  const networkActivity = theirListings.length + theirRequests.length;
  const socialCredit = buildSocialCredit(person, listings, networkActivity);

  const endorsementsReceived = theirListings.flatMap((l) =>
    l.endorsements.map((e) => ({ listing: l, endorsement: e })),
  );
  const endorsementsGiven = listings.flatMap((l) =>
    l.endorsements
      .filter((e) => e.personId === id)
      .map((e) => ({ listing: l, endorsement: e })),
  );

  const endorserIds = Array.from(
    new Set(endorsementsReceived.map((x) => x.endorsement.personId)),
  );

  const activityParts: string[] = [
    `${toPersianDigits(socialCredit.score)} اعتبار`,
  ];
  if (theirListings.length > 0) {
    activityParts.push(`${toPersianDigits(theirListings.length)} آگهی`);
  }
  if (theirRequests.length > 0) {
    activityParts.push(`${toPersianDigits(theirRequests.length)} درخواست`);
  }

  const showTrustPath = !person.inMyCircle || trustPath.length > 0;
  const personName = person.name;
  const hasListings = theirListings.length > 0;
  const hasRequests = theirRequests.length > 0;
  const showContentTabs = hasListings && hasRequests;
  const activeTab: ContentTab = showContentTabs
    ? contentTab
    : hasListings
      ? "listings"
      : "requests";

  const unendorsedListings = theirListings.filter(
    (l) => !l.endorsements.some((e) => e.personId === "me"),
  );

  function handleRemoveFromCircle() {
    if (
      !window.confirm(
        `${personName} از حلقه‌ی شما حذف شود؟ دسترسی مستقیم به پیام بسته می‌شود.`,
      )
    ) {
      return;
    }
    removePerson(id);
    show(`${personName} از حلقه حذف شد`);
    router.push("/circle");
  }

  return (
    <Box component="main" pb={96} mih="100dvh">
      <MHeader title="پروفایل اعتماد" back />

      {/* Identity */}
      <Box px="md" pt="md">
        <Card withBorder radius="lg" p="lg">
          <Group gap="md" wrap="nowrap" align="flex-start">
            <MAvatar name={person.name} src={person.avatar} level={person.level} size="lg" />
            <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
              <Group gap={6} wrap="wrap">
                <Text fw={700} fz="lg">
                  {person.name}
                </Text>
                <Badge size="sm" variant="light" color={levelColor[person.level]}>
                  {levelShort[person.level]}
                </Badge>
                {socialCredit.verified && (
                  <Badge
                    size="sm"
                    variant="light"
                    color="green"
                    leftSection={<ShieldCheckIcon className="w-3 h-3" />}
                  >
                    {socialCredit.verifiedLabel}
                  </Badge>
                )}
              </Group>
              <Text fz="xs" c="dimmed">
                {relationEmoji[person.relation]} {relationLabels[person.relation]}
                {person.city && (
                  <Text span c="dimmed">
                    {" · 📍 "}
                    {person.city}
                  </Text>
                )}
              </Text>
              {person.note && (
                <Text fz="xs" c="dimmed">
                  {person.note}
                </Text>
              )}
              <Text fz="xs" fw={500} c="brand.7">
                {activityParts.join(" · ")}
              </Text>
              <Text fz={11} c="dimmed">
                عضو از {socialCredit.memberSince} · {socialCredit.lastActive}
              </Text>
            </Stack>
          </Group>
        </Card>
      </Box>

      {/* Their content */}
      {(hasListings || hasRequests) && (
        <Box component="section" px="md" pt="md">
          {showContentTabs ? (
            <SegmentedControl
              fullWidth
              value={activeTab}
              onChange={(v) => setContentTab(v as ContentTab)}
              mb="sm"
              data={[
                {
                  value: "listings",
                  label: `آگهی‌ها (${toPersianDigits(theirListings.length)})`,
                },
                {
                  value: "requests",
                  label: `درخواست‌ها (${toPersianDigits(theirRequests.length)})`,
                },
              ]}
            />
          ) : (
            <Text fw={700} fz="sm" mb="xs">
              {hasListings
                ? `آگهی‌های ${person.name}`
                : `درخواست‌های ${person.name}`}
            </Text>
          )}

          <Stack gap="sm">
            {activeTab === "listings" &&
              theirListings.map((l) => (
                <MListingCard key={l.id} listing={l} hideTrust />
              ))}
            {activeTab === "requests" &&
              theirRequests.map((r) => (
                <RequestCard key={r.id} request={r} hideTrust />
              ))}
          </Stack>
        </Box>
      )}

      {/* Endorse prompt */}
      {unendorsedListings.length > 0 && (
        <Box component="section" px="md" pt="md">
          <EndorsePrompt
            personName={person.name}
            listings={unendorsedListings}
            onEndorse={(listingId, type) => {
              toggleEndorsement(listingId, type);
              show("تأیید شما ثبت شد ✓");
            }}
          />
        </Box>
      )}

      {/* Social credit */}
      <Box px="md" pt="md">
        <SocialCreditPanel
          stats={socialCredit}
          subtitle={`شاخص اعتماد ${person.name} در شبکه`}
        />
      </Box>

      {/* Social endorsements */}
      {(endorsementsReceived.length > 0 || endorsementsGiven.length > 0) && (
        <Box component="section" px="md" pt="lg">
          <Text fw={700} fz="sm" mb="xs">
            تأییدهای اجتماعی
          </Text>
          <Stack gap="sm">
            {endorsementsReceived.length > 0 && (
              <div>
                <Text fz="xs" fw={500} c="dimmed" mb="xs">
                  تأیید دریافتی ({toPersianDigits(endorsementsReceived.length)})
                </Text>
                <Stack gap="xs">
                  {endorsementsReceived.map(({ listing, endorsement }, i) => {
                    const endorser = getPerson(endorsement.personId);
                    return (
                      <EndorsementRow
                        key={`r-${i}`}
                        listing={listing}
                        endorsement={endorsement}
                        headline={
                          <>
                            {endorser && endorser.id !== "me" ? (
                              <Anchor
                                component={Link}
                                href={`/person/${endorser.id}`}
                                fw={600}
                                c="inherit"
                              >
                                {endorser.name}
                              </Anchor>
                            ) : (
                              <Text span fw={600}>
                                {endorser?.name ?? "—"}
                              </Text>
                            )}
                            <Text span c="dimmed">
                              {" — "}
                              {badgeLabels[endorsement.type]}
                            </Text>
                          </>
                        }
                      />
                    );
                  })}
                </Stack>
              </div>
            )}
            {endorsementsGiven.length > 0 && (
              <div>
                <Text fz="xs" fw={500} c="dimmed" mb="xs">
                  تأیید داده‌شده ({toPersianDigits(endorsementsGiven.length)})
                </Text>
                <Stack gap="xs">
                  {endorsementsGiven.map(({ listing, endorsement }, i) => (
                    <EndorsementRow
                      key={`g-${i}`}
                      listing={listing}
                      endorsement={endorsement}
                      headline={
                        <Text span fw={600}>
                          {badgeLabels[endorsement.type]}
                        </Text>
                      }
                    />
                  ))}
                </Stack>
              </div>
            )}
            {endorserIds.length > 0 && (
              <Text fz={11} c="dimmed" px={4}>
                {toPersianDigits(endorserIds.length)} نفر از شبکه‌ی شما آگهی‌های{" "}
                {person.name} را تأیید کرده‌اند.
              </Text>
            )}
          </Stack>
        </Box>
      )}

      {/* Empty state */}
      {!hasListings && !hasRequests && (
        <Box component="section" px="md" pt="md">
          <Card withBorder radius="lg" p="lg" ta="center">
            <Text fz={40} mb="xs">
              📭
            </Text>
            <Text fw={700} fz="sm" mb={6}>
              {person.name} آگهی یا درخواست فعالی ندارد
            </Text>
            <Text fz="xs" c="dimmed" mb="md" style={{ lineHeight: 1.7 }}>
              {canMessage
                ? "می‌توانید مستقیم پیام بدهید و بپرسید آیا چیزی برای فروش یا نیاز دارد."
                : "با افزودن به حلقه یا درخواست معرفی، ارتباط نزدیک‌تر برقرار کنید."}
            </Text>
            <Group justify="center" gap="xs">
              <Button
                onClick={() => {
                  if (canMessage) {
                    router.push(`/messages/${id}`);
                    return;
                  }
                  if (person.inMyCircle) {
                    setShowIntro(true);
                    return;
                  }
                  setShowAddToCircle(true);
                }}
              >
                {canMessage
                  ? `پیام به ${person.name}`
                  : person.inMyCircle
                    ? "درخواست معرفی"
                    : "افزودن به حلقه"}
              </Button>
              {canMessage && !person.inMyCircle && (
                <Button variant="light" onClick={() => setShowAddToCircle(true)}>
                  افزودن به حلقه
                </Button>
              )}
            </Group>
          </Card>
        </Box>
      )}

      {/* Circle / relation */}
      <CircleSection
        person={person}
        personId={id}
        showTrustPath={showTrustPath}
        trustPath={trustPath}
        onAddToCircle={() => setShowAddToCircle(true)}
        onRemoveFromCircle={handleRemoveFromCircle}
        onSetLevel={(lvl) => {
          setLevel(id, lvl);
          show(`سطح ${person.name} به ${levelShort[lvl]} تغییر کرد`);
        }}
      />

      {/* Sticky action bar */}
      <Box
        style={{
          position: "fixed",
          bottom: 0,
          insetInline: 0,
          zIndex: 30,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box
          w="100%"
          maw={480}
          p="sm"
          style={{
            backdropFilter: "blur(8px)",
            background:
              "color-mix(in srgb, var(--mantine-color-body) 92%, transparent)",
            borderTop: "1px solid var(--mantine-color-default-border)",
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          {canMessage ? (
            <Button
              component={Link}
              href={`/messages/${id}`}
              fullWidth
              size="md"
              leftSection={<ChatIcon className="w-5 h-5" />}
            >
              پیام به {person.name}
            </Button>
          ) : (
            <Group gap="xs" grow>
              <Button
                size="md"
                leftSection={<UserPlusIcon className="w-5 h-5" />}
                onClick={() => setShowAddToCircle(true)}
              >
                افزودن به حلقه
              </Button>
              <Button size="md" variant="default" onClick={() => setShowIntro(true)}>
                درخواست معرفی
              </Button>
            </Group>
          )}
        </Box>
      </Box>

      {showIntro && (
        <IntroRequestSheet
          itemTitle={person.name}
          itemKind="person"
          onClose={() => setShowIntro(false)}
        />
      )}

      {showAddToCircle && (
        <AddToCircleSheet
          person={person}
          onClose={() => setShowAddToCircle(false)}
          onAdd={(input) => {
            addToCircle(id, input);
            setShowAddToCircle(false);
            show(`${person.name} به حلقه‌ی شما اضافه شد ✓`);
          }}
        />
      )}
    </Box>
  );
}

function SocialCreditPanel({
  stats,
  subtitle,
}: {
  stats: ReturnType<typeof buildSocialCredit>;
  subtitle: string;
}) {
  return (
    <Card
      withBorder
      radius="lg"
      p="md"
      style={{
        background:
          "linear-gradient(135deg, var(--mantine-color-brand-light), var(--mantine-color-body))",
      }}
    >
      <Group justify="space-between" align="flex-start" mb="xs">
        <Group gap="xs">
          <ThemeIcon size={36} radius="xl" variant="light" color="brand">
            <ShieldCheckIcon className="w-5 h-5" />
          </ThemeIcon>
          <div>
            <Text fw={700} fz="sm">
              اعتبار اجتماعی
            </Text>
            <Text fz={11} c="dimmed">
              {subtitle}
            </Text>
          </div>
        </Group>
        <div style={{ textAlign: "left" }}>
          <Text fw={800} fz={28} c="brand.7" lh={1}>
            {toPersianDigits(stats.score)}
            <Text span fz="xs" c="dimmed" fw={700}>
              {" "}
              / ۱۰۰
            </Text>
          </Text>
          <Text fz="xs" fw={800} c="brand.6" ta="left">
            {stats.label}
          </Text>
        </div>
      </Group>
      <Progress value={stats.score} color="brand" radius="xl" size="md" />
      <Text fz={11} c="dimmed" mt={6} mb="md">
        نرخ پاسخگویی {formatPercent(stats.responseRate)} · بر اساس معامله، تأیید و
        فعالیت در شبکه
      </Text>
      <SimpleGrid cols={2} spacing="xs">
        <Metric icon="🤝" value={stats.successfulDeals} label="معامله‌ی موفق" />
        <Metric icon="🛡️" value={stats.endorsementsReceived} label="تأیید دریافتی" />
        <Metric icon="✅" value={stats.endorsementsGiven} label="تأیید داده‌شده" />
        <Metric icon="👥" value={stats.circleSize} label="فعالیت در شبکه" />
      </SimpleGrid>
    </Card>
  );
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: string;
  value: number;
  label: string;
}) {
  return (
    <Card withBorder radius="md" p="xs">
      <Group gap={6} mb={2}>
        <Text fz="sm">{icon}</Text>
        <Text fz={11} c="dimmed" fw={500}>
          {label}
        </Text>
      </Group>
      <Text fz="md" fw={800} c="brand.7" lh={1}>
        {toPersianDigits(value)}
      </Text>
    </Card>
  );
}

function CircleSection({
  person,
  personId,
  showTrustPath,
  trustPath,
  onAddToCircle,
  onRemoveFromCircle,
  onSetLevel,
}: {
  person: Person;
  personId: string;
  showTrustPath: boolean;
  trustPath: TrustHop[];
  onAddToCircle: () => void;
  onRemoveFromCircle: () => void;
  onSetLevel: (lvl: TrustLevel) => void;
}) {
  return (
    <Box component="section" px="md" pt="lg" pb={8}>
      <Card withBorder radius="lg" p="md">
        <Group gap="xs" mb="sm">
          <Text fz="md" aria-hidden>
            👥
          </Text>
          <Text fw={700} fz="sm">
            {person.inMyCircle ? "حلقه‌ی شما" : `ارتباط با ${person.name}`}
          </Text>
        </Group>

        {person.inMyCircle ? (
          <Paper
            radius="md"
            px="sm"
            py={8}
            mb="sm"
            bg="var(--mantine-color-green-light)"
          >
            <Text fz="xs" c="green.7">
              عضو مستقیم حلقه — پیام مستقیم ✓
            </Text>
          </Paper>
        ) : (
          <Paper
            radius="md"
            px="sm"
            py={8}
            mb="sm"
            bg="var(--mantine-color-default-hover)"
          >
            <Text fz="xs" c="dimmed">
              از مسیر اعتماد وصل است؛ هنوز در حلقه‌ی مستقیم نیست.
            </Text>
          </Paper>
        )}

        {person.inMyCircle && (
          <>
            <Text fz="xs" c="dimmed" mb="xs">
              سطح اعتماد
            </Text>
            <SegmentedControl
              fullWidth
              value={person.level}
              onChange={(v) => onSetLevel(v as TrustLevel)}
              mb="sm"
              data={LEVELS.map((lvl) => ({
                value: lvl,
                label: levelShort[lvl],
              }))}
            />
          </>
        )}

        {showTrustPath && (
          <TrustPath
            posterId={personId}
            trustPath={trustPath}
            variant="full"
          />
        )}

        {person.inMyCircle && !showTrustPath && (
          <Anchor component={Link} href="/graph" fz="xs" fw={500}>
            نقشه‌ی کامل حلقه را ببین ‹
          </Anchor>
        )}

        {!person.inMyCircle && (
          <Button
            mt="sm"
            fullWidth
            leftSection={<UserPlusIcon className="w-4 h-4" />}
            onClick={onAddToCircle}
          >
            افزودن به حلقه
          </Button>
        )}

        {person.inMyCircle && (
          <>
            <Divider my="sm" />
            <Group justify="flex-start">
              <Anchor
                component="button"
                type="button"
                fz="xs"
                fw={500}
                c="red"
                onClick={onRemoveFromCircle}
              >
                حذف از حلقه
              </Anchor>
            </Group>
          </>
        )}
      </Card>
    </Box>
  );
}

function EndorsePrompt({
  personName,
  listings,
  onEndorse,
}: {
  personName: string;
  listings: Listing[];
  onEndorse: (listingId: string, type: BadgeType) => void;
}) {
  const visible = listings.slice(0, 3);

  return (
    <Card
      withBorder
      radius="lg"
      p="md"
      style={{
        borderColor: "var(--mantine-color-brand-3)",
        background: "var(--mantine-color-brand-light)",
      }}
    >
      <Group gap="xs" mb="sm">
        <ThemeIcon size="sm" variant="transparent" color="brand">
          <ShieldCheckIcon className="w-5 h-5" />
        </ThemeIcon>
        <Text fw={700} fz="sm">
          تأیید آگهی‌های {personName}
        </Text>
      </Group>
      <Text fz="xs" c="dimmed" mb="sm" style={{ lineHeight: 1.7 }}>
        اگر این آگهی‌ها را می‌شناسید یا کیفیتشان را تأیید می‌کنید، نشان خود را
        اضافه کنید.
      </Text>
      <Stack gap="sm">
        {visible.map((listing) => (
          <Paper
            key={listing.id}
            withBorder
            radius="md"
            p="sm"
            bg="var(--mantine-color-body)"
          >
            <Anchor
              component={Link}
              href={`/listing/${listing.id}`}
              fw={600}
              fz="sm"
              c="inherit"
              lineClamp={2}
            >
              {listing.title}
            </Anchor>
            <Group gap={6} mt="xs">
              {ENDORSE_BADGES.map((b) => {
                const active = listing.endorsements.some(
                  (e) => e.personId === "me" && e.type === b,
                );
                return (
                  <Badge
                    key={b}
                    component="button"
                    type="button"
                    variant={active ? "filled" : "default"}
                    color={active ? "green" : "gray"}
                    size="sm"
                    style={{ cursor: "pointer" }}
                    onClick={() => onEndorse(listing.id, b)}
                  >
                    {badgeEmoji[b]} {badgeLabels[b]}
                  </Badge>
                );
              })}
            </Group>
          </Paper>
        ))}
      </Stack>
      {listings.length > 3 && (
        <Text fz={11} c="dimmed" mt="xs" ta="center">
          {toPersianDigits(listings.length - 3)} آگهی دیگر در تب آگهی‌ها
        </Text>
      )}
    </Card>
  );
}

function EndorsementRow({
  listing,
  endorsement,
  headline,
}: {
  listing: Listing;
  endorsement: Endorsement;
  headline: React.ReactNode;
}) {
  return (
    <Card withBorder radius="lg" p="sm">
      <Group align="flex-start" gap="xs" wrap="nowrap">
        <Text fz="lg" style={{ flexShrink: 0 }} aria-hidden>
          {badgeEmoji[endorsement.type]}
        </Text>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Text fz="sm" lh={1.4}>
            {headline}
          </Text>
          <Anchor
            component={Link}
            href={`/listing/${listing.id}`}
            fz="xs"
            fw={500}
            c="brand.7"
            mt={4}
            truncate
            display="block"
          >
            آگهی: {listing.title} ‹
          </Anchor>
        </div>
      </Group>
    </Card>
  );
}
