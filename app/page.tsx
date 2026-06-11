"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import ListingCard from "@/components/ListingCard";
import RequestCard from "@/components/RequestCard";
import EventCard from "@/components/EventCard";
import BottomNav from "@/components/BottomNav";
import Onboarding from "@/components/Onboarding";
import { FeedSkeleton } from "@/components/Skeleton";
import { CircleUsersIcon, SearchIcon, ShieldCheckIcon } from "@/components/Icons";
import { listingTypeEmoji, listingTypeLabels } from "@/lib/labels";
import type { ListingType } from "@/lib/types";
import { normalizeFa, toPersianDigits } from "@/lib/persian";
import { canView, filterByAccess } from "@/lib/trust";

const filters: { key: ListingType | "all"; label: string; emoji: string }[] = [
  { key: "all", label: "همه", emoji: "✨" },
  { key: "sale", label: listingTypeLabels.sale, emoji: listingTypeEmoji.sale },
  { key: "service", label: listingTypeLabels.service, emoji: listingTypeEmoji.service },
  { key: "donation", label: listingTypeLabels.donation, emoji: listingTypeEmoji.donation },
  { key: "exchange", label: listingTypeLabels.exchange, emoji: listingTypeEmoji.exchange },
  { key: "loan", label: listingTypeLabels.loan, emoji: listingTypeEmoji.loan },
];

const PREVIEW_LIMIT = 3;

export default function FeedPage() {
  const { listings, requests, events, getPerson, hydrated, onboarded } = useStore();
  const [filter, setFilter] = useState<ListingType | "all">("all");
  const [query, setQuery] = useState("");

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
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-b border-zinc-100 dark:border-zinc-800">
        <div className="px-4 pt-3 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg leading-none text-brand-700 dark:text-brand-400">
                سیرکل
              </h1>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                خرید و فروش بین آدم‌های مورد اعتماد
              </p>
            </div>
          </div>

          <div className="mt-3 relative">
            <SearchIcon className="w-5 h-5 text-zinc-400 absolute top-1/2 -translate-y-1/2 right-3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجو در آگهی‌های حلقه‌ی شما…"
              className="field !pr-10 !py-2.5 bg-zinc-50"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-2.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`chip whitespace-nowrap !px-3 !py-1.5 border transition-colors ${
                filter === f.key
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-zinc-600 border-zinc-200"
              }`}
            >
              {f.emoji} {f.label}
            </button>
          ))}
        </div>
      </header>

      {/* Trust banner — full for new users, compact after onboarding */}
      <div className="px-4 pt-3">
        {onboarded ? (
          <div className="rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 px-3 py-2.5 flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4 text-brand-600 shrink-0" />
            <p className="text-xs text-brand-800 dark:text-brand-200 leading-relaxed">
              هر آگهی از مسیر اعتماد حلقه‌ی شما به دستت می‌رسد.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 text-white p-4">
            <p className="font-bold text-sm">اینجا کسی غریبه نیست</p>
            <p className="text-xs text-brand-50 mt-1 leading-relaxed">
              هر آگهی از مسیر اعتمادی به شما می‌رسد: «این فروشنده، دوستِ همکارِ
              خواهرِ شماست.»
            </p>
          </div>
        )}
      </div>

      {/* Listings — primary feed */}
      <FeedSection title="آگهی‌ها">
        {!hydrated ? (
          <FeedSkeleton />
        ) : visible.length === 0 ? (
          <div className="text-center text-zinc-400 py-12 text-sm">
            آگهی‌ای با این فیلتر پیدا نشد.
          </div>
        ) : (
          visible.map((l, i) => (
            <div
              key={l.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i, 7) * 45}ms` }}
            >
              <ListingCard listing={l} />
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

      {/* Requests preview */}
      {visibleRequests.length > 0 && (
        <FeedSection title="درخواست‌های حلقه" href="/requests">
          {visibleRequests.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </FeedSection>
      )}

      {/* Events preview */}
      {visibleEvents.length > 0 && (
        <FeedSection title="رویدادهای پیش‌رو" href="/events">
          {visibleEvents.map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </FeedSection>
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
