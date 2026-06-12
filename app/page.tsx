"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import ListingCard from "@/components/ListingCard";
import BottomNav from "@/components/BottomNav";
import Onboarding from "@/components/Onboarding";
import FeedFilterBar from "@/components/FeedFilterBar";
import { FeedSkeleton } from "@/components/Skeleton";
import Avatar from "@/components/Avatar";
import { CircleUsersIcon, SearchIcon, ShieldCheckIcon } from "@/components/Icons";
import { formatPrice } from "@/lib/labels";
import type { CircleEvent, ListingType, Request } from "@/lib/types";
import { formatEventDateDisplay, normalizeFa, toPersianDigits } from "@/lib/persian";
import { canView, filterByAccess } from "@/lib/trust";

const SCROLL_COLLAPSE_THRESHOLD = 48;

const PREVIEW_LIMIT = 8;

export default function FeedPage() {
  const { listings, requests, events, people, getPerson, hydrated, onboarded } =
    useStore();
  const [filter, setFilter] = useState<ListingType | "all">("all");
  const [query, setQuery] = useState("");
  const [headerCompact, setHeaderCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setHeaderCompact(window.scrollY > SCROLL_COLLAPSE_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const circleCount = people.filter((p) => p.inMyCircle).length;

  const { allowed, hidden } = useMemo(() => {
    const { visible, hidden } = filterByAccess(listings, getPerson);
    return { allowed: visible, hidden };
  }, [listings, getPerson]);

  const visibleRequests = useMemo(
    () => requests.filter((r) => canView(r, getPerson)).slice(0, PREVIEW_LIMIT),
    [requests, getPerson],
  );

  const visibleEvents = useMemo(
    () => events.filter((e) => canView(e, getPerson)).slice(0, PREVIEW_LIMIT),
    [events, getPerson],
  );

  const visible = useMemo(() => {
    const q = normalizeFa(query);
    return allowed.filter((l) => {
      if (filter !== "all" && l.type !== filter) return false;
      if (
        q &&
        !normalizeFa(`${l.title} ${l.description} ${l.category}`).includes(q)
      )
        return false;
      return true;
    });
  }, [allowed, filter, query]);

  return (
    <main className="pb-24 min-h-[100dvh]">
      <header
        className={`sticky top-0 z-20 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-b border-zinc-100 dark:border-zinc-800 transition-shadow ${
          headerCompact ? "shadow-sm" : ""
        }`}
      >
        <div
          className={`px-4 transition-all duration-200 ${
            headerCompact ? "pt-2 pb-2" : "pt-3 pb-2.5"
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 transition-all duration-200 ${
                headerCompact ? "w-8 h-8" : "w-9 h-9"
              }`}
            >
              <ShieldCheckIcon className={headerCompact ? "w-4 h-4" : "w-5 h-5"} />
            </div>
            <div className="min-w-0">
              <h1
                className={`font-extrabold leading-none text-brand-700 dark:text-brand-400 transition-all duration-200 ${
                  headerCompact ? "text-base" : "text-lg"
                }`}
              >
                سیرکل
              </h1>
              <p
                className={`text-[11px] text-zinc-500 dark:text-zinc-400 overflow-hidden transition-all duration-200 ${
                  headerCompact ? "max-h-0 opacity-0 mt-0" : "max-h-6 opacity-100 mt-0.5"
                }`}
              >
                خرید و فروش بین آدم‌های مورد اعتماد
              </p>
            </div>
          </div>

          <div className={`relative transition-all duration-200 ${headerCompact ? "mt-2" : "mt-3"}`}>
            <SearchIcon className="w-5 h-5 text-zinc-400 absolute top-1/2 -translate-y-1/2 right-3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجو در آگهی‌های حلقه‌ی شما…"
              className={`field !pr-10 bg-zinc-50 dark:bg-zinc-800/50 transition-all duration-200 ${
                headerCompact ? "!py-2 text-sm" : "!py-2.5"
              }`}
            />
          </div>
        </div>

        <FeedFilterBar
          filter={filter}
          onFilter={setFilter}
          compact={headerCompact}
        />
      </header>

      {/* Trust banner — only before onboarding completes */}
      {!onboarded && (
        <div className="px-4 pt-3">
          <div className="rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 text-white p-4">
            <p className="font-bold text-sm">اینجا کسی غریبه نیست</p>
            <p className="text-xs text-brand-50 mt-1 leading-relaxed">
              هر آگهی از مسیر اعتمادی به شما می‌رسد: «این فروشنده، دوستِ همکارِ
              خواهرِ شماست.»
            </p>
          </div>
        </div>
      )}

      {/* Quick access — only while circle is still small */}
      {circleCount <= 2 && (
        <div className="grid grid-cols-2 gap-2.5 px-4 pt-3">
          <Shortcut href="/requests" emoji="🔎" label="درخواست‌ها" tint="bg-amber-50 dark:bg-amber-500/15 text-amber-600" />
          <Shortcut href="/events" emoji="🎉" label="رویدادها" tint="bg-brand-50 dark:bg-brand-500/15 text-brand-600" />
        </div>
      )}

      {/* New-user first step — build your circle */}
      {hydrated && circleCount === 0 && (
        <div className="px-4 pt-4">
          <div className="card p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center mx-auto mb-2">
              <CircleUsersIcon className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
              اول حلقه‌ات را بساز
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              با افزودن خانواده و دوستان مورد اعتماد، آگهی‌ها و رویدادهای آن‌ها
              اینجا ظاهر می‌شود.
            </p>
            <Link href="/circle" className="btn-primary inline-block mt-3">
              افزودن به حلقه
            </Link>
          </div>
        </div>
      )}

      {/* Listings — primary feed */}
      <FeedSection title="آگهی‌ها">
        {!hydrated ? (
          <FeedSkeleton />
        ) : visible.length === 0 ? (
          <FeedEmptyState
            hasFilter={filter !== "all" || query.trim().length > 0}
            onClear={() => {
              setFilter("all");
              setQuery("");
            }}
          />
        ) : (
          visible.map((l, i) => (
            <div
              key={l.id}
              className={i < 4 ? "animate-fade-up" : undefined}
              style={i < 4 ? { animationDelay: `${i * 45}ms` } : undefined}
            >
              <ListingCard listing={l} compactTrust />
            </div>
          ))
        )}

        {hidden > 0 && (
          <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400 py-2">
            <CircleUsersIcon className="w-4 h-4" />
            <span>
              {toPersianDigits(hidden)} آگهی به‌دلیل تنظیمات حریم خصوصی برای شما
              قابل نمایش نیست
            </span>
          </div>
        )}
      </FeedSection>

      {/* Events — compact strip */}
      {visibleEvents.length > 0 && (
        <StripSection title="رویدادهای پیش‌رو" href="/events">
          {visibleEvents.map((ev) => (
            <EventStripCard key={ev.id} event={ev} />
          ))}
        </StripSection>
      )}

      {/* Requests — compact strip */}
      {visibleRequests.length > 0 && (
        <StripSection title="درخواست‌های حلقه" href="/requests">
          {visibleRequests.map((r) => (
            <RequestStripCard key={r.id} request={r} />
          ))}
        </StripSection>
      )}

      <Onboarding />
      <BottomNav />
    </main>
  );
}

function FeedSection({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 pt-5">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{title}</h2>
        {href && (
          <Link href={href} className="text-xs text-brand-600 font-medium">
            همه
          </Link>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Shortcut({
  href,
  emoji,
  icon,
  label,
  tint,
}: {
  href: string;
  emoji?: string;
  icon?: React.ReactNode;
  label: string;
  tint: string;
}) {
  return (
    <Link
      href={href}
      className="card p-3 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-transform"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${tint}`}>
        {icon ?? emoji}
      </div>
      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{label}</p>
    </Link>
  );
}

function StripSection({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pt-5">
      <div className="flex items-center justify-between mb-2.5 px-4">
        <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{title}</h2>
        {href && (
          <Link href={href} className="text-xs text-brand-600 font-medium">
            همه
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">{children}</div>
    </section>
  );
}

function FeedEmptyState({
  hasFilter,
  onClear,
}: {
  hasFilter: boolean;
  onClear: () => void;
}) {
  return (
    <div className="card p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl mx-auto mb-3">
        🔍
      </div>
      <p className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
        {hasFilter ? "نتیجه‌ای پیدا نشد" : "هنوز آگهی‌ای نیست"}
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
        {hasFilter
          ? "فیلتر یا جستجو را عوض کن، یا اولین آگهی را ثبت کن."
          : "با ثبت آگهی یا گسترش حلقه، فیدت پر می‌شود."}
      </p>
      <div className="flex flex-col gap-2 mt-4">
        {hasFilter && (
          <button type="button" onClick={onClear} className="btn-ghost text-sm">
            پاک کردن فیلتر و جستجو
          </button>
        )}
        <Link href="/new" className="btn-primary text-sm">
          ثبت آگهی
        </Link>
      </div>
    </div>
  );
}

function EventStripCard({ event }: { event: CircleEvent }) {
  const { getPerson } = useStore();
  const host = getPerson(event.hostId);
  const count = event.attendees.length;

  return (
    <Link
      href={`/event/${event.id}`}
      className="card p-3 w-48 shrink-0 active:scale-[0.98] transition-transform"
    >
      {host && (
        <div className="flex items-center gap-2 mb-2">
          <Avatar name={host.name} level={host.level} size="sm" />
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
            {host.name}
          </span>
        </div>
      )}
      <div className="w-full h-14 rounded-xl bg-gradient-to-br from-brand-50 to-zinc-100 dark:from-brand-500/10 dark:to-zinc-800 flex items-center justify-center text-2xl mb-2">
        {event.image}
      </div>
      <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
        {event.title}
      </p>
      <p className="text-[11px] text-brand-700 dark:text-brand-300 font-medium mt-1">
        📅 {formatEventDateDisplay(event.date)}
      </p>
      <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">📍 {event.location}</p>
      <p className="text-[10px] text-zinc-400 mt-1 nums">
        {toPersianDigits(count)} نفر
        {event.capacity ? ` از ${toPersianDigits(event.capacity)}` : ""}
      </p>
    </Link>
  );
}

function RequestStripCard({ request }: { request: Request }) {
  const { getPerson, getOffers } = useStore();
  const requester = getPerson(request.requesterId);
  const offers = getOffers(request.id);

  return (
    <Link
      href={`/request/${request.id}`}
      className="card p-3 w-48 shrink-0 active:scale-[0.98] transition-transform"
    >
      {requester && (
        <div className="flex items-center gap-2 mb-2">
          <Avatar name={requester.name} level={requester.level} size="sm" />
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
            {requester.name}
          </span>
        </div>
      )}
      <div className="w-full h-14 rounded-xl bg-gradient-to-br from-amber-50 to-zinc-100 dark:from-amber-500/10 dark:to-zinc-800 flex items-center justify-center text-2xl mb-2">
        {request.image}
      </div>
      <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
        {request.title}
      </p>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
        {request.category}
      </p>
      {request.budget != null && (
        <p className="text-[11px] text-brand-700 dark:text-brand-300 font-bold nums mt-0.5">
          تا {formatPrice(request.budget)}
        </p>
      )}
      {offers.length > 0 && (
        <p className="text-[10px] text-brand-600 font-medium mt-1 nums">
          {toPersianDigits(offers.length)} پیشنهاد
        </p>
      )}
    </Link>
  );
}
