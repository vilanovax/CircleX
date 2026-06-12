"use client";

import { useRef, useState } from "react";
import { useSheetA11y } from "@/lib/use-sheet-a11y";
import {
  levelChip,
  levelLabels,
  relationEmoji,
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
  const panelRef = useRef<HTMLDivElement>(null);
  useSheetA11y(panelRef, onClose);

  return (
    <div className="fixed inset-0 z-40 flex justify-center">
      <div className="relative w-full max-w-[480px]">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-to-circle-title"
          tabIndex={-1}
          className="absolute bottom-0 inset-x-0 bg-white dark:bg-zinc-900 rounded-t-2xl p-5 animate-slide-up outline-none"
        >
          <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
          <h2 id="add-to-circle-title" className="font-bold text-lg mb-1 text-zinc-900 dark:text-zinc-100">
            افزودن به حلقه‌ی من
          </h2>
          <p className="text-xs text-zinc-400 mb-4">
            {person.name} از مسیر اعتماد به شما وصل است — سطح اعتماد را مشخص کن.
          </p>

          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <Avatar name={person.name} level={person.level} size="md" />
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{person.name}</p>
              {person.city && (
                <p className="text-xs text-zinc-500">📍 {person.city}</p>
              )}
            </div>
          </div>

          <label className="block text-sm font-medium mb-2 text-zinc-800 dark:text-zinc-200">
            نوع رابطه
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
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                }`}
              >
                {relationEmoji[r]} {relationLabels[r]}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium mb-2 text-zinc-800 dark:text-zinc-200">
            سطح اعتماد
          </label>
          <div className="flex gap-2 mb-4">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevel(lvl)}
                className={`flex-1 rounded-xl py-2.5 text-xs font-medium border ${
                  level === lvl
                    ? `${levelChip[lvl]} border-current`
                    : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-700"
                }`}
              >
                {levelLabels[lvl]}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">
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
              افزودن به حلقه
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
