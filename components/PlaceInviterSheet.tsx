"use client";

import { useState } from "react";
import SheetShell from "@/components/SheetShell";
import Avatar from "@/components/Avatar";
import { GROUP_PRIVATE_LINE } from "@/lib/invite";
import { levelLabels, relationLabels } from "@/lib/labels";
import type { Person, RelationType, TrustLevel } from "@/lib/types";

const RELATIONS: RelationType[] = [
  "family",
  "friend",
  "colleague",
  "neighbor",
  "acquaintance",
];

const LEVELS: TrustLevel[] = ["A", "B", "C"];

/** Reverse directed edge: invitee places the inviter in their own circle. */
export default function PlaceInviterSheet({
  person,
  onPlace,
}: {
  person: Person;
  onPlace: (input: { relation: RelationType; level: TrustLevel }) => void;
}) {
  const [relation, setRelation] = useState<RelationType>("friend");
  const [level, setLevel] = useState<TrustLevel>("B");

  function confirm() {
    onPlace({ relation, level });
  }

  return (
    <SheetShell
      onClose={confirm}
      closeOnBackdrop={false}
      showHandle={false}
      labelledBy="place-inviter-title"
      zClass="z-50"
      onEscape={() => true}
      footer={
        <button
          type="button"
          onClick={confirm}
          className="btn-primary w-full min-h-12"
        >
          به حلقه‌ات اضافه کن
        </button>
      }
    >
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={person.name} src={person.avatar} size="md" showLevel={false} />
        <div>
          <h2
            id="place-inviter-title"
            className="font-extrabold text-[20px] text-ink dark:text-zinc-50 leading-snug"
          >
            {person.name} را چطور می‌شناسی؟
          </h2>
          <p className="text-[12px] text-ink-muted mt-0.5">
            این انتخاب مال حلقهٔ توست — از دعوت او کپی نمی‌شود.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {RELATIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRelation(r)}
            className={`chip !px-3 !py-1.5 border ${
              relation === r
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-[color:var(--circle-surface)] text-ink-muted border-stone-200 dark:border-zinc-700"
            }`}
          >
            {relationLabels[r]}
          </button>
        ))}
      </div>

      <p className="text-sm font-medium mb-2 text-ink dark:text-zinc-200">
        جایگاهش کجا باشد؟
      </p>
      <div className="flex flex-col gap-2 mb-2">
        {LEVELS.map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => setLevel(lvl)}
            className={`rounded-xl py-2.5 px-3 text-right border ${
              level === lvl
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-[color:var(--circle-surface)] text-ink-muted border-stone-200 dark:border-zinc-700"
            }`}
          >
            <span className="block text-[14px] font-bold">{levelLabels[lvl]}</span>
          </button>
        ))}
      </div>
      <p className="text-[12px] text-ink-faint leading-relaxed">
        {GROUP_PRIVATE_LINE}
      </p>
    </SheetShell>
  );
}
