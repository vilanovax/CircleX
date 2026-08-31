"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  isMessagesInboxTipPending,
  markMessagesInboxTipSeen,
} from "@/lib/home-tip";

/**
 * Quiet inbox coach when only Circlo exists — not an invite landing.
 * Dismissible; disappears for good once a real peer thread appears.
 */
export default function MessagesInboxExplain({
  emptyCircle,
}: {
  emptyCircle: boolean;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(isMessagesInboxTipPending());
  }, []);

  const dismiss = useCallback(() => {
    markMessagesInboxTipSeen();
    setShow(false);
  }, []);

  if (!show) return null;

  return (
    <section
      className="relative rounded-2xl bg-stone-100/90 px-3.5 py-2.5 dark:bg-zinc-800/55 listing-detail-rise"
      aria-label="راهنمای پیام‌ها"
    >
      <p className="text-[13px] font-bold text-ink dark:text-zinc-100 leading-snug pe-7">
        هنوز گفتگویی با افراد حلقه نیست
      </p>
      <p className="mt-0.5 text-[11px] text-ink-muted dark:text-zinc-400 leading-snug pe-7">
        {emptyCircle
          ? "ردیف سیرکلو اخبار رسمی است. چت با افراد وقتی کسی به حلقه بپیوندد اینجا می‌آید."
          : "از آگهی یا پروفایل عضو حلقه پیام بفرست — گفتگو در همین لیست دیده می‌شود. سیرکلو فقط اخبار رسمی است."}
      </p>
      {emptyCircle ? (
        <p className="mt-1.5 pe-7">
          <Link
            href="/?invite=1"
            className="text-[11px] font-semibold text-brand-700 dark:text-brand-400 active:opacity-70"
          >
            دعوت نزدیکان
          </Link>
        </p>
      ) : null}
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full text-sm text-ink-faint hover:bg-stone-200/70 dark:hover:bg-zinc-700 active:scale-95"
        aria-label="بستن راهنما"
      >
        ×
      </button>
    </section>
  );
}
