"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import TrustGraph from "@/components/TrustGraph";
import { ShieldCheckIcon } from "@/components/Icons";
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
      <Header
        title="گراف اعتماد"
        subtitle={`${toPersianDigits(circleCount)} نفر مستقیم · ${toPersianDigits(reach)} دسترسی`}
        back
      />

      <div className="px-4 pt-3 space-y-3">
        <div className="card px-3.5 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheckIcon className="w-4 h-4 text-levelA" />
            <p className="font-bold text-[13px] text-ink dark:text-zinc-100">
              حلقه‌ی اعتماد من
            </p>
          </div>
          <p className="text-[11px] text-ink-muted dark:text-zinc-400 leading-relaxed">
            <span className="nums font-semibold text-ink dark:text-zinc-200">
              {toPersianDigits(circleCount)}
            </span>{" "}
            نفر مستقیم، و دسترسی به{" "}
            <span className="nums font-semibold text-ink dark:text-zinc-200">
              {toPersianDigits(reach)}
            </span>{" "}
            نفر از طریق مسیرهای اعتماد. هیچ‌کس غریبه نیست.
          </p>
        </div>

        <div className="card p-3 overflow-hidden">
          <TrustGraph />
        </div>

        <div className="card px-2 py-2.5 flex items-stretch">
          <div className="flex-1 text-center py-1">
            <p className="text-xl font-extrabold text-ink dark:text-zinc-50 nums leading-none">
              {toPersianDigits(reach)}
            </p>
            <p className="text-[11px] text-ink-faint mt-1">دسترسی کل</p>
          </div>
          <div className="flex-1 text-center py-1 border-s border-stone-100 dark:border-zinc-800">
            <p className="text-xl font-extrabold text-levelA nums leading-none">
              {toPersianDigits(insights.levelA)}
            </p>
            <p className="text-[11px] text-ink-faint mt-1">نزدیک‌ترین (A)</p>
          </div>
          <div className="flex-1 text-center py-1 border-s border-stone-100 dark:border-zinc-800">
            <p className="text-sm font-extrabold text-ink dark:text-zinc-50 truncate px-1 leading-none mt-1">
              {insights.hub ? insights.hub.name : "—"}
            </p>
            <p className="text-[11px] text-ink-faint mt-1.5">پل اصلی اعتماد</p>
          </div>
        </div>

        {insights.hub && insights.hub.count > 0 && (
          <p className="text-[11px] text-ink-faint dark:text-zinc-500 leading-relaxed px-0.5 text-center">
            بیشترین مسیرهای اعتماد از طریق{" "}
            <span className="font-bold text-ink dark:text-zinc-300">
              {insights.hub.name}
            </span>{" "}
            به شما می‌رسد.
          </p>
        )}

        <div className="flex items-center justify-center gap-4 text-[11px] text-ink-muted dark:text-zinc-400 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-levelA" aria-hidden />
            سطح A
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-levelB" aria-hidden />
            سطح B
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-levelC" aria-hidden />
            سطح C
          </span>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
