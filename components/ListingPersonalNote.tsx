"use client";

import { useEffect, useRef, useState } from "react";
import { LockIcon, PencilIcon } from "@/components/Icons";
import { useToast } from "@/components/Toast";
import { ApiError } from "@/lib/api";
import { LISTING_NOTE_MAX } from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";
import { useStore } from "@/lib/store";

export default function ListingPersonalNote({
  listingId,
}: {
  listingId: string;
}) {
  const savedBody = useStore((s) => s.listingNotes[listingId] ?? "");
  const isSaved = useStore((s) => s.saved.includes(listingId));
  const persist = useStore((s) => s.setListingNote);
  const { show } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(savedBody);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const savedRef = useRef(savedBody);
  savedRef.current = savedBody;

  useEffect(() => {
    if (!editing) setDraft(savedBody);
  }, [editing, savedBody]);

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

  function startEdit() {
    setDraft(savedBody);
    setEditing(true);
  }

  async function remove() {
    if (timer.current) clearTimeout(timer.current);
    setDraft("");
    setEditing(false);
    try {
      await persist(listingId, "");
    } catch (err) {
      show(err instanceof ApiError ? err.message : "پاک نشد");
    }
  }

  const empty = !savedBody.trim();

  if (!editing && empty) {
    return (
      <section className="px-4 pt-3 cv-block">
        <button
          type="button"
          onClick={startEdit}
          className="w-full card px-3.5 py-3 flex items-center gap-3 text-start active:opacity-80 transition-opacity"
        >
          <span className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-zinc-800 text-ink-muted flex items-center justify-center shrink-0">
            <LockIcon className="w-[16px] h-[16px]" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-bold text-[14px] text-ink dark:text-zinc-100">
              یادداشت خصوصی
            </span>
            <span className="block text-[11px] text-ink-muted mt-0.5">
              فقط تو می‌بینی. بقیه حلقه نمی‌بینند.
            </span>
          </span>
          <span className="shrink-0 text-[12px] font-bold text-brand-600 dark:text-brand-400">
            بنویس ‹
          </span>
        </button>
      </section>
    );
  }

  if (!editing) {
    return (
      <section className="px-4 pt-3 cv-block">
        <div className="card px-3.5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex items-start gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-zinc-800 text-ink-muted flex items-center justify-center shrink-0 mt-0.5">
                <LockIcon className="w-[16px] h-[16px]" />
              </span>
              <div className="min-w-0">
                <h2 className="font-bold text-[14px] text-ink dark:text-zinc-100">
                  یادداشت خصوصی
                </h2>
                <p className="text-[11px] text-ink-faint mt-0.5">فقط تو می‌بینی</p>
                <p className="mt-2 text-[13px] text-ink dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {savedBody}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <button
                type="button"
                onClick={startEdit}
                className="text-[12px] font-bold text-brand-600 dark:text-brand-400 py-0.5"
              >
                ویرایش ‹
              </button>
              <button
                type="button"
                onClick={() => void remove()}
                className="text-[11px] font-bold text-ink-faint py-0.5"
              >
                پاک کن
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 pt-3 cv-block">
      <div className="card px-3.5 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-zinc-800 text-ink-muted flex items-center justify-center shrink-0">
            <PencilIcon className="w-[15px] h-[15px]" />
          </span>
          <div className="min-w-0">
            <h2 className="font-bold text-[14px] text-ink dark:text-zinc-100">
              یادداشت خصوصی
            </h2>
            <p className="text-[11px] text-ink-muted">
              فقط تو می‌بینی
              {!isSaved ? " · با نوشتن، آگهی نشان می‌شود" : ""}
            </p>
          </div>
        </div>
        <textarea
          value={draft}
          onChange={(e) =>
            schedule(e.target.value.slice(0, LISTING_NOTE_MAX))
          }
          onBlur={() => {
            if (timer.current) clearTimeout(timer.current);
            void flush();
          }}
          maxLength={LISTING_NOTE_MAX}
          rows={3}
          autoFocus
          placeholder="مثلاً پنجشنبه بروم ببینم، یا سارا گفت فنرها سالم‌اند."
          className="field !py-2.5 !text-[13px] !min-h-[4.5rem] resize-none leading-relaxed"
        />
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-[11px] text-ink-faint nums">
            {status === "saving"
              ? "در حال ذخیره…"
              : status === "saved"
                ? "ذخیره شد"
                : status === "error"
                  ? "ذخیره نشد"
                  : "\u00a0"}
          </span>
          <span className="text-[11px] text-ink-faint nums">
            {toPersianDigits(draft.length)} / {toPersianDigits(LISTING_NOTE_MAX)}
          </span>
        </div>
        <div className="mt-1 flex justify-end gap-3">
          {savedBody.trim() ? (
            <button
              type="button"
              onClick={() => void remove()}
              className="text-[12px] font-bold text-ink-faint py-1"
            >
              پاک کن
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (timer.current) clearTimeout(timer.current);
                draftRef.current = savedRef.current;
                setDraft(savedBody);
                setEditing(false);
                setStatus("idle");
              }}
              className="text-[12px] font-bold text-ink-faint py-1"
            >
              بستن
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
