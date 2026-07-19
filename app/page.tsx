"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import ListingCard from "@/components/ListingCard";
import RequestCard from "@/components/RequestCard";
import EventCard from "@/components/EventCard";
import BottomNav from "@/components/BottomNav";
import Onboarding from "@/components/Onboarding";
import FeedFilterBar from "@/components/FeedFilterBar";
import { FeedSkeleton } from "@/components/Skeleton";
import Avatar from "@/components/Avatar";
import { CircleUsersIcon, SearchIcon, ShieldCheckIcon } from "@/components/Icons";
import { relationLabels } from "@/lib/labels";
import type { CircleEvent, Listing, ListingType, Person, Request } from "@/lib/types";
import { normalizeFa, toPersianDigits } from "@/lib/persian";
import { canView, filterByAccess } from "@/lib/trust";

const SCROLL_COLLAPSE_THRESHOLD = 48;

type ContentType = "listings" | "requests" | "events";

const CONTENT_TABS: { id: ContentType; label: string }[] = [
  { id: "listings", label: "آگهی‌ها" },
  { id: "requests", label: "درخواست‌ها" },
  { id: "events", label: "رویدادها" },
];

export default function FeedPage() {
  const { listings, requests, events, people, getPerson, hydrated } =
    useStore();
  const [filter, setFilter] = useState<ListingType | "all">("all");
  const [query, setQuery] = useState("");
  const [contentType, setContentType] = useState<ContentType>("listings");
  const [headerCompact, setHeaderCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setHeaderCompact(window.scrollY > SCROLL_COLLAPSE_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const circleCount = people.filter((p) => p.inMyCircle).length;
  // Brand-new user with no circle yet → show a single focused "build your circle"
  // path instead of a crowded mix of banner + shortcuts + empty feed.
  const emptyStart = hydrated && circleCount === 0;

  const { allowed, hidden } = useMemo(() => {
    const { visible, hidden } = filterByAccess(listings, getPerson);
    return { allowed: visible, hidden };
  }, [listings, getPerson]);

  const visibleRequests = useMemo(
    () => requests.filter((r) => canView(r, getPerson)),
    [requests, getPerson],
  );

  const visibleEvents = useMemo(
    () => events.filter((e) => canView(e, getPerson)),
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

  const searching = query.trim().length > 0;

  // Global search across listings, requests, events and people in the network.
  const searchResults = useMemo(() => {
    const q = normalizeFa(query);
    if (!q) return null;
    const requestMatches = requests.filter(
      (r) =>
        canView(r, getPerson) &&
        normalizeFa(`${r.title} ${r.description} ${r.category}`).includes(q),
    );
    const eventMatches = events.filter(
      (e) =>
        canView(e, getPerson) &&
        normalizeFa(`${e.title} ${e.description} ${e.location}`).includes(q),
    );
    const peopleMatches = people.filter((p) =>
      normalizeFa(
        `${p.name} ${p.note ?? ""} ${relationLabels[p.relation]} ${p.city ?? ""}`,
      ).includes(q),
    );
    return {
      listings: visible,
      requests: requestMatches,
      events: eventMatches,
      people: peopleMatches,
      total:
        visible.length +
        requestMatches.length +
        eventMatches.length +
        peopleMatches.length,
    };
  }, [query, visible, requests, events, people, getPerson]);

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

          {!emptyStart && (
            <div className={`relative transition-all duration-200 ${headerCompact ? "mt-2" : "mt-3"}`}>
              <SearchIcon className="w-5 h-5 text-zinc-400 absolute top-1/2 -translate-y-1/2 right-3" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجو در آگهی، درخواست، رویداد و افراد…"
                aria-label="جستجو در حلقه"
                className={`field !pr-10 bg-zinc-50 dark:bg-zinc-800/50 transition-all duration-200 ${
                  query ? "!pl-9" : ""
                } ${headerCompact ? "!py-2 text-sm" : "!py-2.5"}`}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="پاک کردن جستجو"
                  className="absolute top-1/2 -translate-y-1/2 left-2 w-6 h-6 rounded-full bg-zinc-200/80 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300 flex items-center justify-center text-sm active:scale-90 transition"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {!emptyStart && !searching && (
          <div
            role="tablist"
            aria-label="نوع محتوا"
            className="flex gap-1.5 px-4 pb-2"
          >
            {CONTENT_TABS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={contentType === c.id}
                onClick={() => setContentType(c.id)}
                className={`flex-1 rounded-lg py-1.5 text-[13px] font-medium transition-colors ${
                  contentType === c.id
                    ? "bg-brand-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {!emptyStart && !searching && contentType === "listings" && (
          <FeedFilterBar
            filter={filter}
            onFilter={setFilter}
            compact={headerCompact}
          />
        )}
      </header>

      {emptyStart ? (
        /* First run — one clear path: build your circle */
        <FirstRunStart />
      ) : searching ? (
        <SearchResults results={searchResults} onClear={() => setQuery("")} />
      ) : contentType === "listings" ? (
        <FeedSection title="آگهی‌ها">
          {!hydrated ? (
            <FeedSkeleton />
          ) : visible.length === 0 ? (
            <FeedEmptyState
              hasFilter={filter !== "all"}
              onClear={() => setFilter("all")}
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
      ) : contentType === "requests" ? (
        <FeedSection title="درخواست‌های حلقه" href="/requests">
          {!hydrated ? (
            <FeedSkeleton />
          ) : visibleRequests.length === 0 ? (
            <ContentEmptyState
              emoji="🔎"
              title="هنوز درخواستی نیست"
              body="کسی در حلقه‌ات دنبال چیزی نگشته. اگر چیزی می‌خواهی، درخواست بگذار."
              href="/requests?compose=1"
              cta="ثبت درخواست"
            />
          ) : (
            visibleRequests.map((r) => <RequestCard key={r.id} request={r} />)
          )}
        </FeedSection>
      ) : (
        <FeedSection title="رویدادهای حلقه" href="/events">
          {!hydrated ? (
            <FeedSkeleton />
          ) : visibleEvents.length === 0 ? (
            <ContentEmptyState
              emoji="🎉"
              title="هنوز رویدادی نیست"
              body="دورهمی، کلاس یا سفری در حلقه‌ات برگزار نشده. اولین رویداد را بساز."
              href="/events?compose=1"
              cta="ساختن رویداد"
            />
          ) : (
            visibleEvents.map((ev) => <EventCard key={ev.id} event={ev} />)
          )}
        </FeedSection>
      )}

      <Onboarding />
      <BottomNav />
    </main>
  );
}

type SearchResultsData = {
  listings: Listing[];
  requests: Request[];
  events: CircleEvent[];
  people: Person[];
  total: number;
};

function SearchResults({
  results,
  onClear,
}: {
  results: SearchResultsData | null;
  onClear: () => void;
}) {
  if (!results) return null;

  if (results.total === 0) {
    return (
      <div className="px-4 pt-6">
        <div className="card p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl mx-auto mb-3">
            🔍
          </div>
          <p className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
            چیزی پیدا نشد
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
            در آگهی‌ها، درخواست‌ها، رویدادها و افراد حلقه‌ات نتیجه‌ای نبود.
          </p>
          <button type="button" onClick={onClear} className="btn-ghost text-sm mt-4">
            پاک کردن جستجو
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-2">
      {results.people.length > 0 && (
        <SearchGroup title="افراد" count={results.people.length}>
          <div className="space-y-2">
            {results.people.map((p) => (
              <PersonResultRow key={p.id} person={p} />
            ))}
          </div>
        </SearchGroup>
      )}

      {results.listings.length > 0 && (
        <SearchGroup title="آگهی‌ها" count={results.listings.length}>
          <div className="space-y-3">
            {results.listings.map((l) => (
              <ListingCard key={l.id} listing={l} compactTrust />
            ))}
          </div>
        </SearchGroup>
      )}

      {results.requests.length > 0 && (
        <SearchGroup title="درخواست‌ها" count={results.requests.length}>
          <div className="space-y-3">
            {results.requests.map((r) => (
              <RequestCard key={r.id} request={r} />
            ))}
          </div>
        </SearchGroup>
      )}

      {results.events.length > 0 && (
        <SearchGroup title="رویدادها" count={results.events.length}>
          <div className="space-y-3">
            {results.events.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        </SearchGroup>
      )}
    </div>
  );
}

function SearchGroup({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 pt-5">
      <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2.5">
        {title}
        <span className="text-zinc-400 font-normal nums"> ({toPersianDigits(count)})</span>
      </h2>
      {children}
    </section>
  );
}

function PersonResultRow({ person }: { person: Person }) {
  return (
    <Link
      href={`/person/${person.id}`}
      className="card p-3 flex items-center gap-3 active:scale-[0.99] transition-transform"
    >
      <Avatar name={person.name} level={person.level} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
          {person.name}
        </p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
          {relationLabels[person.relation]}
          {person.city ? ` · ${person.city}` : ""}
          {person.inMyCircle ? " · در حلقه‌ی شما" : ""}
        </p>
      </div>
      <span className="text-zinc-300 dark:text-zinc-600 text-lg">‹</span>
    </Link>
  );
}

function FirstRunStart() {
  return (
    <div className="px-4 pt-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300 flex items-center justify-center mx-auto mb-4">
          <CircleUsersIcon className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
          اول حلقه‌ات را بساز
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed px-2">
          سیرکل فقط بین آدم‌های مورد اعتماد کار می‌کند. خانواده، دوستان و آشنایانت
          را اضافه کن تا آگهی‌ها، درخواست‌ها و رویدادهای آن‌ها اینجا ظاهر شود.
        </p>
        <Link href="/circle" className="btn-primary inline-block mt-5 px-8">
          افزودن به حلقه
        </Link>
      </div>

      <ol className="mt-8 space-y-3">
        <FirstRunStep
          n={1}
          title="حلقه‌ات را بساز"
          body="افراد مورد اعتماد را در دایره‌های «نزدیک»، «مورد اعتماد» و «آشنا» بگذار."
          active
        />
        <FirstRunStep
          n={2}
          title="فید پر می‌شود"
          body="آگهی‌ها و رویدادهای حلقه‌ات — و حلقه‌ی آن‌ها — اینجا نمایش داده می‌شود."
        />
        <FirstRunStep
          n={3}
          title="اولین آگهی را ثبت کن"
          body="با دکمه‌ی + پایین صفحه، آگهی، درخواست یا رویداد بساز."
        />
      </ol>
    </div>
  );
}

function FirstRunStep({
  n,
  title,
  body,
  active = false,
}: {
  n: number;
  title: string;
  body: string;
  active?: boolean;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold nums ${
          active
            ? "bg-brand-600 text-white"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
        }`}
      >
        {toPersianDigits(n)}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{title}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
          {body}
        </p>
      </div>
    </li>
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
          ? "فیلتر را عوض کن، یا اولین آگهی را ثبت کن."
          : "با ثبت آگهی یا گسترش حلقه، فیدت پر می‌شود."}
      </p>
      <div className="flex flex-col gap-2 mt-4">
        {hasFilter && (
          <button type="button" onClick={onClear} className="btn-ghost text-sm">
            پاک کردن فیلتر
          </button>
        )}
        <Link href="/new" className="btn-primary text-sm">
          ثبت آگهی
        </Link>
      </div>
    </div>
  );
}

function ContentEmptyState({
  emoji,
  title,
  body,
  href,
  cta,
}: {
  emoji: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="card p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl mx-auto mb-3">
        {emoji}
      </div>
      <p className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{title}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
        {body}
      </p>
      <Link href={href} className="btn-primary inline-block text-sm mt-4">
        {cta}
      </Link>
    </div>
  );
}
