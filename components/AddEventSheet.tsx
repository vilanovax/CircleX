"use client";

import { useState } from "react";
import JalaliDateField from "@/components/JalaliDateField";
import PrivacyPicker from "@/components/PrivacyPicker";
import SheetShell from "@/components/SheetShell";
import { ClockIcon, MapPinIcon } from "@/components/Icons";
import { eventKindEmoji, eventKindLabels } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { formatEventDateDisplay, toEnglishDigits } from "@/lib/persian";
import type { EventKind, Privacy } from "@/lib/types";

const KINDS: EventKind[] = [
  "social",
  "family",
  "class",
  "kids",
  "trip",
  "charity",
];

export type EventInput = {
  title: string;
  description: string;
  kind: EventKind;
  image: string;
  date: string;
  time?: string;
  location: string;
  capacity?: number;
  privacy: Privacy;
};

export default function AddEventSheet({
  onClose,
  onAdd,
  onBack,
}: {
  onClose: () => void;
  onAdd: (input: EventInput) => void;
  onBack?: () => void;
}) {
  const { people } = useStore();
  const circle = people.filter((p) => p.inMyCircle);
  const [kind, setKind] = useState<EventKind>("social");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("ABC");

  const canSubmit = Boolean(title.trim() && date.trim() && location.trim());

  function submit() {
    if (!canSubmit) return;
    onAdd({
      title: title.trim(),
      description: description.trim(),
      kind,
      image: eventKindEmoji[kind],
      date: formatEventDateDisplay(date.trim()),
      time: time.trim() || undefined,
      location: location.trim(),
      capacity: capacity
        ? Number(toEnglishDigits(capacity).replace(/\D/g, "")) || undefined
        : undefined,
      privacy,
    });
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="add-event-title"
      zClass="z-50"
      footer={
        <div>
          {!canSubmit && (
            <p className="text-[11px] text-ink-faint text-center mb-2">
              عنوان، تاریخ و مکان را کامل کن
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 !py-3.5 active:scale-[0.98] transition-transform duration-150"
            >
              انصراف
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={submit}
              className="btn-primary flex-1 !py-3.5 shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-transform duration-150"
            >
              انتشار رویداد
            </button>
          </div>
        </div>
      }
    >
      <div className="mb-1">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-[12px] text-brand-600 dark:text-brand-400 font-semibold mb-1.5 active:opacity-80"
          >
            ‹ بازگشت
          </button>
        )}
        <h2
          id="add-event-title"
          className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50 leading-tight"
        >
          ساخت رویداد جدید
        </h2>
        <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed">
          دورهمی، کلاس یا سفر — فقط برای حلقهٔ شما.
        </p>
      </div>

      {/* Preview */}
      <div className="mt-3.5 mb-3.5 rounded-xl bg-brand-50/70 dark:bg-brand-500/10 px-3 py-2 flex items-center gap-2.5">
        <span
          className="w-10 h-10 rounded-lg bg-[color:var(--circle-surface)] dark:bg-zinc-900 ring-1 ring-brand-200/60 dark:ring-brand-500/20 flex items-center justify-center text-xl shrink-0"
          aria-hidden
        >
          {eventKindEmoji[kind]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="chip !py-0.5 !px-1.5 !text-[10px] bg-brand-100 text-brand-800 dark:bg-brand-500/20 dark:text-brand-200">
              {eventKindLabels[kind]}
            </span>
            <span className="text-[10px] text-ink-faint">پیش‌نمایش</span>
          </div>
          <p className="text-[13px] font-bold text-ink dark:text-zinc-100 mt-0.5 truncate">
            {title.trim() || "عنوان رویداد…"}
          </p>
          {(date || location) && (
            <p className="text-[11px] text-ink-muted mt-0.5 truncate nums">
              {[
                date ? formatEventDateDisplay(date) : null,
                time.trim() || null,
                location.trim() || null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      </div>

      <section className="mb-4">
        <label className="block text-[13px] font-bold mb-1.5 text-ink dark:text-zinc-200">
          نوع رویداد
        </label>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-0.5 px-0.5">
          {KINDS.map((k) => {
            const active = kind === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                aria-pressed={active}
                className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-bold border flex items-center gap-1 transition-[transform,colors] duration-150 active:scale-[0.97] ${
                  active
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-[color:var(--circle-surface)] dark:bg-zinc-900 text-ink-muted border-stone-200/80 dark:border-zinc-700"
                }`}
              >
                <span className="text-sm leading-none" aria-hidden>
                  {eventKindEmoji[k]}
                </span>
                {eventKindLabels[k]}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-3">
        <label
          htmlFor="event-title"
          className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
        >
          عنوان
        </label>
        <input
          id="event-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مثلاً: دورهمی آخر هفته"
          className="field"
          maxLength={80}
        />
      </section>

      <section className="mb-3">
        <label
          htmlFor="event-desc"
          className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
        >
          توضیحات
        </label>
        <textarea
          id="event-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="جزئیات برنامه، چه چیزی بیاورند، و…"
          rows={3}
          className="field resize-none min-h-[5rem] leading-relaxed"
        />
      </section>

      <section className="mb-3">
        <label className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200">
          تاریخ شمسی
        </label>
        <JalaliDateField value={date} onChange={setDate} />
      </section>

      <section className="mb-3">
        <label
          htmlFor="event-time"
          className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
        >
          ساعت{" "}
          <span className="font-medium text-ink-faint">(اختیاری)</span>
        </label>
        <div className="relative">
          <ClockIcon className="w-4 h-4 text-brand-600 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
          <input
            id="event-time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="مثلاً ۱۸:۰۰"
            className="field !ps-10"
            inputMode="numeric"
          />
        </div>
      </section>

      <section className="mb-3">
        <label
          htmlFor="event-location"
          className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
        >
          مکان
        </label>
        <div className="relative">
          <MapPinIcon className="w-4 h-4 text-brand-600 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
          <input
            id="event-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="مثلاً: پارک ملت"
            className="field !ps-10"
          />
        </div>
      </section>

      <section className="mb-4">
        <label
          htmlFor="event-capacity"
          className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
        >
          ظرفیت{" "}
          <span className="font-medium text-ink-faint">(اختیاری)</span>
        </label>
        <input
          id="event-capacity"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          inputMode="numeric"
          placeholder="مثلاً ۱۲ نفر"
          className="field nums"
        />
      </section>

      <div className="mb-2">
        <PrivacyPicker
          value={privacy}
          onChange={setPrivacy}
          circle={circle}
          showCircleLink
          compact
        />
      </div>
    </SheetShell>
  );
}
