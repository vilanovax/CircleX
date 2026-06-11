"use client";

import { useState } from "react";
import {
  eventKindEmoji,
  eventKindLabels,
  privacyEmoji,
  privacyLabels,
} from "@/lib/labels";
import type { EventKind, Privacy } from "@/lib/types";
import { toEnglishDigits } from "@/lib/persian";

const KINDS: EventKind[] = ["class", "family", "charity", "kids", "trip", "social"];
const PRIVACIES: Privacy[] = ["A", "AB", "ABC", "referral", "approved"];

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
  const [kind, setKind] = useState<EventKind>("social");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("ABC");

  const canSubmit = title.trim() && date.trim() && location.trim();

  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      <div className="relative w-full max-w-[480px]">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-event-title"
          className="absolute bottom-0 inset-x-0 bg-white dark:bg-zinc-900 rounded-t-2xl p-5 pb-7 animate-slide-up max-h-[88dvh] overflow-y-auto"
        >
          <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-brand-600 font-medium mb-2"
            >
              ‹ بازگشت
            </button>
          )}
          <h2 id="add-event-title" className="font-bold text-lg mb-4 text-zinc-900 dark:text-zinc-100">
            ساخت رویداد جدید
          </h2>

          <label className="block text-sm font-medium mb-2 text-zinc-800 dark:text-zinc-200">نوع رویداد</label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`rounded-xl py-2.5 text-[11px] font-medium border flex flex-col items-center gap-1 ${
                  kind === k
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 border-zinc-200 dark:border-zinc-700"
                }`}
              >
                <span className="text-lg">{eventKindEmoji[k]}</span>
                {eventKindLabels[k]}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">عنوان</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: دورهمی آخر هفته"
            className="field mb-4"
          />

          <label className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">توضیحات</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="جزئیات برنامه، چه چیزی بیاورند، و…"
            rows={2}
            className="field resize-none mb-4"
          />

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">تاریخ</label>
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="جمعه ۲۲ خرداد"
                className="field"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">ساعت</label>
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="۱۸:۰۰"
                className="field"
              />
            </div>
          </div>

          <label className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">مکان</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="مثلاً: پارک ملت"
            className="field mb-4"
          />

          <label className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">ظرفیت (اختیاری)</label>
          <input
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            inputMode="numeric"
            placeholder="مثلاً ۱۲"
            className="field nums mb-4"
          />

          <label className="block text-sm font-medium mb-2 text-zinc-800 dark:text-zinc-200">چه کسانی ببینند؟</label>
          <div className="flex flex-wrap gap-2 mb-5">
            {PRIVACIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrivacy(p)}
                className={`chip !px-3 !py-1.5 border ${
                  privacy === p
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 border-zinc-200 dark:border-zinc-700"
                }`}
              >
                {privacyEmoji[p]} {privacyLabels[p]}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              انصراف
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() =>
                onAdd({
                  title: title.trim(),
                  description: description.trim(),
                  kind,
                  image: eventKindEmoji[kind],
                  date: date.trim(),
                  time: time.trim() || undefined,
                  location: location.trim(),
                  capacity: capacity
                    ? Number(toEnglishDigits(capacity).replace(/\D/g, "")) || undefined
                    : undefined,
                  privacy,
                })
              }
              className="btn-primary flex-1"
            >
              انتشار رویداد
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
