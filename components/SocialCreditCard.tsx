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
  "تازه‌وارد": "text-zinc-500",
};

export default function SocialCreditCard({
  stats,
  subtitle,
  circleLabel = "نفر در حلقه‌ی من",
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
    <div className="card bg-gradient-to-br from-brand-50/80 to-white dark:from-brand-500/10 dark:to-zinc-900 border-brand-100 dark:border-brand-500/20 overflow-hidden">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full p-4 flex items-center gap-3 text-right active:opacity-90 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 flex items-center justify-center shrink-0">
            <ShieldCheckIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              اعتبار اجتماعی
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 nums truncate">
              {open ? subtitle ?? "جزئیات شاخص اعتماد" : collapsedSummary}
            </p>
          </div>
          <span
            className="text-zinc-400 text-sm shrink-0 transition-transform duration-200"
            aria-hidden
            style={{ transform: open ? "rotate(90deg)" : "rotate(-90deg)" }}
          >
            ‹
          </span>
        </button>
      ) : (
        <div className="p-4 pb-0">
          <CardHeader
            stats={stats}
            subtitle={subtitle}
            hideVerified={hideVerified}
          />
        </div>
      )}

      {(!collapsible || open) && (
        <div className={`px-4 pb-4 ${collapsible ? "-mt-1" : ""}`}>
          <div className="h-2.5 rounded-full bg-white/80 dark:bg-zinc-800 overflow-hidden ring-1 ring-brand-100 dark:ring-brand-500/20">
            <div
              className="h-full bg-gradient-to-l from-levelA to-brand-500 transition-all"
              style={{ width: `${stats.score}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-400 mt-1.5 mb-4">
            نرخ پاسخگویی {formatPercent(stats.responseRate)} · بر اساس معامله، تأیید
            {stats.endorsementsGiven > 0 ? " (دریافتی و داده‌شده)" : " دریافتی"} و
            فعالیت در شبکه
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <Metric
              value={toPersianDigits(stats.successfulDeals)}
              label="معامله‌ی موفق"
              icon="🤝"
            />
            <Metric
              value={toPersianDigits(stats.endorsementsReceived)}
              label="تأیید دریافتی"
              icon="🛡️"
            />
            <Metric
              value={toPersianDigits(stats.endorsementsGiven)}
              label="تأیید داده‌شده"
              icon="✅"
            />
            <Metric
              value={toPersianDigits(stats.circleSize)}
              label={circleLabel}
              icon="👥"
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
      <div className="flex items-center gap-2 min-w-0">
        {!compactScore && (
          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 flex items-center justify-center shrink-0">
            <ShieldCheckIcon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {!compactScore && (
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                اعتبار اجتماعی
              </h2>
            )}
            {stats.verified && !hideVerified && (
              <span className="chip bg-green-50 text-levelA dark:bg-green-500/15 text-[10px] !py-0.5 !px-2">
                {stats.verifiedLabel}
              </span>
            )}
          </div>
          {subtitle && !compactScore && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="text-left shrink-0 leading-none">
        <p
          className={`font-extrabold text-brand-700 dark:text-brand-300 nums ${
            compactScore ? "text-2xl" : "text-3xl"
          }`}
        >
          {toPersianDigits(stats.score)}
          <span className="text-xs text-zinc-400 font-bold"> / ۱۰۰</span>
        </p>
        <p className={`text-xs font-extrabold mt-1 ${labelColor[stats.label]}`}>
          {stats.label}
        </p>
      </div>
    </div>
  );
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-white/90 dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800 px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm" aria-hidden>
          {icon}
        </span>
        <span className="text-[11px] text-zinc-400 font-medium">{label}</span>
      </div>
      <p className="text-base font-extrabold text-brand-800 dark:text-brand-200 nums leading-none">
        {value}
      </p>
    </div>
  );
}
