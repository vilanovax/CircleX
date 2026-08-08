"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSheetA11y } from "@/lib/use-sheet-a11y";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import ListingCard from "@/components/ListingCard";
import ListingImage from "@/components/ListingImage";
import SocialCreditCard from "@/components/SocialCreditCard";
import { ShieldCheckIcon, HeartIcon, PencilIcon } from "@/components/Icons";
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

export default function ClassicProfile() {
  const { me, people, listings, events, saved, updateProfile, hydrated } =
    useStore();
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

  const socialCredit = buildSocialCredit(me, listings, myCircle.length);

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

      {/* Identity */}
      <div className="px-4 pt-3">
        <div className="card p-4">
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
                  className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/15 rounded-xl px-2.5 py-1.5 active:scale-95 transition"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                  ویرایش
                </button>
              </div>
              <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1.5">
                {me.city}
                <span className="text-stone-300 dark:text-zinc-600 mx-1" aria-hidden>
                  ·
                </span>
                عضو از {socialCredit.memberSince}
              </p>
              <p className="text-[11px] text-ink-faint dark:text-zinc-500 mt-0.5">
                آخرین فعالیت {socialCredit.lastActive}
                {savedListings.length > 0 && (
                  <>
                    <span className="mx-1" aria-hidden>
                      ·
                    </span>
                    <Link
                      href="/profile#saved"
                      className="inline-flex items-center gap-0.5 font-medium text-pink-600 dark:text-pink-400"
                    >
                      <HeartIcon className="w-3 h-3" filled />
                      {toPersianDigits(savedListings.length)} نشان‌شده
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social credit — quieter, verified already in hero */}
      <div className="px-4 pt-3">
        <SocialCreditCard
          stats={socialCredit}
          subtitle="شاخص اعتماد در حلقه‌ی شما"
          hideVerified
          collapsible
          defaultCollapsed={false}
        />
      </div>

      {/* My listings */}
      <Section title="آگهی‌های من" count={myListings.length}>
        {myListings.length === 0 ? (
          <EmptyRow
            text="هنوز آگهی‌ای ثبت نکرده‌اید"
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
              </Link>
            ))}
          </div>
        )}
      </Section>

      {hostedEvents.length > 0 && (
        <Section title="رویدادهای من" count={hostedEvents.length}>
          <div className="card divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden">
            {hostedEvents.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </div>
        </Section>
      )}

      {attendingEvents.length > 0 && (
        <Section title="رویدادهایی که می‌روم" count={attendingEvents.length}>
          <div className="card divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden">
            {attendingEvents.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </div>
        </Section>
      )}

      <Section id="saved" title="نشان‌شده‌ها" count={savedListings.length}>
        {savedListings.length === 0 ? (
          <EmptyRow text="هنوز چیزی نشان نکرده‌اید" href="/" cta="دیدن آگهی‌ها" />
        ) : (
          <div className="space-y-2.5">
            {savedListings.map((l) => (
              <ListingCard key={l.id} listing={l} compactTrust />
            ))}
          </div>
        )}
      </Section>

      <Section title="تأییدهایی که داده‌ام" count={myGivenBadges.length}>
        {myGivenBadges.length === 0 ? (
          <p className="text-[12px] text-ink-muted dark:text-zinc-400 px-0.5 leading-relaxed">
            هنوز آگهی‌ای را تأیید نکرده‌اید. از صفحه‌ی آگهی می‌توانید نشان اعتماد
            بدهید.
          </p>
        ) : (
          <div className="card divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden">
            {myGivenBadges.map(({ l, e }, i) => (
              <Link
                key={i}
                href={`/listing/${l.id}`}
                className="flex items-center gap-2.5 px-3.5 py-3 text-[13px] active:bg-stone-50/80"
              >
                <span className="text-[11px] font-semibold text-levelA shrink-0">
                  {badgeLabels[e.type]}
                </span>
                <span className="font-medium text-ink dark:text-zinc-100 truncate">
                  {l.title}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section title="تنظیمات">
        <div className="card p-3.5 space-y-4">
          <div>
            <p className="text-[11px] text-ink-muted dark:text-zinc-400 mb-2">
              مدل نمایش
            </p>
            <UIModeSegmented />
          </div>
          <div>
            <p className="text-[11px] text-ink-muted dark:text-zinc-400 mb-2">
              حالت نمایش
            </p>
            <ThemeSegmented />
          </div>
        </div>
      </Section>

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
  const panelRef = useRef<HTMLDivElement>(null);
  useSheetA11y(panelRef, onClose);

  return (
    <div className="fixed inset-0 z-40 flex justify-center">
      <div className="relative w-full max-w-[480px]">
        <div
          className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
          tabIndex={-1}
          className="absolute bottom-0 inset-x-0 bg-[color:var(--circle-surface)] dark:bg-zinc-900 rounded-t-[1.35rem] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-slide-up outline-none"
        >
          <div className="w-9 h-1 bg-stone-300/80 dark:bg-zinc-600 rounded-full mx-auto mb-4" />
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
          />

          <label className="block text-sm font-medium mb-1 text-ink">شهر</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="مثلاً تهران"
            className="field mb-5"
          />

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              انصراف
            </button>
            <button
              type="button"
              disabled={!name.trim()}
              onClick={() => onSave({ name: name.trim(), city: city.trim() })}
              className="btn-primary flex-1"
            >
              ذخیره
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventRow({ event }: { event: import("@/lib/types").CircleEvent }) {
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
        <p className="text-[11px] text-ink-muted mt-0.5">
          {formatEventDateDisplay(event.date)}
          {event.time ? ` · ${event.time}` : ""} · {event.location}
        </p>
      </div>
    </Link>
  );
}

function Section({
  id,
  title,
  count,
  children,
}: {
  id?: string;
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`px-4 pt-4 ${id ? "scroll-mt-24" : ""}`}>
      <h2 className="flex items-center gap-2 text-[13px] font-bold text-ink dark:text-zinc-200 mb-2">
        <span>{title}</span>
        {count != null && (
          <span className="inline-flex items-center justify-center min-w-[1.35rem] h-5 px-1.5 rounded-md bg-stone-200/70 dark:bg-zinc-800 text-[11px] font-bold text-ink-muted nums">
            {toPersianDigits(count)}
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}

function EmptyRow({
  text,
  href,
  cta,
}: {
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="card px-3.5 py-3 flex items-center justify-between gap-3">
      <p className="text-[12px] text-ink-muted dark:text-zinc-400">{text}</p>
      <Link
        href={href}
        className="shrink-0 text-[12px] font-bold text-brand-600 dark:text-brand-400"
      >
        {cta} ‹
      </Link>
    </div>
  );
}
