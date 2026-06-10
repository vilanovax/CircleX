"use client";

import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import { toPersianDigits } from "@/lib/persian";

// Lightweight mock conversations for the prototype.
const THREADS = [
  {
    personId: "sara",
    last: "مبل هنوز هست؟ می‌تونم آخر هفته بیام ببینم.",
    time: "۱۰:۳۲",
    unread: 2,
  },
  {
    personId: "mina",
    last: "آیفون رو برات نگه می‌دارم، نگران نباش.",
    time: "دیروز",
    unread: 0,
  },
  {
    personId: "hossein",
    last: "سلام، برای کلاس پیانو بعدازظهرها وقت دارم.",
    time: "دیروز",
    unread: 1,
  },
  {
    personId: "reza",
    last: "لباس‌های کودک رو فردا میارم دمِ در.",
    time: "۲ روز پیش",
    unread: 0,
  },
];

export default function MessagesPage() {
  const { getPerson } = useStore();

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Header title="پیام‌ها" />

      <div className="px-4 pt-3">
        <div className="card divide-y divide-zinc-100">
          {THREADS.map((t) => {
            const p = getPerson(t.personId);
            if (!p) return null;
            return (
              <div key={t.personId} className="flex items-center gap-3 p-3 active:bg-zinc-50">
                <Avatar emoji={p.avatar} level={p.level} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-zinc-900">{p.name}</span>
                    <span className="text-[11px] text-zinc-400">{t.time}</span>
                  </div>
                  <p
                    className={`text-xs truncate mt-0.5 ${
                      t.unread ? "text-zinc-800 font-medium" : "text-zinc-400"
                    }`}
                  >
                    {t.last}
                  </p>
                </div>
                {t.unread > 0 && (
                  <span className="shrink-0 w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center nums">
                    {toPersianDigits(t.unread)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-zinc-400 mt-4 leading-relaxed">
          گفتگوها فقط بین افراد حلقه‌ی شما برقرار می‌شود — بدون مزاحمت غریبه‌ها.
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
