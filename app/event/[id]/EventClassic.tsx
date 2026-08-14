"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { activeCircle } from "@/lib/circle-member";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import Avatar from "@/components/Avatar";
import TrustPath from "@/components/TrustPath";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from "@/components/Icons";
import { useToast } from "@/components/Toast";
import LockedAccess from "@/components/LockedAccess";
import { canView, privacyAudience } from "@/lib/trust";
import { formatEventDateDisplay, toPersianDigits } from "@/lib/persian";
import {
  eventKindChip,
  eventKindLabels,
  privacyLabels,
  relationLabels,
} from "@/lib/labels";
import type { EventKind } from "@/lib/types";

const eventHeroTint: Record<EventKind, string> = {
  class: "from-teal-100 via-teal-50/80 to-stone-100 dark:from-teal-500/20 dark:via-teal-500/5 dark:to-zinc-900",
  family: "from-rose-100 via-rose-50/80 to-stone-100 dark:from-rose-500/20 dark:via-rose-500/5 dark:to-zinc-900",
  charity: "from-pink-100 via-pink-50/80 to-stone-100 dark:from-pink-500/20 dark:via-pink-500/5 dark:to-zinc-900",
  kids: "from-sky-100 via-sky-50/80 to-stone-100 dark:from-sky-500/20 dark:via-sky-500/5 dark:to-zinc-900",
  trip: "from-emerald-100 via-emerald-50/80 to-stone-100 dark:from-emerald-500/20 dark:via-emerald-500/5 dark:to-zinc-900",
  social: "from-violet-100 via-violet-50/80 to-stone-100 dark:from-violet-500/20 dark:via-violet-500/5 dark:to-zinc-900",
};

export default function EventClassic(_props: { params: { id: string } }) {
  const params = useParams();
  const id = String(params.id);
  const { getEvent, getPerson, people, toggleRsvp, isAttending } = useStore();
  const { show } = useToast();

  const event = getEvent(id);
  if (!event) {
    return (
      <main className="min-h-[100dvh]">
        <Header title="رویداد" back />
        <p className="text-center text-ink-faint py-20 text-sm">رویداد پیدا نشد.</p>
      </main>
    );
  }

  const host = getPerson(event.hostId);
  const isMine = event.hostId === "me";
  const circle = activeCircle(people);

  if (!isMine && !canView(event, getPerson)) {
    return (
      <main className="min-h-[100dvh]">
        <Header title="جزئیات رویداد" back />
        <LockedAccess
          itemTitle={event.title}
          itemKind="event"
          privacy={event.privacy}
        />
      </main>
    );
  }

  const going = isAttending(id);
  const count = event.attendees.length;
  const spotsLeft = event.capacity != null ? event.capacity - count : null;
  const full = spotsLeft != null && spotsLeft <= 0 && !going;
  const fillPct =
    event.capacity && event.capacity > 0
      ? Math.min(100, Math.round((count / event.capacity) * 100))
      : null;

  return (
    <main className="pb-28 min-h-[100dvh]">
      <Header title="جزئیات رویداد" back />

      {/* Full-bleed hero — matches listing detail rhythm */}
      <div className="relative listing-detail-hero">
        <div
          className={`relative h-52 w-full bg-gradient-to-br ${eventHeroTint[event.kind]} overflow-hidden`}
        >
          <div
            className="pointer-events-none absolute -top-10 -start-8 w-40 h-40 rounded-full bg-white/35 dark:bg-white/5 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-12 -end-6 w-48 h-48 rounded-full bg-brand-400/15 dark:bg-brand-400/10 blur-3xl"
            aria-hidden
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-[5.25rem] leading-none drop-shadow-sm select-none"
              aria-hidden
            >
              {event.image}
            </span>
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[color:var(--circle-canvas)] via-[color:var(--circle-canvas)]/55 to-transparent"
          aria-hidden
        />
      </div>

      {/* Title block */}
      <div className="px-4 -mt-3 relative listing-detail-rise">
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <span className={`chip ${eventKindChip[event.kind]}`}>
            {eventKindLabels[event.kind]}
          </span>
          <span
            className="chip bg-[color:var(--circle-surface)] text-ink-muted ring-1 ring-stone-200/70 dark:ring-zinc-700"
            title={privacyAudience(event.privacy, circle)}
          >
            {privacyLabels[event.privacy]}
          </span>
          {going && (
            <span className="chip bg-levelA/10 text-levelA">✓ می‌آیم</span>
          )}
        </div>

        <h1 className="text-[1.45rem] font-extrabold text-ink dark:text-zinc-50 leading-[1.35] tracking-tight">
          {event.title}
        </h1>

        <ul className="mt-3.5 space-y-2">
          <li className="flex items-start gap-2.5 text-[13.5px]">
            <span className="mt-0.5 w-8 h-8 rounded-xl bg-[color:var(--circle-surface)] ring-1 ring-stone-200/70 dark:ring-zinc-700 text-brand-600 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </span>
            <div className="min-w-0 pt-1">
              <p className="font-semibold text-ink dark:text-zinc-100 nums leading-snug">
                {formatEventDateDisplay(event.date)}
              </p>
              <p className="text-[11px] text-ink-faint mt-0.5">تاریخ برگزاری</p>
            </div>
          </li>
          {event.time && (
            <li className="flex items-start gap-2.5 text-[13.5px]">
              <span className="mt-0.5 w-8 h-8 rounded-xl bg-[color:var(--circle-surface)] ring-1 ring-stone-200/70 dark:ring-zinc-700 text-brand-600 flex items-center justify-center shrink-0">
                <ClockIcon className="w-4 h-4" />
              </span>
              <div className="min-w-0 pt-1">
                <p className="font-semibold text-ink dark:text-zinc-100 nums leading-snug">
                  ساعت {event.time}
                </p>
                <p className="text-[11px] text-ink-faint mt-0.5">زمان شروع</p>
              </div>
            </li>
          )}
          <li className="flex items-start gap-2.5 text-[13.5px]">
            <span className="mt-0.5 w-8 h-8 rounded-xl bg-[color:var(--circle-surface)] ring-1 ring-stone-200/70 dark:ring-zinc-700 text-brand-600 flex items-center justify-center shrink-0">
              <MapPinIcon className="w-4 h-4" />
            </span>
            <div className="min-w-0 pt-1">
              <p className="font-semibold text-ink dark:text-zinc-100 leading-snug">
                {event.location}
              </p>
              <p className="text-[11px] text-ink-faint mt-0.5">محل رویداد</p>
            </div>
          </li>
        </ul>

        <p className="text-[13.5px] text-ink-muted dark:text-zinc-300 leading-[1.75] mt-4 whitespace-pre-line">
          {event.description}
        </p>
      </div>

      {/* Trust + host in one section (no duplicate host card) */}
      <section className="px-4 pt-5">
        <div className="card trust-card p-4">
          <div className="flex items-center gap-2 mb-3.5">
            <span className="w-8 h-8 rounded-xl bg-[color:var(--circle-trust)]/12 text-[color:var(--circle-trust)] flex items-center justify-center shrink-0">
              <ShieldCheckIcon className="w-[18px] h-[18px]" />
            </span>
            <div className="min-w-0">
              <h2 className="font-bold text-[14px] text-ink dark:text-zinc-100 leading-tight">
                مسیر ارتباط
              </h2>
              <p className="text-[11px] text-ink-muted mt-0.5">
                چطور به میزبان وصل هستید
              </p>
            </div>
          </div>

          <TrustPath
            posterId={event.hostId}
            trustPath={event.trustPath}
            variant="full"
          />

          {host && !isMine && (
            <Link
              href={`/person/${event.hostId}`}
              className="mt-3.5 pt-3.5 border-t border-stone-100 dark:border-zinc-800 flex items-center gap-3 active:opacity-80 transition-opacity"
            >
              <Avatar name={host.name} src={host.avatar} level={host.level} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[14px] text-ink dark:text-zinc-100">
                  {host.name}
                </p>
                <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                  میزبان · {relationLabels[host.relation]}
                  {host.city ? ` · ${host.city}` : ""}
                </p>
              </div>
              <span className="text-[12px] font-bold text-brand-600 dark:text-brand-400 shrink-0">
                پروفایل ‹
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* Attendees */}
      <section className="px-4 pt-3 pb-2">
        <div className="card p-4">
          <div className="flex items-baseline justify-between gap-2 mb-2.5">
            <h2 className="font-bold text-[14px] text-ink dark:text-zinc-100">
              چه کسانی می‌آیند
            </h2>
            <span className="text-[12px] font-semibold text-ink-faint nums">
              {toPersianDigits(count)}
              {event.capacity ? ` / ${toPersianDigits(event.capacity)}` : " نفر"}
            </span>
          </div>

          {fillPct != null && (
            <div className="mb-3">
              <div className="h-1.5 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ease-out ${
                    full ? "bg-amber-500" : "bg-gradient-to-l from-levelA to-brand-600"
                  }`}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
              <p className="text-[11px] text-ink-faint mt-1.5 nums">
                {full
                  ? "ظرفیت تکمیل است"
                  : spotsLeft != null
                    ? `${toPersianDigits(spotsLeft)} جای خالی`
                    : null}
              </p>
            </div>
          )}

          {count === 0 ? (
            <p className="text-[13px] text-ink-faint leading-relaxed">
              هنوز کسی ثبت‌نام نکرده. اولین نفر باش!
            </p>
          ) : (
            <div className="flex flex-wrap gap-x-3 gap-y-3">
              {event.attendees.map((aid) => {
                const p = getPerson(aid);
                const me = aid === "me";
                const name = me ? "شما" : p?.name ?? "؟";
                const inner = (
                  <>
                    {p || me ? (
                      <Avatar
                        name={name}
                        src={p?.avatar}
                        level={me ? undefined : p!.level}
                        size="sm"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-stone-100 dark:bg-zinc-800" />
                    )}
                    <span className="text-[11px] text-ink-muted mt-1 truncate w-full text-center">
                      {name}
                    </span>
                  </>
                );
                if (me || !p) {
                  return (
                    <div key={aid} className="flex flex-col items-center w-14">
                      {inner}
                    </div>
                  );
                }
                return (
                  <Link
                    key={aid}
                    href={`/person/${aid}`}
                    className="flex flex-col items-center w-14 active:scale-95 transition-transform duration-150"
                  >
                    {inner}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {!isMine && (
        <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
          <div className="app-shell !min-h-0 !shadow-none bg-transparent">
            <div className="pointer-events-auto bg-[color:var(--circle-surface)]/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-stone-200/70 dark:border-zinc-800 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {going ? (
                <div className="flex gap-2">
                  <span className="btn-ghost flex-1 text-center !text-levelA !py-3.5">
                    ✓ حضور شما ثبت شد
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      toggleRsvp(id);
                      show("حضور لغو شد");
                    }}
                    className="bg-stone-100 dark:bg-zinc-800 text-ink-muted font-medium rounded-xl px-4 active:scale-[0.97] transition-transform duration-150"
                  >
                    لغو
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (full) return;
                    toggleRsvp(id);
                    show("حضور شما ثبت شد ✓ منتظر شما هستیم!");
                  }}
                  disabled={full}
                  className="btn-primary w-full !py-3.5 text-base shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-transform duration-150"
                >
                  {full ? "ظرفیت تکمیل است" : "من می‌آیم"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
