"use client";

import { useState } from "react";
import {
  AREA_CITYWIDE,
  AREA_MODES,
  areaFromMode,
  areaMode,
  areaPlaces,
  type AreaMode,
} from "@/lib/place";

const HOOD_PREVIEW = 6;

export default function AreaPicker({
  city,
  value,
  onChange,
}: {
  city?: string;
  value: string;
  onChange: (area: string) => void;
}) {
  const mode = areaMode(value);
  const { regions, hoods } = areaPlaces(city);
  const placeSelected = mode === "place";
  const hiddenHoods = hoods.slice(HOOD_PREVIEW);
  const selectedInMore = hiddenHoods.includes(value);
  const [showMore, setShowMore] = useState(selectedInMore);
  const visibleHoods = showMore ? hoods : hoods.slice(0, HOOD_PREVIEW);

  function pickMode(next: AreaMode) {
    if (next === "place") {
      onChange(placeSelected && value !== AREA_CITYWIDE ? value : AREA_CITYWIDE);
      return;
    }
    onChange(areaFromMode(next));
  }

  return (
    <section className="mb-4">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <p className="text-[13px] font-bold text-ink dark:text-zinc-200">
          محدوده
        </p>
        {value ? (
          <p className="text-[11px] font-semibold text-ink-muted dark:text-zinc-400 truncate">
            {value}
          </p>
        ) : null}
      </div>
      <p className="text-[11px] text-ink-faint dark:text-zinc-500 mb-2 leading-relaxed">
        آدرس دقیق لازم نیست.
      </p>

      <div className="space-y-1" role="radiogroup" aria-label="نحوهٔ تحویل">
        {AREA_MODES.map((opt) => {
          const active = mode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => pickMode(opt.id)}
              className={`w-full flex items-center gap-2.5 rounded-xl border px-3 py-2 text-right transition-[transform,colors] duration-150 active:scale-[0.99] ${
                active
                  ? "border-brand-500 bg-brand-50/90 dark:bg-brand-500/15"
                  : "border-stone-200/80 dark:border-zinc-700 bg-[color:var(--circle-surface)] dark:bg-zinc-900"
              }`}
            >
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-[12.5px] font-bold ${
                    active
                      ? "text-brand-800 dark:text-brand-200"
                      : "text-ink dark:text-zinc-200"
                  }`}
                >
                  {opt.label}
                </span>
                <span className="block text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-snug">
                  {opt.hint}
                </span>
              </span>
              <span
                className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  active
                    ? "border-brand-600 bg-brand-600"
                    : "border-stone-300 dark:border-zinc-600"
                }`}
                aria-hidden
              >
                {active ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      {placeSelected && (regions.length > 0 || hoods.length > 0) ? (
        <div className="mt-3">
          <p className="text-[12px] font-bold text-ink dark:text-zinc-200 mb-1.5">
            محله{" "}
            <span className="font-medium text-ink-faint">(اختیاری)</span>
          </p>
          {regions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {regions.map((opt) => (
                <PlaceChip
                  key={opt}
                  label={opt}
                  active={value === opt}
                  onClick={() => onChange(value === opt ? AREA_CITYWIDE : opt)}
                />
              ))}
            </div>
          ) : null}
          {visibleHoods.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {visibleHoods.map((opt) => (
                <PlaceChip
                  key={opt}
                  label={opt}
                  active={value === opt}
                  onClick={() => onChange(value === opt ? AREA_CITYWIDE : opt)}
                />
              ))}
            </div>
          ) : null}
          {!showMore && hiddenHoods.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowMore(true)}
              className="mt-2 text-[12px] font-semibold text-brand-600 dark:text-brand-400"
            >
              محله‌های بیشتر
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function PlaceChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`chip !px-2.5 !py-1 !text-[11px] border transition-colors ${
        active
          ? "bg-brand-600 text-white border-brand-600"
          : "bg-stone-50 text-ink-muted border-stone-200/80 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
      }`}
    >
      {label}
    </button>
  );
}
