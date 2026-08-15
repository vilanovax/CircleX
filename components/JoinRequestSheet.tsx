"use client";

import { useState } from "react";
import SheetShell from "@/components/SheetShell";
import Avatar from "@/components/Avatar";
import { GROUP_PRIVATE_LINE } from "@/lib/invite";
import { levelLabels, relationLabels } from "@/lib/labels";
import type { CircleJoinRequest, RelationType, TrustLevel } from "@/lib/types";

const RELATIONS: RelationType[] = [
  "family",
  "friend",
  "colleague",
  "neighbor",
  "acquaintance",
];

const LEVELS: TrustLevel[] = ["A", "B", "C"];

export default function JoinRequestSheet({
  request,
  onClose,
  onAccept,
  onReject,
}: {
  request: CircleJoinRequest;
  onClose: () => void;
  onAccept: (input: {
    relation: RelationType;
    level: TrustLevel;
    displayName: string;
  }) => void | Promise<void>;
  onReject: () => void | Promise<void>;
}) {
  const [relation, setRelation] = useState<RelationType>("friend");
  const [level, setLevel] = useState<TrustLevel>("B");
  const [displayName, setDisplayName] = useState(request.guest.name);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => void | Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="join-request-title"
      zClass="z-50"
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(onReject)}
            className="btn-ghost flex-1 min-h-12"
          >
            رد
          </button>
          <button
            type="button"
            disabled={busy || !displayName.trim()}
            onClick={() =>
              void run(() =>
                onAccept({
                  relation,
                  level,
                  displayName: displayName.trim(),
                }),
              )
            }
            className="btn-primary flex-[1.4] min-h-12"
          >
            {busy ? "…" : "قبول و افزودن"}
          </button>
        </div>
      }
    >
      <div className="flex items-center gap-3 mb-4">
        <Avatar
          name={request.guest.name}
          src={request.guest.avatar}
          size="md"
          showLevel={false}
        />
        <div className="min-w-0">
          <h2
            id="join-request-title"
            className="font-extrabold text-[1.1rem] text-ink dark:text-zinc-50 leading-snug"
          >
            آیا {request.guest.name} را می‌شناسی؟
          </h2>
          <p className="text-[12px] text-ink-muted mt-0.5 leading-relaxed">
            با لینک دعوت آمده. تا قبول نکنی وارد حلقه نمی‌شود.
          </p>
        </div>
      </div>

      <label className="block mb-4">
        <span className="block text-[12px] font-semibold text-ink-muted mb-1.5">
          نام در حلقهٔ تو
        </span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
          className="w-full rounded-xl border border-stone-200 dark:border-zinc-700 bg-[color:var(--circle-surface)] px-3 py-2.5 text-[14px] text-ink dark:text-zinc-100"
        />
        <span className="block text-[11px] text-ink-faint mt-1 leading-relaxed">
          فقط برای تو نمایش داده می‌شود — اسم پروفایل او عوض نمی‌شود.
        </span>
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
