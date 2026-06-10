"use client";

import type { Endorsement } from "@/lib/types";
import { useStore } from "@/lib/store";
import { badgeEmoji, badgeLabels } from "@/lib/labels";

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
        <span className="nums">{people.size}</span> نفر از آدم‌های مورد اعتماد شما
        تأیید کرده‌اند
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
      <p className="text-sm text-zinc-400">
        هنوز کسی از حلقه‌ی شما این آگهی را تأیید نکرده است.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {endorsements.map((e, i) => {
        const p = getPerson(e.personId);
        return (
          <li key={i} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-base shrink-0">
              {p?.avatar ?? "🧑"}
            </div>
            <div className="text-sm leading-tight">
              <span className="font-medium text-zinc-800">{p?.name ?? "شما"}</span>
              <span className="text-zinc-500">
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
