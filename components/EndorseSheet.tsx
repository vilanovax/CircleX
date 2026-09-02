"use client";

import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import SheetShell from "@/components/SheetShell";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { ApiError } from "@/lib/api";
import {
  EyeIcon,
  ShieldCheckIcon,
  SwapIcon,
  UserIcon,
} from "@/components/Icons";
import {
  badgeHints,
  badgeLabels,
  ENDORSE_NOTE_MAX,
  formatEndorsementPreview,
  ITEM_BADGES,
  PERSON_BADGES,
} from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";
import type { BadgeType, Endorsement } from "@/lib/types";

const OPTION_ICON: Partial<
  Record<BadgeType, ComponentType<{ className?: string }>>
> = {
  verify_item: EyeIcon,
  verify_quality: ShieldCheckIcon,
  know_seller: UserIcon,
  dealt_before: SwapIcon,
};

export default function EndorseSheet({
  listingId,
  listingTitle,
  sellerName,
  myEndorsements,
  broadcastsToCircle = false,
  onClose,
}: {
  listingId: string;
  listingTitle: string;
  sellerName: string;
  myEndorsements: Endorsement[];
  broadcastsToCircle?: boolean;
  onClose: () => void;
}) {
  const me = useStore((s) => s.me);
  const save = useStore((s) => s.setMyListingEndorsement);
  const { show } = useToast();
  const [types, setTypes] = useState<BadgeType[]>(() =>
    myEndorsements.map((e) => e.type).filter((t) => t !== "word"),
  );
  const [note, setNote] = useState(
    () => myEndorsements.find((e) => e.note?.trim())?.note ?? "",
  );
  const [saving, setSaving] = useState(false);

  const preview = useMemo(
    () =>
      formatEndorsementPreview(types, {
        meName: me.name,
        sellerName,
        listingTitle,
        note,
      }),
    [types, me.name, sellerName, listingTitle, note],
  );

  const canSave = types.length > 0 || Boolean(note.trim());
  const hadAny = myEndorsements.length > 0;
  const clearing = hadAny && !canSave;

  function toggle(type: BadgeType) {
    setTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  async function submit() {
    if ((!canSave && !hadAny) || saving) return;
    setSaving(true);
    try {
      await save(listingId, types, note);
      if (clearing) show("حرفت از آگهی برداشته شد");
      else if (canSave) show("حرفت روی آگهی نشست");
      onClose();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ثبت نشد. دوباره بزن.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="endorse-sheet-title"
      zClass="z-50"
      maxHeight="88dvh"
      footer={
        <div>
          {preview ? (
            <p className="text-[11px] text-ink-muted dark:text-zinc-400 leading-snug mb-2.5 line-clamp-2">
              <span className="font-bold text-brand-700 dark:text-brand-300">
                روی آگهی:{" "}
              </span>
              {preview}
            </p>
          ) : (
            <p className="text-[11px] text-ink-faint leading-snug mb-2.5">
              یکی را تیک بزن، یا یک جمله بنویس.
            </p>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={saving || (!canSave && !hadAny)}
            className={`w-full !py-3.5 shadow-md active:scale-[0.98] transition-transform duration-150 disabled:opacity-40 disabled:shadow-none disabled:active:scale-100 ${
              clearing
                ? "btn-ghost !bg-red-50 !text-red-600 dark:!bg-red-500/10 dark:!text-red-400"
                : "btn-primary shadow-brand-600/20"
            }`}
          >
            {saving ? "در حال ثبت…" : clearing ? "برداشتن حرف" : "ثبت حرف"}
          </button>
        </div>
      }
    >
      <h2
        id="endorse-sheet-title"
        className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50 tracking-tight"
      >
        بگو چی می‌دانی
      </h2>
      <p className="text-[12px] text-ink-muted mt-1 leading-snug">
        {broadcastsToCircle
          ? "اسمت زیر آگهی می‌آید. حلقه‌ات هم این آگهی را می‌بیند."
          : `اسمت زیر آگهی می‌آید. فقط آشنایان ${sellerName} می‌بینند.`}
      </p>

      <p className="mt-3.5 mb-1 text-[11px] font-extrabold text-ink-muted dark:text-zinc-400">
        کالا
      </p>
      <OptionGroup>
        {ITEM_BADGES.map((type, i) => (
          <EndorseOption
            key={type}
            type={type}
            active={types.includes(type)}
            onToggle={() => toggle(type)}
            divider={i < ITEM_BADGES.length - 1}
          />
        ))}
      </OptionGroup>

      <p className="mt-3 mb-1 text-[11px] font-extrabold text-ink-muted dark:text-zinc-400">
        {sellerName}
      </p>
      <OptionGroup>
        {PERSON_BADGES.map((type, i) => (
          <EndorseOption
            key={type}
            type={type}
            active={types.includes(type)}
            onToggle={() => toggle(type)}
            divider={i < PERSON_BADGES.length - 1}
            strong={type === "dealt_before"}
          />
        ))}
      </OptionGroup>

      <label className="block mt-3">
        <span className="block text-[11px] font-extrabold text-ink-muted dark:text-zinc-400 mb-1">
          یک جمله از خودت
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, ENDORSE_NOTE_MAX))}
          maxLength={ENDORSE_NOTE_MAX}
          rows={2}
          placeholder="مثلاً پارسال ازش کتاب خریدم، درست بود."
          className="field !py-2.5 !text-[13px] !min-h-[3.75rem] resize-none leading-relaxed"
        />
        <span className="mt-1 flex justify-between gap-2 text-[11px] text-ink-faint nums">
          <span>اختیاری</span>
          <span>
            {toPersianDigits(note.length)} / {toPersianDigits(ENDORSE_NOTE_MAX)}
          </span>
        </span>
      </label>
    </SheetShell>
  );
}

function OptionGroup({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-200/80 dark:border-zinc-800 overflow-hidden bg-stone-50/50 dark:bg-zinc-800/25">
      {children}
    </div>
  );
}

function EndorseOption({
  type,
  active,
  onToggle,
  divider,
  strong = false,
}: {
  type: BadgeType;
  active: boolean;
  onToggle: () => void;
  divider: boolean;
  strong?: boolean;
}) {
  const Icon = OPTION_ICON[type];
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-right transition-colors duration-150 active:scale-[0.99] ${
        divider ? "border-b border-stone-200/70 dark:border-zinc-700/80" : ""
      } ${
        active
          ? "bg-[color:var(--circle-trust)]/8 dark:bg-[color:var(--circle-trust)]/12"
          : "active:bg-stone-100/80 dark:active:bg-zinc-800/80"
      }`}
    >
      <span
        className={`mt-0.5 w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-[background-color,border-color,transform] duration-150 ${
          active
            ? "bg-[color:var(--circle-trust)] border-[color:var(--circle-trust)] text-white scale-100"
            : "border-stone-300 dark:border-zinc-500 bg-white dark:bg-zinc-900"
        }`}
      >
        {active ? (
          <svg
            viewBox="0 0 16 16"
            className="w-3 h-3"
            fill="none"
            aria-hidden
          >
            <path
              d="M3.5 8.2 6.4 11l6.1-6.5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      {Icon ? (
        <Icon
          className={`mt-0.5 w-4 h-4 shrink-0 ${
            active
              ? "text-[color:var(--circle-trust)]"
              : "text-ink-faint dark:text-zinc-500"
          }`}
        />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="text-[13px] font-extrabold text-ink dark:text-zinc-50 truncate">
            {badgeLabels[type]}
          </span>
          {strong ? (
            <span className="shrink-0 rounded-full bg-levelA/12 text-levelA px-1.5 py-[1px] text-[11px] font-extrabold leading-4">
              قوی‌تر
            </span>
          ) : null}
        </span>
        <span className="block text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-snug">
          {type !== "word" ? badgeHints[type] : ""}
        </span>
      </span>
    </button>
  );
}
