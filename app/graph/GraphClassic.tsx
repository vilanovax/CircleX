"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { lazyUi } from "@/lib/lazy-ui";
import { GraphIcon, ShieldCheckIcon } from "@/components/Icons";
import { toPersianDigits } from "@/lib/persian";
import { buildTrustGraph, graphInsights } from "@/lib/graph";

const TrustGraph = lazyUi(() => import("@/components/TrustGraph"));

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
        subtitle={`${toPersianDigits(circleCount)} مستقیم · ${toPersianDigits(reach)} دسترسی`}
        back
      />

      <div className="px-4 pt-3 space-y-3 listing-detail-rise">
        {/* Overview composition */}
        <div className="card overflow-hidden">
          <div className="px-3.5 pt-3.5 pb-3">
            <div className="flex items-start gap-2.5 mb-3">
              <span className="w-9 h-9 rounded-xl bg-[color:var(--circle-trust)]/12 text-[color:var(--circle-trust)] flex items-center justify-center shrink-0">
                <ShieldCheckIcon className="w-[18px] h-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-[14px] text-ink dark:text-zinc-100">
                  حلقه‌ی اعتماد من
                </p>
                <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-relaxed">
                  هیچ‌کس غریبه نیست — هر نفر از یک مسیر اعتماد به تو می‌رسد.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <StatPill
                value={toPersianDigits(reach)}
                label="دسترسی کل"
                accent="text-brand-600"
                soft="bg-brand-50 dark:bg-brand-500/15"
              />
              <StatPill
                value={toPersianDigits(insights.levelA)}
                label="نزدیک‌ترین"
                accent="text-levelA"
                soft="bg-levelA/10"
              />
              <StatPill
                value={toPersianDigits(circleCount)}
                label="مستقیم"
                accent="text-levelB"
                soft="bg-levelB/10"
              />
            </div>
          </div>

          {insights.hub && insights.hub.count > 0 && (
            <Link
              href={`/person/${insights.hub.id}`}
              className="flex items-center gap-3 px-3.5 py-3 border-t border-stone-100 dark:border-zinc-800 active:bg-stone-50/80 dark:active:bg-zinc-800/40 transition-colors"
            >
              <span className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center shrink-0">
                <GraphIcon className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-bold text-ink dark:text-zinc-100">
                  پل اصلی: {insights.hub.name}
                </span>
                <span className="block text-[11px] text-ink-muted mt-0.5 nums">
                  {toPersianDigits(insights.hub.count)} مسیر اعتماد از طریق او
                </span>
              </span>
              <span className="text-[12px] font-bold text-brand-600 dark:text-brand-400 shrink-0">
                پروفایل ‹
              </span>
            </Link>
          )}
        </div>

        {/* Interactive map */}
        <div className="card p-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-0.5 mb-2">
            <h2 className="text-[13px] font-bold text-ink dark:text-zinc-100">
              نقشه‌ی شبکه
            </h2>
            <span className="text-[11px] text-ink-faint nums">
              {toPersianDigits(reach + 1)} گره
            </span>
          </div>
          <TrustGraph />
        </div>
      </div>

      <BottomNav />
    </main>
  );
}

function StatPill({
  value,
  label,
  accent,
  soft,
}: {
  value: string;
  label: string;
  accent: string;
  soft: string;
}) {
  return (
    <div className={`rounded-xl px-2 py-2.5 text-center ${soft}`}>
      <p className={`text-lg font-extrabold nums leading-none ${accent}`}>
        {value}
      </p>
      <p className="text-[10px] font-semibold text-ink-muted dark:text-zinc-400 mt-1.5">
        {label}
      </p>
    </div>
  );
}
