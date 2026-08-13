"use client";

import { useMemo, useRef, useState } from "react";
import { useSheetA11y } from "@/lib/use-sheet-a11y";
import { useStore } from "@/lib/store";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import SheetShell from "@/components/SheetShell";
import { CardListSkeleton } from "@/components/Skeleton";
import Avatar from "@/components/Avatar";
import { GraphIcon, UserPlusIcon } from "@/components/Icons";
import { levelChip, levelShort, relationLabels } from "@/lib/labels";
import { viewerRelationPhrase } from "@/lib/trust";
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

const LEVEL_HINT: Record<TrustLevel, string> = {
  A: "افرادی که ارتباط خیلی نزدیکی با آن‌ها دارید.",
  B: "افرادی که می‌شناسید و به آن‌ها اطمینان دارید.",
  C: "افرادی که ارتباط محدودتری با آن‌ها دارید.",
};

/** Section title — slightly longer than the row chip for group B. */
const SECTION_LABEL: Record<TrustLevel, string> = {
  A: "نزدیکان",
  B: "افراد مورد اعتماد",
  C: "آشنایان",
};

const RELATION_ROOTS = [
  "خواهر",
  "برادر",
  "همسر",
  "همکار",
  "همسایه",
  "دوست",
  "آشنا",
] as const;

/** One short human line: merge relation + note without repeating the same idea. */
function circleRelationLine(person: Person): string {
  const phrase = viewerRelationPhrase(person);
  const note = person.note?.trim();
  if (!note) return phrase;

  const root = RELATION_ROOTS.find((r) => phrase.includes(r) && note.includes(r));
  if (!root) return phrase;

  const rest = note
    .replace(new RegExp(`^${root}[ه‌یيِ]?\\s*`), "")
    .replace(/^م$/, "")
    .trim();
  if (!rest) return phrase;

  const core = phrase.replace(/\s*شما\s*$/, "").trim();
  if (/^(در|از)\s/.test(rest)) return `${core} شما ${rest}`;

  const parts = rest.split(/\s+/);
  const afterFirst = parts.slice(1).join(" ");
  if (parts.length >= 2 && /^(از|در)\s/.test(afterFirst)) {
    return `${core} ${parts[0]} شما ${afterFirst}`;
  }
  if (parts.length === 1) return `${core} شما در ${rest}`;
  return `${core} ${rest}`.replace(/\s+/g, " ");
}

export default function CircleClassic() {
  const { people, addPerson, setLevel, hydrated } = useStore();
  const { show } = useToast();
  const mine = people.filter((p) => p.inMyCircle);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);

  const grouped = useMemo(() => {
    return LEVELS.map((lvl) => ({
      level: lvl,
      members: mine.filter((p) => p.level === lvl),
    })).filter((g) => g.members.length > 0);
  }, [mine]);

  return (
    <main className="pb-28 min-h-[100dvh]">
      <Header
        title="حلقه‌ی من"
        subtitle={
          mine.length === 0
            ? "هنوز کسی اضافه نشده"
            : `${toPersianDigits(mine.length)} نفر که مستقیماً می‌شناسید`
        }
        action={
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1 h-8 rounded-xl bg-brand-600 text-white px-2.5 text-[11px] font-bold active:scale-95 transition-transform duration-150"
          >
            <UserPlusIcon className="w-4 h-4" />
            افزودن فرد
          </button>
        }
      />

      {mine.length === 0 ? (
        <div className="px-4 pt-10 listing-detail-rise">
          <div className="card p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center mx-auto mb-3">
              <UserPlusIcon className="w-7 h-7" />
            </div>
            <p className="font-bold text-ink dark:text-zinc-100">
              حلقه‌ات هنوز خالیه
            </p>
            <p className="text-sm text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed">
              خانواده و دوستان را اضافه کن تا آگهی‌ها و رویدادهایشان اینجا دیده
              شود.
            </p>
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="btn-primary inline-block mt-4"
            >
              افزودن اولین نفر
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 pt-3 space-y-3 listing-detail-rise">
          {!hydrated ? (
            <CardListSkeleton count={5} />
          ) : (
            <div className="card overflow-hidden">
              {grouped.map(({ level, members }, i) => (
                <section
                  key={level}
                  className={i > 0 ? "border-t border-stone-100 dark:border-zinc-800" : ""}
                >
                  <h2 className="px-3.5 pt-2.5 pb-1 text-[13px] font-bold text-ink dark:text-zinc-100 nums">
                    {SECTION_LABEL[level]}
                    <span className="text-ink-muted font-semibold">
                      {" · "}
                      {toPersianDigits(members.length)}
                    </span>
                  </h2>
                  <ul className="divide-y divide-stone-100 dark:divide-zinc-800">
                    {members.map((p) => (
                      <CircleMemberRow
                        key={p.id}
                        person={p}
                        onEditGroup={() => setEditing(p)}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <Link
            href="/graph"
            className="flex items-center gap-3 rounded-xl bg-brand-50/70 dark:bg-brand-500/10 px-3 py-2.5 active:opacity-80 transition-opacity"
          >
            <span className="w-8 h-8 rounded-lg bg-[color:var(--circle-surface)] dark:bg-zinc-900 text-brand-600 flex items-center justify-center shrink-0 ring-1 ring-brand-100 dark:ring-brand-500/20">
              <GraphIcon className="w-4 h-4" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-bold text-ink dark:text-zinc-100">
                دیدن نقشه ارتباط‌ها
              </span>
              <span className="block text-[11px] text-ink-muted mt-0.5 truncate">
                ببینید هر فرد چگونه به شما وصل است
              </span>
            </span>
            <span className="text-[12px] font-bold text-brand-600 dark:text-brand-400 shrink-0">
              ‹
            </span>
          </Link>
        </div>
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

      {editing && (
        <GroupSheet
          person={editing}
          onClose={() => setEditing(null)}
          onPick={(lvl) => {
            const prev = editing.level;
            const name = editing.name;
            setEditing(null);
            if (lvl === prev) return;
            setLevel(editing.id, lvl);
            show(`${name} به «${SECTION_LABEL[lvl]}» منتقل شد.`, {
              action: {
                label: "بازگرداندن",
                onClick: () => setLevel(editing.id, prev),
              },
            });
          }}
        />
      )}

      <BottomNav />
    </main>
  );
}

function CircleMemberRow({
  person,
  onEditGroup,
}: {
  person: Person;
  onEditGroup: () => void;
}) {
  return (
    <li className="flex items-center gap-2.5 px-3.5 py-2">
      <Link
        href={`/person/${person.id}`}
        className="flex items-center gap-2.5 min-w-0 flex-1 active:opacity-90 transition-opacity"
      >
        <Avatar name={person.name} src={person.avatar} size="sm" showLevel={false} />
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-[13px] text-ink dark:text-zinc-100 truncate leading-snug">
            {person.name}
          </span>
          <span className="block text-[11px] text-ink-muted mt-px truncate leading-snug">
            {circleRelationLine(person)}
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={onEditGroup}
        className={`shrink-0 chip !py-0.5 !px-1.5 !text-[10px] font-bold ${levelChip[person.level]}`}
        aria-label={`گروه ${person.name}: ${levelShort[person.level]}`}
      >
        {levelShort[person.level]} ▾
      </button>
    </li>
  );
}

function GroupSheet({
  person,
  onClose,
  onPick,
}: {
  person: Person;
  onClose: () => void;
  onPick: (level: TrustLevel) => void;
}) {
  return (
    <SheetShell onClose={onClose} labelledBy="group-sheet-title" zClass="z-50">
      <div className="pb-3">
        <h2
          id="group-sheet-title"
          className="font-extrabold text-[1.1rem] text-ink dark:text-zinc-50"
        >
          {person.name} در کدام گروه باشد؟
        </h2>
        <p className="text-[12px] text-ink-muted mt-1 mb-3">
          این انتخاب فقط برای خود شما نمایش داده می‌شود.
        </p>
        <div className="space-y-2">
          {LEVELS.map((lvl) => {
            const active = person.level === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => onPick(lvl)}
                className={`w-full text-right rounded-xl border px-3.5 py-3 transition-colors ${
                  active
                    ? `${levelChip[lvl]} border-current`
                    : "border-stone-200/80 dark:border-zinc-700 bg-[color:var(--circle-surface)] dark:bg-zinc-900"
                }`}
              >
                <span className="block text-[14px] font-bold text-ink dark:text-zinc-100">
                  {SECTION_LABEL[lvl]}
                </span>
                <span className="block text-[12px] text-ink-muted mt-0.5 leading-relaxed">
                  {LEVEL_HINT[lvl]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </SheetShell>
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
            افزودن فرد
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
            این فرد را چطور می‌شناسید؟
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
            در کدام گروه باشد؟
          </label>
          <div className="flex flex-col gap-2 mb-4">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevel(lvl)}
                className={`rounded-xl py-2.5 px-3 text-sm font-medium border text-right ${
                  level === lvl
                    ? `${levelChip[lvl]} border-current`
                    : "bg-[color:var(--circle-surface)] text-ink-muted border-stone-200 dark:border-zinc-700"
                }`}
              >
                {SECTION_LABEL[lvl]}
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
