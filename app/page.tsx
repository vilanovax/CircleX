"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import ListingCard from "@/components/ListingCard";
import BottomNav from "@/components/BottomNav";
import Onboarding from "@/components/Onboarding";
import { FeedSkeleton } from "@/components/Skeleton";
import { CircleUsersIcon, HeartIcon, SearchIcon, ShieldCheckIcon } from "@/components/Icons";
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

export default function FeedPage() {
  const { listings, events, getPerson, hydrated } = useStore();
  const [filter, setFilter] = useState<ListingType | "all">("all");
  const [query, setQuery] = useState("");

  // First, drop anything the viewer is not allowed to see (privacy enforcement).
  const { allowed, hidden } = useMemo(() => {
    const { visible, hidden } = filterByAccess(listings, getPerson);
    return { allowed: visible, hidden };
  }, [listings, getPerson]);

  const upcomingEvents = useMemo(
    () => events.filter((e) => canView(e, getPerson)).slice(0, 6),
    [events, getPerson],
  );

  // Then apply the type filter and search.
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
      {/* Brand header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-zinc-100">
        <div className="px-4 pt-3 pb-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg leading-none text-brand-700">
                  سیرکل
                </h1>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  خرید و فروش بین آدم‌های مورد اعتماد
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
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

        {/* Filter chips */}
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

      {/* Trust banner */}
      <div className="px-4 pt-3">
        <div className="rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 text-white p-4">
          <p className="font-bold text-sm">اینجا کسی غریبه نیست</p>
          <p className="text-xs text-brand-50 mt-1 leading-relaxed">
            هر آگهی از مسیر اعتمادی به شما می‌رسد: «این فروشنده، دوستِ همکارِ
            خواهرِ شماست.»
          </p>
        </div>
      </div>

      {/* Quick shortcuts */}
      <div className="grid grid-cols-3 gap-3 px-4 pt-3">
        <Link href="/requests" className="card p-3 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-transform">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
            🔎
          </div>
          <p className="text-xs font-bold text-zinc-800">درخواست‌ها</p>
        </Link>
        <Link href="/events" className="card p-3 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-transform">
          <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-lg">
            🎉
          </div>
          <p className="text-xs font-bold text-zinc-800">رویدادها</p>
        </Link>
        <Link href="/saved" className="card p-3 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-transform">
          <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center">
            <HeartIcon className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-zinc-800">نشان‌شده‌ها</p>
        </Link>
      </div>

      {/* Upcoming events strip */}
      {upcomingEvents.length > 0 && (
        <div className="pt-4">
          <div className="flex items-center justify-between px-4 mb-2">
            <h2 className="text-sm font-bold text-zinc-700">رویدادهای پیش‌رو</h2>
            <Link href="/events" className="text-xs text-brand-600 font-medium">
              همه
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {upcomingEvents.map((ev) => (
              <Link
                key={ev.id}
                href={`/event/${ev.id}`}
                className="card p-3 w-40 shrink-0 active:scale-[0.98] transition-transform"
              >
                <div className="w-full h-16 rounded-xl bg-gradient-to-br from-brand-50 to-zinc-100 dark:from-brand-500/10 dark:to-zinc-800 flex items-center justify-center text-3xl mb-2">
                  {ev.image}
                </div>
                <p className="text-[13px] font-semibold text-zinc-900 line-clamp-1">
                  {ev.title}
                </p>
                <p className="text-[11px] text-brand-700 dark:text-brand-300 font-medium mt-0.5">
                  📅 {ev.date}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Listings */}
      <section className="px-4 pt-3 space-y-3">
        {!hydrated ? (
          <FeedSkeleton />
        ) : visible.length === 0 ? (
          <div className="text-center text-zinc-400 py-16 text-sm">
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

        {/* Privacy notice */}
        {hidden > 0 && (
          <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400 py-3">
            <CircleUsersIcon className="w-4 h-4" />
            <span>
              {toPersianDigits(hidden)} آگهی به‌دلیل تنظیمات حریم خصوصی برای شما
              قابل نمایش نیست
            </span>
          </div>
        )}
      </section>

      <Onboarding />
      <BottomNav />
    </main>
  );
}
