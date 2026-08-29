"use client";

import {
  memo,
  startTransition,
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { activeCircleCount, firstLiveMemberName, unplacedMembers } from "@/lib/circle-member";
import { useStore } from "@/lib/store";
import ListingCard from "@/components/ListingCard";
import BottomNav from "@/components/BottomNav";
import { lazyUi } from "@/lib/lazy-ui";
import FeedFilterBar, { type FeedFilter } from "@/components/FeedFilterBar";
import RequestCard from "@/components/RequestCard";
import { FeedSkeleton } from "@/components/Skeleton";
import { CircleUsersIcon, LockIcon, SearchIcon, ShieldCheckIcon } from "@/components/Icons";
import type { CircleEvent, Listing, Person, Request } from "@/lib/types";
import { formatEventDateDisplay, normalizeFa, toPersianDigits } from "@/lib/persian";
import CircleConceptTip from "@/components/CircleConceptTip";
import AddedYouBanner from "@/components/AddedYouBanner";
import { POSTED_QUERY } from "@/lib/home-posted";
import {
  unreadListingReply,
  unreadOwnListingInquiry,
} from "@/lib/listing-inquiry";
import { canView, filterByAccess, trustScore } from "@/lib/trust";
import { useCatalog } from "@/lib/use-catalog";

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

  const hidden =
    listing.identityHidden || listing.sellerId.startsWith("hidden:");
  const direct = hidden
    ? Boolean(listing.viewerDirect ?? listing.trustPath.length === 0)
    : listing.trustPath.length === 0;
  const score = hidden
    ? (listing.viewerTrustScore ?? 1)
    : trustScore(listing.sellerId, listing.trustPath, getPerson);

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

function ConsumePostedParam({ onPosted }: { onPosted: (id: string) => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get(POSTED_QUERY)?.trim();
    if (!id) return;
    onPosted(id);
    router.replace("/", { scroll: false });
  }, [searchParams, router, onPosted]);

  return null;
}

export default function ClassicFeed() {
  const hydrated = useStore((s) => s.hydrated);
  const circleReady = useStore((s) => s.circleReady);
  const circleCount = useStore((s) => activeCircleCount(s.people));
  const catalog = useCatalog();
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [circleScope, setCircleScope] = useState<CircleScope>("network");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [justPostedId, setJustPostedId] = useState<string | null>(null);

  const onPosted = useCallback((id: string) => {
    setJustPostedId(id);
  }, []);

  const emptyCircle = circleReady && circleCount === 0;
  const quietChrome = !circleReady || emptyCircle;
  const requestsMode = filter === "requests";
  const onFilter = useCallback((next: FeedFilter) => {
    startTransition(() => setFilter(next));
  }, []);
  const onScope = useCallback((next: CircleScope) => {
    startTransition(() => setCircleScope(next));
  }, []);
  const onClearSearch = useCallback(() => {
    setFilter("all");
    setCircleScope("network");
    setQuery("");
  }, []);

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Suspense fallback={null}>
        <ConsumePostedParam onPosted={onPosted} />
      </Suspense>
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
          <FeedFilterBar filter={filter} onFilter={onFilter} />
        )}
      </header>

      {emptyCircle ? (
        <HomeEmptyCircle justPostedId={justPostedId} />
      ) : (
        <HomeFeedBody
          filter={filter}
          deferredQuery={deferredQuery}
          circleScope={circleScope}
          circleCount={circleCount}
          circleReady={circleReady}
          hydrated={hydrated}
          justPostedId={justPostedId}
          requestsEnabled={catalog.flags.requests}
          onScope={onScope}
          onFilter={onFilter}
          onClearSearch={onClearSearch}
        />
      )}

      <BottomNav />
    </main>
  );
}

const HomeFeedBody = memo(function HomeFeedBody({
  filter,
  deferredQuery,
  circleScope,
  circleCount,
  circleReady,
  hydrated,
  justPostedId,
  requestsEnabled,
  onScope,
  onFilter,
  onClearSearch,
}: {
  filter: FeedFilter;
  deferredQuery: string;
  circleScope: CircleScope;
  circleCount: number;
  circleReady: boolean;
  hydrated: boolean;
  justPostedId: string | null;
  requestsEnabled: boolean;
  onScope: (next: CircleScope) => void;
  onFilter: (next: FeedFilter) => void;
  onClearSearch: () => void;
}) {
  const listings = useStore((s) => s.listings);
  const requests = useStore((s) => s.requests);
  const events = useStore((s) => s.events);
  const getPerson = useStore((s) => s.getPerson);
  const showOwnListingsInFeed = useStore((s) => s.showOwnListingsInFeed);
  const hiddenListings = useStore((s) => s.hiddenListings);
  const hiddenPeople = useStore((s) => s.hiddenPeople);
  const [feedPage, setFeedPage] = useState(1);
  const requestsMode = filter === "requests";

  const { allowed, hidden } = useMemo(() => {
    const { visible, hidden } = filterByAccess(listings, getPerson);
    return { allowed: visible, hidden };
  }, [listings, getPerson]);

  const hiddenListingSet = useMemo(
    () => new Set(hiddenListings),
    [hiddenListings],
  );
  const hiddenPeopleSet = useMemo(
    () => new Set(hiddenPeople),
    [hiddenPeople],
  );

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
    const rows = allowed.filter((l) => {
      if (justPostedId && l.id === justPostedId) return true;
      if (filter !== "all" && l.type !== filter) return false;
      if (q && !normalizeFa(`${l.title} ${l.category}`).includes(q))
        return false;
      if (!listingMatchesScope(l, circleScope, getPerson)) return false;
      if (!showOwnListingsInFeed && l.sellerId === "me") return false;
      if (hiddenListingSet.has(l.id)) return false;
      if (hiddenPeopleSet.has(l.sellerId)) return false;
      return true;
    });
    if (!justPostedId) return rows;
    const idx = rows.findIndex((l) => l.id === justPostedId);
    if (idx === 0) return rows;
    if (idx > 0) {
      const next = rows.slice();
      const [hit] = next.splice(idx, 1);
      next.unshift(hit);
      return next;
    }
    const extra = listings.find(
      (l) => l.id === justPostedId && l.sellerId === "me",
    );
    return extra ? [extra, ...rows] : rows;
  }, [
    allowed,
    listings,
    filter,
    deferredQuery,
    circleScope,
    getPerson,
    requestsMode,
    showOwnListingsInFeed,
    hiddenListingSet,
    hiddenPeopleSet,
    justPostedId,
  ]);

  const feedTotal = requestsMode ? visibleRequests.length : visible.length;
  const feedShown = Math.min(feedPage * FEED_PAGE, feedTotal);
  const feedRemaining = feedTotal - feedShown;
  const pagedListings = useMemo(
    () => (requestsMode ? [] : visible.slice(0, feedShown)),
    [requestsMode, visible, feedShown],
  );
  const pagedRequests = useMemo(
    () => (requestsMode ? visibleRequests.slice(0, feedShown) : []),
    [requestsMode, visibleRequests, feedShown],
  );

  useEffect(() => {
    setFeedPage(1);
  }, [
    filter,
    deferredQuery,
    circleScope,
    showOwnListingsInFeed,
    hiddenListings,
    hiddenPeople,
  ]);

  useEffect(() => {
    if (!justPostedId || requestsMode) return;
    const el = document.getElementById("home-just-posted");
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [justPostedId, requestsMode, visible]);

  const browsingAll =
    filter === "all" &&
    deferredQuery.trim().length === 0 &&
    circleScope === "network";
  const showSecondary = browsingAll && circleReady && circleCount > 0;
  const scopeLabel =
    SCOPE_OPTIONS.find((o) => o.key === circleScope)?.label ??
    "حلقه + وابسته‌ها";
  const firstJoinCount = useStore((s) => unplacedMembers(s.people).length);
  const firstJoinName = useStore(
    (s) => unplacedMembers(s.people)[0]?.name ?? "",
  );
  const liveMemberName = useStore((s) => firstLiveMemberName(s.people));
  const mineLiveCount = useStore(
    (s) =>
      s.listings.filter(
        (l) => l.sellerId === "me" && l.dealStatus !== "inactive",
      ).length,
  );
  const audienceName = firstJoinName || liveMemberName;
  const needsFirstListing = circleCount > 0 && mineLiveCount === 0;
  const inquiry = useStore((s) =>
    unreadOwnListingInquiry(s.threadIndex, s.listings, s.people),
  );
  const listingReply = useStore((s) =>
    inquiry
      ? null
      : unreadListingReply(s.threadIndex, s.listings, s.people),
  );
  const wrapUp = useStore((s) => {
    const mine = s.listings.filter((l) => l.sellerId === "me");
    return (
      mine.find((l) => l.dealStatus === "agreed") ??
      mine.find((l) => l.dealStatus === "reserved") ??
      null
    );
  });
  const addedYouCount = useStore((s) => s.addedYou.length);

  return (
    <>
          {addedYouCount > 0 ? (
            <div className="px-4 pt-3">
              <AddedYouBanner />
            </div>
          ) : null}
          {inquiry ? (
            <div className="px-4 pt-3">
              <div className="card px-3.5 py-3">
                <p className="text-[15px] font-extrabold text-ink dark:text-zinc-50 leading-snug">
                  {inquiry.peerName} درباره آگهی‌ات پیام داد
                </p>
                <p className="text-[13px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed">
                  «{inquiry.listingTitle}» — جواب بده تا معامله جلو برود.
                </p>
                <Link
                  href={inquiry.href}
                  className="btn-primary mt-2.5 min-h-11 inline-flex items-center justify-center text-[13px] font-bold"
                >
                  خواندن و جواب
                </Link>
              </div>
            </div>
          ) : listingReply ? (
            <div className="px-4 pt-3">
              <div className="card px-3.5 py-3">
                <p className="text-[15px] font-extrabold text-ink dark:text-zinc-50 leading-snug">
                  {listingReply.closed
                    ? "معامله تمام شد"
                    : `${listingReply.peerName} جواب آگهی را داد`}
                </p>
                <p className="text-[13px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed">
                  {listingReply.closed
                    ? `«${listingReply.listingTitle}» — گفتگو را بخوان؛ اگر دیدی، حرف بگذار.`
                    : `«${listingReply.listingTitle}» — معامله را یک قدم جلو ببر.`}
                </p>
                <Link
                  href={listingReply.href}
                  className="btn-primary mt-2.5 min-h-11 inline-flex items-center justify-center text-[13px] font-bold"
                >
                  {listingReply.closed ? "خواندن گفتگو" : "خواندن و ادامه"}
                </Link>
              </div>
            </div>
          ) : wrapUp ? (
            <div className="px-4 pt-3">
              <div className="card px-3.5 py-3">
                <p className="text-[15px] font-extrabold text-ink dark:text-zinc-50 leading-snug">
                  {wrapUp.dealStatus === "agreed"
                    ? "توافق ثبت شد"
                    : "آگهی رزرو است"}
                </p>
                <p className="text-[13px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed">
                  «{wrapUp.title}» —{" "}
                  {wrapUp.dealStatus === "agreed"
                    ? "از فید بردار تا کس دیگری سراغش نیاید."
                    : "اگر معامله تمام شد توافق بزن، یا آگهی را از فید بردار."}
                </p>
                <Link
                  href={`/listing/${wrapUp.id}`}
                  className="btn-primary mt-2.5 min-h-11 inline-flex items-center justify-center text-[13px] font-bold"
                >
                  {wrapUp.dealStatus === "agreed"
                    ? "بستن آگهی"
                    : "دیدن آگهی"}
                </Link>
              </div>
            </div>
          ) : firstJoinCount > 0 || needsFirstListing ? (
            <div className="px-4 pt-3">
              <div className="card px-3.5 py-3">
                <p className="text-[15px] font-extrabold text-ink dark:text-zinc-50 leading-snug">
                  {firstJoinCount > 0
                    ? firstJoinCount === 1
                      ? `${firstJoinName} به حلقه‌ات پیوست`
                      : `${toPersianDigits(firstJoinCount)} نفر تازه پیوسته‌اند`
                    : audienceName
                      ? `${audienceName} در حلقه‌ات است`
                      : "حلقه‌ات آماده است"}
                </p>
                <p className="text-[13px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed">
                  {needsFirstListing
                    ? audienceName
                      ? `الان می‌تواند آگهی‌ات را ببیند. یکی بگذار تا حلقه فقط اسم نباشد.`
                      : "الان حلقه‌ات می‌تواند آگهی‌ات را ببیند. یکی بگذار."
                    : "الان آگهی‌هایت را می‌بینند. اگر خواستی جایگاهشان را مشخص کن — اجباری نیست."}
                </p>
                {needsFirstListing ? (
                  <div className="mt-2.5 flex flex-col items-stretch gap-2">
                    <Link
                      href="/new"
                      className="btn-primary min-h-11 inline-flex items-center justify-center text-[13px] font-bold"
                    >
                      {audienceName
                        ? `ثبت آگهی تا ${audienceName} ببیند`
                        : "ثبت اولین آگهی"}
                    </Link>
                    {firstJoinCount > 0 ? (
                      <Link
                        href="/circle?place=1"
                        className="text-center text-[13px] font-semibold text-brand-700 dark:text-brand-400 py-1"
                      >
                        دیدن حلقه
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <Link
                    href="/circle?place=1"
                    className="mt-2.5 inline-block text-[13px] font-semibold text-brand-700 dark:text-brand-400"
                  >
                    دیدن حلقه
                  </Link>
                )}
              </div>
            </div>
          ) : null}

          <CircleConceptTip hidden={Boolean(justPostedId)} />

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
                  onChange={onScope}
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
                  canCompose={requestsEnabled}
                  onClear={onClearSearch}
                />
              ) : (
                <>
                  {pagedRequests.map((r) => (
                    <div key={r.id} className="cv-card">
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
                onClear={onClearSearch}
                circleCount={circleCount}
                audienceName={audienceName}
                hideCompose={needsFirstListing}
              />
            ) : (
              <>
                {pagedListings.map((l, i) => {
                  const posted = l.id === justPostedId;
                  return (
                    <div
                      key={l.id}
                      id={posted ? "home-just-posted" : undefined}
                      className="cv-card"
                    >
                      {posted ? (
                        <p className="text-[12px] font-bold text-brand-700 dark:text-brand-300 px-0.5 mb-1.5">
                          {circleCount === 0
                            ? "آگهی ثبت شد — هنوز فقط خودت می‌بینی"
                            : audienceName && circleCount === 1
                              ? `${audienceName} این را می‌بیند`
                              : "آگهی تو همین حالا داخل حلقه است"}
                        </p>
                      ) : null}
                      <ListingCard
                        listing={l}
                        compactTrust
                        imagePriority={i === 0}
                        eagerTrust={i < 3}
                        highlight={posted}
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
                  onClick={() => onFilter("requests")}
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
  );
});

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

const CircleScopeControl = memo(function CircleScopeControl({
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
});

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
  circleCount = 0,
  audienceName = "",
  hideCompose = false,
}: {
  hasFilter: boolean;
  onClear: () => void;
  requestsMode?: boolean;
  canCompose?: boolean;
  circleCount?: number;
  audienceName?: string;
  hideCompose?: boolean;
}) {
  const waitingForFirstAd = !requestsMode && !hasFilter && circleCount > 0;

  return (
    <div className="card p-6 text-center">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 bg-brand-50 dark:bg-brand-500/15 text-brand-600"
      >
        <CircleUsersIcon className="w-5 h-5" />
      </div>
      <p className="font-bold text-[15px] text-ink dark:text-zinc-100">
        {requestsMode
          ? hasFilter
            ? "درخواستی با این فیلتر نیست"
            : "هنوز درخواستی نیست"
          : hasFilter
            ? "نتیجه‌ای پیدا نشد"
            : "هنوز آگهی‌ای نیست"}
      </p>
      <p className="text-[13px] text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed">
        {requestsMode
          ? "چیزی لازم داری؟ از حلقه بپرس — یا فیلتر را عوض کن."
          : hasFilter
            ? "فیلتر یا جستجو را عوض کن، یا اولین آگهی را ثبت کن."
            : waitingForFirstAd
              ? audienceName
                ? `${audienceName} می‌تواند آگهی‌ات را ببیند. یکی بگذار.`
                : "حلقه‌ات می‌تواند آگهی‌ات را ببیند. یکی بگذار."
              : "با ثبت آگهی یا گسترش حلقه، اینجا پر می‌شود."}
      </p>
      <div className="flex flex-col gap-2 mt-4">
        {hasFilter && (
          <button type="button" onClick={onClear} className="btn-ghost text-sm">
            پاک کردن فیلتر و جستجو
          </button>
        )}
        {canCompose && !hideCompose ? (
          <Link
            href={requestsMode ? "/requests?compose=1" : "/new"}
            className="btn-primary text-sm min-h-11 inline-flex items-center justify-center"
          >
            {requestsMode
              ? "ثبت درخواست"
              : waitingForFirstAd && audienceName
                ? `ثبت آگهی تا ${audienceName} ببیند`
                : "ثبت آگهی"}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function EventStripCard({ event }: { event: CircleEvent }) {
  const host = useStore((s) => s.getPerson(event.hostId));
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
