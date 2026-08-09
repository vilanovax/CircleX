"use client";

import { useState } from "react";
import ListingImagePicker from "@/components/ListingImagePicker";
import PrivacyPicker from "@/components/PrivacyPicker";
import { useToast } from "@/components/Toast";
import { listingTypeEmoji, listingTypeLabels } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { toEnglishDigits } from "@/lib/persian";
import type { ListingType, Privacy } from "@/lib/types";

const TYPES: ListingType[] = ["sale", "service", "donation", "exchange", "loan"];

export type ListingInput = {
  title: string;
  description: string;
  type: ListingType;
  price?: number;
  category: string;
  image: string;
  privacy: Privacy;
};

export default function ListingComposeForm({
  onSubmit,
  onCancel,
  cancelLabel = "انصراف",
  submitLabel = "انتشار آگهی",
}: {
  onSubmit: (input: ListingInput) => void;
  onCancel?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
}) {
  const { people } = useStore();
  const { show } = useToast();
  const circle = people.filter((p) => p.inMyCircle);

  const [type, setType] = useState<ListingType>("sale");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("📦");
  const [privacy, setPrivacy] = useState<Privacy>("AB");

  const needsPrice = type === "sale" || type === "service";
  const canSubmit = title.trim() && description.trim();

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

  return (
    <>
      <label className="block text-sm font-medium mb-2 text-ink dark:text-zinc-200">نوع آگهی</label>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-xl py-2.5 text-[11px] font-medium border flex flex-col items-center gap-0.5 ${
              type === t
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-[color:var(--circle-surface)] dark:bg-zinc-900 text-ink-muted border-stone-200/70 dark:border-zinc-700"
            }`}
          >
            <span className="text-sm opacity-80">{listingTypeEmoji[t]}</span>
            {listingTypeLabels[t]}
          </button>
        ))}
      </div>

      <ListingImagePicker
        value={image}
        onChange={setImage}
        onError={(msg) => show(msg)}
        category={category || listingTypeLabels[type]}
      />

      <label className="block text-sm font-medium mb-1 text-ink dark:text-zinc-200">عنوان</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="مثلاً: مبل راحتی سه‌نفره تمیز"
        className="field mb-4"
      />

      <label className="block text-sm font-medium mb-1 text-ink dark:text-zinc-200">توضیحات</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="جزئیات کالا یا خدمت، وضعیت، و شرایط…"
        rows={3}
        className="field resize-none mb-4"
      />

      <div className="flex gap-3 mb-4">
        {needsPrice && (
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1 text-ink dark:text-zinc-200">قیمت (تومان)</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="numeric"
              placeholder="مثلاً ۸۵۰۰۰۰۰"
              className="field nums"
            />
          </div>
        )}
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1 text-ink dark:text-zinc-200">دسته‌بندی</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="مثلاً لوازم خانه"
            className="field"
          />
        </div>
      </div>

      <div className="mb-5">
        <PrivacyPicker value={privacy} onChange={setPrivacy} circle={circle} showCircleLink />
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost flex-1">
            {cancelLabel}
          </button>
        )}
        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className={`btn-primary ${onCancel ? "flex-1" : "w-full !py-3.5 text-base"}`}
        >
          {submitLabel}
        </button>
      </div>
    </>
  );
}
