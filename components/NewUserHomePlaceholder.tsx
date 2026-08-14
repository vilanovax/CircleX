"use client";

import Link from "next/link";
import { CircleUsersIcon } from "@/components/Icons";

/** Sample preview cards — generic, no fake “your sister” relations. */
const SAMPLE_PREVIEWS = [
  {
    emoji: "🛋️",
    title: "مبل راحتی سه‌نفره",
    meta: "نمونه · از حلقهٔ شما",
    price: "۸,۵۰۰,۰۰۰ تومان",
  },
  {
    emoji: "🎹",
    title: "آموزش پیانو برای کودکان",
    meta: "نمونه · خدمات",
    price: "۶۰۰,۰۰۰ تومان",
  },
] as const;

/**
 * Home body for first-run users — empty CTA + muted sample previews.
 * Real seeded listings stay hidden until onboarding completes.
 */
export default function NewUserHomePlaceholder() {
  return (
    <div className="px-4 pt-4 pb-2 space-y-4">
      <div className="card p-5 text-center">
        <div className="w-14 h-14 rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center mx-auto mb-3">
          <CircleUsersIcon className="w-7 h-7" />
        </div>
        <p className="font-extrabold text-[15px] text-ink dark:text-zinc-100">
          اول حلقه را بسازید
        </p>
        <p className="text-xs text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed max-w-[18rem] mx-auto">
          با افزودن خانواده و دوستان، آگهی‌ها و رویدادهای آن‌ها اینجا ظاهر می‌شود.
        </p>
        <Link href="/circle?invite=1" className="btn-primary inline-block mt-4 !px-6">
          افزودن به حلقه
        </Link>
      </div>

      <div>
        <p className="text-[12px] font-bold text-ink-faint mb-2">
          بعد از ساخت حلقه، چیزی شبیه این می‌بینید
        </p>
        <div className="space-y-2 opacity-55 pointer-events-none select-none" aria-hidden>
          {SAMPLE_PREVIEWS.map((item) => (
            <div
              key={item.title}
              className="card p-3 flex items-center gap-3"
            >
              <div className="w-14 h-14 rounded-xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-2xl shrink-0">
                {item.emoji}
              </div>
              <div className="min-w-0 flex-1 text-start">
                <p className="text-[11px] text-ink-faint">{item.meta}</p>
                <p className="text-sm font-bold text-ink dark:text-zinc-100 truncate">
                  {item.title}
                </p>
                <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mt-0.5">
                  {item.price}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
