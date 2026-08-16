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
    hint: "تصویر یا متن خلاف عرف حلقه",
  },
  {
    key: "misleading",
    label: "گمراه‌کننده",
    hint: "توضیح یا قیمت با واقعیت جور نیست",
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

export default function ReportListingSheet({
  listingId,
  listingTitle,
  onClose,
}: {
  listingId: string;
  listingTitle: string;
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
      }>(`/api/listings/${encodeURIComponent(listingId)}/report`, {
        method: "POST",
        body: JSON.stringify({
          reason,
          note: note.trim() || undefined,
        }),
      });
      show(
        res.alreadyReported
          ? "قبلاً این آگهی را گزارش کرده‌ای"
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
            <p className="text-[11px] text-center text-ink-faint leading-snug">
              یک دلیل انتخاب کن، بعد بفرست
            </p>
          ) : noteRequired && !note.trim() ? (
            <p className="text-[11px] text-center text-amber-700/90 dark:text-amber-300/90 leading-snug">
              برای این گزینه توضیح کوتاه لازم است
            </p>
          ) : (
            <p className="text-[11px] text-center text-ink-faint leading-snug">
              فروشنده از هویت گزارش‌دهنده باخبر نمی‌شود
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
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0 ring-1 ring-amber-200/70 dark:ring-amber-500/25">
            <FlagIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2
              id={titleId}
              className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50 leading-tight"
            >
              گزارش آگهی
            </h2>
            <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed">
              فقط تیم سیرکل می‌بیند — برای امن‌تر شدن حلقه.
            </p>
          </div>
        </div>

        <div className="mt-3.5 rounded-xl bg-stone-100/80 dark:bg-zinc-800/70 px-3 py-2.5 ring-1 ring-stone-200/60 dark:ring-zinc-700/80">
          <p className="text-[10px] font-bold text-ink-faint tracking-wide mb-0.5">
            آگهی
          </p>
          <p className="text-[13px] font-bold text-ink dark:text-zinc-100 leading-snug line-clamp-2">
            {listingTitle}
          </p>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl bg-[color:var(--circle-trust)]/8 dark:bg-[color:var(--circle-trust)]/12 px-3 py-2.5">
          <ShieldCheckIcon className="w-4 h-4 text-[color:var(--circle-trust)] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[color:var(--circle-trust)] leading-relaxed text-right">
            گزارش محرمانه است. فروشنده نمی‌فهمد چه کسی گزارش کرده.
          </p>
        </div>

        <p className="mt-4 mb-2 text-[12px] font-bold text-ink dark:text-zinc-200">
          دلیل گزارش چیست؟
        </p>

        <div
          className="space-y-2"
          role="radiogroup"
          aria-label="دلیل گزارش"
        >
          {REASONS.map((r) => {
            const active = reason === r.key;
            return (
              <button
                key={r.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setReason(r.key)}
                className={`w-full flex items-start gap-3 text-right rounded-2xl border px-3.5 py-3 transition-[border-color,background-color,box-shadow,transform] duration-150 ease-out active:scale-[0.985] ${
                  active
                    ? "border-brand-600 bg-brand-50/90 dark:bg-brand-500/15 dark:border-brand-400 shadow-sm shadow-brand-600/10"
                    : "border-stone-200/90 dark:border-zinc-700 bg-[color:var(--circle-surface)] dark:bg-zinc-900/80 hover:border-stone-300 dark:hover:border-zinc-600"
                }`}
              >
                <span
                  className={`mt-0.5 w-[1.125rem] h-[1.125rem] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-150 ${
                    active
                      ? "border-brand-600 dark:border-brand-400"
                      : "border-stone-300 dark:border-zinc-600"
                  }`}
                  aria-hidden
                >
                  <span
                    className={`w-2 h-2 rounded-full bg-brand-600 dark:bg-brand-400 transition-transform duration-150 ease-out ${
                      active ? "scale-100" : "scale-0"
                    }`}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-ink dark:text-zinc-100">
                    {r.label}
                  </span>
                  <span className="block text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-snug">
                    {r.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <label className="block mt-4">
          <span className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[12px] font-bold text-ink dark:text-zinc-200">
              {noteRequired ? "توضیح (لازم)" : "توضیح بیشتر"}
              {!noteRequired && (
                <span className="font-medium text-ink-faint"> · اختیاری</span>
              )}
            </span>
            <span className="text-[10px] text-ink-faint nums tabular-nums">
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
            className={`field !py-2.5 text-sm resize-none transition-[box-shadow,border-color] duration-150 ${
              noteRequired
                ? "ring-1 ring-amber-300/80 dark:ring-amber-500/40 focus:ring-amber-400"
                : ""
            }`}
          />
        </label>
      </div>
    </SheetShell>
  );
}
