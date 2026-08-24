"use client";

import { useEffect, useRef, useState } from "react";
import SheetShell from "@/components/SheetShell";
import { NoteIcon } from "@/components/Icons";
import { useToast } from "@/components/Toast";
import { ApiError } from "@/lib/api";
import { LISTING_NOTE_MAX } from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";
import { useStore } from "@/lib/store";

export default function ListingNoteSheet({
  listingId,
  onClose,
}: {
  listingId: string;
  onClose: () => void;
}) {
  const savedBody = useStore((s) => s.listingNotes[listingId] ?? "");
  const isSaved = useStore((s) => s.saved.includes(listingId));
  const persist = useStore((s) => s.setListingNote);
  const { show } = useToast();
  const [draft, setDraft] = useState(savedBody);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const savedRef = useRef(savedBody);
  savedRef.current = savedBody;

  async function flush(next = draftRef.current) {
    const trimmed = next.trim();
    if (trimmed === savedRef.current.trim()) {
      setStatus("idle");
      return;
    }
    setStatus("saving");
    try {
      await persist(listingId, trimmed);
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      show(err instanceof ApiError ? err.message : "یادداشت ذخیره نشد");
    }
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      const pending = draftRef.current.trim();
      if (pending !== savedRef.current.trim()) {
        void persist(listingId, pending).catch(() => {});
      }
    };
  }, [listingId, persist]);

  function schedule(value: string) {
    setDraft(value);
    setStatus("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void flush(value);
    }, 700);
  }

  async function remove() {
    if (timer.current) clearTimeout(timer.current);
    setDraft("");
    draftRef.current = "";
    try {
      await persist(listingId, "");
      onClose();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "پاک نشد");
    }
  }

  const hadNote = Boolean(savedBody.trim());
  const statusLabel =
    status === "saving"
      ? "در حال ذخیره…"
      : status === "saved"
        ? "ذخیره شد"
        : status === "error"
          ? "ذخیره نشد — دوباره بنویس"
          : "خودکار ذخیره می‌شود";

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="listing-note-title"
      hugContent
      zClass="z-50"
      footer={
        <div className="flex gap-2">
          {hadNote ? (
            <button
              type="button"
              onClick={() => void remove()}
              className="btn-ghost flex-1 !py-3.5"
            >
              پاک کردن
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (timer.current) clearTimeout(timer.current);
              void flush().then(onClose);
            }}
            className="btn-primary flex-1 !py-3.5 shadow-md shadow-brand-600/20 active:scale-[0.98] transition-transform"
          >
            باشه
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
          <NoteIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 pt-0.5">
          <h2
            id="listing-note-title"
            className="font-extrabold text-[20px] text-ink dark:text-zinc-50 tracking-tight leading-tight"
          >
            یادداشت برای این آگهی
          </h2>
          <p className="mt-1.5 text-[13px] text-ink-muted dark:text-zinc-400 leading-relaxed">
            فقط خودت می‌بینی؛ فروشنده و آشنایان نمی‌بینند.
            {!isSaved ? (
              <>
                {" "}
                اگر بنویسی، آگهی هم در نشان‌هایت می‌ماند.
              </>
            ) : null}
          </p>
        </div>
      </div>

      <label className="mt-4 block">
        <span className="sr-only">متن یادداشت</span>
        <textarea
          value={draft}
          onChange={(e) => schedule(e.target.value.slice(0, LISTING_NOTE_MAX))}
          onBlur={() => {
            if (timer.current) clearTimeout(timer.current);
            void flush();
          }}
          maxLength={LISTING_NOTE_MAX}
          rows={5}
          autoFocus
          placeholder="مثلاً پنجشنبه بروم ببینم."
          className="field !py-3 !px-3.5 !text-[15px] !min-h-[7.5rem] resize-none leading-relaxed"
        />
      </label>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span
          className={`text-[11px] leading-none ${
            status === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-ink-faint"
          }`}
        >
          {statusLabel}
        </span>
        <span className="text-[11px] text-ink-faint nums tabular-nums">
          {toPersianDigits(draft.length)} / {toPersianDigits(LISTING_NOTE_MAX)}
        </span>
      </div>
    </SheetShell>
  );
}
