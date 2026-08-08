"use client";

import { useMemo, useRef, useState } from "react";
import { useSheetA11y } from "@/lib/use-sheet-a11y";
import { useStore } from "@/lib/store";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { CardListSkeleton } from "@/components/Skeleton";
import Avatar from "@/components/Avatar";
import { GraphIcon, PlusIcon } from "@/components/Icons";
import {
  levelChip,
  levelLabels,
  levelShort,
  relationLabels,
} from "@/lib/labels";
import type { Person, RelationType, TrustLevel } from "@/lib/types";
import { toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";

const LEVELS: TrustLevel[] = ["A", "B", "C"];
const RELATIONS: RelationType[] = [
  "family",
  "friend",
  "colleague",
  "neighbor",
  "acquaintance",
];

const LEVEL_ACCENT: Record<TrustLevel, string> = {
  A: "text-levelA",
  B: "text-levelB",
  C: "text-levelC",
};

const LEVEL_DOT: Record<TrustLevel, string> = {
  A: "bg-levelA",
  B: "bg-levelB",
  C: "bg-levelC",
};

export default function CircleClassic() {
  const { people, addPerson, setLevel, hydrated } = useStore();
  const { show } = useToast();
  const mine = people.filter((p) => p.inMyCircle);
  const [showAdd, setShowAdd] = useState(false);

  const counts = useMemo(() => {
    return Object.fromEntries(
      LEVELS.map((lvl) => [lvl, mine.filter((p) => p.level === lvl).length]),
    ) as Record<TrustLevel, number>;
  }, [mine]);

  const grouped = useMemo(() => {
    return LEVELS.map((lvl) => ({
      level: lvl,
      members: mine.filter((p) => p.level === lvl),
    }));
  }, [mine]);

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Header
        title="حلقه‌ی من"
        subtitle={
          mine.length === 0
            ? "هنوز کسی اضافه نشده"
            : `${toPersianDigits(mine.length)} نفر مورد اعتماد`
        }
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm shadow-brand-600/20 active:bg-brand-700"
            aria-label="افزودن فرد"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        }
      />

      {mine.length === 0 ? (
        <div className="px-4 pt-10">
          <div className="card p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center mx-auto mb-3">
              <PlusIcon className="w-7 h-7" />
            </div>
            <p className="font-bold text-ink dark:text-zinc-100">
              حلقه‌ات هنوز خالیه
            </p>
            <p className="text-sm text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed">
              خانواده و دوستان مورد اعتمادت را اضافه کن تا آگهی‌ها و رویدادهایشان
              اینجا دیده شود.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="btn-primary inline-block mt-4"
            >
              افزودن اولین نفر
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Compact trust overview */}
          <div className="px-4 pt-3 space-y-2.5">
            <div className="card px-2 py-2.5 flex items-stretch">
              {LEVELS.map((lvl, i) => (
                <div
                  key={lvl}
                  className={`flex-1 text-center py-1 ${
                    i > 0 ? "border-s border-stone-100 dark:border-zinc-800" : ""
                  }`}
                >
                  <p
                    className={`text-[11px] font-semibold ${LEVEL_ACCENT[lvl]}`}
                  >
                    سطح {lvl}
                  </p>
                  <p className="text-xl font-extrabold text-ink dark:text-zinc-50 nums mt-0.5 leading-none">
                    {toPersianDigits(counts[lvl])}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/graph"
              className="card flex items-center gap-3 px-3.5 py-3 active:scale-[0.99] transition-transform"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center shrink-0">
                <GraphIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px] text-ink dark:text-zinc-100">
                  نقشه‌ی گراف اعتماد
                </p>
                <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 truncate">
                  مسیر اعتماد تا هر فروشنده را ببین
                </p>
              </div>
              <span className="text-ink-faint text-lg leading-none" aria-hidden>
                ‹
              </span>
            </Link>

            <p className="text-[11px] text-ink-faint dark:text-zinc-500 leading-relaxed px-0.5">
              سطح A نزدیک‌ترین‌اند. با دکمه‌های A / B / C سطح هر نفر را عوض کن.
            </p>
          </div>

          {/* Groups */}
          <div className="px-4 pt-4 space-y-5">
            {!hydrated ? (
              <CardListSkeleton count={5} />
            ) : (
              grouped.map(({ level, members }) => (
                <section key={level}>
                  <div className="flex items-center gap-2 mb-2 px-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${LEVEL_DOT[level]}`}
                      aria-hidden
                    />
                    <h2 className="text-[13px] font-bold text-ink dark:text-zinc-200">
                      {levelLabels[level]}
                    </h2>
                    <span className="text-[11px] font-semibold text-ink-faint nums">
                      {toPersianDigits(members.length)}
                    </span>
                  </div>
                  {members.length === 0 ? (
                    <p className="text-xs text-ink-faint pr-1 py-2">
                      کسی در این سطح نیست.
                    </p>
                  ) : (
                    <div className="card divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden">
                      {members.map((p) => (
                        <CircleMemberRow
                          key={p.id}
                          person={p}
                          onSetLevel={(lvl) => {
                            setLevel(p.id, lvl);
                            show(
                              `سطح ${p.name} به ${levelShort[lvl]} تغییر کرد`,
                            );
                          }}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ))
            )}
          </div>
        </>
      )}

      {showAdd && (
        <AddPersonSheet
          onClose={() => setShowAdd(false)}
          onAdd={(input) => {
            addPerson(input);
            setShowAdd(false);
            show(`${input.name} به حلقه‌ی شما اضافه شد ✓`);
          }}
        />
      )}

      <BottomNav />
    </main>
  );
}

function CircleMemberRow({
  person,
  onSetLevel,
}: {
  person: Person;
  onSetLevel: (level: TrustLevel) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      <Link
        href={`/person/${person.id}`}
        className="flex items-center gap-2.5 min-w-0 flex-1 active:opacity-90"
      >
        <Avatar name={person.name} level={person.level} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-[13px] text-ink dark:text-zinc-100 truncate">
              {person.name}
            </span>
            <span className="shrink-0 text-[10px] font-medium text-ink-faint dark:text-zinc-500">
              {relationLabels[person.relation]}
            </span>
          </div>
          <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 truncate">
            {person.note || (
              <>
                <span className="nums">{toPersianDigits(person.deals)}</span>{" "}
                معامله‌ی موفق
              </>
            )}
          </p>
        </div>
      </Link>

      <div
        className="flex p-0.5 rounded-lg bg-stone-100/80 dark:bg-zinc-800 shrink-0"
        role="group"
        aria-label={`سطح اعتماد ${person.name}`}
      >
        {LEVELS.map((lvl) => {
          const active = person.level === lvl;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                if (!active) onSetLevel(lvl);
              }}
              aria-pressed={active}
              aria-label={levelShort[lvl]}
              title={levelLabels[lvl]}
              className={`w-7 h-7 rounded-md text-[11px] font-bold transition-colors ${
                active
                  ? `${levelChip[lvl]} shadow-sm`
                  : "text-ink-faint dark:text-zinc-500"
              }`}
            >
              {lvl}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AddPersonSheet({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (input: {
    name: string;
    relation: RelationType;
    level: TrustLevel;
    note?: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [relation, setRelation] = useState<RelationType>("friend");
  const [level, setLevel] = useState<TrustLevel>("A");
  const [note, setNote] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  useSheetA11y(panelRef, onClose);

  return (
    <div className="fixed inset-0 z-40 flex justify-center">
      <div className="relative w-full max-w-[480px]">
        <div
          className="absolute inset-0 bg-black/30"
          onClick={onClose}
          aria-hidden
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-person-title"
          tabIndex={-1}
          className="absolute bottom-0 inset-x-0 bg-[color:var(--circle-surface)] dark:bg-zinc-900 rounded-t-2xl p-5 animate-slide-up outline-none"
        >
          <div className="w-10 h-1 bg-stone-200 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
          <h2
            id="add-person-title"
            className="font-bold text-lg mb-4 text-ink dark:text-zinc-100"
          >
            افزودن به حلقه‌ی من
          </h2>

          <label className="block text-sm font-medium mb-1 text-ink dark:text-zinc-200">
            نام
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً: مریم"
            className="field mb-4"
          />

          <label className="block text-sm font-medium mb-1 text-ink dark:text-zinc-200">
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
                    : "bg-[color:var(--circle-surface)] text-ink-muted border-stone-200 dark:border-zinc-700"
                }`}
              >
                {relationLabels[r]}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium mb-1 text-ink dark:text-zinc-200">
            سطح اعتماد
          </label>
          <div className="flex gap-2 mb-4">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevel(lvl)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium border ${
                  level === lvl
                    ? `${levelChip[lvl]} border-current`
                    : "bg-[color:var(--circle-surface)] text-ink-faint border-stone-200 dark:border-zinc-700"
                }`}
              >
                سطح {lvl}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium mb-1 text-ink dark:text-zinc-200">
            یادداشت (اختیاری)
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثلاً: دوست دوران دانشگاه"
            className="field mb-5"
          />

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              انصراف
            </button>
            <button
              type="button"
              disabled={!name.trim()}
              onClick={() =>
                onAdd({
                  name: name.trim(),
                  relation,
                  level,
                  note: note.trim() || undefined,
                })
              }
              className="btn-primary flex-1"
            >
              افزودن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
