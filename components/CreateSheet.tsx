"use client";

import { useRouter } from "next/navigation";

const OPTIONS = [
  {
    emoji: "🏷️",
    title: "ثبت آگهی",
    subtitle: "کالا یا خدمتی برای فروش، اهدا یا معاوضه دارم",
    href: "/new",
    tint: "bg-brand-50 text-brand-600",
  },
  {
    emoji: "🔎",
    title: "ثبت درخواست",
    subtitle: "دنبال کالا یا خدمتی می‌گردم — مثلاً «کلاس نقاشی کودک»",
    href: "/requests?compose=1",
    tint: "bg-amber-50 text-amber-600",
  },
  {
    emoji: "🎉",
    title: "ساخت رویداد",
    subtitle: "کلاس، دورهمی، بازارچه، سفر گروهی یا playdate",
    href: "/events?compose=1",
    tint: "bg-violet-50 text-violet-600",
  },
];

export default function CreateSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="app-shell !min-h-0 !shadow-none relative">
        <div className="bg-white dark:bg-zinc-900 rounded-t-2xl p-5 pb-7 animate-slide-up">
          <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-4" />
          <h2 className="font-bold text-lg mb-1">چی می‌خوای ثبت کنی؟</h2>
          <p className="text-xs text-zinc-400 mb-4">
            عرضه می‌کنی یا دنبال چیزی می‌گردی؟
          </p>

          <div className="space-y-2">
            {OPTIONS.map((o) => (
              <button
                key={o.href}
                onClick={() => {
                  onClose();
                  router.push(o.href);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 active:scale-[0.99] transition text-right"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 ${o.tint}`}
                >
                  {o.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-zinc-900">{o.title}</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {o.subtitle}
                  </p>
                </div>
                <span className="text-zinc-300 text-lg shrink-0">‹</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
