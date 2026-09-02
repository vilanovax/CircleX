"use client";

import { useId, useState, type ComponentType } from "react";
import SheetShell from "@/components/SheetShell";
import {
  ChatIcon,
  MegaphoneIcon,
  SendIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from "@/components/Icons";
import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";
import {
  FEEDBACK_BODY_MAX,
  FEEDBACK_KIND_HINTS,
  FEEDBACK_KIND_LABELS,
  type FeedbackKind,
} from "@/lib/feedback";
import { toPersianDigits } from "@/lib/persian";

type IconComp = ComponentType<{ className?: string }>;

const KINDS: { key: FeedbackKind; Icon: IconComp }[] = [
  { key: "issue", Icon: WrenchIcon },
  { key: "suggestion", Icon: MegaphoneIcon },
  { key: "contact", Icon: ChatIcon },
];

const MIN_BODY = 8;

export default function FeedbackSheet({ onClose }: { onClose: () => void }) {
  const { show } = useToast();
  const titleId = useId();
  const [kind, setKind] = useState<FeedbackKind>("issue");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const trimmed = text.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_BODY;
  const canSend = trimmed.length >= MIN_BODY && !busy;

  async function submit() {
    if (!canSend) return;
    setBusy(true);
    try {
      const path =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`.slice(0, 200)
          : null;
      await api("/api/feedback", {
        method: "POST",
        body: JSON.stringify({ kind, body: text, path }),
      });
      show("رسید — تیم می‌بیند ✓");
      onClose();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ارسال نشد");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SheetShell
      onClose={() => {
        if (!busy) onClose();
      }}
      labelledBy={titleId}
      hugContent
      zClass="z-[70]"
      closeOnBackdrop={!busy}
      footer={
        <div className="space-y-2 pb-0.5">
          <p
            className={`text-center text-[11px] leading-snug transition-colors duration-150 ${
              tooShort
                ? "text-amber-700/90 dark:text-amber-300/90"
                : "text-ink-faint dark:text-zinc-500"
            }`}
          >
            {tooShort
              ? `حداقل ${toPersianDigits(MIN_BODY)} حرف لازم است`
              : canSend
                ? "پیامت مستقیم به تیم سیرکل می‌رسد"
                : "کوتاه بنویس چه چیزی در ذهنت است"}
          </p>
          <button
            type="button"
            disabled={!canSend}
            onClick={() => void submit()}
            className="btn-primary flex w-full items-center justify-center gap-2 !py-3.5 text-[14px] font-bold shadow-md shadow-brand-600/20 transition-[transform,background-color,color,box-shadow,opacity] duration-150 active:scale-[0.98] disabled:!bg-stone-200 disabled:!text-ink-faint disabled:!opacity-100 disabled:shadow-none dark:disabled:!bg-zinc-800 dark:disabled:!text-zinc-500"
          >
            <SendIcon className="h-4 w-4 -scale-x-100 opacity-90" />
            {busy ? "در حال ارسال…" : "ارسال پیام"}
          </button>
        </div>
      }
    >
      <div className="pb-0.5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm shadow-brand-600/20">
            <ShieldCheckIcon className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0 flex-1 pt-px">
            <h2
              id={titleId}
              className="text-[18px] font-extrabold leading-tight tracking-tight text-ink dark:text-zinc-50"
            >
              پیام به سیرکل
            </h2>
            <p className="mt-1 flex items-start gap-1.5 text-[12px] leading-relaxed text-ink-muted dark:text-zinc-400">
              <ShieldCheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--circle-trust)]" />
              <span>
                مستقیم به تیم — نه اعضای حلقه، نه فروشنده‌ها.
              </span>
            </p>
          </div>
        </div>

        <p className="mb-2 mt-4 text-[12px] font-bold text-ink dark:text-zinc-200">
          موضوع پیام
        </p>

        <div
          className="grid grid-cols-3 gap-1.5"
          role="radiogroup"
          aria-label="نوع پیام"
        >
          {KINDS.map(({ key, Icon }) => {
            const on = kind === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={on}
                aria-describedby={on ? `feedback-kind-hint-${key}` : undefined}
                onClick={() => setKind(key)}
                className={`flex min-h-[4.75rem] flex-col items-center justify-center gap-1.5 rounded-2xl border px-1.5 py-2.5 transition-[border-color,background-color,box-shadow,transform] duration-150 ease-out active:scale-[0.97] ${
                  on
                    ? "border-brand-600 bg-brand-50 shadow-sm shadow-brand-600/10 dark:border-brand-400 dark:bg-brand-500/15"
                    : "border-stone-200/90 bg-[color:var(--circle-surface)] hover:border-stone-300 dark:border-zinc-700 dark:bg-zinc-900/80 dark:hover:border-zinc-600"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-[0.65rem] transition-colors duration-150 ${
                    on
                      ? "bg-brand-600 text-white shadow-sm shadow-brand-600/25"
                      : "bg-stone-100/90 text-ink-muted dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                  aria-hidden
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span
                  className={`text-[12px] leading-none ${
                    on
                      ? "font-bold text-brand-800 dark:text-brand-200"
                      : "font-semibold text-ink-muted dark:text-zinc-300"
                  }`}
                >
                  {FEEDBACK_KIND_LABELS[key]}
                </span>
              </button>
            );
          })}
        </div>

        <p
          id={`feedback-kind-hint-${kind}`}
          key={kind}
          className="mt-2 text-center text-[11px] leading-snug text-ink-faint dark:text-zinc-500"
        >
          {FEEDBACK_KIND_HINTS[kind]}
        </p>

        <label className="mt-3.5 block">
          <span className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-[12px] font-bold text-ink dark:text-zinc-200">
              متن پیام
            </span>
            <span
              className={`nums tabular-nums text-[11px] ${
                text.length > FEEDBACK_BODY_MAX - 40
                  ? "font-semibold text-amber-700 dark:text-amber-300"
                  : "text-ink-faint"
              }`}
            >
              {toPersianDigits(text.length)}/
              {toPersianDigits(FEEDBACK_BODY_MAX)}
            </span>
          </span>
          <textarea
            autoFocus
            value={text}
            maxLength={FEEDBACK_BODY_MAX}
            disabled={busy}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={
              kind === "issue"
                ? "چی خراب شد یا کجا گیر کردی…"
                : kind === "suggestion"
                  ? "ایده‌ات را کوتاه و روشن بنویس…"
                  : "هرچه لازم است بگو…"
            }
            className={`field min-h-[6.5rem] resize-none !py-3 !text-[14px] leading-relaxed transition-[box-shadow,border-color] duration-150 ${
              tooShort
                ? "ring-1 ring-amber-300/80 focus:ring-amber-400 dark:ring-amber-500/40"
                : "focus:ring-1 focus:ring-brand-300/70 dark:focus:ring-brand-500/40"
            }`}
          />
        </label>
      </div>
    </SheetShell>
  );
}
