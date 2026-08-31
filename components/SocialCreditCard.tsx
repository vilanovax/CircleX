"use client";

import type { ReactNode } from "react";
import type { SocialCreditStats } from "@/lib/social-credit";
import { toPersianDigits } from "@/lib/persian";

function Percent({ value }: { value: number }) {
  return (
    <span className="nums" dir="ltr">
      {toPersianDigits(value)}٪
    </span>
  );
}

export default function SocialCreditCard({
  stats,
  hideVerified = false,
  title = "سابقه در حلقه",
  forSelf = false,
}: {
  stats: SocialCreditStats & { circleSize?: number };
  hideVerified?: boolean;
  title?: string;
  forSelf?: boolean;
}) {
  const deals = stats.successfulDeals;
  const endorsements = stats.endorsementsReceived;
  const circleSize = stats.circleSize ?? 0;
  /** Empty-circle self: never show seeded deals / response % as if they were earned here. */
  const emptySelfCircle = forSelf && circleSize === 0;

  if (emptySelfCircle) {
    return (
      <section className="card px-3.5 py-3">
        <p className="text-[11px] font-bold text-ink-muted dark:text-zinc-400">
          {title}
        </p>
        <p className="mt-1 text-[14px] font-extrabold text-ink dark:text-zinc-50 leading-snug">
          هنوز سابقه‌ای در حلقه نیست
        </p>
        <p className="mt-1 text-[11px] text-ink-faint dark:text-zinc-500 leading-snug">
          بعد از معامله و تأیید آشنایان اینجا دیده می‌شود
        </p>
      </section>
    );
  }

  const facts: { key: string; node: ReactNode }[] = [];
  if (deals > 0) {
    facts.push({
      key: "deals",
      node: (
        <>
          <span className="nums">{toPersianDigits(deals)}</span> معامله
        </>
      ),
    });
  }
  if (endorsements > 0) {
    facts.push({
      key: "endorsements",
      node: (
        <>
          <span className="nums">{toPersianDigits(endorsements)}</span> تأیید
        </>
      ),
    });
  }
  if (deals > 0 || endorsements > 0) {
    facts.push({
      key: "response",
      node: (
        <>
          پاسخ‌گویی <Percent value={stats.responseRate} />
        </>
      ),
    });
  }

  if (facts.length === 0) {
    return (
      <section className="card px-3.5 py-3">
        <p className="text-[11px] font-bold text-ink-muted dark:text-zinc-400">
          {title}
        </p>
        <p className="mt-1 text-[14px] font-extrabold text-ink dark:text-zinc-50 leading-snug">
          تازه‌وارد حلقه
        </p>
        {forSelf ? (
          <p className="mt-1 text-[11px] text-ink-faint dark:text-zinc-500 leading-snug">
            حلقه این را می‌بیند — امتیاز رسمی نیست
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="card px-3.5 py-3">
      <p className="text-[11px] font-bold text-ink-muted dark:text-zinc-400">
        {title}
      </p>
      <p className="mt-1 text-[14px] font-extrabold text-ink dark:text-zinc-50 leading-snug">
        {facts.map((fact, i) => (
          <span key={fact.key}>
            {i > 0 ? (
              <span className="text-ink-faint font-semibold"> · </span>
            ) : null}
            {fact.node}
          </span>
        ))}
      </p>
      {stats.verified && !hideVerified && stats.verifiedLabel ? (
        <p className="mt-1 text-[11px] text-ink-muted dark:text-zinc-400">
          {stats.verifiedLabel}
        </p>
      ) : null}
      {forSelf ? (
        <p className="mt-1 text-[11px] text-ink-faint dark:text-zinc-500 leading-snug">
          حلقه این را می‌بیند — امتیاز رسمی نیست
        </p>
      ) : null}
    </section>
  );
}
