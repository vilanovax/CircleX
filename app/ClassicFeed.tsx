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
import HomeEmptyCircle from "@/components/HomeEmptyCircle";
import { lazyUi } from "@/lib/lazy-ui";
import FeedFilterBar from "@/components/FeedFilterBar";
import { FeedSkeleton } from "@/components/Skeleton";
import Avatar from "@/components/Avatar";
import { CircleUsersIcon, LockIcon, SearchIcon, ShieldCheckIcon } from "@/components/Icons";
import { formatPrice } from "@/lib/labels";
import type { CircleEvent, Listing, ListingType, Request } from "@/lib/types";
import { formatEventDateDisplay, normalizeFa, toPersianDigits } from "@/lib/persian";
import { canView, filterByAccess, trustScore } from "@/lib/trust";

const Onboarding = lazyUi(() => import("@/components/Onboarding"));

const SCROLL_COLLAPSE_THRESHOLD = 48;
const PREVIEW_LIMIT = 8;
const HOME_SELLERS = 8;
const SEARCH_PAGE = 12;
const CONCEPT_TIP_KEY = "circle-home-concept-tip-v1";

type SellerBundle = {
  sellerId: string;
  featured: Listing;
  extras: Listing[];
};

function bundleBySeller(listings: Listing[]): SellerBundle[] {
  const order: string[] = [];
  const bySeller = new Map<string, Listing[]>();
  for (const listing of listings) {
    const existing = bySeller.get(listing.sellerId);
    if (!existing) {
      order.push(listing.sellerId);
      bySeller.set(listing.sellerId, [listing]);
    } else {
      existing.push(listing);
    }
  }
  return order.map((sellerId) => {
    const items = bySeller.get(sellerId) ?? [];
    return {
      sellerId,
      featured: items[0]!,
      extras: items.slice(1),
    };
  });
}

/** Who in the circle the feed draws from (maps to trustScore floors). */
type CircleScope = "all" | "near" | "trusted";

const SCOPE_OPTIONS: { key: CircleScope; label: string; hint: string }[] = [
  { key: "all", label: "همهٔ حلقه", hint: "نزدیکان، افراد مورد اعتماد و آشنایان" },
  { key: "trusted", label: "تا افراد مورد اعتماد", hint: "نزدیکان و افراد مورد اعتماد" },
  { key: "near", label: "فقط نزدیکان", hint: "نزدیک‌ترین‌های شما" },
];

function scopeMinScore(scope: CircleScope): number {
  if (scope === "near") return 3;
  if (scope === "trusted") return 2;
  return 0;
}

export default function ClassicFeed() {
  const {
    listings,
    requests,
    events,
    people,
    getPerson,
    hydrated,
    onboarded,
  } = useStore();
  const [filter, setFilter] = useState<ListingType | "all">("all");
  const [circleScope, setCircleScope] = useState<CircleScope>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [headerCompact, setHeaderCompact] = useState(false);
  const [showConceptTip, setShowConceptTip] = useState(false);
  const [conceptTipReady, setConceptTipReady] = useState(false);
  const [feedPage, setFeedPage] = useState(1);

  useEffect(() => {
    const onScroll = () => setHeaderCompact(window.scrollY > SCROLL_COLLAPSE_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!hydrated || !onboarded) {
      setShowConceptTip(false);
      setConceptTipReady(false);
      return;
    }
    try {
      setShowConceptTip(localStorage.getItem(CONCEPT_TIP_KEY) !== "1");
    } catch {
      setShowConceptTip(true);
    }
    setConceptTipReady(true);
  }, [hydrated, onboarded]);

  function dismissConceptTip() {
    try {
      localStorage.setItem(CONCEPT_TIP_KEY, "1");
    } catch {
      /* ignore */
    }
    setShowConceptTip(false);
  }

  function restoreConceptTip() {
    try {
      localStorage.removeItem(CONCEPT_TIP_KEY);
    } catch {
      /* ignore */
    }
    setShowConceptTip(true);
  }

  const circleCount = activeCircle(people).length;
  const isNewUser = hydrated && !onboarded;
  const emptyCircle = hydrated && onboarded && circleCount === 0;
  const quietChrome = isNewUser || emptyCircle;

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
    const minScore = scopeMinScore(circleScope);
    return allowed.filter((l) => {
      if (filter !== "all" && l.type !== filter) return false;
      if (
        q &&
        !normalizeFa(`${l.title} ${l.description} ${l.category}`).includes(q)
      )
        return false;
      if (minScore > 0) {
        const score = trustScore(l.sellerId, l.trustPath, getPerson);
        if (score < minScore) return false;
      }
      return true;
    });
  }, [allowed, filter, deferredQuery, circleScope, getPerson]);

  const searching = deferredQuery.trim().length > 0;
  const bundles = useMemo(() => bundleBySeller(visible), [visible]);
  const pageSize = searching ? SEARCH_PAGE : HOME_SELLERS;
  const feedTotal = searching ? visible.length : bundles.length;
  const feedShown = Math.min(feedPage * pageSize, feedTotal);
  const feedRemaining = feedTotal - feedShown;

  useEffect(() => {
    setFeedPage(1);
  }, [filter, deferredQuery, circleScope]);

  const browsingAll =
    filter === "all" &&
    query.trim().length === 0 &&
    circleScope === "all";
  const showSecondary = browsingAll && hydrated && onboarded && !emptyCircle;
  const scopeLabel =
    SCOPE_OPTIONS.find((o) => o.key === circleScope)?.label ?? "همهٔ حلقه";

  return (
    <main className="pb-24 min-h-[100dvh]">
      <header
        className={`sticky top-0 z-20 border-b transition-[box-shadow,background-color] duration-200 ${
          headerCompact
            ? "bg-[color:var(--circle-surface)] border-stone-200/70 shadow-sm dark:bg-zinc-950 dark:border-zinc-800"
            : "bg-[color:var(--circle-canvas)] border-transparent dark:bg-zinc-950"
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
            {!quietChrome && (
              <div className="relative flex-1 min-w-0">
                <SearchIcon className="w-[16px] h-[16px] text-ink-faint absolute top-1/2 -translate-y-1/2 right-2.5" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="جستجو…"
                  aria-label="جستجو در حلقه‌ات"
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
            compact={headerCompact}
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

          {conceptTipReady && !showConceptTip && (
            <div className="px-4 pt-2.5">
              <button
                type="button"
                onClick={restoreConceptTip}
                className="text-[11px] font-medium text-brand-600 dark:text-brand-400"
              >
                سیرکل چطور کار می‌کند؟
              </button>
            </div>
          )}

          {/* Listings first — home's primary job */}
          <FeedSection
            title="آگهی‌ها"
            count={hydrated ? feedTotal : undefined}
            countUnit={searching ? "مورد" : "نفر"}
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
            {!hydrated ? (
              <FeedSkeleton />
            ) : visible.length === 0 ? (
              <FeedEmptyState
                hasFilter={!browsingAll}
                onClear={() => {
                  setFilter("all");
                  setCircleScope("all");
                  setQuery("");
                }}
              />
            ) : (
              <>
                {searching
                  ? visible.slice(0, feedShown).map((l, i) => (
                      <div
                        key={l.id}
                        className={i < 4 ? "animate-fade-up" : undefined}
                        style={
                          i < 4 ? { animationDelay: `${i * 45}ms` } : undefined
                        }
                      >
                        <ListingCard listing={l} compactTrust />
                      </div>
                    ))
                  : bundles.slice(0, feedShown).map((bundle, i) => {
                      const seller = getPerson(bundle.sellerId);
                      const sellerName = seller?.name ?? "این نفر";
                      const moreHref =
                        bundle.sellerId === "me"
                          ? "/profile"
                          : `/person/${bundle.sellerId}`;
                      return (
                        <div
                          key={bundle.sellerId}
                          className={i < 4 ? "animate-fade-up" : undefined}
                          style={
                            i < 4
                              ? { animationDelay: `${i * 45}ms` }
                              : undefined
                          }
                        >
                          <ListingCard
                            listing={bundle.featured}
                            compactTrust
                            moreFrom={
                              bundle.extras.length > 0
                                ? {
                                    count: bundle.extras.length,
                                    href: moreHref,
                                    name: sellerName,
                                  }
                                : undefined
                            }
                          />
                        </div>
                      );
                    })}
                {feedRemaining > 0 ? (
                  <button
                    type="button"
                    onClick={() => setFeedPage((page) => page + 1)}
                    className="w-full rounded-xl border border-stone-200/80 dark:border-zinc-700 bg-[color:var(--circle-surface)] dark:bg-zinc-900 py-2.5 text-[13px] font-bold text-brand-700 dark:text-brand-300 active:opacity-80"
                  >
                    نمایش {toPersianDigits(Math.min(pageSize, feedRemaining))}{" "}
                    {searching ? "آگهی" : "نفر"} دیگر
                  </button>
                ) : null}
              </>
            )}

            {hidden > 0 && circleCount > 0 && (
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
  countUnit = "مورد",
  scopeControl,
  children,
}: {
  title: string;
  href?: string;
  count?: number;
  countUnit?: string;
  scopeControl?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="px-4 pt-3.5">
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-ink dark:text-zinc-200 min-w-0">
          <span>{title}</span>
          {count != null && count > 0 && (
            <span
              className="text-[12px] font-semibold text-ink-muted dark:text-zinc-400 nums"
              aria-label={`${toPersianDigits(count)} ${countUnit}`}
            >
              · {toPersianDigits(count)} {countUnit}
            </span>
          )}
        </h2>
        {href && (
          <Link href={href} className="text-[11px] text-ink-muted dark:text-zinc-500 font-medium shrink-0">
            همه
          </Link>
        )}
      </div>
      {scopeControl && <div className="mb-2.5">{scopeControl}</div>}
      <div className="space-y-2.5">{children}</div>
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
        <span className="text-ink-muted dark:text-zinc-500">نمایش از:</span>
        <span className="font-bold text-brand-700 dark:text-brand-300">
          {label}
        </span>
        <span className="text-ink-faint text-[10px]" aria-hidden>
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
            className="absolute top-full right-0 z-40 mt-1.5 min-w-[13.5rem] rounded-xl border border-stone-200/80 dark:border-zinc-700 bg-[color:var(--circle-surface)] dark:bg-zinc-900 shadow-lg overflow-hidden py-1"
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
          : "با ثبت آگهی یا گسترش حلقه، اینجا پر می‌شود."}
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
        <Avatar
          name={requester.name}
          src={requester.avatar}
          showLevel={false}
          size="sm"
        />
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
        <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 shrink-0 nums">
          مشاهده {toPersianDigits(offers.length)} پیشنهاد
        </span>
      )}
    </Link>
  );
}
