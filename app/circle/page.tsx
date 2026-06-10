"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import { GraphIcon, PlusIcon } from "@/components/Icons";
import {
  levelLabels,
  relationEmoji,
  relationLabels,
  levelChip,
} from "@/lib/labels";
import type { RelationType, TrustLevel } from "@/lib/types";
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

export default function CirclePage() {
  const { people, addPerson, removePerson, setLevel } = useStore();
  const { show } = useToast();
  const mine = people.filter((p) => p.inMyCircle);
  const [showAdd, setShowAdd] = useState(false);

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
        subtitle={`${toPersianDigits(mine.length)} نفر مورد اعتماد`}
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center active:bg-brand-700"
            aria-label="افزودن فرد"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        }
      />

      {/* Trust graph entry */}
      <div className="px-4 pt-3">
        <Link
          href="/graph"
          className="flex items-center gap-3 rounded-2xl bg-gradient-to-l from-brand-700 to-brand-500 text-white p-4 active:scale-[0.99] transition-transform"
        >
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <GraphIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">نقشه‌ی گرافیکی حلقه‌ات را ببین</p>
            <p className="text-[11px] text-brand-50">
              تو در مرکز، شاخه‌ها تا فروشنده‌ها — اعتماد قابل مشاهده
            </p>
          </div>
          <span className="text-white/70 text-lg">‹</span>
        </Link>
      </div>

      {/* Level legend */}
      <div className="px-4 pt-3">
        <div className="card p-3 flex items-center justify-around text-center">
          {LEVELS.map((lvl) => (
            <div key={lvl} className="flex-1">
              <div className={`chip ${levelChip[lvl]} mx-auto`}>سطح {lvl}</div>
              <p className="text-lg font-bold mt-1 nums">
                {toPersianDigits(mine.filter((p) => p.level === lvl).length)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed px-1">
          سطح اعتماد تعیین می‌کند چه کسانی آگهی‌های شما را می‌بینند. سطح A
          نزدیک‌ترین و مورد اعتمادترین افراد شما هستند.
        </p>
      </div>

      {/* Groups */}
      <div className="px-4 pt-3 space-y-5">
        {grouped.map(({ level, members }) => (
          <section key={level}>
            <h2 className="text-sm font-bold text-zinc-700 mb-2">
              {levelLabels[level]}
              <span className="text-zinc-400 font-normal">
                {" "}
                ({toPersianDigits(members.length)})
              </span>
            </h2>
            {members.length === 0 ? (
              <p className="text-xs text-zinc-400 pr-1">کسی در این سطح نیست.</p>
            ) : (
              <div className="space-y-2">
                {members.map((p) => (
                  <div key={p.id} className="card p-3 flex items-center gap-3">
                    <Avatar emoji={p.avatar} level={p.level} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-zinc-900">{p.name}</span>
                        <span className="chip bg-zinc-100 text-zinc-500">
                          {relationEmoji[p.relation]} {relationLabels[p.relation]}
                        </span>
                      </div>
                      {p.note && (
                        <p className="text-xs text-zinc-400 mt-0.5 truncate">{p.note}</p>
                      )}
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        <span className="nums">{toPersianDigits(p.deals)}</span> معامله‌ی موفق
                      </p>
                    </div>
                    {/* Level switcher */}
                    <div className="flex flex-col gap-1">
                      {LEVELS.map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setLevel(p.id, lvl)}
                          aria-label={`انتقال ${p.name} به سطح ${lvl}`}
                          aria-pressed={p.level === lvl}
                          className={`w-6 h-6 rounded-md text-[11px] font-bold transition-colors ${
                            p.level === lvl
                              ? `${levelChip[lvl]} ring-1 ring-current`
                              : "bg-zinc-50 text-zinc-300"
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

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

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="app-shell !min-h-0 !shadow-none relative">
        <div className="bg-white rounded-t-2xl p-5 animate-slide-up">
          <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-4" />
          <h2 className="font-bold text-lg mb-4">افزودن به حلقه‌ی من</h2>

          <label className="block text-sm font-medium mb-1">نام</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً: مریم"
            className="field mb-4"
          />

          <label className="block text-sm font-medium mb-1">نوع رابطه</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {RELATIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRelation(r)}
                className={`chip !px-3 !py-1.5 border ${
                  relation === r
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-zinc-600 border-zinc-200"
                }`}
              >
                {relationEmoji[r]} {relationLabels[r]}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium mb-1">سطح اعتماد</label>
          <div className="flex gap-2 mb-4">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevel(lvl)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium border ${
                  level === lvl
                    ? `${levelChip[lvl]} border-current`
                    : "bg-white text-zinc-500 border-zinc-200"
                }`}
              >
                {levelLabels[lvl]}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium mb-1">یادداشت (اختیاری)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثلاً: دوست دوران دانشگاه"
            className="field mb-5"
          />

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost flex-1">
              انصراف
            </button>
            <button
              disabled={!name.trim()}
              onClick={() =>
                onAdd({ name: name.trim(), relation, level, note: note.trim() || undefined })
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
