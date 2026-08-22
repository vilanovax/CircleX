"use client";

import Link from "next/link";
import { memo, useMemo, useState } from "react";
import { privacyEmoji, privacyLabels } from "@/lib/labels";
import { activeCircle } from "@/lib/circle-member";
import { useStore } from "@/lib/store";
import { privacyAudience } from "@/lib/trust";
import type { Privacy } from "@/lib/types";

const PRIMARY: Privacy[] = ["A", "AB", "ABC"];
const ADVANCED: Privacy[] = ["referral", "approved"];

function PrivacyPicker({
  value,
  onChange,
  showCircleLink = false,
  compact = false,
}: {
  value: Privacy;
  onChange: (p: Privacy) => void;
  showCircleLink?: boolean;
  /** Tighter rows + advanced options collapsed by default. */
  compact?: boolean;
}) {
  const people = useStore((s) => s.people);
  const circle = useMemo(() => activeCircle(people), [people]);
  const advancedSelected = ADVANCED.includes(value);
  const [showAdvanced, setShowAdvanced] = useState(advancedSelected);

  const options = compact
    ? [...PRIMARY, ...(showAdvanced || advancedSelected ? ADVANCED : [])]
    : [...PRIMARY, ...ADVANCED];

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="block text-[13px] font-bold text-ink dark:text-zinc-200">
          چه کسانی ببینند؟
        </label>
        {showCircleLink ? (
          <Link
            href="/circle"
            className="text-[12px] text-brand-600 dark:text-brand-400 font-semibold shrink-0"
          >
            حلقه‌ی من ‹
          </Link>
        ) : null}
      </div>
      <div
        className={compact ? "space-y-1" : "space-y-1.5"}
        role="radiogroup"
        aria-label="محدوده دیده شدن"
      >
        {options.map((p) => {
          const active = value === p;
          return (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(p)}
              className={`w-full flex items-center gap-2.5 rounded-xl border text-right transition-[transform,colors] duration-150 active:scale-[0.99] ${
                compact ? "px-3 py-2" : "px-3.5 py-2.5 rounded-2xl gap-3"
              } ${
                active
                  ? "border-brand-500 bg-brand-50/90 dark:bg-brand-500/15"
                  : "border-stone-200/80 dark:border-zinc-700 bg-[color:var(--circle-surface)] dark:bg-zinc-900"
              }`}
            >
              <span
                className={`flex items-center justify-center shrink-0 ${
                  compact
                    ? "w-8 h-8 rounded-lg text-sm"
                    : "w-9 h-9 rounded-xl text-base"
                } ${
                  active
                    ? "bg-brand-600/10 dark:bg-brand-500/20"
                    : "bg-stone-100 dark:bg-zinc-800"
                }`}
                aria-hidden
              >
                {privacyEmoji[p]}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block font-bold ${
                    compact ? "text-[12.5px]" : "text-[13px]"
                  } ${
                    active
                      ? "text-brand-800 dark:text-brand-200"
                      : "text-ink dark:text-zinc-200"
                  }`}
                >
                  {privacyLabels[p]}
                </span>
                <span className="block text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-snug">
                  {privacyAudience(p, circle)}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full border-2 flex items-center justify-center ${
                  compact ? "w-4 h-4" : "w-5 h-5"
                } ${
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
      {compact && !showAdvanced && !advancedSelected ? (
        <button
          type="button"
          onClick={() => setShowAdvanced(true)}
          className="mt-2 text-[12px] font-semibold text-brand-600 dark:text-brand-400"
        >
          تنظیمات بیشتر
        </button>
      ) : null}
    </div>
  );
}

export default memo(PrivacyPicker);
