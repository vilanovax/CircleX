"use client";

import { useRef, useState } from "react";
import { useSheetA11y } from "@/lib/use-sheet-a11y";
import { listingTypeEmoji, listingTypeLabels } from "@/lib/labels";
import type { ListingType } from "@/lib/types";

const PRIMARY: { key: ListingType | "all"; label: string; emoji: string }[] = [
  { key: "all", label: "همه", emoji: "✨" },
  { key: "sale", label: "فروش", emoji: listingTypeEmoji.sale },
  { key: "service", label: "خدمات", emoji: listingTypeEmoji.service },
  { key: "donation", label: "اهدا", emoji: listingTypeEmoji.donation },
];

const MORE: ListingType[] = ["exchange", "loan"];

function filterLabel(key: ListingType | "all"): string {
  if (key === "all") return "همه";
  return listingTypeLabels[key];
}

function filterEmoji(key: ListingType | "all"): string {
  if (key === "all") return "✨";
  return listingTypeEmoji[key];
}

export default function FeedFilterBar({
  filter,
  onFilter,
  compact,
}: {
  filter: ListingType | "all";
  onFilter: (key: ListingType | "all") => void;
  compact: boolean;
}) {
  const [showMore, setShowMore] = useState(false);
  const morePanelRef = useRef<HTMLDivElement>(null);
  const moreActive = MORE.includes(filter as ListingType);

  useSheetA11y(morePanelRef, () => setShowMore(false), { enabled: showMore });

  const chipClass = (active: boolean) =>
    `chip whitespace-nowrap !px-2.5 !py-1 border transition-colors duration-150 text-[12px] ${
      active
        ? "bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/20"
        : "bg-[color:var(--circle-surface)] text-ink-muted dark:text-zinc-300 border-stone-200/70 dark:border-zinc-700"
    }`;

  return (
    <>
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          compact ? "max-h-0 opacity-0" : "max-h-16 opacity-100"
        }`}
      >
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-2.5">
          {PRIMARY.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => onFilter(f.key)}
              aria-pressed={filter === f.key}
              className={chipClass(filter === f.key)}
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowMore(true)}
            aria-pressed={moreActive}
            aria-haspopup="dialog"
            className={chipClass(moreActive)}
          >
            {moreActive ? filterLabel(filter) : "بیشتر"}
          </button>
        </div>
      </div>

      {compact && filter !== "all" && (
        <div className="px-4 pb-2 flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 shrink-0">فیلتر فعال</span>
          <button
            type="button"
            onClick={() => onFilter("all")}
            className="chip !text-xs !py-1 !px-2.5 bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/30"
          >
            {filterEmoji(filter)} {filterLabel(filter)} ×
          </button>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-[11px] text-brand-600 font-medium mr-auto"
          >
            تغییر فیلتر
          </button>
        </div>
      )}

      {showMore && (
        <div className="fixed inset-0 z-40 flex justify-center">
          <div className="relative w-full max-w-[480px]">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setShowMore(false)}
              aria-hidden
            />
            <div
              ref={morePanelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="feed-more-filters-title"
              tabIndex={-1}
              className="absolute bottom-0 inset-x-0 bg-white dark:bg-zinc-900 rounded-t-2xl p-5 animate-slide-up outline-none"
            >
              <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
              <h2
                id="feed-more-filters-title"
                className="font-bold text-lg mb-1 text-zinc-900 dark:text-zinc-100"
              >
                دسته‌های بیشتر
              </h2>
              <p className="text-xs text-zinc-400 mb-4">
                معاوضه و قرض موقت — کمتر استفاده می‌شوند، اینجا جدا نگه داشته‌ایم.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {MORE.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      onFilter(type);
                      setShowMore(false);
                    }}
                    aria-pressed={filter === type}
                    className={`rounded-xl py-3 px-3 text-sm font-medium border text-right transition-colors ${
                      filter === type
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <span className="text-lg ml-1.5" aria-hidden>
                      {listingTypeEmoji[type]}
                    </span>
                    {listingTypeLabels[type]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowMore(false)}
                className="btn-ghost w-full"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
