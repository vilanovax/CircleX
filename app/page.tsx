"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import ListingCard from "@/components/ListingCard";
import BottomNav from "@/components/BottomNav";
import Onboarding from "@/components/Onboarding";
import { CircleUsersIcon, HeartIcon, SearchIcon, ShieldCheckIcon } from "@/components/Icons";
import { listingTypeEmoji, listingTypeLabels } from "@/lib/labels";
import type { ListingType } from "@/lib/types";
import { normalizeFa, toPersianDigits } from "@/lib/persian";
import { filterByAccess } from "@/lib/trust";

const filters: { key: ListingType | "all"; label: string; emoji: string }[] = [
  { key: "all", label: "همه", emoji: "✨" },
  { key: "sale", label: listingTypeLabels.sale, emoji: listingTypeEmoji.sale },
  { key: "service", label: listingTypeLabels.service, emoji: listingTypeEmoji.service },
  { key: "donation", label: listingTypeLabels.donation, emoji: listingTypeEmoji.donation },
  { key: "exchange", label: listingTypeLabels.exchange, emoji: listingTypeEmoji.exchange },
  { key: "loan", label: listingTypeLabels.loan, emoji: listingTypeEmoji.loan },
];

export default function FeedPage() {
  const { listings, getPerson } = useStore();
  const [filter, setFilter] = useState<ListingType | "all">("all");
  const [query, setQuery] = useState("");

  // First, drop anything the viewer is not allowed to see (privacy enforcement).
  const { allowed, hidden } = useMemo(() => {
    const { visible, hidden } = filterByAccess(listings, getPerson);
    return { allowed: visible, hidden };
  }, [listings, getPerson]);

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
      <div className="grid grid-cols-2 gap-3 px-4 pt-3">
        <Link href="/requests" className="card p-3 flex items-center gap-2.5 active:scale-[0.99] transition-transform">
          <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            🔎
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-800 leading-tight">درخواست‌ها</p>
            <p className="text-[11px] text-zinc-400">حلقه دنبال چیه</p>
          </div>
        </Link>
        <Link href="/saved" className="card p-3 flex items-center gap-2.5 active:scale-[0.99] transition-transform">
          <div className="w-9 h-9 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center">
            <HeartIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-800 leading-tight">نشان‌شده‌ها</p>
            <p className="text-[11px] text-zinc-400">ذخیره‌های شما</p>
          </div>
        </Link>
      </div>

      {/* Listings */}
      <section className="px-4 pt-3 space-y-3">
        {visible.length === 0 ? (
          <div className="text-center text-zinc-400 py-16 text-sm">
            آگهی‌ای با این فیلتر پیدا نشد.
          </div>
        ) : (
          visible.map((l) => <ListingCard key={l.id} listing={l} />)
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
