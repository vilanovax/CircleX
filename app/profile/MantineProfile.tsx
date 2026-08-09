"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Modal,
  Progress,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import { useStore } from "@/lib/store";
import { useTheme, type Theme } from "@/lib/theme";
import { useUIMode, type UIMode } from "@/lib/ui-mode";
import MHeader from "@/components/mantine/MHeader";
import MBottomNav from "@/components/mantine/MBottomNav";
import MAvatar from "@/components/mantine/MAvatar";
import MListingCard from "@/components/mantine/MListingCard";
import MListingImage from "@/components/mantine/MListingImage";
import {
  CalendarIcon,
  ClockIcon,
  HeartIcon,
  MapPinIcon,
  PencilIcon,
  ShieldCheckIcon,
} from "@/components/Icons";
import {
  badgeEmoji,
  badgeLabels,
  eventKindEmoji,
  formatPrice,
  listingTypeEmoji,
} from "@/lib/labels";
import { buildSocialCredit, formatPercent } from "@/lib/social-credit";
import { formatEventDateDisplay, toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";
import type { CircleEvent } from "@/lib/types";

type ActivityTab = "listings" | "events" | "saved" | "endorsements";

export default function MantineProfile() {
  const { me, people, listings, events, saved, updateProfile, hydrated } =
    useStore();
  const { show } = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [tab, setTab] = useState<ActivityTab>("listings");
  const [creditOpen, setCreditOpen] = useState(false);

  const myCircle = people.filter((p) => p.inMyCircle);
  const myListings = listings.filter((l) => l.sellerId === "me");
  const savedListings = saved
    .map((id) => listings.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l));
  const hostedEvents = events.filter((e) => e.hostId === "me");
  const attendingEvents = events.filter(
    (e) => e.hostId !== "me" && e.attendees.includes("me"),
  );
  const allMyEvents = useMemo(
    () => [...hostedEvents, ...attendingEvents],
    [hostedEvents, attendingEvents],
  );

  const credit = buildSocialCredit(me, listings, myCircle.length);
  const myGivenBadges = listings.flatMap((l) =>
    l.endorsements.filter((e) => e.personId === "me").map((e) => ({ l, e })),
  );

  useEffect(() => {
    if (!hydrated) return;

    if (window.location.hash === "#saved") {
      setTab("saved");
      const el = document.getElementById("activity");
      if (!el) return;
      const t = window.setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => window.clearTimeout(t);
    }

    if (myListings.length > 0) return;
    if (allMyEvents.length > 0) setTab("events");
    else if (savedListings.length > 0) setTab("saved");
    else if (myGivenBadges.length > 0) setTab("endorsements");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once after hydrate
  }, [hydrated]);

  return (
    <Box component="main" pb={96} mih="100dvh">
      <MHeader title="پروفایل" />

      <Stack px="md" pt="sm" gap="sm">
        {/* Identity + score */}
        <Card withBorder radius="lg" p="md">
          <Group gap="md" wrap="nowrap" align="flex-start">
            <MAvatar name={me.name} size="lg" />
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Box style={{ minWidth: 0 }}>
                  <Text fw={800} fz="lg" truncate>
                    {me.name}
                  </Text>
                  {credit.verified && (
                    <Badge
                      size="sm"
                      variant="light"
                      color="teal"
                      mt={4}
                      leftSection={<ShieldCheckIcon className="w-3 h-3" />}
                    >
                      {credit.verifiedLabel}
                    </Badge>
                  )}
                </Box>
                <Button
                  size="compact-sm"
                  variant="light"
                  color="brand"
                  leftSection={<PencilIcon className="w-3.5 h-3.5" />}
                  onClick={() => setShowEdit(true)}
                >
                  ویرایش
                </Button>
              </Group>
              <Group gap={6} mt={8} wrap="wrap">
                <Text fz={11} c="dimmed" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <MapPinIcon className="w-3 h-3" />
                  {me.city || "شهر ثبت نشده"}
                </Text>
                <Text fz={11} c="dimmed">
                  · عضو از {credit.memberSince}
                </Text>
                <Text fz={11} c="dimmed">
                  · فعال {credit.lastActive}
                </Text>
              </Group>
            </Box>
          </Group>

          <Group gap="xs" mt="md" wrap="nowrap">
            <Card
              withBorder={false}
              radius="md"
              p="sm"
              style={{
                flex: 1,
                background:
                  "linear-gradient(135deg, var(--mantine-color-brand-light), var(--mantine-color-teal-0))",
              }}
            >
              <Group justify="space-between" wrap="nowrap">
                <div>
                  <Text fz={10} c="dimmed">
                    اعتبار اجتماعی
                  </Text>
                  <Text fz="xs" fw={700} c="brand.7" mt={2}>
                    {credit.label}
                  </Text>
                </div>
                <Text fw={800} fz={22} lh={1}>
                  {toPersianDigits(credit.score)}
                  <Text span fz={11} c="dimmed" fw={700}>
                    {" "}
                    /۱۰۰
                  </Text>
                </Text>
              </Group>
            </Card>
            <UnstyledButton component={Link} href="/circle">
              <Card withBorder radius="md" p="sm" ta="center" miw={72}>
                <Text fw={800} fz="md" lh={1}>
                  {toPersianDigits(myCircle.length)}
                </Text>
                <Text fz={10} c="dimmed" mt={4}>
                  حلقه
                </Text>
              </Card>
            </UnstyledButton>
          </Group>
        </Card>

        {/* Collapsible credit details */}
        <Card withBorder radius="lg" p={0} style={{ overflow: "hidden" }}>
          <UnstyledButton
            onClick={() => setCreditOpen((v) => !v)}
            style={{ display: "block", width: "100%", padding: 14 }}
            aria-expanded={creditOpen}
          >
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon size={36} radius="md" variant="light" color="brand">
                  <ShieldCheckIcon className="w-5 h-5" />
                </ThemeIcon>
                <div>
                  <Text fw={700} fz="sm">
                    اعتبار اجتماعی
                  </Text>
                  <Text fz={11} c="dimmed">
                    {creditOpen
                      ? "جزئیات شاخص اعتماد"
                      : `${toPersianDigits(credit.score)}/۱۰۰ · ${credit.label} · ${toPersianDigits(credit.successfulDeals)} معامله`}
                  </Text>
                </div>
              </Group>
              <Text c="dimmed" aria-hidden>
                {creditOpen ? "›" : "‹"}
              </Text>
            </Group>
          </UnstyledButton>
          {creditOpen && (
            <Box px="md" pb="md">
              <Progress value={credit.score} color="brand" radius="xl" size="md" />
              <Text fz={11} c="dimmed" mt={6} mb="sm" style={{ lineHeight: 1.6 }}>
                نرخ پاسخگویی {formatPercent(credit.responseRate)} · بر اساس معامله و تأیید
              </Text>
              <SimpleGrid cols={2} spacing="xs">
                <Metric value={credit.successfulDeals} label="معامله‌ی موفق" />
                <Metric value={credit.endorsementsReceived} label="تأیید دریافتی" />
                <Metric value={credit.endorsementsGiven} label="تأیید داده‌شده" />
                <Metric value={credit.circleSize} label="نفر در حلقه" />
              </SimpleGrid>
            </Box>
          )}
        </Card>

        {/* Activity tabs */}
        <Box id="activity" style={{ scrollMarginTop: 96 }}>
          <Group justify="space-between" mb={8}>
            <Text fw={700} fz="sm">
              فعالیت من
            </Text>
            {tab === "listings" && (
              <Anchor component={Link} href="/new" fz={11} fw={700} c="brand">
                ثبت آگهی ›
              </Anchor>
            )}
          </Group>

          <SegmentedControl
            fullWidth
            value={tab}
            onChange={(v) => setTab(v as ActivityTab)}
            data={[
              {
                label: `آگهی‌ها ${toPersianDigits(myListings.length)}`,
                value: "listings",
              },
              {
                label: `رویداد ${toPersianDigits(allMyEvents.length)}`,
                value: "events",
              },
              {
                label: `نشان ${toPersianDigits(savedListings.length)}`,
                value: "saved",
              },
              {
                label: `تأیید ${toPersianDigits(myGivenBadges.length)}`,
                value: "endorsements",
              },
            ]}
            mb="sm"
          />

          <Box id={tab === "saved" ? "saved" : undefined}>
            {tab === "listings" &&
              (myListings.length === 0 ? (
                <EmptyHint
                  title="هنوز آگهی‌ای نداری"
                  text="چیزی برای فروش، امانت یا هدیه ثبت کن."
                  href="/new"
                  cta="ثبت آگهی"
                />
              ) : (
                <Stack gap="xs">
                  {myListings.map((l) => (
                    <Card
                      key={l.id}
                      component={Link}
                      href={`/listing/${l.id}`}
                      withBorder
                      radius="lg"
                      p="sm"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <Group gap="sm" wrap="nowrap">
                        <MListingImage image={l.image} alt={l.title} size="lg" />
                        <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                          <Text fw={500} fz="sm" truncate>
                            {listingTypeEmoji[l.type]} {l.title}
                          </Text>
                          <Text fz="xs" c="dimmed">
                            {l.price != null ? formatPrice(l.price) : "رایگان / توافقی"} ·{" "}
                            {l.postedAt}
                          </Text>
                        </Stack>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              ))}

            {tab === "events" &&
              (allMyEvents.length === 0 ? (
                <EmptyHint
                  title="رویدادی در تقویمت نیست"
                  text="به یک رویداد بپیوند یا خودت یکی بساز."
                  href="/"
                  cta="دیدن رویدادها"
                />
              ) : (
                <Stack gap="sm">
                  {hostedEvents.length > 0 && (
                    <div>
                      <Text fz={11} c="dimmed" fw={600} mb={6}>
                        میزبانی من · {toPersianDigits(hostedEvents.length)}
                      </Text>
                      <Stack gap="xs">
                        {hostedEvents.map((e) => (
                          <EventRow key={e.id} event={e} />
                        ))}
                      </Stack>
                    </div>
                  )}
                  {attendingEvents.length > 0 && (
                    <div>
                      <Text fz={11} c="dimmed" fw={600} mb={6}>
                        شرکت می‌کنم · {toPersianDigits(attendingEvents.length)}
                      </Text>
                      <Stack gap="xs">
                        {attendingEvents.map((e) => (
                          <EventRow key={e.id} event={e} />
                        ))}
                      </Stack>
                    </div>
                  )}
                </Stack>
              ))}

            {tab === "saved" &&
              (savedListings.length === 0 ? (
                <EmptyHint
                  title="هنوز چیزی نشان نکرده‌ای"
                  text="روی ❤ هر آگهی بزن تا اینجا جمع شود."
                  href="/"
                  cta="دیدن آگهی‌ها"
                  heart
                />
              ) : (
                <Stack gap="sm">
                  {savedListings.map((l) => (
                    <MListingCard key={l.id} listing={l} compactTrust />
                  ))}
                </Stack>
              ))}

            {tab === "endorsements" &&
              (myGivenBadges.length === 0 ? (
                <EmptyHint
                  title="هنوز تأییدی نداده‌ای"
                  text="از صفحه‌ی آگهی می‌توانی نشان اعتماد بدهی."
                  href="/"
                  cta="رفتن به آگهی‌ها"
                />
              ) : (
                <Stack gap="xs">
                  {myGivenBadges.map(({ l, e }, i) => (
                    <Card
                      key={`${l.id}-${e.type}-${i}`}
                      component={Link}
                      href={`/listing/${l.id}`}
                      withBorder
                      radius="lg"
                      p="sm"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <Group gap="xs" wrap="nowrap">
                        <Text fz="lg">{badgeEmoji[e.type]}</Text>
                        <Text fz="sm" truncate>
                          <Text span c="dimmed">
                            {badgeLabels[e.type]} —{" "}
                          </Text>
                          <Text span fw={500}>
                            {l.title}
                          </Text>
                        </Text>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              ))}
          </Box>
        </Box>

        <Box>
          <Text fw={700} fz="sm" mb="xs">
            ظاهر برنامه
          </Text>
          <Card withBorder radius="lg" p="md">
            <Stack gap="md">
              <div>
                <Text fz="xs" c="dimmed" mb={6}>
                  مدل نمایش
                </Text>
                <UIModeControl />
              </div>
              <div>
                <Text fz="xs" c="dimmed" mb={6}>
                  حالت روشن / تیره
                </Text>
                <ThemeControl />
              </div>
            </Stack>
          </Card>
        </Box>
      </Stack>

      <EditProfileModal
        opened={showEdit}
        name={me.name}
        city={me.city ?? ""}
        onClose={() => setShowEdit(false)}
        onSave={(input) => {
          updateProfile(input);
          setShowEdit(false);
          show("پروفایل به‌روزرسانی شد ✓");
        }}
      />

      <MBottomNav />
    </Box>
  );
}

function UIModeControl() {
  const { mode, setMode } = useUIMode();
  const router = useRouter();
  const { show } = useToast();
  return (
    <>
      <SegmentedControl
        fullWidth
        value={mode}
        onChange={(v) => {
          const m = v as UIMode;
          setMode(m);
          router.push("/");
          show(
            m === "mantine"
              ? "نمای مدرن (Mantine) روی همه‌ی صفحات فعال شد"
              : m === "classic"
                ? "نمای کلاسیک فعال شد"
                : "نمای جدید روی صفحه‌ی اصلی و آگهی فعال شد",
          );
        }}
        data={[
          { label: "کلاسیک", value: "classic" },
          { label: "مدرن", value: "mantine" },
          { label: "چاکرا", value: "chakra" },
          { label: "متریال", value: "mui" },
          { label: "هیرو", value: "heroui" },
        ]}
      />
      <Text fz={11} c="dimmed" mt={6} style={{ lineHeight: 1.6 }}>
        Mantine همه‌جا؛ بقیه فقط خانه و آگهی.
      </Text>
    </>
  );
}

function ThemeControl() {
  const { theme, setTheme } = useTheme();
  return (
    <SegmentedControl
      fullWidth
      value={theme}
      onChange={(v) => setTheme(v as Theme)}
      data={[
        { label: "روشن", value: "light" },
        { label: "تیره", value: "dark" },
        { label: "سیستم", value: "system" },
      ]}
    />
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <Card withBorder radius="md" p="xs">
      <Text fz={11} c="dimmed" fw={500}>
        {label}
      </Text>
      <Text fz="md" fw={800} c="brand.7" lh={1} mt={4}>
        {toPersianDigits(value)}
      </Text>
    </Card>
  );
}

function EventRow({ event }: { event: CircleEvent }) {
  return (
    <Card
      component={Link}
      href={`/event/${event.id}`}
      withBorder
      radius="lg"
      p="sm"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Group gap="sm" wrap="nowrap">
        <Box
          w={48}
          h={48}
          style={{
            borderRadius: 12,
            background: "var(--mantine-color-default-hover)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            flexShrink: 0,
          }}
        >
          {event.image}
        </Box>
        <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
          <Text fw={600} fz="sm" truncate>
            {eventKindEmoji[event.kind]} {event.title}
          </Text>
          <Group gap={8} wrap="wrap">
            <Text fz={11} c="dimmed" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <CalendarIcon className="w-3 h-3" />
              {formatEventDateDisplay(event.date)}
            </Text>
            {event.time && (
              <Text fz={11} c="dimmed" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <ClockIcon className="w-3 h-3" />
                {toPersianDigits(event.time)}
              </Text>
            )}
            <Text fz={11} c="dimmed" truncate style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <MapPinIcon className="w-3 h-3" />
              {event.location}
            </Text>
          </Group>
        </Stack>
      </Group>
    </Card>
  );
}

function EmptyHint({
  title,
  text,
  href,
  cta,
  heart,
}: {
  title: string;
  text: string;
  href: string;
  cta: string;
  heart?: boolean;
}) {
  return (
    <Card withBorder radius="lg" p="lg" ta="center">
      {heart && (
        <ThemeIcon size={44} radius="xl" variant="light" color="pink" mx="auto" mb="sm">
          <HeartIcon className="w-5 h-5" />
        </ThemeIcon>
      )}
      <Text fw={700} fz="sm">
        {title}
      </Text>
      <Text fz={12} c="dimmed" mt={6} style={{ lineHeight: 1.7 }}>
        {text}
      </Text>
      <Button component={Link} href={href} size="sm" mt="md" variant="light">
        {cta}
      </Button>
    </Card>
  );
}

function EditProfileModal({
  opened,
  name: initialName,
  city: initialCity,
  onClose,
  onSave,
}: {
  opened: boolean;
  name: string;
  city: string;
  onClose: () => void;
  onSave: (input: { name: string; city: string }) => void;
}) {
  const [name, setName] = useState(initialName);
  const [city, setCity] = useState(initialCity);

  useEffect(() => {
    if (opened) {
      setName(initialName);
      setCity(initialCity);
    }
  }, [opened, initialName, initialCity]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="ویرایش پروفایل"
      centered
      radius="lg"
      styles={{ title: { fontWeight: 700 } }}
    >
      <Stack gap="md" align="stretch">
        <Stack gap={6} align="center">
          <MAvatar name={name.trim() || initialName} size="lg" />
          <Text fz={11} c="dimmed" ta="center">
            آواتار از حرف اول نام ساخته می‌شود
          </Text>
        </Stack>
        <TextInput
          label="نام"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="نام شما"
        />
        <TextInput
          label="شهر"
          value={city}
          onChange={(e) => setCity(e.currentTarget.value)}
          placeholder="مثلاً تهران"
        />
        <Group grow>
          <Button variant="default" onClick={onClose}>
            انصراف
          </Button>
          <Button
            disabled={!name.trim()}
            onClick={() => onSave({ name: name.trim(), city: city.trim() })}
          >
            ذخیره
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
