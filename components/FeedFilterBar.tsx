"use client";

import { useRef, useState } from "react";
import { useSheetA11y } from "@/lib/use-sheet-a11y";
import { listingTypeEmoji, listingTypeLabels } from "@/lib/labels";
import type { ListingType } from "@/lib/types";

/** Home feed filter: listing kinds or the wants (requests) mode. */
export type FeedFilter = ListingType | "all" | "requests";

const PRIMARY: { key: FeedFilter; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "requests", label: "درخواست‌ها" },
  { key: "sale", label: "فروش" },
  { key: "service", label: "خدمات" },
  { key: "donation", label: "رایگان" },
];

const MORE: ListingType[] = ["exchange", "loan"];

function filterLabel(key: FeedFilter): string {
  if (key === "all") return "همه";
  if (key === "requests") return "درخواست‌ها";
  return listingTypeLabels[key];
}

export default function FeedFilterBar({
  filter,
  onFilter,
}: {
  filter: FeedFilter;
  onFilter: (key: FeedFilter) => void;
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
                تعویض و امانت — کمتر استفاده می‌شوند، اینجا جدا نگه داشته‌ایم.
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
