"use client";

import { useState } from "react";
import SheetShell from "@/components/SheetShell";
import {
  levelLabels,
  relationLabels,
} from "@/lib/labels";
import type { Person, RelationType, TrustLevel } from "@/lib/types";
import Avatar from "./Avatar";

const LEVELS: TrustLevel[] = ["A", "B", "C"];
const RELATIONS: RelationType[] = [
  "family",
  "friend",
  "colleague",
  "neighbor",
  "acquaintance",
];

export default function AddToCircleSheet({
  person,
  onClose,
  onAdd,
}: {
  person: Person;
  onClose: () => void;
  onAdd: (input: {
    level: TrustLevel;
    relation: RelationType;
    note?: string;
  }) => void;
}) {
  const [relation, setRelation] = useState<RelationType>(person.relation);
  const [level, setLevel] = useState<TrustLevel>(person.level);
  const [note, setNote] = useState(person.note ?? "");

  return (
    <SheetShell onClose={onClose} labelledBy="add-to-circle-title">
      <h2 id="add-to-circle-title" className="font-bold text-lg mb-1 text-ink dark:text-zinc-100">
        به حلقه‌ات اضافه کن
      </h2>
      <p className="text-xs text-ink-faint mb-4">
        {person.name} از مسیر ارتباط به تو وصل است — جایگاهش کجا باشد؟
      </p>

      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-200/70 dark:border-zinc-700">
        <Avatar name={person.name} src={person.avatar} size="md" showLevel={false} />
        <div>
          <p className="font-semibold text-ink dark:text-zinc-100">{person.name}</p>
          {person.city && (
            <p className="text-xs text-ink-muted">{person.city}</p>
          )}
        </div>
      </div>

      <label className="block text-sm font-medium mb-2 text-ink dark:text-zinc-200">
        {person.name} را چطور می‌شناسی؟
      </label>
      <div className="flex flex-wrap gap-2 mb-4">
        {RELATIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRelation(r)}
            className={`chip !px-3 !py-1.5 border ${
              relation === r
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-[color:var(--circle-surface)] dark:bg-zinc-900 text-ink-muted dark:text-zinc-300 border-stone-200/70 dark:border-zinc-700"
            }`}
          >
            {relationLabels[r]}
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium mb-2 text-ink dark:text-zinc-200">
        جایگاهش کجا باشد؟
      </label>
      <div className="flex gap-2 mb-4">
        {LEVELS.map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => setLevel(lvl)}
            className={`flex-1 rounded-xl py-2.5 text-xs font-medium border ${
              level === lvl
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-[color:var(--circle-surface)] dark:bg-zinc-900 text-ink-muted border-stone-200/70 dark:border-zinc-700"
            }`}
          >
            {levelLabels[lvl]}
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium mb-1 text-ink dark:text-zinc-200">
        یادداشت (اختیاری)
      </label>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="مثلاً: از طریق سارا آشنا شدم"
        className="field mb-5"
      />

      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="btn-ghost flex-1">
          انصراف
        </button>
        <button
          type="button"
          onClick={() =>
            onAdd({
              level,
              relation,
              note: note.trim() || undefined,
            })
          }
          className="btn-primary flex-1"
        >
          به حلقه‌ات اضافه کن
        </button>
      </div>
    </SheetShell>
  );
}
