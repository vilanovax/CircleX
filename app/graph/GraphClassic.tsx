"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import TrustGraph from "@/components/TrustGraph";
import { toPersianDigits } from "@/lib/persian";
import { buildTrustGraph, graphInsights } from "@/lib/graph";

export default function GraphClassic() {
  const { people, listings, requests, getPerson } = useStore();
  const circleCount = people.filter((p) => p.inMyCircle).length;

  const insights = useMemo(
    () => graphInsights(buildTrustGraph(people, listings, requests, getPerson)),
    [people, listings, requests, getPerson],
  );
  const reach = insights.reach;

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

      {/* Insights */}
      <div className="px-4 pt-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="card p-3 text-center">
            <p className="text-lg font-extrabold text-brand-700 dark:text-brand-300 nums">
              {toPersianDigits(reach)}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">دسترسی کل</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-lg font-extrabold text-levelA nums">
              {toPersianDigits(insights.levelA)}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">نزدیک‌ترین (A)</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-lg font-extrabold text-brand-700 dark:text-brand-300 truncate">
              {insights.hub ? insights.hub.name : "—"}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">پل اصلی اعتماد</p>
          </div>
        </div>
        {insights.hub && insights.hub.count > 0 && (
          <p className="text-[11px] text-zinc-400 mt-2 text-center leading-relaxed">
            بیشترین مسیرهای اعتماد از طریق{" "}
            <span className="font-bold text-zinc-600 dark:text-zinc-300">
              {insights.hub.name}
            </span>{" "}
            به شما می‌رسد.
          </p>
        )}
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
