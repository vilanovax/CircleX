"use client";

import { useState } from "react";
import PrivacyPicker from "@/components/PrivacyPicker";
import SheetShell from "@/components/SheetShell";
import { useStore } from "@/lib/store";
import type { Privacy } from "@/lib/types";
import { toEnglishDigits } from "@/lib/persian";

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
  const { people } = useStore();
  const circle = people.filter((p) => p.inMyCircle);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("🔎");
  const [budget, setBudget] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("ABC");

  const canSubmit = title.trim() && description.trim();

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="add-request-title"
      zClass="z-50"
      maxHeight="85dvh"
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-brand-600 font-medium mb-2"
        >
          ‹ بازگشت
        </button>
      )}
      <h2 id="add-request-title" className="font-bold text-lg mb-4 text-ink dark:text-zinc-100">
        ثبت درخواست جدید
      </h2>

      <label className="block text-sm font-medium mb-2 text-ink dark:text-zinc-200">شکلک</label>
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
                : "border-stone-200/70 dark:border-zinc-700 bg-[color:var(--circle-surface)] dark:bg-zinc-900"
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium mb-1 text-ink dark:text-zinc-200">چه چیزی می‌خواهی؟</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="مثلاً: صندلی اداری ارگونومیک"
        className="field mb-4"
      />

      <label className="block text-sm font-medium mb-1 text-ink dark:text-zinc-200">توضیحات</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="جزئیات بیشتر، شرایط و کیفیت موردنظر…"
        rows={3}
        className="field resize-none mb-4"
      />

      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1 text-ink dark:text-zinc-200">بودجه (اختیاری)</label>
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            inputMode="numeric"
            placeholder="تومان"
            className="field nums"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1 text-ink dark:text-zinc-200">دسته‌بندی</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="مثلاً لوازم اداری"
            className="field"
          />
        </div>
      </div>

      <div className="mb-5">
        <PrivacyPicker value={privacy} onChange={setPrivacy} circle={circle} />
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
    </SheetShell>
  );
}
