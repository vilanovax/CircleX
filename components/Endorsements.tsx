"use client";

import type { Endorsement } from "@/lib/types";
import { useStore } from "@/lib/store";
import Avatar from "./Avatar";
import { badgeEmoji, badgeResultLabels } from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";

/** Summary line for trust cards — names the endorser when there's only one. */
export function EndorsementSummary({
  endorsements,
}: {
  endorsements: Endorsement[];
}) {
  const { getPerson } = useStore();
  const uniqueIds = Array.from(new Set(endorsements.map((e) => e.personId)));
  if (uniqueIds.length === 0) return null;

  let text: string;
  if (uniqueIds.length === 1) {
    const person = getPerson(uniqueIds[0]);
    const name = person?.name ?? "یکی از حلقه شما";
    const first = endorsements.find((e) => e.personId === uniqueIds[0])!;
    text = `${name} ${badgeResultLabels[first.type]}`;
  } else {
    text = `${toPersianDigits(uniqueIds.length)} نفر از حلقه شما این آگهی را تأیید کرده‌اند`;
  }

  return (
    <div className="flex items-start gap-1.5 text-[12px] text-levelA font-medium leading-snug">
      <span aria-hidden>🛡</span>
      <span>{text}</span>
    </div>
  );
}

/** Detailed list of who endorsed and with which badge. */
export function EndorsementList({
  endorsements,
}: {
  endorsements: Endorsement[];
}) {
  const { getPerson } = useStore();
  if (endorsements.length === 0) {
    return (
      <p className="text-[13px] text-ink-faint leading-relaxed">
        هنوز کسی از حلقه‌ی شما این آگهی را تأیید نکرده است.
      </p>
    );
  }
  return (
    <ul className="space-y-2.5">
      {endorsements.map((e, i) => {
        const p = getPerson(e.personId);
        return (
          <li key={`${e.personId}-${e.type}-${i}`} className="flex items-center gap-2.5">
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
            <div className="text-[13px] leading-snug min-w-0">
              <span className="font-semibold text-ink dark:text-zinc-100">
                {p?.name ?? "شما"}
              </span>
              <span className="text-ink-muted">
                {" "}
                {badgeEmoji[e.type]} {badgeResultLabels[e.type]}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
