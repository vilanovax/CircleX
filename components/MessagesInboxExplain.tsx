"use client";

import Link from "next/link";
import { ChatIcon, CircleUsersIcon, ShieldCheckIcon } from "@/components/Icons";
import type { ReactNode } from "react";

/**
 * Empty-inbox coach: only Circlo exists — teach what Messages is for.
 * Disappears once the first real peer thread appears.
 */
export default function MessagesInboxExplain({
  emptyCircle,
}: {
  emptyCircle: boolean;
}) {
  return (
    <section
      className="rounded-2xl border border-stone-200/80 bg-[color:var(--circle-surface)] px-3.5 py-3.5 dark:border-zinc-800 dark:bg-zinc-900/70 listing-detail-rise"
      aria-label="درباره پیام‌ها"
    >
      <p className="text-[13px] font-bold text-ink dark:text-zinc-100 leading-snug">
        گفتگو با حلقه اینجا می‌آید
      </p>
      <p className="mt-1 text-[12px] text-ink-muted dark:text-zinc-400 leading-relaxed">
        {emptyCircle
          ? "تا کسی به حلقه‌ات نپیوندد، چت با افراد اینجا نیست. ردیف سیرکلو فقط اخبار رسمی سیرکل است."
          : "از آگهی یا پروفایل عضو حلقه پیام بفرست — گفتگو همین‌جا دیده می‌شود. سیرکلو اخبار رسمی است، نه چت شخصی."}
      </p>
      <ul className="mt-3 space-y-2.5">
        <ExplainRow
          Icon={ShieldCheckIcon}
          title="فقط افراد حلقه"
          detail="غریبه اینجا پیام نمی‌دهد"
        />
        <ExplainRow
          Icon={ChatIcon}
          title="معمولاً حول آگهی"
          detail="بازدید، قیمت و هماهنگی در همان گفتگو"
        />
        <ExplainRow
          Icon={CircleUsersIcon}
          title="سیرکلو"
          detail="درخواست ورود، پذیرش دعوت و خبرهای سیستم"
        />
      </ul>
      {emptyCircle ? (
        <Link
          href="/?invite=1"
          className="btn-primary mt-3.5 w-full min-h-11 inline-flex items-center justify-center shadow-md shadow-brand-600/15 active:scale-[0.98] transition-transform duration-150"
        >
          دعوت به حلقه
        </Link>
      ) : (
        <Link
          href="/"
          className="mt-3.5 inline-flex min-h-10 w-full items-center justify-center text-[13px] font-semibold text-brand-700 dark:text-brand-400 active:opacity-70"
        >
          رفتن به آگهی‌های حلقه
        </Link>
      )}
    </section>
  );
}

function ExplainRow({
  Icon,
  title,
  detail,
}: {
  Icon: (props: { className?: string }) => ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <li className="flex items-start gap-2.5 text-start">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 pt-0.5">
        <span className="block text-[13px] font-bold text-ink dark:text-zinc-100 leading-snug">
          {title}
        </span>
        <span className="mt-0.5 block text-[12px] text-ink-muted dark:text-zinc-400 leading-relaxed">
          {detail}
        </span>
      </span>
    </li>
  );
}
