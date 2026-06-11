"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import SocialCreditCard from "@/components/SocialCreditCard";
import { ShieldCheckIcon, HeartIcon, PencilIcon } from "@/components/Icons";
import {
  badgeEmoji,
  badgeLabels,
  eventKindEmoji,
  formatPrice,
  listingTypeEmoji,
} from "@/lib/labels";
import { buildSocialCredit } from "@/lib/social-credit";
import { toPersianDigits } from "@/lib/persian";
import { ThemeSegmented } from "@/components/ThemeToggle";
import { useToast } from "@/components/Toast";

const AVATARS = ["🧑", "👩", "🧔", "👨", "🧑‍🦱", "👩‍🦰", "🧑‍🦲", "👵", "👴", "🧑‍💼", "👩‍💻", "🧑‍🎨"];

export default function ProfilePage() {
  const { me, people, listings, events, saved, updateProfile } = useStore();
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

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Header title="پروفایل اعتماد" />

      {/* Identity */}
      <div className="px-4 pt-4">
        <div className="card p-5 relative">
          <button
            onClick={() => setShowEdit(true)}
            aria-label="ویرایش پروفایل"
            className="absolute top-4 left-4 flex items-center gap-1 text-xs font-medium text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/15 rounded-full px-3 py-1.5 active:scale-95 transition"
          >
            <PencilIcon className="w-3.5 h-3.5" />
            ویرایش
          </button>
          <div className="flex items-center gap-4">
            <Avatar emoji={me.avatar} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {me.name}
                </h2>
                <span className="chip bg-green-50 text-levelA dark:bg-green-500/15">
                  <ShieldCheckIcon className="w-3.5 h-3.5" /> تأییدشده
                </span>
              </div>
              <p className="text-sm text-zinc-500 mt-0.5">📍 {me.city}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                عضو از {socialCredit.memberSince} · آخرین فعالیت{" "}
                {socialCredit.lastActive}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social credit — hero */}
      <div className="px-4 pt-3">
        <SocialCreditCard
          stats={socialCredit}
          subtitle="شاخص اعتماد در شبکه‌ی حلقه‌ی شما"
        />
      </div>

      {/* My listings */}
      <Section title={`آگهی‌های من (${toPersianDigits(myListings.length)})`}>
        {myListings.length === 0 ? (
          <EmptyHint
            text="هنوز آگهی‌ای ثبت نکرده‌اید."
            href="/new"
            cta="ثبت اولین آگهی"
          />
        ) : (
          <div className="space-y-2">
            {myListings.map((l) => (
              <Link
                key={l.id}
                href={`/listing/${l.id}`}
                className="card p-3 flex items-center gap-3 active:scale-[0.99] transition-transform"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-2xl shrink-0">
                  {l.image}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-zinc-900 truncate">
                    {listingTypeEmoji[l.type]} {l.title}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
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
        <Section title={`رویدادهای من (${toPersianDigits(hostedEvents.length)})`}>
          <div className="space-y-2">
            {hostedEvents.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </div>
        </Section>
      )}

      {attendingEvents.length > 0 && (
        <Section title={`رویدادهایی که می‌روم (${toPersianDigits(attendingEvents.length)})`}>
          <div className="space-y-2">
            {attendingEvents.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </div>
        </Section>
      )}

      {/* Saved listings */}
      <Section title={`نشان‌شده‌ها (${toPersianDigits(savedListings.length)})`}>
        {savedListings.length === 0 ? (
          <div className="card p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-pink-50 dark:bg-pink-500/15 flex items-center justify-center text-pink-400 mx-auto mb-3">
              <HeartIcon className="w-6 h-6" />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              هنوز آگهی‌ای نشان نکرده‌اید. روی ❤ در هر آگهی بزنید تا اینجا ذخیره شود.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {savedListings.map((l) => (
              <Link
                key={l.id}
                href={`/listing/${l.id}`}
                className="card p-3 flex items-center gap-3 active:scale-[0.99] transition-transform"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-2xl shrink-0">
                  {l.image}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-zinc-900 truncate">
                    {listingTypeEmoji[l.type]} {l.title}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
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

      {/* Badges given */}
      <Section title="تأییدهایی که داده‌ام">
        {myGivenBadges.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 pr-1">
            هنوز آگهی‌ای را تأیید نکرده‌اید. در صفحه‌ی هر آگهی می‌توانید نشان
            اعتماد خود را اضافه کنید.
          </p>
        ) : (
          <div className="space-y-2">
            {myGivenBadges.map(({ l, e }, i) => (
              <Link
                key={i}
                href={`/listing/${l.id}`}
                className="card p-3 flex items-center gap-2.5 text-sm"
              >
                <span className="text-lg">{badgeEmoji[e.type]}</span>
                <span className="flex-1 min-w-0">
                  <span className="text-zinc-500">{badgeLabels[e.type]} — </span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100 truncate">
                    {l.title}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* Settings / theme — at the bottom (mobile convention) */}
      <Section title="تنظیمات">
        <div className="card p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">حالت نمایش برنامه</p>
          <ThemeSegmented />
        </div>
      </Section>

      {showEdit && (
        <EditProfileSheet
          name={me.name}
          avatar={me.avatar}
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
  avatar: initialAvatar,
  city: initialCity,
  onClose,
  onSave,
}: {
  name: string;
  avatar: string;
  city: string;
  onClose: () => void;
  onSave: (input: { name: string; avatar: string; city: string }) => void;
}) {
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [city, setCity] = useState(initialCity);

  return (
    <div className="fixed inset-0 z-40 flex justify-center">
      <div className="relative w-full max-w-[480px]">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="absolute bottom-0 inset-x-0 bg-white dark:bg-zinc-900 rounded-t-2xl p-5 animate-slide-up">
          <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-4" />
          <h2 className="font-bold text-lg mb-4">ویرایش پروفایل</h2>

          <label className="block text-sm font-medium mb-2">آواتار</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                aria-label={`انتخاب آواتار ${a}`}
                aria-pressed={avatar === a}
                className={`w-12 h-12 shrink-0 rounded-full text-2xl flex items-center justify-center border transition-colors ${
                  avatar === a
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/15"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium mb-1">نام</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام شما"
            className="field mb-4"
          />

          <label className="block text-sm font-medium mb-1">شهر</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="مثلاً تهران"
            className="field mb-5"
          />

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost flex-1">
              انصراف
            </button>
            <button
              disabled={!name.trim()}
              onClick={() =>
                onSave({ name: name.trim(), avatar, city: city.trim() })
              }
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
      className="card p-3 flex items-center gap-3 active:scale-[0.99] transition-transform"
    >
      <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-2xl shrink-0">
        {event.image}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-zinc-900 truncate">
          {eventKindEmoji[event.kind]} {event.title}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          📅 {event.date}
          {event.time ? ` · ${event.time}` : ""} · 📍 {event.location}
        </p>
      </div>
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 pt-5">
      <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">{title}</h2>
      {children}
    </section>
  );
}

function EmptyHint({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="card p-5 text-center">
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">{text}</p>
      <Link href={href} className="btn-primary inline-block">
        {cta}
      </Link>
    </div>
  );
}
