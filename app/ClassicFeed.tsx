"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { activeCircle } from "@/lib/circle-member";
import { useStore } from "@/lib/store";
import ListingCard from "@/components/ListingCard";
import BottomNav from "@/components/BottomNav";
import NewUserHomePlaceholder from "@/components/NewUserHomePlaceholder";
import { lazyUi } from "@/lib/lazy-ui";
import FeedFilterBar, { type FeedFilter } from "@/components/FeedFilterBar";
import RequestCard from "@/components/RequestCard";
import { FeedSkeleton } from "@/components/Skeleton";
import { CircleUsersIcon, LockIcon, SearchIcon, ShieldCheckIcon } from "@/components/Icons";
import type { CircleEvent, Listing, Person, Request } from "@/lib/types";
import { formatEventDateDisplay, normalizeFa, toPersianDigits } from "@/lib/persian";
import { CONCEPT_TIP_KEY } from "@/lib/home-tip";
import { canView, filterByAccess, trustScore } from "@/lib/trust";
import { useCatalog } from "@/lib/use-catalog";

const Onboarding = lazyUi(() => import("@/components/Onboarding"));
const HomeEmptyCircle = lazyUi(() => import("@/components/HomeEmptyCircle"), {
  loading: () => (
    <div className="px-4 pt-4">
      <div className="card h-28 animate-pulse bg-stone-100 dark:bg-zinc-800" />
    </div>
  ),
});

const PREVIEW_LIMIT = 8;
const FEED_PAGE = 12;

/**
 * Feed boundary + depth:
 * - network: my circle and people reached through them (FoF)
 * - mine: only people I added directly
 * - trusted / near: direct only, narrowed by trust group
 */
type CircleScope = "network" | "mine" | "trusted" | "near";

const SCOPE_OPTIONS: { key: CircleScope; label: string; hint: string }[] = [
  {
    key: "network",
    label: "حلقه + وابسته‌ها",
    hint: "حلقهٔ تو و کسانی که از طریق آن‌ها می‌آیند",
  },
  {
    key: "mine",
    label: "فقط حلقهٔ من",
    hint: "فامیل، دوست، همکار، همسایه و آشنای مستقیم",
  },
  {
    key: "trusted",
    label: "نزدیکان و مورد اعتماد",
    hint: "فقط اعضای مستقیم این دو گروه",
  },
  {
    key: "near",
    label: "فقط نزدیکان",
    hint: "فقط نزدیک‌ترین‌های مستقیم حلقه‌ات",
  },
];

function listingMatchesScope(
  listing: Listing,
  scope: CircleScope,
  getPerson: (id: string) => Person | undefined,
): boolean {
  if (listing.dealStatus === "inactive") return false;
  if (listing.sellerId === "me") return true;

  const direct = listing.trustPath.length === 0;
  const score = trustScore(listing.sellerId, listing.trustPath, getPerson);

  if (scope === "network") return score > 0;
  if (!direct) return false;
  if (scope === "mine") return score > 0;
  if (scope === "trusted") return score >= 2;
  return score >= 3;
}

function requestMatchesScope(
  request: Request,
  scope: CircleScope,
  getPerson: (id: string) => Person | undefined,
): boolean {
  if (request.requesterId === "me") return true;

  const direct = request.trustPath.length === 0;
  const score = trustScore(request.requesterId, request.trustPath, getPerson);

  if (scope === "network") return score > 0;
  if (!direct) return false;
  if (scope === "mine") return score > 0;
  if (scope === "trusted") return score >= 2;
  return score >= 3;
}

function readShowConceptTip() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CONCEPT_TIP_KEY) !== "1";
  } catch {
    return true;
  }
}

export default function ClassicFeed() {
  const listings = useStore((s) => s.listings);
  const requests = useStore((s) => s.requests);
  const events = useStore((s) => s.events);
  const people = useStore((s) => s.people);
  const getPerson = useStore((s) => s.getPerson);
  const hydrated = useStore((s) => s.hydrated);
  const circleReady = useStore((s) => s.circleReady);
  const onboarded = useStore((s) => s.onboarded);
  const showOwnListingsInFeed = useStore((s) => s.showOwnListingsInFeed);
  const catalog = useCatalog();
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [circleScope, setCircleScope] = useState<CircleScope>("network");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [showConceptTip, setShowConceptTip] = useState(readShowConceptTip);
  const [feedPage, setFeedPage] = useState(1);

  function dismissConceptTip() {
    try {
      localStorage.setItem(CONCEPT_TIP_KEY, "1");
    } catch {
      /* ignore */
    }
    setShowConceptTip(false);
  }

  const circleCount = activeCircle(people).length;
  const isNewUser = hydrated && !onboarded;
  const emptyCircle = circleReady && onboarded && circleCount === 0;
  const quietChrome = isNewUser || emptyCircle;
  const requestsMode = filter === "requests";

  const { allowed, hidden } = useMemo(() => {
    const { visible, hidden } = filterByAccess(listings, getPerson);
    return { allowed: visible, hidden };
  }, [listings, getPerson]);

  const visibleRequests = useMemo(() => {
    const q = normalizeFa(deferredQuery);
    return requests.filter((r) => {
      if (!canView(r, getPerson)) return false;
      if (!requestMatchesScope(r, circleScope, getPerson)) return false;
      if (
        q &&
        !normalizeFa(`${r.title} ${r.description} ${r.category}`).includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [requests, getPerson, circleScope, deferredQuery]);

  const previewRequests = useMemo(
    () => visibleRequests.slice(0, PREVIEW_LIMIT),
    [visibleRequests],
  );

  const visibleEvents = useMemo(
    () => events.filter((e) => canView(e, getPerson)).slice(0, PREVIEW_LIMIT),
    [events, getPerson],
  );

  const visible = useMemo(() => {
    if (requestsMode) return [];
    const q = normalizeFa(deferredQuery);
    return allowed.filter((l) => {
      if (filter !== "all" && l.type !== filter) return false;
      if (
        q &&
        !normalizeFa(`${l.title} ${l.description} ${l.category}`).includes(q)
      )
        return false;
      if (!listingMatchesScope(l, circleScope, getPerson)) return false;
      if (!showOwnListingsInFeed && l.sellerId === "me") return false;
      return true;
    });
  }, [
    allowed,
    filter,
    deferredQuery,
    circleScope,
    getPerson,
    requestsMode,
    showOwnListingsInFeed,
  ]);

  const feedTotal = requestsMode ? visibleRequests.length : visible.length;
  const feedShown = Math.min(feedPage * FEED_PAGE, feedTotal);
  const feedRemaining = feedTotal - feedShown;

  useEffect(() => {
    setFeedPage(1);
  }, [filter, deferredQuery, circleScope, showOwnListingsInFeed]);

  const browsingAll =
    filter === "all" &&
    query.trim().length === 0 &&
    circleScope === "network";
  const showSecondary = browsingAll && circleReady && onboarded && !emptyCircle;
  const scopeLabel =
    SCOPE_OPTIONS.find((o) => o.key === circleScope)?.label ??
    "حلقه + وابسته‌ها";

  return (
    <main className="pb-24 min-h-[100dvh]">
      <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-[color:var(--circle-surface)] before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-[50vh] before:bg-[color:var(--circle-surface)] dark:border-zinc-800 dark:bg-zinc-950 dark:before:bg-zinc-950">
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
            {!quietChrome && (
              <div className="relative flex-1 min-w-0">
                <SearchIcon className="w-[16px] h-[16px] text-ink-faint absolute top-1/2 -translate-y-1/2 right-2.5" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={requestsMode ? "جستجو در درخواست‌ها…" : "جستجو…"}
                  aria-label={
                    requestsMode ? "جستجو در درخواست‌ها" : "جستجو در حلقه‌ات"
                  }
                  className="field !pr-9 !py-2 !px-3 text-sm !border-stone-200/80 dark:!border-zinc-700"
                />
              </div>
            )}
          </div>
        </div>

        {!quietChrome && (
          <FeedFilterBar
            filter={filter}
            onFilter={(next) => startTransition(() => setFilter(next))}
          />
        )}
      </header>

      {isNewUser ? (
        <NewUserHomePlaceholder />
      ) : emptyCircle ? (
        <HomeEmptyCircle />
      ) : (
        <>
          {showConceptTip && (
            <div className="px-4 pt-3">
              <div className="relative rounded-2xl bg-brand-50/80 dark:bg-brand-500/10 ring-1 ring-brand-100/70 dark:ring-brand-500/20 px-3.5 py-2.5">
                <p className="text-[13px] font-bold text-ink dark:text-zinc-100 leading-snug pe-7">
                  خرید، فروش و کمک گرفتن از آدم‌های مورد اعتماد
                </p>
                <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-snug pe-7">
                  همه‌چیز از حلقهٔ تو می‌آید، نه از غریبه‌ها.
                </p>
                <button
                  type="button"
                  onClick={dismissConceptTip}
                  className="absolute top-2 left-2 w-7 h-7 rounded-full text-ink-faint hover:bg-stone-200/60 dark:hover:bg-zinc-800 flex items-center justify-center text-sm"
                  aria-label="بستن راهنما"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Listings — or requests when that filter is on */}
          <FeedSection
            title={requestsMode ? "درخواست‌ها" : "آگهی‌ها"}
            count={
              hydrated
                ? requestsMode
                  ? visibleRequests.length
                  : visible.length
                : undefined
            }
            scopeControl={
              circleCount > 0 ? (
                <CircleScopeControl
                  value={circleScope}
                  label={scopeLabel}
                  onChange={(next) =>
                    startTransition(() => setCircleScope(next))
                  }
                />
              ) : undefined
            }
          >
            {!circleReady ? (
              <FeedSkeleton />
            ) : requestsMode ? (
              visibleRequests.length === 0 ? (
                <FeedEmptyState
                  hasFilter
                  requestsMode
                  canCompose={catalog.flags.requests}
                  onClear={() => {
                    setFilter("all");
                    setCircleScope("network");
                    setQuery("");
                  }}
                />
              ) : (
                <>
                  {visibleRequests.slice(0, feedShown).map((r, i) => (
                    <div
                      key={r.id}
                      className={i < 4 ? "animate-fade-up" : undefined}
                      style={
                        i < 4 ? { animationDelay: `${i * 45}ms` } : undefined
                      }
                    >
                      <RequestCard request={r} feedStyle compactTrust />
                    </div>
                  ))}
                  {feedRemaining > 0 ? (
                    <button
                      type="button"
                      onClick={() => setFeedPage((page) => page + 1)}
                      className="w-full rounded-xl border border-stone-200/80 dark:border-zinc-700 bg-[color:var(--circle-surface)] dark:bg-zinc-900 py-2.5 text-[13px] font-bold text-brand-700 dark:text-brand-300 active:opacity-80"
                    >
                      درخواست‌های بیشتر
                    </button>
                  ) : null}
                </>
              )
            ) : visible.length === 0 ? (
              <FeedEmptyState
                hasFilter={!browsingAll}
                onClear={() => {
                  setFilter("all");
                  setCircleScope("network");
                  setQuery("");
                }}
              />
            ) : (
              <>
                {visible.slice(0, feedShown).map((l, i) => (
                  <div
                    key={l.id}
                    className={i < 4 ? "animate-fade-up" : undefined}
                    style={
                      i < 4 ? { animationDelay: `${i * 45}ms` } : undefined
                    }
                  >
                    <ListingCard
                      listing={l}
                      compactTrust
                      imagePriority={i === 0}
                    />
                  </div>
                ))}
                {feedRemaining > 0 ? (
                  <button
                    type="button"
                    onClick={() => setFeedPage((page) => page + 1)}
                    className="w-full rounded-xl border border-stone-200/80 dark:border-zinc-700 bg-[color:var(--circle-surface)] dark:bg-zinc-900 py-2.5 text-[13px] font-bold text-brand-700 dark:text-brand-300 active:opacity-80"
                  >
                    آگهی‌های بیشتر
                  </button>
                ) : null}
              </>
            )}

            {!requestsMode && hidden > 0 && circleCount > 0 && (
              <button
                type="button"
                className="flex items-center justify-center gap-2 text-[12px] font-medium text-ink-muted dark:text-zinc-400 py-2 w-full"
                title="این آگهی‌ها را فقط حلقهٔ نزدیک‌تر فروشنده می‌بیند"
              >
                <LockIcon className="w-3.5 h-3.5 shrink-0 text-ink-muted" />
                <span>
                  {toPersianDigits(hidden)} آگهی را فقط حلقهٔ نزدیک‌تر فروشنده
                  می‌بیند
                </span>
              </button>
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

          {showSecondary && previewRequests.length > 0 && (
            <section className="pt-5 px-4 pb-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[13px] font-bold text-ink dark:text-zinc-200">
                  درخواست‌های حلقه
                </h2>
                <button
                  type="button"
                  onClick={() => startTransition(() => setFilter("requests"))}
                  className="text-[11px] text-ink-muted dark:text-zinc-500 font-medium"
                >
                  همه
                </button>
              </div>
              <div className="space-y-2.5">
                {previewRequests.slice(0, 2).map((r) => (
                  <RequestCard
                    key={r.id}
                    request={r}
                    compactTrust
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {isNewUser ? <Onboarding /> : null}
      <BottomNav />
    </main>
  );
}

function FeedSection({
  title,
  href,
  count,
  scopeControl,
  children,
}: {
  title: string;
  href?: string;
  count?: number;
  scopeControl?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="px-4 pt-3.5">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-ink dark:text-zinc-200 min-w-0">
          <span>{title}</span>
          {count != null && count > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[1.35rem] h-5 px-1.5 rounded-md bg-stone-200/80 dark:bg-zinc-800 text-[11px] font-bold text-ink-muted dark:text-zinc-300 nums"
              aria-label={`${toPersianDigits(count)} مورد`}
            >
              {toPersianDigits(count)}
            </span>
          )}
        </h2>
        {scopeControl}
        {href && (
          <Link href={href} className="text-[11px] text-ink-muted dark:text-zinc-500 font-medium shrink-0">
            همه
          </Link>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function CircleScopeControl({
  value,
  label,
  onChange,
}: {
  value: CircleScope;
  label: string;
  onChange: (next: CircleScope) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--circle-surface)] dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-700 px-2.5 py-1.5 text-[12px] font-medium text-ink dark:text-zinc-200 active:scale-[0.98] transition-transform"
      >
        <CircleUsersIcon className="w-3.5 h-3.5 text-brand-600 shrink-0" />
        <span className="font-bold text-brand-700 dark:text-brand-300">
          {label}
        </span>
        <span className="text-ink-faint text-[11px]" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default"
            aria-label="بستن"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            aria-label="محدوده حلقه"
            className="absolute top-full left-0 z-40 mt-1.5 w-[min(16.5rem,calc(100vw-2.5rem))] rounded-xl border border-stone-200/80 dark:border-zinc-700 bg-[color:var(--circle-surface)] dark:bg-zinc-900 shadow-lg overflow-hidden py-1"
          >
            {SCOPE_OPTIONS.map((opt) => {
              const active = opt.key === value;
              return (
                <li key={opt.key} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.key);
                      setOpen(false);
                    }}
                    className={`w-full text-right px-3 py-2.5 transition-colors ${
                      active
                        ? "bg-brand-50 dark:bg-brand-500/15"
                        : "hover:bg-stone-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span
                      className={`block text-[13px] font-bold ${
                        active
                          ? "text-brand-700 dark:text-brand-300"
                          : "text-ink dark:text-zinc-100"
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="block text-[11px] text-ink-muted dark:text-zinc-500 mt-0.5">
                      {opt.hint}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
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
  requestsMode = false,
  canCompose = true,
}: {
  hasFilter: boolean;
  onClear: () => void;
  requestsMode?: boolean;
  canCompose?: boolean;
}) {
  return (
    <div className="card p-6 text-center">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl mx-auto mb-3 bg-zinc-100 dark:bg-zinc-800"
      >
        {requestsMode ? "🙋" : "🔍"}
      </div>
      <p className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
        {requestsMode
          ? hasFilter
            ? "درخواستی با این فیلتر نیست"
            : "هنوز درخواستی نیست"
          : hasFilter
            ? "نتیجه‌ای پیدا نشد"
            : "هنوز آگهی‌ای نیست"}
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
        {requestsMode
          ? "چیزی لازم داری؟ از حلقه بپرس — یا فیلتر را عوض کن."
          : hasFilter
            ? "فیلتر یا جستجو را عوض کن، یا اولین آگهی را ثبت کن."
            : "با ثبت آگهی یا گسترش حلقه، اینجا پر می‌شود."}
      </p>
      <div className="flex flex-col gap-2 mt-4">
        {hasFilter && (
          <button type="button" onClick={onClear} className="btn-ghost text-sm">
            پاک کردن فیلتر و جستجو
          </button>
        )}
        {canCompose ? (
          <Link
            href={requestsMode ? "/requests?compose=1" : "/new"}
            className="btn-primary text-sm"
          >
            {requestsMode ? "ثبت درخواست" : "ثبت آگهی"}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function EventStripCard({ event }: { event: CircleEvent }) {
  const getPerson = useStore((s) => s.getPerson);
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
      <p className="text-[11px] text-ink-faint mt-0.5 nums">
        {toPersianDigits(count)}
        {event.capacity ? `/${toPersianDigits(event.capacity)}` : ""} نفر ·{" "}
        <span className="truncate">{event.location}</span>
      </p>
    </Link>
  );
}
