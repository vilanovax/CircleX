"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useSheetA11y } from "@/lib/use-sheet-a11y";
import { useToast } from "./Toast";
import AddListingSheet from "./AddListingSheet";
import AddRequestSheet from "./AddRequestSheet";
import AddEventSheet from "./AddEventSheet";

type Step = "menu" | "listing" | "request" | "event";

const MENU_OPTIONS = [
  {
    id: "listing" as const,
    emoji: "🏷️",
    title: "ثبت آگهی",
    subtitle: "چیزی برای فروش، اهدا، معاوضه یا قرض داری",
    tint: "bg-brand-50 text-brand-600 dark:bg-brand-500/15",
  },
  {
    id: "request" as const,
    emoji: "🔎",
    title: "ثبت درخواست",
    subtitle: "دنبال کالا یا خدمتی می‌گردی — از حلقه بپرس",
    tint: "bg-amber-50 text-amber-600 dark:bg-amber-500/15",
  },
  {
    id: "event" as const,
    emoji: "🎉",
    title: "ساخت رویداد",
    subtitle: "کلاس، دورهمی، بازارچه، سفر گروهی یا playdate",
    tint: "bg-violet-50 text-violet-600 dark:bg-violet-500/15",
  },
] as const;

export default function CreateSheet({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>("menu");
  const router = useRouter();
  const { addListing, addRequest, addEvent } = useStore();
  const { show } = useToast();
  const panelRef = useRef<HTMLDivElement>(null);
  const handleEscape = useCallback(() => {
    if (step !== "menu") {
      setStep("menu");
      return true;
    }
    return false;
  }, [step]);
  useSheetA11y(panelRef, onClose, { onEscape: handleEscape });

  if (step === "listing") {
    return (
      <AddListingSheet
        onClose={onClose}
        onBack={() => setStep("menu")}
        onAdd={(input) => {
          const id = addListing(input);
          onClose();
          show("آگهی شما در حلقه منتشر شد ✓");
          router.push(`/listing/${id}`);
        }}
      />
    );
  }

  if (step === "request") {
    return (
      <AddRequestSheet
        onClose={onClose}
        onBack={() => setStep("menu")}
        onAdd={(input) => {
          const id = addRequest(input);
          onClose();
          show("درخواست شما ثبت شد ✓");
          router.push(`/request/${id}`);
        }}
      />
    );
  }

  if (step === "event") {
    return (
      <AddEventSheet
        onClose={onClose}
        onBack={() => setStep("menu")}
        onAdd={(input) => {
          const id = addEvent(input);
          onClose();
          show("رویداد شما ساخته شد ✓");
          router.push(`/event/${id}`);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-center">
      <div className="relative w-full max-w-[480px]">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-sheet-title"
          tabIndex={-1}
          className="absolute bottom-0 inset-x-0 bg-white dark:bg-zinc-900 rounded-t-2xl p-5 pb-7 animate-slide-up outline-none"
        >
          <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
          <h2
            id="create-sheet-title"
            className="font-bold text-lg mb-1 text-zinc-900 dark:text-zinc-100"
          >
            چی می‌خوای ثبت کنی؟
          </h2>
          <p className="text-xs text-zinc-400 mb-4">
            هر سه نوع از همین‌جا — بدون جابه‌جایی بین صفحه‌ها
          </p>

          <div className="space-y-2">
            {MENU_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setStep(o.id)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 active:scale-[0.99] transition text-right"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 ${o.tint}`}
                >
                  {o.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{o.title}</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{o.subtitle}</p>
                </div>
                <span className="text-zinc-300 dark:text-zinc-600 text-lg shrink-0" aria-hidden>
                  ‹
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
