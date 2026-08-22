"use client";

import {
  memo,
  useCallback,
  useRef,
  useState,
} from "react";
import PrivacyPicker from "@/components/PrivacyPicker";
import SheetShell from "@/components/SheetShell";
import VoiceDictateButton from "@/components/VoiceDictateButton";
import { BackIcon, CloseIcon } from "@/components/Icons";
import { useToast } from "@/components/Toast";
import type { BudgetUnit, Privacy } from "@/lib/types";
import { formatTomanInput, toEnglishDigits } from "@/lib/persian";

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

const BUDGET_UNITS: { id: BudgetUnit; label: string }[] = [
  { id: "total", label: "جمع" },
  { id: "session", label: "هر جلسه" },
  { id: "month", label: "ماهانه" },
  { id: "negotiable", label: "توافقی" },
];

export type RequestInput = {
  title: string;
  description: string;
  category: string;
  image: string;
  budget?: number;
  budgetUnit?: BudgetUnit;
  privacy: Privacy;
};

type Draft = {
  title: string;
  description: string;
  budget: string;
};

export default function AddRequestSheet({
  onClose,
  onAdd,
  onBack,
}: {
  onClose: () => void;
  onAdd: (input: RequestInput) => void | Promise<void>;
  onBack?: () => void;
}) {
  const { show } = useToast();
  const draftRef = useRef<Draft>({ title: "", description: "", budget: "" });
  const [hasTitle, setHasTitle] = useState(false);
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState(false);
  const [image, setImage] = useState("🔎");
  const [showEmojis, setShowEmojis] = useState(false);
  const [budgetUnit, setBudgetUnit] = useState<BudgetUnit>("total");
  const [privacy, setPrivacy] = useState<Privacy>("ABC");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = hasTitle;
  const amountMode = budgetUnit !== "negotiable";

  const onTitleChange = useCallback((title: string) => {
    draftRef.current.title = title;
    const ok = Boolean(title.trim());
    setHasTitle((prev) => (prev === ok ? prev : ok));
  }, []);

  const onDescriptionChange = useCallback((description: string) => {
    draftRef.current.description = description;
  }, []);

  const onBudgetChange = useCallback((budget: string) => {
    draftRef.current.budget = budget;
  }, []);

  function pickCategory(c: string) {
    if (c === "سایر") {
      setCustomCategory(true);
      setCategory("");
      return;
    }
    setCustomCategory(false);
    setCategory(category === c ? "" : c);
  }

  async function submit() {
    if (!canSubmit || submitting) return;
    const { title, description, budget } = draftRef.current;
    const amount =
      amountMode && budget
        ? Number(toEnglishDigits(budget).replace(/\D/g, "")) || undefined
        : undefined;
    setSubmitting(true);
    try {
      await onAdd({
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || "عمومی",
        image,
        budget: amount,
        budgetUnit:
          budgetUnit === "negotiable"
            ? "negotiable"
            : amount != null
              ? budgetUnit
              : undefined,
        privacy,
      });
    } catch (err) {
      show(err instanceof Error ? err.message : "درخواست ذخیره نشد");
      setSubmitting(false);
    }
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="add-request-title"
      zClass="z-50"
      footer={
        <div>
          {!canSubmit ? (
            <p className="text-[11px] text-ink-muted text-center mb-2 leading-relaxed">
              عنوان را بنویس
            </p>
          ) : null}
          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={() => void submit()}
            className="btn-primary w-full !py-3 text-[15px] shadow-lg shadow-brand-600/20 active:scale-[0.99] transition-transform duration-150 disabled:opacity-60"
          >
            {submitting ? "در حال ثبت…" : "ثبت درخواست"}
          </button>
        </div>
      }
    >
      <div className="flex items-center gap-2 mb-1">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="بازگشت"
            className="shrink-0 w-9 h-9 -ms-1 rounded-full flex items-center justify-center text-brand-600 dark:text-brand-400 active:bg-brand-50 dark:active:bg-brand-500/10"
          >
            <BackIcon className="w-5 h-5" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2
            id="add-request-title"
            className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50 leading-tight"
          >
            درخواست جدید
          </h2>
          <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-relaxed">
            بگو دنبال چی می‌گردی. جواب از حلقه‌ات می‌آید.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن"
          className="shrink-0 w-9 h-9 -me-1 rounded-full flex items-center justify-center text-ink-muted dark:text-zinc-400 active:bg-stone-100 dark:active:bg-zinc-800"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      <RequestTitleBlock onChange={onTitleChange} />
      <RequestDescBlock onChange={onDescriptionChange} />
      <RequestBudgetBlock
        unit={budgetUnit}
        onUnitChange={setBudgetUnit}
        onAmountChange={onBudgetChange}
      />

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
        {customCategory ? (
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="دسته را بنویس…"
            className="field mt-2"
            autoFocus
          />
        ) : null}
      </section>

      <RequestEmojiBlock
        image={image}
        showEmojis={showEmojis}
        onImageChange={setImage}
        onToggle={setShowEmojis}
      />

      <div className="mb-2">
        <PrivacyPicker
          value={privacy}
          onChange={setPrivacy}
          showCircleLink
          compact
        />
      </div>
    </SheetShell>
  );
}

const RequestTitleBlock = memo(function RequestTitleBlock({
  onChange,
}: {
  onChange: (title: string) => void;
}) {
  const { show } = useToast();
  const [title, setTitle] = useState("");
  const [voiceInterim, setVoiceInterim] = useState("");
  const [voiceListening, setVoiceListening] = useState(false);

  function commit(next: string) {
    const clipped = next.slice(0, 80);
    setTitle(clipped);
    onChange(clipped);
  }

  return (
    <section className="mt-3.5 mb-3">
      <div className="flex items-center justify-between gap-2 mb-1">
        <label
          htmlFor="request-title"
          className="block text-[13px] font-bold text-ink dark:text-zinc-200"
        >
          دنبال چی می‌گردی؟
        </label>
        <VoiceDictateButton
          onError={(msg) => show(msg)}
          onListeningChange={setVoiceListening}
          onInterim={setVoiceInterim}
          onFinal={(phrase) => {
            const piece = phrase.trim();
            if (!piece) return;
            commit(title.trim() ? `${title.trim()} ${piece}` : piece);
            setVoiceInterim("");
          }}
        />
      </div>
      <input
        id="request-title"
        value={title}
        onChange={(e) => commit(e.target.value)}
        placeholder="مثلاً: صندلی اداری ارگونومیک"
        className="field"
        maxLength={80}
      />
      {voiceListening ? (
        <div className="mt-2 rounded-xl border border-rose-200/80 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-500/10 px-3 py-2">
          <p className="text-[10px] font-bold text-rose-700 dark:text-rose-300 mb-0.5">
            در حال شنیدن…
          </p>
          <p className="text-[12px] text-ink dark:text-zinc-100 leading-relaxed min-h-[1.25rem]">
            {voiceInterim || "صحبت کن — متن موقت اینجا می‌آید"}
          </p>
        </div>
      ) : null}
    </section>
  );
});

const RequestDescBlock = memo(function RequestDescBlock({
  onChange,
}: {
  onChange: (description: string) => void;
}) {
  const [description, setDescription] = useState("");
  return (
    <section className="mb-3">
      <label
        htmlFor="request-desc"
        className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
      >
        توضیحات{" "}
        <span className="font-medium text-ink-faint">(اختیاری)</span>
      </label>
      <textarea
        id="request-desc"
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
          onChange(e.target.value);
        }}
        placeholder="شرایط، اندازه، یا کیفیت موردنظر…"
        rows={2}
        className="field resize-none min-h-[4.25rem] leading-relaxed"
      />
    </section>
  );
});

const RequestBudgetBlock = memo(function RequestBudgetBlock({
  unit,
  onUnitChange,
  onAmountChange,
}: {
  unit: BudgetUnit;
  onUnitChange: (unit: BudgetUnit) => void;
  onAmountChange: (amount: string) => void;
}) {
  const [budget, setBudget] = useState("");
  const amountMode = unit !== "negotiable";

  return (
    <section className="mb-3">
      <p className="block text-[12px] font-medium mb-1.5 text-ink-muted">
        مبلغ تقریبی — اختیاری
      </p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {BUDGET_UNITS.map((u) => {
          const active = unit === u.id;
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => onUnitChange(u.id)}
              aria-pressed={active}
              className={`chip !px-2.5 !py-1 !text-[11px] border transition-colors ${
                active
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-stone-50 text-ink-muted border-stone-200/80 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
              }`}
            >
              {u.label}
            </button>
          );
        })}
      </div>
      {amountMode ? (
        <div className="relative">
          <label htmlFor="request-budget" className="sr-only">
            مبلغ به تومان
          </label>
          <input
            id="request-budget"
            value={budget}
            onChange={(e) => {
              const next = formatTomanInput(e.target.value);
              setBudget(next);
              onAmountChange(next);
            }}
            inputMode="numeric"
            placeholder="مثلاً ۳٬۰۰۰٬۰۰۰"
            className="field nums !py-2 !text-[13px] !pl-14"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-ink-muted pointer-events-none">
            تومان
          </span>
        </div>
      ) : (
        <p className="text-[11px] text-ink-faint leading-relaxed px-0.5">
          مبلغ را با پیشنهاددهنده‌ها هماهنگ می‌کنی.
        </p>
      )}
    </section>
  );
});

const RequestEmojiBlock = memo(function RequestEmojiBlock({
  image,
  showEmojis,
  onImageChange,
  onToggle,
}: {
  image: string;
  showEmojis: boolean;
  onImageChange: (emoji: string) => void;
  onToggle: (open: boolean) => void;
}) {
  return (
    <section className="mb-4">
      <p className="block text-[12px] font-medium mb-1.5 text-ink-muted">
        شکلک
      </p>
      {!showEmojis ? (
        <button
          type="button"
          onClick={() => onToggle(true)}
          className="w-full flex items-center gap-3 rounded-xl border border-stone-200/80 dark:border-zinc-700 bg-stone-50/70 dark:bg-zinc-800/40 px-3 py-2 text-right"
        >
          <span className="text-[1.65rem] leading-none shrink-0" aria-hidden>
            {image}
          </span>
          <span className="min-w-0 flex-1 text-[13px] font-semibold text-ink dark:text-zinc-200">
            تصویر نمادین
          </span>
          <span className="text-[12px] font-semibold text-brand-600 dark:text-brand-400">
            تغییر
          </span>
        </button>
      ) : (
        <div>
          <div className="grid grid-cols-6 gap-1.5">
            {EMOJIS.map((e) => {
              const active = image === e;
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    onImageChange(e);
                    onToggle(false);
                  }}
                  aria-label={`انتخاب شکلک ${e}`}
                  aria-pressed={active}
                  className={`h-11 rounded-xl text-xl flex items-center justify-center border transition-[transform,colors] duration-150 active:scale-95 ${
                    active
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/20"
                      : "border-stone-200/80 dark:border-zinc-700 bg-stone-50/60 dark:bg-zinc-900"
                  }`}
                >
                  {e}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => onToggle(false)}
            className="mt-1.5 text-[12px] font-semibold text-ink-muted"
          >
            بستن
          </button>
        </div>
      )}
    </section>
  );
});
