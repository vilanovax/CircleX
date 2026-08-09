"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import ListingCard from "@/components/ListingCard";
import BottomNav from "@/components/BottomNav";
import { lazyUi } from "@/lib/lazy-ui";
import FeedFilterBar from "@/components/FeedFilterBar";
import { FeedSkeleton } from "@/components/Skeleton";
import Avatar from "@/components/Avatar";
import { CircleUsersIcon, SearchIcon, ShieldCheckIcon } from "@/components/Icons";
import { formatPrice } from "@/lib/labels";
import type { CircleEvent, ListingType, Request } from "@/lib/types";
import { formatEventDateDisplay, normalizeFa, toPersianDigits } from "@/lib/persian";
import { canView, filterByAccess } from "@/lib/trust";

const Onboarding = lazyUi(() => import("@/components/Onboarding"));

const SCROLL_COLLAPSE_THRESHOLD = 48;

const PREVIEW_LIMIT = 8;

export default function ClassicFeed() {
  const { listings, requests, events, people, getPerson, hydrated, onboarded } =
    useStore();
  const [filter, setFilter] = useState<ListingType | "all">("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
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
    const q = normalizeFa(deferredQuery);
    return allowed.filter((l) => {
      if (filter !== "all" && l.type !== filter) return false;
      if (
        q &&
        !normalizeFa(`${l.title} ${l.description} ${l.category}`).includes(q)
      )
        return false;
      return true;
    });
  }, [allowed, filter, deferredQuery]);

  const browsingAll = filter === "all" && query.trim().length === 0;
  const showSecondary = browsingAll && hydrated;

  return (
    <main className="pb-24 min-h-[100dvh]">
      <header
        className={`sticky top-0 z-20 backdrop-blur-xl border-b transition-shadow duration-200 ${
          headerCompact
            ? "bg-[color:var(--circle-surface)]/92 border-stone-200/60 shadow-sm dark:border-zinc-800"
            : "bg-[color:var(--circle-canvas)]/85 border-transparent"
        }`}
      >
        <div className="px-4 pt-[max(0.85rem,env(safe-area-inset-top))] pb-1.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm shadow-brand-600/20">
                <ShieldCheckIcon className="w-4 h-4" />
              </div>
              <h1 className="text-[15px] font-extrabold text-ink dark:text-zinc-50 tracking-tight">
                سیرکل
              </h1>
            </div>
            <div className="relative flex-1 min-w-0">
              <SearchIcon className="w-[16px] h-[16px] text-ink-faint absolute top-1/2 -translate-y-1/2 right-2.5" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجو…"
                aria-label="جستجو در حلقه‌ی شما"
                className="field !pr-9 !py-2 !px-3 text-sm !border-stone-200/80 dark:!border-zinc-700"
              />
            </div>
          </div>
        </div>

        <FeedFilterBar
          filter={filter}
          onFilter={(next) => startTransition(() => setFilter(next))}
          compact={headerCompact}
        />
      </header>

      {/* Trust banner — only before onboarding completes */}
      {!onboarded && (
        <div className="px-4 pt-3">
          <div className="rounded-2xl border border-levelA/20 bg-levelA/[0.07] px-3.5 py-3">
            <p className="font-bold text-[13px] text-ink dark:text-zinc-100">
              اینجا کسی غریبه نیست
            </p>
            <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-relaxed">
              هر آگهی از مسیر اعتماد حلقه‌ات به تو می‌رسد.
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

      {/* Listings first — home's primary job */}
      <FeedSection
        title="آگهی‌ها"
        count={hydrated ? visible.length : undefined}
      >
        {!hydrated ? (
          <FeedSkeleton />
        ) : visible.length === 0 ? (
          <FeedEmptyState
            hasFilter={!browsingAll}
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
          <div className="flex items-center justify-center gap-2 text-[11px] text-ink-faint py-1">
            <CircleUsersIcon className="w-4 h-4 shrink-0" />
            <span>
              {toPersianDigits(hidden)} آگهی به‌دلیل حریم خصوصی پنهان است
            </span>
          </div>
        )}
      </FeedSection>

      {/* Secondary: events + requests only when browsing the full feed */}
      {showSecondary && visibleEvents.length > 0 && (
        <StripSection title="رویدادهای پیش‌رو" href="/events">
          {visibleEvents.slice(0, 4).map((ev) => (
            <EventStripCard key={ev.id} event={ev} />
          ))}
        </StripSection>
      )}

      {showSecondary && visibleRequests.length > 0 && (
        <section className="pt-5 px-4 pb-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[13px] font-bold text-ink dark:text-zinc-200">
              درخواست‌های حلقه
            </h2>
            <Link
              href="/requests"
              className="text-[11px] text-ink-muted dark:text-zinc-500 font-medium"
            >
              همه
            </Link>
          </div>
          <div className="card divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden">
            {visibleRequests.slice(0, 2).map((r) => (
              <RequestDenseRow key={r.id} request={r} />
            ))}
          </div>
        </section>
      )}

      {hydrated && !onboarded ? <Onboarding /> : null}
      <BottomNav />
    </main>
  );
}

function FeedSection({
  title,
  href,
  count,
  children,
}: {
  title: string;
  href?: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 pt-3.5">
      <div className="flex items-baseline justify-between mb-2.5">
        <h2 className="flex items-center gap-2 text-[13px] font-bold text-ink dark:text-zinc-200">
          <span>{title}</span>
          {count != null && count > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[1.35rem] h-5 px-1.5 rounded-md bg-stone-200/70 dark:bg-zinc-800 text-[11px] font-bold text-ink-muted dark:text-zinc-400 nums"
              aria-label={`${toPersianDigits(count)} مورد`}
            >
              {toPersianDigits(count)}
            </span>
          )}
        </h2>
        {href && (
          <Link href={href} className="text-[11px] text-ink-muted dark:text-zinc-500 font-medium">
            همه
          </Link>
        )}
      </div>
      <div className="space-y-2.5">{children}</div>
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
    <section className="pt-4">
      <div className="flex items-center justify-between mb-2 px-4">
        <h2 className="text-[13px] font-bold text-ink dark:text-zinc-200">{title}</h2>
        {href && (
          <Link href={href} className="text-[11px] text-ink-muted dark:text-zinc-500 font-medium">
            همه
          </Link>
        )}
      </div>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 pb-1">{children}</div>
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
      className="card p-2.5 w-40 shrink-0 active:scale-[0.98] transition-transform duration-150"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl leading-none" aria-hidden>
          {event.image}
        </span>
        {host && (
          <span className="text-[11px] text-ink-muted dark:text-zinc-400 truncate">
            {host.name}
          </span>
        )}
      </div>
      <p className="text-[12px] font-bold text-ink dark:text-zinc-100 line-clamp-2 leading-snug">
        {event.title}
      </p>
      <p className="text-[11px] text-ink-muted mt-1.5">
        {formatEventDateDisplay(event.date)}
      </p>
      <p className="text-[10px] text-ink-faint mt-0.5 nums">
        {toPersianDigits(count)}
        {event.capacity ? `/${toPersianDigits(event.capacity)}` : ""} نفر ·{" "}
        <span className="truncate">{event.location}</span>
      </p>
    </Link>
  );
}

function RequestDenseRow({ request }: { request: Request }) {
  const { getPerson, getOffers } = useStore();
  const requester = getPerson(request.requesterId);
  const offers = getOffers(request.id);

  return (
    <Link
      href={`/request/${request.id}`}
      className="flex items-center gap-3 px-3.5 py-3 active:bg-stone-50/80 dark:active:bg-zinc-800/60 transition-colors"
    >
      {requester ? (
        <Avatar name={requester.name} level={requester.level} size="sm" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-zinc-800" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-ink dark:text-zinc-100 line-clamp-1">
          {request.title}
        </p>
        <p className="text-[11px] text-ink-faint mt-0.5 line-clamp-1">
          {request.category}
          {request.budget != null ? ` · تا ${formatPrice(request.budget)}` : ""}
        </p>
      </div>
      {offers.length > 0 && (
        <span className="text-[10px] font-bold text-levelA shrink-0 nums">
          {toPersianDigits(offers.length)} پیشنهاد
        </span>
      )}
    </Link>
  );
}
