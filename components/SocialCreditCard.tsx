"use client";

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
}: {
  stats: SocialCreditStats;
  subtitle?: string;
  circleLabel?: string;
}) {
  return (
    <div className="card p-4 bg-gradient-to-br from-brand-50/80 to-white dark:from-brand-500/10 dark:to-zinc-900 border-brand-100 dark:border-brand-500/20">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 flex items-center justify-center">
            <ShieldCheckIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              اعتبار اجتماعی
            </h2>
            {subtitle && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {/* hero score */}
        <div className="text-left shrink-0 leading-none">
          <p className="text-3xl font-extrabold text-brand-700 dark:text-brand-300 nums">
            {toPersianDigits(stats.score)}
            <span className="text-xs text-zinc-400 font-bold"> / ۱۰۰</span>
          </p>
          <p className={`text-xs font-extrabold mt-1 ${labelColor[stats.label]}`}>
            {stats.label}
          </p>
        </div>
      </div>

      <div className="h-2.5 rounded-full bg-white/80 dark:bg-zinc-800 overflow-hidden ring-1 ring-brand-100 dark:ring-brand-500/20">
        <div
          className="h-full bg-gradient-to-l from-levelA to-brand-500 transition-all"
          style={{ width: `${stats.score}%` }}
        />
      </div>
      <p className="text-[10px] text-zinc-400 mt-1.5 mb-4">
        بر اساس معامله‌های موفق، تأییدها و اندازه‌ی حلقه‌ی شما
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        <Metric
          value={toPersianDigits(stats.successfulDeals)}
          label="معامله‌ی موفق"
          icon="🤝"
        />
        <Metric
          value={toPersianDigits(stats.endorsementsReceived)}
          label="تأییدیه دریافتی"
          icon="🛡️"
        />
        <Metric
          value={toPersianDigits(stats.circleSize)}
          label={circleLabel}
          icon="👥"
        />
        <Metric
          value={formatPercent(stats.responseRate)}
          label="نرخ پاسخگویی"
          icon="💬"
        />
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
        <span className="text-[10px] text-zinc-400 font-medium">{label}</span>
      </div>
      <p className="text-base font-extrabold text-brand-800 dark:text-brand-200 nums leading-none">
        {value}
      </p>
    </div>
  );
}
