"use client";

import { useState } from "react";
import type { SocialCreditStats } from "@/lib/social-credit";
import { formatPercent } from "@/lib/social-credit";
import { toPersianDigits } from "@/lib/persian";

export default function SocialCreditCard({
  stats,
  subtitle,
  hideVerified = false,
  collapsible = false,
  defaultCollapsed = false,
  title = "سابقهٔ تو در حلقه",
  forSelf = false,
}: {
  stats: SocialCreditStats;
  subtitle?: string;
  hideVerified?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  title?: string;
  /** Second-person copy for the owner’s own profile. */
  forSelf?: boolean;
}) {
  const [open, setOpen] = useState(!defaultCollapsed);
  const [showCalc, setShowCalc] = useState(false);

  const deals = stats.successfulDeals;
  const endorsements = stats.endorsementsReceived;
  const response = formatPercent(stats.responseRate);

  const collapsedSummary =
    deals > 0
      ? `${toPersianDigits(deals)} معامله · پاسخ‌گویی ${response}`
      : `عضو از ${stats.memberSince} · پاسخ‌گویی ${response}`;

  const openSubtitle =
    subtitle ??
    (forSelf
      ? "اعضای حلقه این را روی پروفایلت می‌بینند — امتیاز رسمی نیست"
      : "سابقه و تأییدهای اعضا، نه امتیاز رسمی");

  const dealsLine =
    deals > 0
      ? `${toPersianDigits(deals)} معامله با حلقه`
      : forSelf
        ? "هنوز معاملهٔ تکمیل‌شده‌ای ثبت نشده"
        : "هنوز معاملهٔ تکمیل‌شده‌ای ندارد";

  const endorseLine =
    endorsements > 0
      ? `${toPersianDigits(endorsements)} تأیید از اعضای حلقه`
      : forSelf
        ? "هنوز کسی تأییدت نکرده"
        : "هنوز تأییدی از حلقه نگرفته";

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
            <p
              className={`text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 nums leading-relaxed ${
                open ? "" : "truncate"
              }`}
            >
              {open ? openSubtitle : collapsedSummary}
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
          <h2 className="text-[13px] font-extrabold text-ink dark:text-zinc-100">
            {title}
          </h2>
          <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-relaxed">
            {openSubtitle}
          </p>
          {stats.verified && !hideVerified && stats.verifiedLabel && (
            <p className="text-[11px] font-medium text-ink-muted dark:text-zinc-400 mt-1">
              {stats.verifiedLabel}
            </p>
          )}
        </div>
      )}

      {(!collapsible || open) && (
        <div
          className={`px-3.5 pb-3.5 animate-fade-up ${collapsible ? "pt-0" : "pt-2"}`}
        >
          <p
            className={`text-[15px] leading-snug ${
              deals > 0
                ? "font-extrabold text-ink dark:text-zinc-50"
                : "font-semibold text-ink-muted dark:text-zinc-400"
            }`}
          >
            {dealsLine}
          </p>
          <p
            className={`mt-1 text-[13px] leading-relaxed ${
              endorsements > 0
                ? "font-bold text-ink dark:text-zinc-100"
                : "text-ink-muted dark:text-zinc-400"
            }`}
          >
            {endorseLine}
          </p>
          <p className="mt-2.5 text-[12px] text-ink-faint dark:text-zinc-500 leading-relaxed nums">
            عضو از {stats.memberSince}
            {" · "}
            پاسخ‌گویی به پیام‌ها {response}
          </p>

          {stats.endorsementsGiven > 0 && (
            <p className="text-[11px] text-ink-faint mt-2.5 leading-relaxed">
              {forSelf
                ? `تأییدهایی که برای دیگران ثبت کرده‌ای (${toPersianDigits(stats.endorsementsGiven)}) اینجا حساب نمی‌شود.`
                : `تأییدهای ثبت‌شده توسط این عضو: ${toPersianDigits(stats.endorsementsGiven)} — در سابقه‌اش حساب نمی‌شود.`}
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowCalc((v) => !v)}
            className="mt-3 text-[11px] font-semibold text-brand-600 dark:text-brand-400"
            aria-expanded={showCalc}
          >
            {showCalc ? "بستن توضیح" : "این یعنی چه؟"}
          </button>

          {showCalc && (
            <div className="mt-2 rounded-xl bg-stone-50/90 dark:bg-zinc-800/60 px-3 py-2.5 text-[11px] text-ink-muted dark:text-zinc-400 leading-relaxed">
              {forSelf ? (
                <p>
                  امتیاز یا مهر هویت سیرکل نیست. حلقه معامله‌های تکمیل‌شده،
                  تأییدهایی که از اعضا گرفته‌ای، و اینکه معمولاً به پیام‌ها جواب
                  می‌دهی را می‌بیند. تأییدهایی که خودت برای دیگران می‌گذاری اینجا
                  حساب نمی‌شود.
                </p>
              ) : (
                <p>
                  امتیاز یا مهر هویت سیرکل نیست. حلقه معامله‌های تکمیل‌شده،
                  تأییدهای دریافتی، و پاسخ‌گویی به پیام‌ها را می‌بیند. تأییدهایی که
                  این عضو برای دیگران ثبت کرده فقط مشارکت است.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
