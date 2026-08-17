"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { activeCircle } from "@/lib/circle-member";
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
  CameraIcon,
  ClockIcon,
  HeartIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  ShieldCheckIcon,
} from "@/components/Icons";
import {
  isAvatarImage,
  PICKER_AVATARS,
  withBasePath,
} from "@/lib/avatar";
import { badgeLabels, eventKindEmoji, formatPrice } from "@/lib/labels";
import { buildSocialCredit } from "@/lib/social-credit";
import { formatEventDateDisplay, toPersianDigits } from "@/lib/persian";
import { CONCEPT_TIP_KEY } from "@/lib/home-tip";
import { ThemeSegmented } from "@/components/ThemeToggle";
import { useToast } from "@/components/Toast";
import { ProfileSkeleton } from "@/components/Skeleton";
import type { CircleEvent, Listing } from "@/lib/types";

type ActivityTab = "listings" | "events" | "saved" | "endorsements";

export default function ClassicProfile() {
  const me = useStore((s) => s.me);
  const people = useStore((s) => s.people);
  const listings = useStore((s) => s.listings);
  const events = useStore((s) => s.events);
  const saved = useStore((s) => s.saved);
  const sessionPhone = useStore((s) => s.sessionPhone);
  const updateProfile = useStore((s) => s.updateProfile);
  const signOut = useStore((s) => s.signOut);
  const hydrated = useStore((s) => s.hydrated);
  const router = useRouter();
  const { show } = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [tab, setTab] = useState<ActivityTab>("listings");
  const [hashSaved, setHashSaved] = useState(false);

  const myCircleCount = useMemo(() => activeCircle(people).length, [people]);

  const myListings = useMemo(
    () => listings.filter((l) => l.sellerId === "me"),
    [listings],
  );
  const liveListings = useMemo(
    () => myListings.filter((l) => l.dealStatus !== "inactive"),
    [myListings],
  );
  const inactiveListings = useMemo(
    () => myListings.filter((l) => l.dealStatus === "inactive"),
    [myListings],
  );
  const listingsSplit =
    liveListings.length > 0 && inactiveListings.length > 0;

  const savedListings = useMemo(
    () =>
      saved
        .map((id) => listings.find((l) => l.id === id))
        .filter((l): l is NonNullable<typeof l> => Boolean(l)),
    [saved, listings],
  );

  const { hostedEvents, attendingEvents, allMyEvents } = useMemo(() => {
    const hosted = events.filter((e) => e.hostId === "me");
    const attending = events.filter(
      (e) => e.hostId !== "me" && e.attendees.includes("me"),
    );
    return {
      hostedEvents: hosted,
      attendingEvents: attending,
      allMyEvents: [...hosted, ...attending],
    };
  }, [events]);

  const socialCredit = useMemo(
    () => buildSocialCredit(me, listings, myCircleCount),
    [me, listings, myCircleCount],
  );

  const myGivenBadges = useMemo(
    () =>
      listings.flatMap((l) =>
        l.endorsements
          .filter((e) => e.personId === "me")
          .map((e) => ({ l, e })),
      ),
    [listings],
  );

  const activityTabs = useMemo(
    () => [
      { id: "listings" as const, label: "آگهی‌ها", count: myListings.length },
      { id: "events" as const, label: "رویدادها", count: allMyEvents.length },
      { id: "saved" as const, label: "نشان‌ها", count: savedListings.length },
      {
        id: "endorsements" as const,
        label: "تأییدهایی که داده‌ام",
        count: myGivenBadges.length,
      },
    ],
    [
      myListings.length,
      allMyEvents.length,
      savedListings.length,
      myGivenBadges.length,
    ],
  );

  const visibleTabs = useMemo(
    () =>
      activityTabs.filter(
        (t) => t.count > 0 || (hashSaved && t.id === "saved"),
      ),
    [activityTabs, hashSaved],
  );
  const showTabBar = visibleTabs.length >= 2;
  const activeTab = visibleTabs.some((t) => t.id === tab)
    ? tab
    : (visibleTabs[0]?.id ?? "listings");

  const metaLine = [me.city, socialCredit.lastActive ? `فعال ${socialCredit.lastActive}` : null]
    .filter(Boolean)
    .join(" · ");

  useEffect(() => {
    if (!hydrated) return;

    if (window.location.hash === "#saved") {
      setHashSaved(true);
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

      <div className="px-4 pt-3 space-y-3.5 listing-detail-rise">
        <section className="card p-3.5">
          <div className="flex items-start gap-3">
            <Avatar name={me.name} src={me.avatar} size="lg" showLevel={false} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-[1.15rem] font-extrabold text-ink dark:text-zinc-50 tracking-tight truncate leading-tight">
                  {me.name}
                </h2>
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
              {metaLine ? (
                <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1 leading-snug">
                  {metaLine}
                </p>
              ) : null}
              <Link
                href="/circle"
                className="inline-block text-[12px] font-bold text-brand-700 dark:text-brand-300 mt-1.5"
              >
                {toPersianDigits(myCircleCount)} نفر در حلقه ‹
              </Link>
            </div>
          </div>
        </section>

        <SocialCreditCard
          stats={socialCredit}
          title="سابقهٔ تو در حلقه"
          subtitle="اعضای حلقه این را روی پروفایلت می‌بینند — امتیاز رسمی نیست"
          hideVerified
          collapsible
          defaultCollapsed
          forSelf
        />

        <section id="activity" className="scroll-mt-24">
          {showTabBar ? (
            <div
              className="flex gap-1 p-1 rounded-2xl bg-stone-100/90 dark:bg-zinc-800/80 overflow-x-auto no-scrollbar mb-2.5"
              role="tablist"
              aria-label="نوع فعالیت"
            >
              {visibleTabs.map((t) => {
                const active = activeTab === t.id;
                const listingsTab = t.id === "listings";
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
                    {listingsTab && listingsSplit ? (
                      <span
                        className={`ms-1 nums text-[11px] font-semibold ${
                          active ? "text-white/85" : "text-ink-faint"
                        }`}
                      >
                        {toPersianDigits(liveListings.length)}
                        <span
                          className={
                            active ? "text-white/55" : "text-ink-faint/80"
                          }
                        >
                          {" "}
                          · {toPersianDigits(inactiveListings.length)}
                        </span>
                      </span>
                    ) : (
                      <span
                        className={`ms-1 nums text-[11px] font-semibold ${
                          active ? "text-white/85" : "text-ink-faint"
                        }`}
                      >
                        {toPersianDigits(t.count)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : visibleTabs.length === 1 &&
            activeTab === "listings" &&
            listingsSplit ? (
            <h2 className="text-[13px] font-extrabold text-ink dark:text-zinc-200 mb-2.5 px-0.5">
              آگهی‌ها
            </h2>
          ) : visibleTabs.length === 1 ? (
            <div className="flex items-center gap-2 mb-2.5 px-0.5">
              <h2 className="text-[13px] font-extrabold text-ink dark:text-zinc-200">
                {visibleTabs[0].label}
              </h2>
              <span className="inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center rounded-full bg-stone-100 dark:bg-zinc-800 text-[11px] font-bold text-ink-muted nums">
                {toPersianDigits(visibleTabs[0].count)}
              </span>
            </div>
          ) : visibleTabs.length === 0 ? (
            <h2 className="text-[13px] font-extrabold text-ink dark:text-zinc-200 mb-2.5 px-0.5">
              فعالیت من
            </h2>
          ) : null}

          <div
            className="mt-0"
            id={activeTab === "saved" ? "saved" : undefined}
            role="tabpanel"
          >
            {activeTab === "listings" ? (
              myListings.length === 0 ? (
                <EmptyCard
                  title="هنوز آگهی‌ای نداری"
                  text="چیزی برای فروش، امانت یا هدیه ثبت کن تا حلقه ببیند."
                  href="/new"
                  cta="آگهی جدید"
                  icon="plus"
                />
              ) : listingsSplit ? (
                <div className="space-y-3">
                  <ListingGroup
                    label="فعال"
                    hint="در فید حلقه دیده می‌شود"
                    listings={liveListings}
                  />
                  <ListingGroup
                    label="غیرفعال"
                    hint="از فید برداشته شده؛ در پروفایل می‌ماند"
                    listings={inactiveListings}
                    inactive
                  />
                </div>
              ) : inactiveListings.length > 0 ? (
                <ListingGroup
                  label="غیرفعال"
                  hint="از فید برداشته شده؛ در پروفایل می‌ماند"
                  listings={inactiveListings}
                  inactive
                />
              ) : (
                <ListingGroup listings={liveListings} />
              )
            ) : null}

            {activeTab === "events" ? (
              allMyEvents.length === 0 ? (
                <EmptyCard
                  title="رویدادی در تقویمت نیست"
                  text="به یک رویداد بپیوند یا خودت یکی بساز."
                  href="/events"
                  cta="دیدن رویدادها"
                  icon="calendar"
                />
              ) : (
                <div className="space-y-2.5">
                  {hostedEvents.length > 0 && (
                    <EventGroup label="میزبانی من" events={hostedEvents} />
                  )}
                  {attendingEvents.length > 0 && (
                    <EventGroup label="شرکت می‌کنم" events={attendingEvents} />
                  )}
                </div>
              )
            ) : null}

            {activeTab === "saved" ? (
              savedListings.length === 0 ? (
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
              )
            ) : null}

            {activeTab === "endorsements" ? (
              myGivenBadges.length === 0 ? (
                <EmptyCard
                  title="هنوز تأییدی نداده‌ای"
                  text="از صفحهٔ آگهی تأیید ثبت کن."
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
                      className="flex items-center gap-3 px-3.5 py-3 text-[13px] active:bg-stone-50/80"
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
              )
            ) : null}
          </div>
        </section>

        <section>
          <h2 className="text-[13px] font-extrabold text-ink dark:text-zinc-200 mb-2.5 px-0.5">
            حساب
          </h2>
          <div className="card p-3.5 space-y-3">
            <div>
              <p className="text-[11px] font-semibold text-ink-muted dark:text-zinc-400 mb-2">
                حالت روشن / تیره
              </p>
              <ThemeSegmented />
            </div>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem(CONCEPT_TIP_KEY);
                } catch {
                  /* ignore */
                }
                router.push("/");
              }}
              className="w-full text-[13px] font-bold text-ink dark:text-zinc-100 bg-stone-50 dark:bg-zinc-800/60 rounded-xl py-3 active:scale-[0.99] transition-transform"
            >
              سیرکل چطور کار می‌کند؟
            </button>
            {sessionPhone && (
              <>
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
                    void signOut().then(() => {
                      show("خارج شدید — دوباره وارد شوید");
                      router.replace("/");
                    });
                  }}
                  className="w-full text-[13px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl py-3.5 active:scale-[0.99] transition-transform"
                >
                  خروج از حساب
                </button>
              </>
            )}
          </div>
        </section>
      </div>

      {showEdit && (
        <EditProfileSheet
          name={me.name}
          city={me.city ?? ""}
          avatar={me.avatar}
          onClose={() => setShowEdit(false)}
          onSave={async (input) => {
            await updateProfile(input);
            setShowEdit(false);
            show("پروفایل به‌روزرسانی شد ✓");
          }}
        />
      )}

      <BottomNav />
    </main>
  );
}

function formatPhoneDisplay(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) {
    return toPersianDigits(`${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`);
  }
  return toPersianDigits(phone);
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

function ListingGroup({
  label,
  hint,
  listings,
  inactive = false,
}: {
  label?: string;
  hint?: string;
  listings: Listing[];
  inactive?: boolean;
}) {
  return (
    <div>
      {label ? (
        <div className="mb-1.5 px-0.5">
          <p className="text-[11px] font-semibold text-ink-muted dark:text-zinc-400">
            {label}
            <span className="ms-1 nums text-ink-faint">
              {toPersianDigits(listings.length)}
            </span>
          </p>
          {hint ? (
            <p className="text-[10px] text-ink-faint mt-0.5 leading-snug">
              {hint}
            </p>
          ) : null}
        </div>
      ) : null}
      <div
        className={`card divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden ${
          inactive ? "bg-stone-50/90 dark:bg-zinc-900/55" : ""
        }`}
      >
        {listings.map((l) => (
          <ProfileListingRow key={l.id} listing={l} inactive={inactive} />
        ))}
      </div>
    </div>
  );
}

function ProfileListingRow({
  listing,
  inactive,
}: {
  listing: Listing;
  inactive?: boolean;
}) {
  const price =
    listing.price != null ? (
      <span className="nums">{formatPrice(listing.price)}</span>
    ) : (
      "رایگان / توافقی"
    );

  return (
    <Link
      href={`/listing/${listing.id}`}
      aria-label={
        inactive ? `${listing.title}، غیرفعال` : listing.title
      }
      className="flex items-center gap-3 px-3 py-2.5 active:bg-stone-50/80 dark:active:bg-zinc-800/60"
    >
      <ListingImage
        image={listing.image}
        alt={listing.title}
        size="sm"
        category={listing.category}
        type={listing.type}
        className={inactive ? "grayscale" : ""}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p
            className={`font-semibold text-[13px] truncate ${
              inactive
                ? "text-ink-muted dark:text-zinc-400"
                : "text-ink dark:text-zinc-100"
            }`}
          >
            {listing.title}
          </p>
          {inactive ? (
            <span className="shrink-0 chip !text-[10px] !py-0.5 !px-1.5 bg-stone-200/80 text-ink-muted dark:bg-zinc-800 dark:text-zinc-400">
              غیرفعال
            </span>
          ) : null}
        </div>
        <p className="text-[11px] text-ink-muted mt-0.5">
          {price} · {listing.postedAt}
        </p>
      </div>
      <span className="text-ink-faint" aria-hidden>
        ‹
      </span>
    </Link>
  );
}

function editAvatarChoices(current?: string): string[] {
  const list: string[] = [...PICKER_AVATARS];
  if (
    current &&
    isAvatarImage(current) &&
    !current.startsWith("data:") &&
    !list.includes(current)
  ) {
    list.unshift(current);
  }
  return list;
}

function EditProfileSheet({
  name: initialName,
  city: initialCity,
  avatar: initialAvatar,
  onClose,
  onSave,
}: {
  name: string;
  city: string;
  avatar?: string;
  onClose: () => void;
  onSave: (input: {
    name: string;
    city: string;
    avatar: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [city, setCity] = useState(initialCity);
  const [avatar, setAvatar] = useState(
    () =>
      initialAvatar && isAvatarImage(initialAvatar)
        ? initialAvatar
        : PICKER_AVATARS[0],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarGroupId = useId();
  const choices = useMemo(() => editAvatarChoices(initialAvatar), [initialAvatar]);
  const canSave = name.trim().length >= 2 && !busy;

  async function save() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("نام را حداقل با دو حرف بنویس");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave({ name: trimmed, city: city.trim(), avatar });
    } catch {
      setError("ذخیره نشد. دوباره امتحان کن.");
      setBusy(false);
    }
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="edit-profile-title"
      zClass="z-50"
      maxHeight="92dvh"
      footer={
        <div className="flex gap-2 pb-0.5">
          <button
            type="button"
            disabled={!canSave}
            onClick={() => void save()}
            className="btn-primary flex-1 !py-3.5 !font-bold active:scale-[0.98] disabled:opacity-40"
          >
            {busy ? "در حال ذخیره…" : "ذخیره"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="btn-ghost flex-1 !py-3.5 active:scale-[0.98]"
          >
            انصراف
          </button>
        </div>
      }
    >
      <h2
        id="edit-profile-title"
        className="font-extrabold text-[1.2rem] text-ink dark:text-zinc-50 tracking-tight"
      >
        ویرایش پروفایل
      </h2>
      <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed">
        نام و تصویر را حلقه‌ات می‌بیند — نه غریبه‌ها.
      </p>

      <div className="flex flex-col items-center mt-5 mb-1">
        <div className="relative">
          <div className="rounded-full ring-[3px] ring-brand-100 dark:ring-brand-500/30 shadow-md shadow-brand-600/10">
            <Avatar
              name={name.trim() || initialName}
              src={avatar}
              size="lg"
              showLevel={false}
            />
          </div>
          <span
            className="absolute -bottom-0.5 -start-0.5 w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-sm ring-2 ring-[color:var(--circle-surface)] dark:ring-zinc-900 pointer-events-none"
            aria-hidden
          >
            <CameraIcon className="w-4 h-4" />
          </span>
        </div>
      </div>

      <p
        id={avatarGroupId}
        className="text-[12px] font-bold text-ink dark:text-zinc-200 mt-4 mb-1"
      >
        تصویر
      </p>
      <p className="text-[11px] text-ink-muted mb-2.5 leading-snug">
        یکی را بزن تا عوض شود
      </p>
      <div
        role="radiogroup"
        aria-labelledby={avatarGroupId}
        className="grid grid-cols-5 gap-2.5"
      >
        {choices.map((src, i) => {
          const selected = avatar === src;
          return (
            <button
              key={src}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`تصویر ${i + 1}`}
              disabled={busy}
              onClick={() => setAvatar(src)}
              className={`relative aspect-square rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 transition-transform active:scale-95 ${
                selected
                  ? "ring-[2.5px] ring-brand-600 ring-offset-2 ring-offset-[color:var(--circle-surface)] dark:ring-offset-zinc-900"
                  : "ring-1 ring-black/10 dark:ring-white/10"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={withBasePath(src)}
                alt=""
                width={64}
                height={64}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </button>
          );
        })}
      </div>

      <label className="block text-[12px] font-bold mt-5 mb-1.5 text-ink dark:text-zinc-200">
        نام
      </label>
      <input
        value={name}
        onChange={(e) => {
          setError(null);
          setName(e.target.value);
        }}
        placeholder="نام تو"
        autoComplete="name"
        spellCheck={false}
        disabled={busy}
        className="field !min-h-12 !font-semibold"
        aria-invalid={!!error}
        aria-describedby={error ? "edit-profile-error" : undefined}
      />

      <label className="block text-[12px] font-bold mt-4 mb-1.5 text-ink dark:text-zinc-200">
        شهر
      </label>
      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="مثلاً تهران"
        autoComplete="address-level2"
        spellCheck={false}
        disabled={busy}
        className="field !min-h-12"
      />
      {error ? (
        <p
          id="edit-profile-error"
          role="alert"
          className="text-[12px] text-red-600 mt-2.5"
        >
          {error}
        </p>
      ) : null}
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
