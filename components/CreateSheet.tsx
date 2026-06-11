"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import AddRequestSheet from "./AddRequestSheet";
import AddEventSheet from "./AddEventSheet";

const OPTIONS = [
  {
    id: "listing",
    emoji: "🏷️",
    title: "ثبت آگهی",
    subtitle: "چیزی برای فروش، اهدا، معاوضه یا قرض داری",
    href: "/new",
    tint: "bg-brand-50 text-brand-600 dark:bg-brand-500/15",
  },
  {
    id: "request",
    emoji: "🔎",
    title: "ثبت درخواست",
    subtitle: "دنبال کالا یا خدمتی می‌گردی — از حلقه بپرس",
    tint: "bg-amber-50 text-amber-600 dark:bg-amber-500/15",
  },
  {
    id: "event",
    emoji: "🎉",
    title: "ساخت رویداد",
    subtitle: "کلاس، دورهمی، بازارچه، سفر گروهی یا playdate",
    tint: "bg-violet-50 text-violet-600 dark:bg-violet-500/15",
  },
] as const;

type Mode = "chooser" | "request" | "event";

export default function CreateSheet({ onClose }: { onClose: () => void }) {
  const { addRequest, addEvent } = useStore();
  const { show } = useToast();
  const [mode, setMode] = useState<Mode>("chooser");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (mode === "chooser") onClose();
        else setMode("chooser");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, onClose]);

  if (mode === "request") {
    return (
      <AddRequestSheet
        onBack={() => setMode("chooser")}
        onClose={onClose}
        onAdd={(input) => {
          addRequest(input);
          onClose();
          show("درخواست شما ثبت شد ✓");
        }}
      />
    );
  }

  if (mode === "event") {
    return (
      <AddEventSheet
        onBack={() => setMode("chooser")}
        onClose={onClose}
        onAdd={(input) => {
          addEvent(input);
          onClose();
          show("رویداد شما ساخته شد ✓");
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-center">
      <div className="relative w-full max-w-[480px]">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-sheet-title"
          className="absolute bottom-0 inset-x-0 bg-white dark:bg-zinc-900 rounded-t-2xl p-5 pb-7 animate-slide-up"
        >
          <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
          <h2 id="create-sheet-title" className="font-bold text-lg mb-1 text-zinc-900 dark:text-zinc-100">
            چی می‌خوای ثبت کنی؟
          </h2>
          <p className="text-xs text-zinc-400 mb-4">
            عرضه می‌کنی یا دنبال چیزی می‌گردی؟
          </p>

          <div className="space-y-2">
            {OPTIONS.map((o) => {
              const cardClass =
                "w-full flex items-center gap-3 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 active:scale-[0.99] transition text-right";

              if (o.id === "listing") {
                return (
                  <Link
                    key={o.id}
                    href={o.href}
                    onClick={onClose}
                    className={cardClass}
                  >
                    <OptionContent option={o} />
                  </Link>
                );
              }

              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setMode(o.id)}
                  className={cardClass}
                >
                  <OptionContent option={o} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionContent({
  option: o,
}: {
  option: (typeof OPTIONS)[number];
}) {
  return (
    <>
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
    </>
  );
}
