"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import ListingCard from "@/components/ListingCard";
import ListingImage from "@/components/ListingImage";
import SocialCreditCard from "@/components/SocialCreditCard";
import SheetShell from "@/components/SheetShell";
import {
  CalendarIcon,
  ClockIcon,
  HeartIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  ShieldCheckIcon,
} from "@/components/Icons";
import {
  badgeLabels,
  eventKindEmoji,
  formatPrice,
} from "@/lib/labels";
import { buildSocialCredit } from "@/lib/social-credit";
import { formatEventDateDisplay, toPersianDigits } from "@/lib/persian";
import { ThemeSegmented } from "@/components/ThemeToggle";
import { UIModeSegmented } from "@/components/UIModeToggle";
import { useToast } from "@/components/Toast";
import { ProfileSkeleton } from "@/components/Skeleton";
import type { CircleEvent } from "@/lib/types";

type ActivityTab = "listings" | "events" | "saved" | "endorsements";

const SCORE_TINT: Record<string, string> = {
  عالی: "text-levelA",
  خوب: "text-brand-600",
  متوسط: "text-amber-600",
  تازه‌وارد: "text-ink-muted",
};

function formatPhoneDisplay(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) {
    return toPersianDigits(`${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`);
  }
  return toPersianDigits(phone);
}

export default function ClassicProfile() {
  const {
    me,
    people,
    listings,
    events,
    saved,
    sessionPhone,
    updateProfile,
    signOut,
    hydrated,
  } = useStore();
  const router = useRouter();
  const { show } = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [tab, setTab] = useState<ActivityTab>("listings");

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

  const socialCredit = buildSocialCredit(me, listings, myCircle.length);

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

    // Prefer a tab that already has content (skip if user landed on #saved).
    if (myListings.length > 0) return;
    if (allMyEvents.length > 0) setTab("events");
    else if (savedListings.length > 0) setTab("saved");
    else if (myGivenBadges.length > 0) setTab("endorsements");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once after hydrate
  }, [hydrated]);

  if (!hydrated) {
    return (
      <main className="pb-24 min-h-[100dvh]">
        <Header title="پروفایل" />
        <ProfileSkeleton />
        <BottomNav />
      </main>
    );
  }

  const activityTabs = [
    { id: "listings" as const, label: "آگهی‌ها", count: myListings.length },
    { id: "events" as const, label: "رویدادها", count: allMyEvents.length },
    { id: "saved" as const, label: "نشان‌ها", count: savedListings.length },
    {
      id: "endorsements" as const,
      label: "تأییدها",
      count: myGivenBadges.length,
    },
  ];

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Header title="پروفایل" />

      <div className="px-4 pt-3 space-y-3.5 listing-detail-rise">
        {/* Identity — one composition */}
        <section className="card overflow-hidden">
          <div
            className="relative px-4 pt-4 pb-3"
            style={{
              background:
                "linear-gradient(145deg, rgba(74,58,143,0.09) 0%, rgba(31,107,66,0.06) 55%, transparent 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute -top-10 -end-8 w-36 h-36 rounded-full border border-brand-300/25 dark:border-brand-400/15"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute top-2 end-10 w-16 h-16 rounded-full border border-brand-300/20 dark:border-brand-400/10"
              aria-hidden
            />

            <div className="relative flex items-start gap-3.5">
              <div className="relative shrink-0">
                <div className="rounded-full ring-[3px] ring-white dark:ring-zinc-900 shadow-md shadow-brand-600/15">
                  <Avatar name={me.name} src={me.avatar} size="lg" />
                </div>
                {socialCredit.verified && (
                  <span
                    className="absolute -bottom-0.5 -start-0.5 w-6 h-6 rounded-full bg-levelA text-white flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 shadow-sm"
                    title={socialCredit.verifiedLabel}
                  >
                    <ShieldCheckIcon className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-[1.2rem] font-extrabold text-ink dark:text-zinc-50 tracking-tight truncate">
                      {me.name}
                    </h2>
                    {socialCredit.verified && (
                      <p className="text-[11px] font-semibold text-levelA mt-0.5">
                        {socialCredit.verifiedLabel}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEdit(true)}
                    aria-label="ویرایش پروفایل"
                    className="shrink-0 flex items-center gap-1.5 text-[12px] font-bold text-brand-700 dark:text-brand-300 bg-[color:var(--circle-surface)] dark:bg-zinc-900/80 ring-1 ring-brand-200/80 dark:ring-brand-500/30 rounded-xl px-3 py-2 shadow-sm active:scale-95 transition-transform"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                    ویرایش
                  </button>
                </div>

                <ul className="flex flex-wrap gap-1.5 mt-2.5">
                  <MetaChip
                    icon={<MapPinIcon className="w-3 h-3" />}
                    label={me.city || "شهر ثبت نشده"}
                  />
                  <MetaChip label={`عضو از ${socialCredit.memberSince}`} />
                  <MetaChip label={`فعال ${socialCredit.lastActive}`} />
                </ul>
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 pt-1">
            <div className="flex items-stretch gap-2">
              <div className="flex-1 rounded-2xl bg-gradient-to-l from-brand-50 via-brand-50/60 to-levelA/10 dark:from-brand-500/20 dark:via-brand-500/10 dark:to-levelA/10 px-3.5 py-3 ring-1 ring-brand-100/80 dark:ring-brand-500/20">
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold text-ink-muted tracking-wide">
                      اعتبار اجتماعی
                    </p>
                    <p
                      className={`text-[13px] font-extrabold mt-0.5 ${SCORE_TINT[socialCredit.label]}`}
                    >
                      {socialCredit.label}
                    </p>
                  </div>
                  <p className="text-[1.6rem] font-extrabold text-ink dark:text-zinc-50 nums leading-none tracking-tight">
                    {toPersianDigits(socialCredit.score)}
                    <span className="text-[11px] text-ink-faint font-bold">
                      {" "}
                      /۱۰۰
                    </span>
                  </p>
                </div>
                <div
                  className="mt-2.5 h-1.5 rounded-full bg-white/70 dark:bg-zinc-950/40 overflow-hidden"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-levelA to-brand-600 transition-[width] duration-500 ease-out"
                    style={{ width: `${socialCredit.score}%` }}
                  />
                </div>
              </div>

              <Link
                href="/circle"
                className="rounded-2xl bg-stone-50 dark:bg-zinc-800/80 px-3.5 py-3 text-center min-w-[4.75rem] ring-1 ring-stone-200/70 dark:ring-zinc-700 active:scale-[0.98] transition-transform flex flex-col items-center justify-center"
              >
                <p className="text-[1.35rem] font-extrabold text-ink dark:text-zinc-100 nums leading-none">
                  {toPersianDigits(myCircle.length)}
                </p>
                <p className="text-[10px] font-semibold text-ink-muted mt-1.5">
                  حلقه
                </p>
              </Link>
            </div>
          </div>
        </section>

        <SocialCreditCard
          stats={socialCredit}
          subtitle="جزئیات شاخص اعتماد"
          hideVerified
          collapsible
          defaultCollapsed
        />

        {/* Activity */}
        <section id="activity" className="scroll-mt-24">
          <div className="flex items-center justify-between gap-2 mb-2.5 px-0.5">
            <h2 className="text-[13px] font-extrabold text-ink dark:text-zinc-200">
              فعالیت من
            </h2>
            {tab === "listings" && (
              <Link
                href="/new"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                ثبت آگهی
              </Link>
            )}
          </div>

          <div
            className="flex gap-1 p-1 rounded-2xl bg-stone-100/90 dark:bg-zinc-800/80 overflow-x-auto no-scrollbar"
            role="tablist"
            aria-label="نوع فعالیت"
          >
            {activityTabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 flex-1 min-w-[4.5rem] rounded-xl px-2.5 py-2 text-[12px] font-bold transition-all duration-200 ${
                    active
                      ? "bg-brand-600 text-white shadow-md shadow-brand-600/25"
                      : "text-ink-muted dark:text-zinc-400 active:bg-white/60 dark:active:bg-zinc-700/50"
                  }`}
                >
                  {t.label}
                  <span
                    className={`ms-1 nums text-[11px] font-semibold ${
                      active ? "text-white/85" : "text-ink-faint"
                    }`}
                  >
                    {toPersianDigits(t.count)}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className="mt-2.5"
            id={tab === "saved" ? "saved" : undefined}
            role="tabpanel"
          >
            {tab === "listings" &&
              (myListings.length === 0 ? (
                <EmptyCard
                  title="هنوز آگهی‌ای نداری"
                  text="چیزی برای فروش، امانت یا هدیه ثبت کن تا حلقه‌ات ببیند."
                  href="/new"
                  cta="ثبت آگهی"
                  icon="plus"
                />
              ) : (
                <div className="card divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden">
                  {myListings.map((l) => (
                    <Link
                      key={l.id}
                      href={`/listing/${l.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 active:bg-stone-50/80 dark:active:bg-zinc-800/60"
                    >
                      <ListingImage
                        image={l.image}
                        alt={l.title}
                        size="sm"
                        category={l.category}
                        type={l.type}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[13px] text-ink dark:text-zinc-100 truncate">
                          {l.title}
                        </p>
                        <p className="text-[11px] text-ink-muted mt-0.5">
                          {l.price != null ? (
                            <span className="nums">{formatPrice(l.price)}</span>
                          ) : (
                            "رایگان / توافقی"
                          )}{" "}
                          · {l.postedAt}
                        </p>
                      </div>
                      <span className="text-ink-faint" aria-hidden>
                        ‹
                      </span>
                    </Link>
                  ))}
                </div>
              ))}

            {tab === "events" &&
              (allMyEvents.length === 0 ? (
                <EmptyCard
                  title="رویدادی در تقویمت نیست"
                  text="به یک رویداد بپیوند یا خودت یکی بساز."
                  href="/"
                  cta="دیدن رویدادها"
                  icon="calendar"
                />
              ) : (
                <div className="space-y-2.5">
                  {hostedEvents.length > 0 && (
                    <EventGroup label="میزبانی من" events={hostedEvents} />
                  )}
                  {attendingEvents.length > 0 && (
                    <EventGroup
                      label="شرکت می‌کنم"
                      events={attendingEvents}
                    />
                  )}
                </div>
              ))}

            {tab === "saved" &&
              (savedListings.length === 0 ? (
                <EmptyCard
                  title="هنوز چیزی نشان نکرده‌ای"
                  text="روی ❤ هر آگهی بزن تا اینجا جمع شود."
                  href="/"
                  cta="دیدن آگهی‌ها"
                  icon="heart"
                />
              ) : (
                <div className="space-y-2.5">
                  {savedListings.map((l) => (
                    <ListingCard key={l.id} listing={l} compactTrust />
                  ))}
                </div>
              ))}

            {tab === "endorsements" &&
              (myGivenBadges.length === 0 ? (
                <EmptyCard
                  title="هنوز تأییدی نداده‌ای"
                  text="از صفحه‌ی آگهی می‌توانی نشان اعتماد بدهی."
                  href="/"
                  cta="رفتن به آگهی‌ها"
                  icon="shield"
                />
              ) : (
                <div className="card divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden">
                  {myGivenBadges.map(({ l, e }, i) => (
                    <Link
                      key={`${l.id}-${e.type}-${i}`}
                      href={`/listing/${l.id}`}
                      className="flex items-center gap-2.5 px-3.5 py-3 text-[13px] active:bg-stone-50/80"
                    >
                      <span className="text-[11px] font-semibold text-levelA shrink-0 rounded-md bg-levelA/10 px-1.5 py-0.5">
                        {badgeLabels[e.type]}
                      </span>
                      <span className="font-medium text-ink dark:text-zinc-100 truncate flex-1">
                        {l.title}
                      </span>
                      <span className="text-ink-faint" aria-hidden>
                        ‹
                      </span>
                    </Link>
                  ))}
                </div>
              ))}
          </div>
        </section>

        {/* Settings */}
        <section>
          <h2 className="text-[13px] font-extrabold text-ink dark:text-zinc-200 mb-2.5 px-0.5">
            ظاهر برنامه
          </h2>
          <div className="card p-3.5 space-y-4">
            <div>
              <p className="text-[11px] font-semibold text-ink-muted dark:text-zinc-400 mb-2">
                مدل نمایش
              </p>
              <UIModeSegmented />
            </div>
            <div className="border-t border-stone-100 dark:border-zinc-800 pt-3.5">
              <p className="text-[11px] font-semibold text-ink-muted dark:text-zinc-400 mb-2">
                حالت روشن / تیره
              </p>
              <ThemeSegmented />
            </div>
          </div>
        </section>

        {sessionPhone && (
          <section>
            <h2 className="text-[13px] font-extrabold text-ink dark:text-zinc-200 mb-2.5 px-0.5">
              حساب
            </h2>
            <div className="card p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-stone-50/80 dark:bg-zinc-800/50 px-3 py-2.5">
                <span className="text-[12px] font-medium text-ink-muted">
                  موبایل
                </span>
                <span
                  className="text-[13px] font-extrabold nums text-ink dark:text-zinc-100 tracking-wide"
                  dir="ltr"
                >
                  {formatPhoneDisplay(sessionPhone)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  signOut();
                  show("خارج شدی — دوباره وارد شو");
                  router.replace("/");
                }}
                className="w-full text-[13px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl py-3.5 active:scale-[0.99] transition-transform"
              >
                خروج از حساب
              </button>
            </div>
          </section>
        )}
      </div>

      {showEdit && (
        <EditProfileSheet
          name={me.name}
          city={me.city ?? ""}
          avatar={me.avatar}
          onClose={() => setShowEdit(false)}
          onSave={(input) => {
            updateProfile(input);
            setShowEdit(false);
            show("پروفایل به‌روزرسانی شد ✓");
          }}
        />
      )}

      <BottomNav />
    </main>
  );
}

function MetaChip({
  label,
  icon,
}: {
  label: string;
  icon?: ReactNode;
}) {
  return (
    <li className="inline-flex items-center gap-1 rounded-lg bg-[color:var(--circle-surface)]/90 dark:bg-zinc-900/70 ring-1 ring-stone-200/70 dark:ring-zinc-700 px-2 py-1 text-[11px] font-medium text-ink-muted dark:text-zinc-300">
      {icon ? (
        <span className="text-ink-faint shrink-0" aria-hidden>
          {icon}
        </span>
      ) : null}
      {label}
    </li>
  );
}

function EventGroup({
  label,
  events,
}: {
  label: string;
  events: CircleEvent[];
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-ink-muted mb-1.5 px-0.5">
        {label}
        <span className="ms-1 nums text-ink-faint">
          {toPersianDigits(events.length)}
        </span>
      </p>
      <div className="card divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden">
        {events.map((e) => (
          <EventRow key={e.id} event={e} />
        ))}
      </div>
    </div>
  );
}

function EditProfileSheet({
  name: initialName,
  city: initialCity,
  avatar,
  onClose,
  onSave,
}: {
  name: string;
  city: string;
  avatar?: string;
  onClose: () => void;
  onSave: (input: { name: string; city: string }) => void;
}) {
  const [name, setName] = useState(initialName);
  const [city, setCity] = useState(initialCity);
  const canSave = Boolean(name.trim());

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="edit-profile-title"
      zClass="z-50"
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost flex-1 !py-3.5"
          >
            انصراف
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => onSave({ name: name.trim(), city: city.trim() })}
            className="btn-primary flex-1 !py-3.5 shadow-lg shadow-brand-600/20"
          >
            ذخیره
          </button>
        </div>
      }
    >
      <h2
        id="edit-profile-title"
        className="font-extrabold text-[1.15rem] mb-4 text-ink dark:text-zinc-100"
      >
        ویرایش پروفایل
      </h2>

      <div className="flex flex-col items-center mb-5">
        <div className="rounded-full ring-[3px] ring-brand-100 dark:ring-brand-500/30 shadow-md shadow-brand-600/10">
          <Avatar name={name.trim() || initialName} src={avatar} size="lg" />
        </div>
        <p className="text-[11px] text-ink-faint mt-2.5 text-center">
          آواتار اختصاصی پروفایل شما
        </p>
      </div>

      <label className="block text-[12px] font-semibold mb-1.5 text-ink-muted">
        نام
      </label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="نام شما"
        className="field mb-4"
        autoFocus
      />

      <label className="block text-[12px] font-semibold mb-1.5 text-ink-muted">
        شهر
      </label>
      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="مثلاً تهران"
        className="field mb-2"
      />
    </SheetShell>
  );
}

function EventRow({ event }: { event: CircleEvent }) {
  return (
    <Link
      href={`/event/${event.id}`}
      className="flex items-center gap-3 px-3 py-2.5 active:bg-stone-50/80 dark:active:bg-zinc-800/60"
    >
      <div className="w-11 h-11 rounded-xl bg-stone-50 dark:bg-zinc-800 flex items-center justify-center text-xl shrink-0 ring-1 ring-stone-200/50 dark:ring-zinc-700">
        {event.image}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[13px] text-ink dark:text-zinc-100 truncate">
          {eventKindEmoji[event.kind]} {event.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <CalendarIcon className="w-3 h-3 text-ink-faint" />
            {formatEventDateDisplay(event.date)}
          </span>
          {event.time && (
            <span className="inline-flex items-center gap-1 nums">
              <ClockIcon className="w-3 h-3 text-ink-faint" />
              {toPersianDigits(event.time)}
            </span>
          )}
          <span className="inline-flex items-center gap-1 truncate">
            <MapPinIcon className="w-3 h-3 text-ink-faint shrink-0" />
            <span className="truncate">{event.location}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyCard({
  title,
  text,
  href,
  cta,
  icon = "plus",
}: {
  title: string;
  text: string;
  href: string;
  cta: string;
  icon?: "heart" | "plus" | "calendar" | "shield";
}) {
  return (
    <div className="card px-5 py-7 text-center relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(74,58,143,0.08), transparent)",
        }}
        aria-hidden
      />
      <div className="relative">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ring-1 ${
            icon === "heart"
              ? "bg-pink-50 dark:bg-pink-500/15 text-pink-600 ring-pink-100 dark:ring-pink-500/20"
              : icon === "calendar"
                ? "bg-levelB/10 text-levelB ring-levelB/20"
                : icon === "shield"
                  ? "bg-levelA/10 text-levelA ring-levelA/20"
                  : "bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300 ring-brand-100 dark:ring-brand-500/25"
          }`}
        >
          {icon === "heart" ? (
            <HeartIcon className="w-5 h-5" />
          ) : icon === "calendar" ? (
            <CalendarIcon className="w-5 h-5" />
          ) : icon === "shield" ? (
            <ShieldCheckIcon className="w-5 h-5" />
          ) : (
            <PlusIcon className="w-5 h-5" />
          )}
        </div>
        <p className="text-[14px] font-extrabold text-ink dark:text-zinc-100">
          {title}
        </p>
        <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed max-w-[16rem] mx-auto">
          {text}
        </p>
        <Link
          href={href}
          className="inline-flex items-center justify-center gap-1.5 mt-4 btn-primary !py-2.5 !px-5 !text-[13px] shadow-md shadow-brand-600/20"
        >
          {cta}
          <span aria-hidden>‹</span>
        </Link>
      </div>
    </div>
  );
}
