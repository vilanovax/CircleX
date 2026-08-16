"use client";

import type { Endorsement } from "@/lib/types";
import { useStore } from "@/lib/store";
import Avatar from "./Avatar";
import { badgeResultLabels } from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";

/** Compact member note — no official shield; uses endorser avatar. */
export function EndorsementSummary({
  endorsements,
}: {
  endorsements: Endorsement[];
}) {
  const getPerson = useStore((s) => s.getPerson);
  const uniqueIds = Array.from(new Set(endorsements.map((e) => e.personId)));
  if (uniqueIds.length === 0) return null;

  if (uniqueIds.length === 1) {
    const person = getPerson(uniqueIds[0]);
    const name = person?.name ?? "یکی از حلقه";
    const first = endorsements.find((e) => e.personId === uniqueIds[0])!;
    return (
      <div className="flex items-start gap-2 text-[12px] text-ink-muted dark:text-zinc-400 leading-snug">
        {person ? (
          <Avatar name={person.name} src={person.avatar} showLevel={false} size="sm" />
        ) : (
          <span className="w-8 h-8 rounded-full bg-stone-100 dark:bg-zinc-800 shrink-0" />
        )}
        <p className="pt-1.5">
          <span className="font-semibold text-ink dark:text-zinc-200">{name}</span>
          {" گفته "}
          {badgeResultLabels[first.type].replace(/^این /, "این ")}
        </p>
      </div>
    );
  }

  return (
    <p className="text-[12px] text-ink-muted leading-snug">
      {toPersianDigits(uniqueIds.length)} نفر از حلقه گفته‌اند این آگهی را
      دیده‌اند یا فروشنده را می‌شناسند.
    </p>
  );
}

/** Detailed list of who endorsed — member claims, not platform certification. */
export function EndorsementList({
  endorsements,
}: {
  endorsements: Endorsement[];
}) {
  const getPerson = useStore((s) => s.getPerson);
  if (endorsements.length === 0) {
    return (
      <p className="text-[13px] text-ink-faint leading-relaxed">
        هنوز کسی از حلقه درباره این آگهی چیزی نگفته است.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {endorsements.map((e, i) => {
        const p = getPerson(e.personId);
        return (
          <li
            key={`${e.personId}-${e.type}-${i}`}
            className="flex items-start gap-2.5"
          >
            {p ? (
              <Avatar
                name={p.name}
                src={p.avatar}
                showLevel={false}
                size="sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-stone-100 dark:bg-zinc-800 shrink-0" />
            )}
            <div className="text-[13px] leading-snug min-w-0 pt-0.5">
              <p className="text-ink dark:text-zinc-100">
                <span className="font-semibold">{p?.name ?? "شما"}</span>
                {" گفته "}
                {claimPhrase(e.type)}
              </p>
              <p className="text-[11px] text-ink-faint mt-0.5">
                اظهارنظر عضو حلقه — نه مهر تأیید سیرکل
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function claimPhrase(
  type: Endorsement["type"],
  sellerName = "فروشنده",
): string {
  switch (type) {
    case "verify_item":
      return "این کالا را از نزدیک دیده است.";
    case "know_seller":
      return `${sellerName} را می‌شناسد.`;
    case "verify_quality":
      return "وضعیت گفته‌شده را بررسی کرده است.";
    case "dealt_before":
      return `قبلاً با ${sellerName} معامله کرده است.`;
    default:
      return badgeResultLabels[type];
  }
}
