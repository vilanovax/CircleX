"use client";

import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import TrustGraph from "@/components/TrustGraph";
import { toPersianDigits } from "@/lib/persian";

export default function GraphPage() {
  const { people } = useStore();
  const circleCount = people.filter((p) => p.inMyCircle).length;
  const reach = people.length; // circle + friends-of-friends

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Header title="گراف اعتماد" subtitle="نقشه‌ی شبکه‌ی شما" back />

      <div className="px-4 pt-4">
        <div className="rounded-2xl bg-gradient-to-l from-brand-700 to-brand-500 text-white p-4">
          <p className="font-extrabold">حلقه‌ی اعتماد من</p>
          <p className="text-xs text-brand-50 mt-1 leading-relaxed">
            <span className="nums">{toPersianDigits(circleCount)}</span> نفر مستقیم،
            و دسترسی به <span className="nums">{toPersianDigits(reach)}</span> نفر از
            طریق مسیرهای اعتماد. هیچ‌کس غریبه نیست.
          </p>
        </div>
      </div>

      <div className="px-3 pt-4">
        <div className="card p-3">
          <TrustGraph />
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pt-3 flex items-center justify-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: "#16a34a" }} />
          سطح A
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: "#2563eb" }} />
          سطح B
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: "#d97706" }} />
          سطح C
        </span>
      </div>

      <BottomNav />
    </main>
  );
}
