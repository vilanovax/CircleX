"use client";

import {
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import ListingImagePicker from "@/components/ListingImagePicker";
import PrivacyPicker from "@/components/PrivacyPicker";
import { useToast } from "@/components/Toast";
import { listingTypeEmoji, listingTypeLabels } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { toEnglishDigits } from "@/lib/persian";
import type { ListingType, Privacy } from "@/lib/types";

const TYPES: ListingType[] = ["sale", "service", "donation", "exchange", "loan"];

const CATEGORY_SUGGESTIONS = [
  "لوازم خانه",
  "الکترونیک",
  "پوشاک",
  "کودک",
  "ورزش",
  "آموزش",
  "خودرو",
  "سایر",
];

export type ListingInput = {
  title: string;
  description: string;
  type: ListingType;
  price?: number;
  category: string;
  image: string;
  privacy: Privacy;
};

export type ListingComposeHandle = {
  submit: () => void;
  canSubmit: boolean;
};

const ListingComposeForm = forwardRef<
  ListingComposeHandle,
  {
    onSubmit: (input: ListingInput) => void;
    onCancel?: () => void;
    cancelLabel?: string;
    submitLabel?: string;
    /** Hide bottom buttons when parent provides a pinned footer. */
    hideActions?: boolean;
    onCanSubmitChange?: (can: boolean) => void;
  }
>(function ListingComposeForm(
  {
    onSubmit,
    onCancel,
    cancelLabel = "انصراف",
    submitLabel = "انتشار آگهی",
    hideActions = false,
    onCanSubmitChange,
  },
  ref,
) {
  const { people } = useStore();
  const { show } = useToast();
  const circle = people.filter((p) => p.inMyCircle);

  const [type, setType] = useState<ListingType>("sale");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState(false);
  const [image, setImage] = useState("📦");
  const [privacy, setPrivacy] = useState<Privacy>("AB");

  const needsPrice = type === "sale" || type === "service";
  const canSubmit = Boolean(title.trim() && description.trim());

  useEffect(() => {
    onCanSubmitChange?.(canSubmit);
  }, [canSubmit, onCanSubmitChange]);

  function submit() {
    if (!canSubmit) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      type,
      price:
        needsPrice && price
          ? Number(toEnglishDigits(price).replace(/\D/g, "")) || undefined
          : undefined,
      category: category.trim() || listingTypeLabels[type],
      image,
      privacy,
    });
  }

  useImperativeHandle(
    ref,
    () => ({
      submit,
      canSubmit,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- submit closes over latest state
    [canSubmit, title, description, type, price, category, image, privacy],
  );

  function pickCategory(c: string) {
    if (c === "سایر") {
      setCustomCategory(true);
      setCategory("");
      return;
    }
    setCustomCategory(false);
    setCategory(category === c ? "" : c);
  }

  return (
    <div className="flex flex-col">
      {/* Compact live preview */}
      <div className="mb-3.5 rounded-xl bg-stone-50/90 dark:bg-zinc-800/50 px-3 py-2 flex items-center gap-2.5">
        <span
          className="w-10 h-10 rounded-lg bg-[color:var(--circle-surface)] dark:bg-zinc-900 ring-1 ring-stone-200/60 dark:ring-zinc-700 flex items-center justify-center text-xl shrink-0"
          aria-hidden
        >
          {image.startsWith("data:image/") ? "🖼️" : image}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="chip !py-0.5 !px-1.5 !text-[10px] bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              {listingTypeLabels[type]}
            </span>
            <span className="text-[10px] text-ink-faint">پیش‌نمایش</span>
          </div>
          <p className="text-[13px] font-bold text-ink dark:text-zinc-100 mt-0.5 truncate">
            {title.trim() || "عنوان آگهی…"}
          </p>
        </div>
      </div>

      <section className="mb-4">
        <label className="block text-[13px] font-bold mb-1.5 text-ink dark:text-zinc-200">
          نوع آگهی
        </label>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-0.5 px-0.5">
          {TYPES.map((t) => {
            const active = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                aria-pressed={active}
                className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-bold border flex items-center gap-1 transition-[transform,colors] duration-150 active:scale-[0.97] ${
                  active
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-[color:var(--circle-surface)] dark:bg-zinc-900 text-ink-muted border-stone-200/80 dark:border-zinc-700"
                }`}
              >
                <span className="text-sm leading-none" aria-hidden>
                  {listingTypeEmoji[t]}
                </span>
                {listingTypeLabels[t]}
              </button>
            );
          })}
        </div>
      </section>

      <ListingImagePicker
        value={image}
        onChange={setImage}
        onError={(msg) => show(msg)}
        category={category || listingTypeLabels[type]}
      />

      <section className="mb-3">
        <label
          htmlFor="listing-title"
          className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
        >
          عنوان
        </label>
        <input
          id="listing-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مثلاً: مبل راحتی سه‌نفره تمیز"
          className="field"
          maxLength={80}
        />
      </section>

      <section className="mb-3">
        <label
          htmlFor="listing-desc"
          className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
        >
          توضیحات
        </label>
        <textarea
          id="listing-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="وضعیت کالا، شرایط تحویل، یا جزئیات خدمت…"
          rows={3}
          className="field resize-none min-h-[5rem] leading-relaxed"
        />
      </section>

      {needsPrice && (
        <section className="mb-3">
          <label
            htmlFor="listing-price"
            className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
          >
            قیمت (تومان)
          </label>
          <input
            id="listing-price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="numeric"
            placeholder="مثلاً ۸۵۰۰۰۰۰"
            className="field nums"
          />
        </section>
      )}

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

      <div className={hideActions ? "mb-2" : "mb-5"}>
        <PrivacyPicker
          value={privacy}
          onChange={setPrivacy}
          circle={circle}
          showCircleLink
          compact
        />
      </div>

      {!hideActions && (
        <div className="pt-3 border-t border-stone-200/70 dark:border-zinc-800">
          {!canSubmit && (
            <p className="text-[11px] text-ink-faint text-center mb-2">
              عنوان و توضیحات را کامل کن
            </p>
          )}
          <div className="flex gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn-ghost flex-1 !py-3.5 active:scale-[0.98] transition-transform duration-150"
              >
                {cancelLabel}
              </button>
            )}
            <button
              type="button"
              disabled={!canSubmit}
              onClick={submit}
              className={`btn-primary !py-3.5 shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-transform duration-150 ${
                onCancel ? "flex-1" : "w-full text-base"
              }`}
            >
              {submitLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default ListingComposeForm;
