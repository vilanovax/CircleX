"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
} from "@mantine/core";
import { useStore } from "@/lib/store";
import { useTheme, type Theme } from "@/lib/theme";
import { useUIMode, type UIMode } from "@/lib/ui-mode";
import MHeader from "@/components/mantine/MHeader";
import MBottomNav from "@/components/mantine/MBottomNav";
import MAvatar from "@/components/mantine/MAvatar";
import MListingCard from "@/components/mantine/MListingCard";
import MListingImage from "@/components/mantine/MListingImage";
import { ShieldCheckIcon, HeartIcon, PencilIcon } from "@/components/Icons";
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

export default function MantineProfile() {
  const { me, people, listings, events, saved, updateProfile, hydrated } = useStore();
  const { show } = useToast();
  const [showEdit, setShowEdit] = useState(false);

  const myCircle = people.filter((p) => p.inMyCircle);
  const myListings = listings.filter((l) => l.sellerId === "me");
  const savedListings = saved
    .map((id) => listings.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l));
  const hostedEvents = events.filter((e) => e.hostId === "me");
  const attendingEvents = events.filter(
    (e) => e.hostId !== "me" && e.attendees.includes("me"),
  );

  const credit = buildSocialCredit(me, listings, myCircle.length);
  const myGivenBadges = listings.flatMap((l) =>
    l.endorsements.filter((e) => e.personId === "me").map((e) => ({ l, e })),
  );

  useEffect(() => {
    if (!hydrated || window.location.hash !== "#saved") return;
    const el = document.getElementById("saved");
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [hydrated]);

  return (
    <Box component="main" pb={96} mih="100dvh">
      <MHeader title="پروفایل اعتماد" />

      {/* Identity */}
      <Box px="md" pt="md">
        <Card withBorder radius="lg" p="lg" pos="relative">
          <Button
            size="compact-sm"
            variant="light"
            leftSection={<PencilIcon className="w-3.5 h-3.5" />}
            pos="absolute"
            top={16}
            left={16}
            onClick={() => setShowEdit(true)}
          >
            ویرایش
          </Button>
          <Group gap="md" wrap="nowrap">
            <MAvatar name={me.name} size="lg" />
            <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
              <Group gap={6} wrap="wrap">
                <Text fw={700} fz="lg">
                  {me.name}
                </Text>
                {credit.verified && (
                  <Badge size="sm" variant="light" color="green" leftSection={<ShieldCheckIcon className="w-3 h-3" />}>
                    {credit.verifiedLabel}
                  </Badge>
                )}
              </Group>
              <Text fz="sm" c="dimmed">
                📍 {me.city}
              </Text>
              <Text fz="xs" c="dimmed">
                عضو از {credit.memberSince} · آخرین فعالیت {credit.lastActive}
              </Text>
              {savedListings.length > 0 && (
                <Anchor component={Link} href="/profile#saved" fz="xs" fw={500} c="pink">
                  ♥ {toPersianDigits(savedListings.length)} نشان‌شده
                </Anchor>
              )}
            </Stack>
          </Group>
        </Card>
      </Box>

      {/* Social credit hero */}
      <Box px="md" pt="sm">
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
                  شاخص اعتماد در شبکه‌ی حلقه‌ی شما
                </Text>
              </div>
            </Group>
            <div style={{ textAlign: "left" }}>
              <Text fw={800} fz={28} c="brand.7" lh={1}>
                {toPersianDigits(credit.score)}
                <Text span fz="xs" c="dimmed" fw={700}>
                  {" "}
                  / ۱۰۰
                </Text>
              </Text>
              <Text fz="xs" fw={800} c="brand.6" ta="left">
                {credit.label}
              </Text>
            </div>
          </Group>
          <Progress value={credit.score} color="brand" radius="xl" size="md" />
          <Text fz={11} c="dimmed" mt={6} mb="md">
            نرخ پاسخگویی {formatPercent(credit.responseRate)} · بر اساس معامله، تأیید و فعالیت در شبکه
          </Text>
          <SimpleGrid cols={2} spacing="xs">
            <Metric icon="🤝" value={credit.successfulDeals} label="معامله‌ی موفق" />
            <Metric icon="🛡️" value={credit.endorsementsReceived} label="تأیید دریافتی" />
            <Metric icon="✅" value={credit.endorsementsGiven} label="تأیید داده‌شده" />
            <Metric icon="👥" value={credit.circleSize} label="نفر در حلقه‌ی من" />
          </SimpleGrid>
        </Card>
      </Box>

      {/* My listings */}
      <Section title={`آگهی‌های من (${toPersianDigits(myListings.length)})`}>
        {myListings.length === 0 ? (
          <EmptyHint text="هنوز آگهی‌ای ثبت نکرده‌اید." href="/new" cta="ثبت اولین آگهی" />
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
                      {l.price != null ? formatPrice(l.price) : "رایگان / توافقی"} · {l.postedAt}
                    </Text>
                  </Stack>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Section>

      {hostedEvents.length > 0 && (
        <Section title={`رویدادهای من (${toPersianDigits(hostedEvents.length)})`}>
          <Stack gap="xs">
            {hostedEvents.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </Stack>
        </Section>
      )}

      {attendingEvents.length > 0 && (
        <Section title={`رویدادهایی که می‌روم (${toPersianDigits(attendingEvents.length)})`}>
          <Stack gap="xs">
            {attendingEvents.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </Stack>
        </Section>
      )}

      {/* Saved */}
      <Section id="saved" title={`نشان‌شده‌ها (${toPersianDigits(savedListings.length)})`}>
        {savedListings.length === 0 ? (
          <Card withBorder radius="lg" p="lg" ta="center">
            <ThemeIcon size={48} radius="xl" variant="light" color="pink" mx="auto" mb="sm">
              <HeartIcon className="w-6 h-6" />
            </ThemeIcon>
            <Text fz="sm" c="dimmed" style={{ lineHeight: 1.7 }}>
              هنوز آگهی‌ای نشان نکرده‌اید. روی ❤ در هر آگهی بزنید تا اینجا ذخیره شود.
            </Text>
            <Anchor component={Link} href="/" fz="sm" fw={600} mt="md">
              دیدن آگهی‌ها
            </Anchor>
          </Card>
        ) : (
          <Stack gap="sm">
            {savedListings.map((l) => (
              <MListingCard key={l.id} listing={l} compactTrust />
            ))}
          </Stack>
        )}
      </Section>

      {/* Badges given */}
      <Section title="تأییدهایی که داده‌ام">
        {myGivenBadges.length === 0 ? (
          <Text fz="xs" c="dimmed">
            هنوز آگهی‌ای را تأیید نکرده‌اید. در صفحه‌ی هر آگهی می‌توانید نشان اعتماد خود را اضافه کنید.
          </Text>
        ) : (
          <Stack gap="xs">
            {myGivenBadges.map(({ l, e }, i) => (
              <Card
                key={i}
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
        )}
      </Section>

      {/* Settings */}
      <Section title="تنظیمات">
        <Card withBorder radius="lg" p="md">
          <Stack gap="md">
            <div>
              <Text fz="xs" c="dimmed" mb={6}>
                مدل نمایش (کتابخانه طراحی)
              </Text>
              <UIModeControl />
            </div>
            <div>
              <Text fz="xs" c="dimmed" mb={6}>
                حالت نمایش برنامه
              </Text>
              <ThemeControl />
            </div>
          </Stack>
        </Card>
      </Section>

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
          // Home renders in every library — go there so the change is visible.
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
      <Text fz={11} c="dimmed" mt={6} style={{ lineHeight: 1.7 }}>
        Mantine روی همه‌ی صفحات؛ Chakra، MUI و HeroUI فقط روی صفحه‌ی اصلی و آگهی.
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

function Metric({ icon, value, label }: { icon: string; value: number; label: string }) {
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
        <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
          <Text fw={500} fz="sm" truncate>
            {eventKindEmoji[event.kind]} {event.title}
          </Text>
          <Text fz="xs" c="dimmed" truncate>
            📅 {formatEventDateDisplay(event.date)}
            {event.time ? ` · ${event.time}` : ""} · 📍 {event.location}
          </Text>
        </Stack>
      </Group>
    </Card>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box component="section" id={id} px="md" pt="lg" style={id ? { scrollMarginTop: 96 } : undefined}>
      <Text fw={700} fz="sm" c="dimmed" mb="xs">
        {title}
      </Text>
      {children}
    </Box>
  );
}

function EmptyHint({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <Card withBorder radius="lg" p="lg" ta="center">
      <Text fz="sm" c="dimmed" mb="sm">
        {text}
      </Text>
      <Button component={Link} href={href} size="sm">
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
            آواتار از حرف اول نام و رنگ ثابت ساخته می‌شود
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
