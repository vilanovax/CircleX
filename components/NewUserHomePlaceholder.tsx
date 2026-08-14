"use client";

import { CircleUsersIcon } from "@/components/Icons";

/**
 * Background behind first-run onboarding. Same job as the empty-circle home:
 * invite is the action; no fake marketplace chrome.
 */
export default function NewUserHomePlaceholder() {
  return (
    <div className="px-4 pt-4 pb-2">
      <div className="card px-4 pt-4 pb-3.5 text-center">
        <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center mx-auto mb-2.5">
          <CircleUsersIcon className="w-5 h-5" />
        </div>
        <p className="font-extrabold text-[15px] text-ink dark:text-zinc-50 leading-snug">
          حلقه‌ات هنوز خالی است
        </p>
        <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed">
          اینجا آگهی‌ها و درخواست‌های آدم‌های آشنا را می‌بینی. برای شروع یکی از
          نزدیکانت را دعوت کن.
        </p>
      </div>
    </div>
  );
}
