"use client";

import { useState } from "react";
import { privacyEmoji, privacyLabels } from "@/lib/labels";
import type { Privacy } from "@/lib/types";
import { toEnglishDigits } from "@/lib/persian";

const PRIVACIES: Privacy[] = ["A", "AB", "ABC", "referral", "approved"];
const EMOJIS = ["🔎", "🪑", "🚵", "📐", "🌀", "📚", "👶", "🧰", "🚗", "🎸", "💻", "🏠"];

export type RequestInput = {
  title: string;
  description: string;
  category: string;
  image: string;
  budget?: number;
  privacy: Privacy;
};

export default function AddRequestSheet({
  onClose,
  onAdd,
  onBack,
}: {
  onClose: () => void;
  onAdd: (input: RequestInput) => void;
  onBack?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("🔎");
  const [budget, setBudget] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("ABC");

  const canSubmit = title.trim() && description.trim();

  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      <div className="relative w-full max-w-[480px]">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-request-title"
          className="absolute bottom-0 inset-x-0 bg-white dark:bg-zinc-900 rounded-t-2xl p-5 pb-7 animate-slide-up max-h-[85dvh] overflow-y-auto"
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
          <h2 id="add-request-title" className="font-bold text-lg mb-4 text-zinc-900 dark:text-zinc-100">
            ثبت درخواست جدید
          </h2>

          <label className="block text-sm font-medium mb-2 text-zinc-800 dark:text-zinc-200">شکلک</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setImage(e)}
                aria-label={`انتخاب شکلک ${e}`}
                aria-pressed={image === e}
                className={`w-11 h-11 shrink-0 rounded-xl text-xl flex items-center justify-center border ${
                  image === e
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/20"
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">چه چیزی می‌خواهی؟</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: صندلی اداری ارگونومیک"
            className="field mb-4"
          />

          <label className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">توضیحات</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="جزئیات بیشتر، شرایط و کیفیت موردنظر…"
            rows={3}
            className="field resize-none mb-4"
          />

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">بودجه (اختیاری)</label>
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                inputMode="numeric"
                placeholder="تومان"
                className="field nums"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-zinc-800 dark:text-zinc-200">دسته‌بندی</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="مثلاً لوازم اداری"
                className="field"
              />
            </div>
          </div>

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
                  category: category.trim() || "عمومی",
                  image,
                  budget: budget
                    ? Number(toEnglishDigits(budget).replace(/\D/g, "")) || undefined
                    : undefined,
                  privacy,
                })
              }
              className="btn-primary flex-1"
            >
              ثبت درخواست
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
