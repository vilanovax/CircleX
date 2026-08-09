"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
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
  "تازه‌وارد": "text-ink-muted",
};

export default function ClassicProfile() {
  const { me, people, listings, events, saved, updateProfile, hydrated } =
    useStore();
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

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Header title="پروفایل" />

      <div className="px-4 pt-3 space-y-3 listing-detail-rise">
        {/* Identity + score — one composition */}
        <div className="card overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <Avatar name={me.name} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-[17px] font-extrabold text-ink dark:text-zinc-100 truncate">
                      {me.name}
                    </h2>
                    {socialCredit.verified && (
                      <p className="flex items-center gap-1 text-[11px] font-semibold text-levelA mt-0.5">
                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                        {socialCredit.verifiedLabel}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEdit(true)}
                    aria-label="ویرایش پروفایل"
                    className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/15 rounded-xl px-2.5 py-1.5 active:scale-95 transition-transform"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                    ویرایش
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-[11px] text-ink-muted dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1">
                    <MapPinIcon className="w-3 h-3 text-ink-faint" />
                    {me.city || "شهر ثبت نشده"}
                  </span>
                  <span className="text-stone-300 dark:text-zinc-600" aria-hidden>
                    ·
                  </span>
                  <span>عضو از {socialCredit.memberSince}</span>
                  <span className="text-stone-300 dark:text-zinc-600" aria-hidden>
                    ·
                  </span>
                  <span>فعال {socialCredit.lastActive}</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 flex items-stretch gap-2">
              <div className="flex-1 rounded-2xl bg-gradient-to-l from-brand-50 to-levelA/10 dark:from-brand-500/15 dark:to-levelA/10 px-3 py-2.5 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-medium text-ink-muted">
                    اعتبار اجتماعی
                  </p>
                  <p
                    className={`text-[12px] font-bold mt-0.5 ${SCORE_TINT[socialCredit.label]}`}
                  >
                    {socialCredit.label}
                  </p>
                </div>
                <p className="text-[22px] font-extrabold text-ink dark:text-zinc-50 nums leading-none">
                  {toPersianDigits(socialCredit.score)}
                  <span className="text-[11px] text-ink-faint font-bold">
                    {" "}
                    /۱۰۰
                  </span>
                </p>
              </div>
              <Link
                href="/circle"
                className="rounded-2xl bg-stone-50 dark:bg-zinc-800/80 px-3 py-2.5 text-center min-w-[4.5rem] active:scale-[0.98] transition-transform"
              >
                <p className="text-[15px] font-extrabold text-ink dark:text-zinc-100 nums leading-none">
                  {toPersianDigits(myCircle.length)}
                </p>
                <p className="text-[10px] text-ink-muted mt-1">حلقه</p>
              </Link>
            </div>
          </div>
        </div>

        <SocialCreditCard
          stats={socialCredit}
          subtitle="جزئیات شاخص اعتماد"
          hideVerified
          collapsible
          defaultCollapsed
        />

        {/* Activity — one section, tabs instead of empty stacks */}
        <section id="activity" className="scroll-mt-24">
          <div className="flex items-center justify-between gap-2 mb-2 px-0.5">
            <h2 className="text-[13px] font-bold text-ink dark:text-zinc-200">
              فعالیت من
            </h2>
            {tab === "listings" && (
              <Link
                href="/new"
                className="text-[11px] font-bold text-brand-600 dark:text-brand-400"
              >
                ثبت آگهی ‹
              </Link>
            )}
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 -mx-0.5 px-0.5 scrollbar-none">
            {(
              [
                {
                  id: "listings" as const,
                  label: "آگهی‌ها",
                  count: myListings.length,
                },
                {
                  id: "events" as const,
                  label: "رویدادها",
                  count: allMyEvents.length,
                },
                {
                  id: "saved" as const,
                  label: "نشان‌ها",
                  count: savedListings.length,
                },
                {
                  id: "endorsements" as const,
                  label: "تأییدها",
                  count: myGivenBadges.length,
                },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`shrink-0 chip !px-3 !py-1.5 !text-[12px] border transition-colors ${
                  tab === t.id
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-[color:var(--circle-surface)] dark:bg-zinc-900 border-stone-200 dark:border-zinc-700 text-ink-muted"
                }`}
              >
                {t.label}
                <span
                  className={`ms-1 nums text-[11px] ${
                    tab === t.id ? "text-white/85" : "text-ink-faint"
                  }`}
                >
                  {toPersianDigits(t.count)}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-2" id={tab === "saved" ? "saved" : undefined}>
            {tab === "listings" &&
              (myListings.length === 0 ? (
                <EmptyCard
                  title="هنوز آگهی‌ای نداری"
                  text="چیزی برای فروش، امانت یا هدیه ثبت کن تا حلقه‌ات ببیند."
                  href="/new"
                  cta="ثبت آگهی"
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
                />
              ) : (
                <div className="space-y-2">
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
          <h2 className="text-[13px] font-bold text-ink dark:text-zinc-200 mb-2 px-0.5">
            ظاهر برنامه
          </h2>
          <div className="card p-3.5 space-y-4">
            <div>
              <p className="text-[11px] text-ink-muted dark:text-zinc-400 mb-2">
                مدل نمایش
              </p>
              <UIModeSegmented />
            </div>
            <div className="border-t border-stone-100 dark:border-zinc-800 pt-3.5">
              <p className="text-[11px] text-ink-muted dark:text-zinc-400 mb-2">
                حالت روشن / تیره
              </p>
              <ThemeSegmented />
            </div>
          </div>
        </section>
      </div>

      {showEdit && (
        <EditProfileSheet
          name={me.name}
          city={me.city ?? ""}
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
  onClose,
  onSave,
}: {
  name: string;
  city: string;
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
          <button type="button" onClick={onClose} className="btn-ghost flex-1 !py-3.5">
            انصراف
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => onSave({ name: name.trim(), city: city.trim() })}
            className="btn-primary flex-1 !py-3.5"
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
        <Avatar name={name.trim() || initialName} size="lg" />
        <p className="text-[11px] text-ink-faint mt-2 text-center">
          آواتار از حرف اول نام ساخته می‌شود
        </p>
      </div>

      <label className="block text-sm font-medium mb-1 text-ink">نام</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="نام شما"
        className="field mb-4"
        autoFocus
      />

      <label className="block text-sm font-medium mb-1 text-ink">شهر</label>
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
      <div className="w-11 h-11 rounded-xl bg-stone-50 dark:bg-zinc-800 flex items-center justify-center text-xl shrink-0">
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
  icon,
}: {
  title: string;
  text: string;
  href: string;
  cta: string;
  icon?: "heart";
}) {
  return (
    <div className="card px-4 py-5 text-center">
      {icon === "heart" ? (
        <div className="w-11 h-11 rounded-2xl bg-pink-50 dark:bg-pink-500/15 text-pink-600 flex items-center justify-center mx-auto mb-2.5">
          <HeartIcon className="w-5 h-5" />
        </div>
      ) : null}
      <p className="text-[13px] font-bold text-ink dark:text-zinc-100">{title}</p>
      <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed max-w-xs mx-auto">
        {text}
      </p>
      <Link
        href={href}
        className="inline-flex mt-3 text-[12px] font-bold text-brand-600 dark:text-brand-400"
      >
        {cta} ‹
      </Link>
    </div>
  );
}
