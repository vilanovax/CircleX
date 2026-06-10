"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import {
  listingTypeEmoji,
  listingTypeLabels,
  privacyEmoji,
  privacyLabels,
} from "@/lib/labels";
import type { ListingType, Privacy } from "@/lib/types";
import { toEnglishDigits } from "@/lib/persian";

const TYPES: ListingType[] = ["sale", "service", "donation", "exchange", "loan"];
const PRIVACIES: Privacy[] = ["A", "AB", "ABC", "referral", "approved"];
const EMOJIS = ["📦", "🛋️", "📱", "💻", "🚗", "🚲", "🎹", "📚", "👕", "🧸", "🛠️", "🪑", "🍳", "⌚", "🎒", "🎁"];

export default function NewListingPage() {
  const router = useRouter();
  const { addListing } = useStore();

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
    const id = addListing({
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
    router.push(`/listing/${id}`);
  }

  return (
    <main className="pb-28 min-h-[100dvh]">
      <Header title="ثبت آگهی جدید" back />

      <div className="px-4 pt-4 space-y-5">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-2">نوع آگهی</label>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-xl py-3 text-xs font-medium border flex flex-col items-center gap-1 transition-colors ${
                  type === t
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-zinc-600 border-zinc-200"
                }`}
              >
                <span className="text-lg">{listingTypeEmoji[t]}</span>
                {listingTypeLabels[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Image picker */}
        <div>
          <label className="block text-sm font-medium mb-2">تصویر (شکلک)</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setImage(e)}
                aria-label={`انتخاب شکلک ${e}`}
                aria-pressed={image === e}
                className={`w-12 h-12 shrink-0 rounded-xl text-2xl flex items-center justify-center border transition-colors ${
                  image === e
                    ? "border-brand-500 bg-brand-50"
                    : "border-zinc-200 bg-white"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">عنوان</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: مبل راحتی سه‌نفره تمیز"
            className="field"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">توضیحات</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="جزئیات کالا یا خدمت، وضعیت، و شرایط…"
            rows={4}
            className="field resize-none"
          />
        </div>

        {/* Price + category */}
        <div className="flex gap-3">
          {needsPrice && (
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">قیمت (تومان)</label>
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
            <label className="block text-sm font-medium mb-1">دسته‌بندی</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="مثلاً لوازم خانه"
              className="field"
            />
          </div>
        </div>

        {/* Privacy */}
        <div>
          <label className="block text-sm font-medium mb-2">
            چه کسانی این آگهی را ببینند؟
          </label>
          <div className="space-y-2">
            {PRIVACIES.map((p) => (
              <button
                key={p}
                onClick={() => setPrivacy(p)}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 border text-right transition-colors ${
                  privacy === p
                    ? "border-brand-500 bg-brand-50"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <span className="text-lg">{privacyEmoji[p]}</span>
                <span className="text-sm font-medium text-zinc-700">
                  {privacyLabels[p]}
                </span>
                <span
                  className={`mr-auto w-4 h-4 rounded-full border-2 ${
                    privacy === p ? "border-brand-600 bg-brand-600" : "border-zinc-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!canSubmit}
          className="btn-primary w-full !py-3.5 text-base"
        >
          انتشار آگهی در حلقه
        </button>
      </div>
    </main>
  );
}
