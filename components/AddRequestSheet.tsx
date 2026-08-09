"use client";

import { useState } from "react";
import PrivacyPicker from "@/components/PrivacyPicker";
import SheetShell from "@/components/SheetShell";
import { useStore } from "@/lib/store";
import type { Privacy } from "@/lib/types";
import { toEnglishDigits } from "@/lib/persian";

const EMOJIS = [
  "🔎",
  "🪑",
  "🚵",
  "📐",
  "📚",
  "👶",
  "🧰",
  "🚗",
  "🎸",
  "💻",
  "🏠",
  "🎮",
];

const CATEGORY_SUGGESTIONS = [
  "لوازم اداری",
  "الکترونیک",
  "خانه",
  "کودک",
  "ورزش",
  "آموزش",
  "خودرو",
  "سایر",
];

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
  const [customCategory, setCustomCategory] = useState(false);
  const [image, setImage] = useState("🔎");
  const [budget, setBudget] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("ABC");

  const canSubmit = Boolean(title.trim() && description.trim());

  function pickCategory(c: string) {
    if (c === "سایر") {
      setCustomCategory(true);
      setCategory("");
      return;
    }
    setCustomCategory(false);
    setCategory(category === c ? "" : c);
  }

  function submit() {
    if (!canSubmit) return;
    onAdd({
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || "عمومی",
      image,
      budget: budget
        ? Number(toEnglishDigits(budget).replace(/\D/g, "")) || undefined
        : undefined,
      privacy,
    });
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="add-request-title"
      zClass="z-50"
      footer={
        <div>
          {!canSubmit && (
            <p className="text-[11px] text-ink-faint text-center mb-2">
              عنوان و توضیحات را کامل کن
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
              ثبت درخواست
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
          id="add-request-title"
          className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50 leading-tight"
        >
          ثبت درخواست جدید
        </h2>
        <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed">
          از حلقه بپرس — پیشنهادها از مسیر اعتماد می‌آیند.
        </p>
      </div>

      {/* Compact preview */}
      <div className="mt-3.5 mb-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-500/10 px-3 py-2 flex items-center gap-2.5">
        <span
          className="w-10 h-10 rounded-lg bg-[color:var(--circle-surface)] dark:bg-zinc-900 ring-1 ring-amber-200/60 dark:ring-amber-500/20 flex items-center justify-center text-xl shrink-0"
          aria-hidden
        >
          {image}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="chip !py-0.5 !px-1.5 !text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
              درخواست
            </span>
            <span className="text-[10px] text-ink-faint">پیش‌نمایش</span>
          </div>
          <p className="text-[13px] font-bold text-ink dark:text-zinc-100 mt-0.5 truncate">
            {title.trim() || "چه چیزی می‌خواهی؟"}
          </p>
        </div>
      </div>

      <section className="mb-4">
        <label className="block text-[13px] font-bold mb-1.5 text-ink dark:text-zinc-200">
          شکلک
        </label>
        <div className="grid grid-cols-4 gap-2">
          {EMOJIS.map((e) => {
            const active = image === e;
            return (
              <button
                key={e}
                type="button"
                onClick={() => setImage(e)}
                aria-label={`انتخاب شکلک ${e}`}
                aria-pressed={active}
                className={`h-12 rounded-xl text-2xl flex items-center justify-center border transition-[transform,colors] duration-150 active:scale-95 ${
                  active
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/20 shadow-sm"
                    : "border-stone-200/80 dark:border-zinc-700 bg-stone-50/60 dark:bg-zinc-900"
                }`}
              >
                {e}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-3">
        <label
          htmlFor="request-title"
          className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
        >
          چه چیزی می‌خواهی؟
        </label>
        <input
          id="request-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مثلاً: صندلی اداری ارگونومیک"
          className="field"
          maxLength={80}
        />
      </section>

      <section className="mb-3">
        <label
          htmlFor="request-desc"
          className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
        >
          توضیحات
        </label>
        <textarea
          id="request-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="جزئیات بیشتر، شرایط و کیفیت موردنظر…"
          rows={3}
          className="field resize-none min-h-[5rem] leading-relaxed"
        />
      </section>

      <section className="mb-3">
        <label
          htmlFor="request-budget"
          className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
        >
          بودجه{" "}
          <span className="font-medium text-ink-faint">(اختیاری)</span>
        </label>
        <input
          id="request-budget"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          inputMode="numeric"
          placeholder="مثلاً ۳۰۰۰۰۰۰ تومان"
          className="field nums"
        />
      </section>

      <section className="mb-4">
        <label className="block text-[13px] font-bold mb-1.5 text-ink dark:text-zinc-200">
          دسته‌بندی
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_SUGGESTIONS.map((c) => {
            const active =
              c === "سایر" ? customCategory : !customCategory && category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => pickCategory(c)}
                aria-pressed={active}
                className={`chip !px-2.5 !py-1 !text-[11px] border transition-colors ${
                  active
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-stone-50 text-ink-muted border-stone-200/80 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
        {customCategory && (
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="دسته را بنویس…"
            className="field mt-2"
            autoFocus
          />
        )}
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
