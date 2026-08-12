"use client";

import { useState } from "react";
import type { SocialCreditStats } from "@/lib/social-credit";
import { formatPercent } from "@/lib/social-credit";
import { toPersianDigits } from "@/lib/persian";

export default function SocialCreditCard({
  stats,
  subtitle,
  activityLabel,
  circleLabel,
  hideVerified = false,
  collapsible = false,
  defaultCollapsed = false,
  title = "اعتماد و سابقه",
}: {
  stats: SocialCreditStats;
  subtitle?: string;
  /** Label for activityCount / legacy circleSize metric. */
  activityLabel?: string;
  /** @deprecated Prefer activityLabel */
  circleLabel?: string;
  hideVerified?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  title?: string;
}) {
  const [open, setOpen] = useState(!defaultCollapsed);
  const [showCalc, setShowCalc] = useState(false);
  const resolvedActivityLabel =
    activityLabel ?? circleLabel ?? "فعالیت قابل‌مشاهده";

  const activity =
    stats.activityCount ??
    (stats as SocialCreditStats & { circleSize?: number }).circleSize ??
    0;

  const evidenceBits: string[] = [];
  if (stats.successfulDeals > 0) {
    evidenceBits.push(
      `${toPersianDigits(stats.successfulDeals)} معامله تکمیل‌شده`,
    );
  }
  if (stats.endorsementsReceived > 0) {
    evidenceBits.push(
      `${toPersianDigits(stats.endorsementsReceived)} تأیید از شبکه`,
    );
  }
  const collapsedSummary =
    evidenceBits.length > 0
      ? evidenceBits.join(" · ")
      : `عضو از ${stats.memberSince}`;

  return (
    <div className="card overflow-hidden">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full px-3.5 py-3 flex items-center gap-3 text-right active:bg-stone-50/80 dark:active:bg-zinc-800/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-extrabold text-ink dark:text-zinc-100">
              {title}
            </p>
            <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 nums truncate">
              {open ? subtitle ?? "شواهد قابل‌فهم، نه امتیاز رسمی" : collapsedSummary}
            </p>
          </div>
          <span
            className={`text-ink-faint text-sm shrink-0 transition-transform duration-200 ${
              open ? "rotate-90" : "-rotate-90"
            }`}
            aria-hidden
          >
            ‹
          </span>
        </button>
      ) : (
        <div className="px-3.5 pt-3.5 pb-1">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <h2 className="text-[13px] font-extrabold text-ink dark:text-zinc-100">
                {title}
              </h2>
              {subtitle && (
                <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5">
                  {subtitle}
                </p>
              )}
              {stats.verified && !hideVerified && stats.verifiedLabel && (
                <p className="text-[11px] font-medium text-ink-muted dark:text-zinc-400 mt-1">
                  {stats.verifiedLabel}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {(!collapsible || open) && (
        <div
          className={`px-3.5 pb-3.5 animate-fade-up ${collapsible ? "pt-0" : ""}`}
        >
          <div className="grid grid-cols-2 gap-2">
            <Metric
              value={toPersianDigits(stats.successfulDeals)}
              label="معامله تکمیل‌شده"
            />
            <Metric
              value={toPersianDigits(stats.endorsementsReceived)}
              label="تأیید از شبکه"
            />
            <Metric value={stats.memberSince} label="عضو از" />
            <Metric
              value={formatPercent(stats.responseRate)}
              label="نرخ پاسخ‌گویی"
            />
          </div>

          {stats.endorsementsGiven > 0 && (
            <p className="text-[11px] text-ink-faint mt-3 leading-relaxed px-0.5">
              مشارکت در شبکه: {toPersianDigits(stats.endorsementsGiven)} تأیید
              ثبت‌شده توسط این عضو — در اعتبار او حساب نمی‌شود.
            </p>
          )}

          {activity > 0 && (
            <p className="text-[11px] text-ink-faint mt-1.5 leading-relaxed px-0.5">
              {resolvedActivityLabel}: {toPersianDigits(activity)}
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowCalc((v) => !v)}
            className="mt-3 text-[11px] font-semibold text-brand-600 dark:text-brand-400"
            aria-expanded={showCalc}
          >
            {showCalc ? "بستن توضیح محاسبه" : "این اعداد چطور به هم مربوط‌اند؟"}
          </button>

          {showCalc && (
            <div className="mt-2 rounded-xl bg-stone-50/90 dark:bg-zinc-800/60 px-3 py-2.5 text-[11px] text-ink-muted dark:text-zinc-400 leading-relaxed">
              <p>
                سیرکل امتیاز رسمی یا احراز هویت نیست. شاخص داخلی فعلی بر اساس
                معامله‌های تکمیل‌شده، تأییدهای دریافتی از شبکه، و نرخ پاسخ ساخته
                می‌شود ({toPersianDigits(stats.score)} از ۱۰۰ · {stats.label}).
                تأییدهایی که این عضو برای دیگران ثبت کرده فقط مشارکت است.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-stone-50/90 dark:bg-zinc-800/60 px-3 py-2.5 ring-1 ring-stone-200/40 dark:ring-zinc-700/60">
      <p className="text-[10px] text-ink-muted dark:text-zinc-400 font-semibold">
        {label}
      </p>
      <p className="text-[1.05rem] font-extrabold text-ink dark:text-zinc-100 nums leading-none mt-1.5 tracking-tight">
        {value}
      </p>
    </div>
  );
}
