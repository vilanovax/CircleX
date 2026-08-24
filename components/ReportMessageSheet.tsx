"use client";

import { useEffect, useId, useRef, useState } from "react";
import SheetShell from "@/components/SheetShell";
import { FlagIcon, ShieldCheckIcon } from "@/components/Icons";
import { api, ApiError } from "@/lib/api";
import { toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";

const REASONS: { key: string; label: string; hint: string }[] = [
  {
    key: "inappropriate",
    label: "محتوای نامناسب",
    hint: "توهین، تهدید، یا متن خلاف عرف حلقه",
  },
  {
    key: "misleading",
    label: "گمراه‌کننده",
    hint: "وعده یا اطلاعات نادرست در گفتگو",
  },
  {
    key: "spam",
    label: "اسپم یا تبلیغ بی‌ربط",
    hint: "تکراری، تبلیغاتی، یا خارج از موضوع",
  },
  {
    key: "other",
    label: "دلیل دیگر",
    hint: "در کادر پایین بنویس",
  },
];

const NOTE_MAX = 500;

export default function ReportMessageSheet({
  messageId,
  preview,
  onClose,
}: {
  messageId: string;
  preview: string;
  onClose: () => void;
}) {
  const { show } = useToast();
  const titleId = useId();
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const noteRequired = reason === "other";
  const canSubmit =
    Boolean(reason) && (!noteRequired || note.trim().length > 0) && !sending;

  useEffect(() => {
    if (reason !== "other") return;
    const t = window.setTimeout(() => noteRef.current?.focus(), 180);
    return () => window.clearTimeout(t);
  }, [reason]);

  async function submit() {
    if (!canSubmit || !reason) return;
    if (noteRequired && !note.trim()) {
      show("برای «دلیل دیگر» یک توضیح کوتاه بنویس");
      noteRef.current?.focus();
      return;
    }
    setSending(true);
    try {
      const res = await api<{
        ok: boolean;
        alreadyReported?: boolean;
      }>(`/api/messages/${encodeURIComponent(messageId)}/report`, {
        method: "POST",
        body: JSON.stringify({
          reason,
          note: note.trim() || undefined,
        }),
      });
      show(
        res.alreadyReported
          ? "قبلاً این پیام را گزارش کرده‌ای"
          : "گزارش برای بررسی تیم سیرکل ارسال شد ✓",
      );
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "ارسال گزارش انجام نشد";
      show(msg);
    } finally {
      setSending(false);
    }
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy={titleId}
      maxHeight="90dvh"
      zClass="z-50"
      footer={
        <div className="space-y-2 pb-0.5">
          {!reason ? (
            <p className="text-center text-[11px] leading-snug text-ink-faint">
              یک دلیل انتخاب کن، بعد بفرست
            </p>
          ) : noteRequired && !note.trim() ? (
            <p className="text-center text-[11px] leading-snug text-amber-700/90 dark:text-amber-300/90">
              برای این گزینه توضیح کوتاه لازم است
            </p>
          ) : (
            <p className="text-center text-[11px] leading-snug text-ink-faint">
              طرف مقابل از هویت گزارش‌دهنده باخبر نمی‌شود
            </p>
          )}
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void submit()}
            className="btn-primary w-full !py-3.5 shadow-md shadow-brand-600/15 disabled:opacity-40 disabled:shadow-none active:scale-[0.98] transition-transform duration-150"
          >
            {sending ? "در حال ارسال…" : "ارسال گزارش"}
          </button>
        </div>
      }
    >
      <div className="pb-1">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-800 ring-1 ring-amber-200/70 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/25">
            <FlagIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2
              id={titleId}
              className="text-[20px] font-semibold leading-tight text-ink dark:text-zinc-50"
            >
              گزارش پیام
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted dark:text-zinc-400">
              فقط تیم سیرکل این متن را می‌بیند — نه کل گفتگو.
            </p>
          </div>
        </div>

        <div className="mt-3.5 rounded-xl bg-stone-100/80 px-3 py-2.5 ring-1 ring-stone-200/60 dark:bg-zinc-800/70 dark:ring-zinc-700/80">
          <p className="mb-0.5 text-[11px] font-medium tracking-wide text-ink-faint">
            پیام
          </p>
          <p className="line-clamp-3 whitespace-pre-wrap text-[13px] font-semibold leading-snug text-ink dark:text-zinc-100">
            {preview.trim() || "—"}
          </p>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl bg-[color:var(--circle-trust)]/8 px-3 py-2.5 dark:bg-[color:var(--circle-trust)]/12">
          <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--circle-trust)]" />
          <p className="text-right text-[11px] leading-relaxed text-[color:var(--circle-trust)]">
            گزارش محرمانه است. فرستنده نمی‌فهمد چه کسی گزارش کرده.
          </p>
        </div>

        <p className="mb-2 mt-4 text-[12.5px] font-medium text-ink dark:text-zinc-200">
          دلیل گزارش چیست؟
        </p>

        <div className="space-y-2" role="radiogroup" aria-label="دلیل گزارش">
          {REASONS.map((r) => {
            const active = reason === r.key;
            return (
              <button
                key={r.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setReason(r.key)}
                className={`flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-right transition-[border-color,background-color,box-shadow,transform] duration-150 ease-out active:scale-[0.985] ${
                  active
                    ? "border-brand-600 bg-brand-50/90 shadow-sm shadow-brand-600/10 dark:border-brand-400 dark:bg-brand-500/15"
                    : "border-stone-200/90 bg-[color:var(--circle-surface)] hover:border-stone-300 dark:border-zinc-700 dark:bg-zinc-900/80 dark:hover:border-zinc-600"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 ${
                    active
                      ? "border-brand-600 dark:border-brand-400"
                      : "border-stone-300 dark:border-zinc-600"
                  }`}
                  aria-hidden
                >
                  <span
                    className={`h-2 w-2 rounded-full bg-brand-600 transition-transform duration-150 ease-out dark:bg-brand-400 ${
                      active ? "scale-100" : "scale-0"
                    }`}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-ink dark:text-zinc-100">
                    {r.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-ink-muted dark:text-zinc-400">
                    {r.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <label className="mt-4 block">
          <span className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-[12.5px] font-medium text-ink dark:text-zinc-200">
              {noteRequired ? "توضیح (لازم)" : "توضیح بیشتر"}
              {!noteRequired && (
                <span className="font-medium text-ink-faint"> · اختیاری</span>
              )}
            </span>
            <span className="text-[11px] tabular-nums text-ink-faint nums">
              {toPersianDigits(note.length)}/{toPersianDigits(NOTE_MAX)}
            </span>
          </span>
          <textarea
            ref={noteRef}
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
            rows={3}
            placeholder={
              noteRequired
                ? "کوتاه بنویس چه چیزی مشکل‌ساز است…"
                : "اگر لازم است جزئیات بگو…"
            }
            className={`field !py-2.5 resize-none text-[14px] transition-[box-shadow,border-color] duration-150 ${
              noteRequired
                ? "ring-1 ring-amber-300/80 focus:ring-amber-400 dark:ring-amber-500/40"
                : ""
            }`}
          />
        </label>
      </div>
    </SheetShell>
  );
}
