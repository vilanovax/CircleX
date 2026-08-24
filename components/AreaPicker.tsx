"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AREA_CITYWIDE,
  AREA_MODES,
  areaFromMode,
  areaMode,
  areaPlaces,
  filterHoods,
  foldAreaName,
  mergePlaceNames,
  sortHoodsFa,
  type AreaMode,
} from "@/lib/place";
import { toPersianDigits } from "@/lib/persian";
import { useCatalog } from "@/lib/use-catalog";

const POPULAR = [
  "پونک",
  "سعادت آباد",
  "شهرک غرب",
  "ونک",
  "تجریش",
  "پاسداران",
  "نارمک",
  "تهرانپارس",
  "ستارخان",
  "شهرک اکباتان",
];

export default function AreaPicker({
  city,
  value,
  onChange,
}: {
  city?: string;
  value: string;
  onChange: (area: string) => void;
}) {
  const catalog = useCatalog();
  const mode = areaMode(value);
  const fromCatalog = catalog.cities.find((item) => item.name === city);
  const fallback = areaPlaces(city);
  const regions = mergePlaceNames(
    fallback.regions,
    fromCatalog?.regions ?? [],
  );
  const hoods = mergePlaceNames(fallback.hoods, fromCatalog?.hoods ?? []);
  const placeSelected = mode === "place";
  const useSearch = hoods.length > 12;

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
              className={`w-full flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-right transition-[transform,background-color,border-color] duration-150 active:scale-[0.99] ${
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
            <div className="flex flex-wrap gap-1.5 mb-2">
              {regions.map((opt) => (
                <PlaceChip
                  key={opt}
                  label={opt}
                  active={samePlace(value, opt)}
                  onClick={() =>
                    onChange(samePlace(value, opt) ? AREA_CITYWIDE : opt)
                  }
                />
              ))}
            </div>
          ) : null}
          {useSearch ? (
            <HoodSearch hoods={hoods} value={value} onChange={onChange} />
          ) : hoods.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {sortHoodsFa(hoods).map((opt) => (
                <PlaceChip
                  key={opt}
                  label={opt}
                  active={samePlace(value, opt)}
                  onClick={() =>
                    onChange(samePlace(value, opt) ? AREA_CITYWIDE : opt)
                  }
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function samePlace(a: string, b: string): boolean {
  return foldAreaName(a) === foldAreaName(b);
}

function HoodSearch({
  hoods,
  value,
  onChange,
}: {
  hoods: string[];
  value: string;
  onChange: (area: string) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedHood = hoods.find((h) => samePlace(value, h)) ?? null;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hi, setHi] = useState(0);

  const popular = useMemo(
    () =>
      mergePlaceNames(
        POPULAR.filter((name) => hoods.some((h) => samePlace(h, name))),
      ).slice(0, 8),
    [hoods],
  );

  const browsable = useMemo(() => sortHoodsFa(hoods), [hoods]);

  const results = useMemo(() => {
    if (!open) return [];
    const q = foldAreaName(query);
    if (!q) return browsable;
    return filterHoods(hoods, query).slice(0, 40);
  }, [open, query, hoods, browsable]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open, selectedHood]);

  useEffect(() => {
    setHi(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function pick(name: string) {
    onChange(samePlace(value, name) ? AREA_CITYWIDE : name);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      {popular.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {popular.map((opt) => (
            <PlaceChip
              key={opt}
              label={opt}
              active={samePlace(value, opt)}
              onClick={() => pick(opt)}
            />
          ))}
        </div>
      ) : null}
      {selectedHood && !open ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="chip bg-brand-600 text-white border-brand-600 !px-2.5 !py-1 !text-[11px]"
            onClick={() => setOpen(true)}
          >
            {selectedHood}
          </button>
          <button
            type="button"
            className="text-[12px] font-semibold text-ink-muted"
            onClick={() => onChange(AREA_CITYWIDE)}
          >
            پاک کردن
          </button>
        </div>
      ) : (
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setOpen(false);
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setHi((i) =>
                results.length
                  ? Math.min(results.length - 1, i + 1)
                  : 0,
              );
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setHi((i) => Math.max(0, i - 1));
              return;
            }
            if (e.key === "Enter" && open && results[hi]) {
              e.preventDefault();
              pick(results[hi]);
            }
          }}
          placeholder="جستجوی محله — مثلاً پونک"
          className="field"
        />
      )}
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-stone-200/90 bg-[color:var(--circle-surface)] py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2.5 text-[12.5px] text-ink-faint">
              محله‌ای با این نام نیست
            </li>
          ) : (
            results.map((name, i) => {
              const active = i === hi;
              const chosen = samePlace(value, name);
              return (
                <li key={name} role="option" aria-selected={chosen}>
                  <button
                    type="button"
                    onMouseEnter={() => setHi(i)}
                    onClick={() => pick(name)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-right text-[13px] ${
                      active
                        ? "bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-200"
                        : "text-ink dark:text-zinc-200"
                    }`}
                  >
                    <span>{name}</span>
                    {chosen ? (
                      <span className="text-[11px] text-brand-600">انتخاب‌شده</span>
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
          {foldAreaName(query) && results.length > 0 ? (
            <li className="border-t border-black/5 px-3 py-1.5 text-[11px] text-ink-faint dark:border-white/10">
              {toPersianDigits(results.length)} نتیجه
              {filterHoods(hoods, query).length > 40 ? " — نزدیک‌ترین‌ها" : ""}
            </li>
          ) : !foldAreaName(query) ? (
            <li className="border-t border-black/5 px-3 py-1.5 text-[11px] text-ink-faint dark:border-white/10">
              نام محله را تایپ کن — {toPersianDigits(hoods.length)} محله
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
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
