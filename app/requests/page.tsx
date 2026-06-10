"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import RequestCard from "@/components/RequestCard";
import { PlusIcon } from "@/components/Icons";
import { canView } from "@/lib/trust";
import { useToast } from "@/components/Toast";
import { toEnglishDigits } from "@/lib/persian";
import {
  privacyEmoji,
  privacyLabels,
} from "@/lib/labels";
import type { Privacy } from "@/lib/types";

const PRIVACIES: Privacy[] = ["A", "AB", "ABC", "referral", "approved"];
const EMOJIS = ["🔎", "🪑", "🚵", "📐", "🌀", "📚", "👶", "🧰", "🚗", "🎸", "💻", "🏠"];

export default function RequestsPage() {
  const { requests, getPerson, addRequest } = useStore();
  const { show } = useToast();
  const [showAdd, setShowAdd] = useState(false);

  // Opened from the global "+" chooser via /requests?compose=1
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("compose") === "1") {
      setShowAdd(true);
    }
  }, []);

  const visible = useMemo(
    () => requests.filter((r) => canView(r, getPerson)),
    [requests, getPerson],
  );

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Header
        title="درخواست‌ها"
        subtitle="چیزهایی که حلقه‌ی شما دنبالش می‌گردد"
        back
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center active:bg-brand-700"
            aria-label="ثبت درخواست"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        }
      />

      <div className="px-4 pt-3">
        <div className="rounded-2xl bg-amber-50 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 p-4">
          <p className="font-bold text-sm text-amber-800 dark:text-amber-300">یک نیاز داری؟ از حلقه بپرس</p>
          <p className="text-xs text-amber-700 dark:text-amber-200/80 mt-1 leading-relaxed">
            به‌جای جستجو بین غریبه‌ها، درخواستت را بین آدم‌های مورد اعتمادت بگذار تا
            خودشان یا آشناهاشان کمکت کنند.
          </p>
        </div>
      </div>

      <section className="px-4 pt-3 space-y-3">
        {visible.length === 0 ? (
          <div className="text-center text-zinc-400 py-16 text-sm">
            هنوز درخواستی نیست. اولین درخواست را ثبت کن.
          </div>
        ) : (
          visible.map((r) => <RequestCard key={r.id} request={r} />)
        )}
      </section>

      {showAdd && (
        <AddRequestSheet
          onClose={() => setShowAdd(false)}
          onAdd={(input) => {
            addRequest(input);
            setShowAdd(false);
            show("درخواست شما ثبت شد ✓");
          }}
        />
      )}

      <BottomNav />
    </main>
  );
}

function AddRequestSheet({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (input: {
    title: string;
    description: string;
    category: string;
    image: string;
    budget?: number;
    privacy: Privacy;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("🔎");
  const [budget, setBudget] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("ABC");

  const canSubmit = title.trim() && description.trim();

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="app-shell !min-h-0 !shadow-none relative">
        <div className="bg-white rounded-t-2xl p-5 animate-slide-up max-h-[85dvh] overflow-y-auto">
          <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-4" />
          <h2 className="font-bold text-lg mb-4">ثبت درخواست جدید</h2>

          <label className="block text-sm font-medium mb-2">شکلک</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setImage(e)}
                aria-label={`انتخاب شکلک ${e}`}
                aria-pressed={image === e}
                className={`w-11 h-11 shrink-0 rounded-xl text-xl flex items-center justify-center border ${
                  image === e ? "border-brand-500 bg-brand-50" : "border-zinc-200 bg-white"
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium mb-1">چه چیزی می‌خواهی؟</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: صندلی اداری ارگونومیک"
            className="field mb-4"
          />

          <label className="block text-sm font-medium mb-1">توضیحات</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="جزئیات بیشتر، شرایط و کیفیت موردنظر…"
            rows={3}
            className="field resize-none mb-4"
          />

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">بودجه (اختیاری)</label>
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                inputMode="numeric"
                placeholder="تومان"
                className="field nums"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">دسته‌بندی</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="مثلاً لوازم اداری"
                className="field"
              />
            </div>
          </div>

          <label className="block text-sm font-medium mb-2">چه کسانی ببینند؟</label>
          <div className="flex flex-wrap gap-2 mb-5">
            {PRIVACIES.map((p) => (
              <button
                key={p}
                onClick={() => setPrivacy(p)}
                className={`chip !px-3 !py-1.5 border ${
                  privacy === p
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-zinc-600 border-zinc-200"
                }`}
              >
                {privacyEmoji[p]} {privacyLabels[p]}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost flex-1">
              انصراف
            </button>
            <button
              disabled={!canSubmit}
              onClick={() =>
                onAdd({
                  title: title.trim(),
                  description: description.trim(),
                  category: category.trim() || "عمومی",
                  image,
                  budget: budget ? Number(toEnglishDigits(budget).replace(/\D/g, "")) || undefined : undefined,
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
