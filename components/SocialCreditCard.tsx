"use client";

import { useState } from "react";
import type { SocialCreditStats } from "@/lib/social-credit";
import { formatPercent } from "@/lib/social-credit";
import { toPersianDigits } from "@/lib/persian";
import { ShieldCheckIcon } from "./Icons";

const labelColor: Record<SocialCreditStats["label"], string> = {
  عالی: "text-levelA",
  خوب: "text-brand-600",
  متوسط: "text-amber-600",
  تازه‌وارد: "text-ink-muted",
};

export default function SocialCreditCard({
  stats,
  subtitle,
  circleLabel = "نفر در حلقه",
  hideVerified = false,
  collapsible = false,
  defaultCollapsed = false,
}: {
  stats: SocialCreditStats;
  subtitle?: string;
  circleLabel?: string;
  /** When verified badge is shown elsewhere (e.g. profile hero). */
  hideVerified?: boolean;
  /** Tap header to expand/collapse details. */
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}) {
  const [open, setOpen] = useState(!defaultCollapsed);

  const collapsedSummary = `${toPersianDigits(stats.score)}/۱۰۰ · ${stats.label} · ${toPersianDigits(stats.successfulDeals)} معامله`;

  return (
    <div className="card overflow-hidden">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full px-3.5 py-3 flex items-center gap-3 text-right active:bg-stone-50/80 dark:active:bg-zinc-800/50 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center shrink-0">
            <ShieldCheckIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-ink dark:text-zinc-100">
              اعتبار اجتماعی
            </p>
            <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 nums truncate">
              {open ? subtitle ?? "جزئیات شاخص اعتماد" : collapsedSummary}
            </p>
          </div>
          <span
            className="text-ink-faint text-sm shrink-0 transition-transform duration-200"
            aria-hidden
            style={{ transform: open ? "rotate(90deg)" : "rotate(-90deg)" }}
          >
            ‹
          </span>
        </button>
      ) : (
        <div className="px-3.5 pt-3.5">
          <CardHeader
            stats={stats}
            subtitle={subtitle}
            hideVerified={hideVerified}
          />
        </div>
      )}

      {(!collapsible || open) && (
        <div className={`px-3.5 pb-3.5 ${collapsible ? "pt-0" : ""}`}>
          <div className="h-2 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-levelA to-brand-600 transition-all"
              style={{ width: `${stats.score}%` }}
            />
          </div>
          <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-2 mb-3 leading-relaxed">
            نرخ پاسخگویی {formatPercent(stats.responseRate)} · بر اساس معامله و
            تأیید
            {stats.endorsementsGiven > 0 ? " (دریافتی و داده‌شده)" : " دریافتی"}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Metric
              value={toPersianDigits(stats.successfulDeals)}
              label="معامله‌ی موفق"
            />
            <Metric
              value={toPersianDigits(stats.endorsementsReceived)}
              label="تأیید دریافتی"
            />
            <Metric
              value={toPersianDigits(stats.endorsementsGiven)}
              label="تأیید داده‌شده"
            />
            <Metric
              value={toPersianDigits(stats.circleSize)}
              label={circleLabel}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CardHeader({
  stats,
  subtitle,
  hideVerified,
  compactScore = false,
}: {
  stats: SocialCreditStats;
  subtitle?: string;
  hideVerified: boolean;
  compactScore?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {!compactScore && (
          <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center shrink-0">
            <ShieldCheckIcon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {!compactScore && (
              <h2 className="text-[13px] font-bold text-ink dark:text-zinc-100">
                اعتبار اجتماعی
              </h2>
            )}
            {stats.verified && !hideVerified && (
              <span className="text-[10px] font-semibold text-levelA">
                {stats.verifiedLabel}
              </span>
            )}
          </div>
          {subtitle && !compactScore && (
            <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="text-left shrink-0 leading-none">
        <p
          className={`font-extrabold text-ink dark:text-zinc-50 nums ${
            compactScore ? "text-xl" : "text-2xl"
          }`}
        >
          {toPersianDigits(stats.score)}
          <span className="text-[11px] text-ink-faint font-bold"> / ۱۰۰</span>
        </p>
        <p className={`text-[11px] font-bold mt-1 ${labelColor[stats.label]}`}>
          {stats.label}
        </p>
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-stone-50/80 dark:bg-zinc-800/60 px-3 py-2.5">
      <p className="text-[10px] text-ink-muted dark:text-zinc-400 font-medium">
        {label}
      </p>
      <p className="text-[15px] font-extrabold text-ink dark:text-zinc-100 nums leading-none mt-1">
        {value}
      </p>
    </div>
  );
}
