"use client";

import type { Endorsement } from "@/lib/types";
import { useStore } from "@/lib/store";
import Avatar from "./Avatar";
import { badgeEmoji, badgeLabels } from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";

/** Summary line: "۳ نفر از آدم‌های مورد اعتماد شما این را تأیید کرده‌اند". */
export function EndorsementSummary({
  endorsements,
}: {
  endorsements: Endorsement[];
}) {
  const people = new Set(endorsements.map((e) => e.personId));
  if (people.size === 0) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-levelA font-medium">
      <span>🛡️</span>
      <span>
        <span className="nums">{toPersianDigits(people.size)}</span> نفر از
        آدم‌های مورد اعتماد شما تأیید کرده‌اند
      </span>
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
          <li key={i} className="flex items-center gap-2.5">
            {p ? (
              <Avatar name={p.name} level={p.level} size="sm" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-stone-100 dark:bg-zinc-800 shrink-0" />
            )}
            <div className="text-[13px] leading-snug min-w-0">
              <span className="font-semibold text-ink dark:text-zinc-100">
                {p?.name ?? "شما"}
              </span>
              <span className="text-ink-muted">
                {" "}
                {badgeEmoji[e.type]} {badgeLabels[e.type]}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
