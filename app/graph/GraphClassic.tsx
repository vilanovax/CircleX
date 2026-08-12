"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import { lazyUi } from "@/lib/lazy-ui";
import { GraphIcon } from "@/components/Icons";
import { toPersianDigits } from "@/lib/persian";
import { viewerRelationPhrase } from "@/lib/trust";
import { levelChip, levelShort } from "@/lib/labels";
import {
  buildTrustGraph,
  graphInsights,
  pathToMe,
} from "@/lib/graph";
import type { TrustLevel } from "@/lib/types";

const TrustGraph = lazyUi(() => import("@/components/TrustGraph"), {
  loading: () => (
    <div
      className="w-full aspect-square max-h-[340px] rounded-xl bg-stone-100/80 dark:bg-zinc-800/60 animate-pulse"
      aria-hidden
    />
  ),
});

type ViewMode = "map" | "list";

function viaPathLabel(
  pathFromNodeToMe: string[],
  nameOf: (id: string) => string,
): string {
  const chain = pathFromNodeToMe.slice().reverse(); // [me, …, selected]
  const vias = chain.slice(1, -1).map(nameOf);
  if (vias.length === 0) return "مستقیم";
  if (vias.length === 1) return `از طریق ${vias[0]}`;
  if (vias.length === 2) return `از طریق ${vias[0]} و ${vias[1]}`;
  return `از طریق ${vias[0]} و ${toPersianDigits(vias.length - 1)} نفر دیگر`;
}

export default function GraphClassic() {
  const { people, listings, requests, getPerson } = useStore();
  const [view, setView] = useState<ViewMode>("list");

  const graph = useMemo(
    () => buildTrustGraph(people, listings, requests, getPerson),
    [people, listings, requests, getPerson],
  );
  const insights = useMemo(() => graphInsights(graph), [graph]);

  const nameOf = (id: string) =>
    id === "me" ? "شما" : (graph.nodes.find((x) => x.id === id)?.name ?? "؟");

  const directNodes = useMemo(
    () =>
      graph.nodes
        .filter((n) => n.depth === 1)
        .sort((a, b) => a.name.localeCompare(b.name, "fa")),
    [graph.nodes],
  );
  const viaNodes = useMemo(
    () =>
      graph.nodes
        .filter((n) => n.depth >= 2)
        .sort((a, b) => a.depth - b.depth || a.name.localeCompare(b.name, "fa")),
    [graph.nodes],
  );

  const subtitle = `${toPersianDigits(insights.reach)} نفر · ${toPersianDigits(insights.direct)} ارتباط مستقیم`;

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Header title="شبکه من" subtitle={subtitle} back />

      <div className="px-4 pt-3 space-y-3 listing-detail-rise">
        {/* RTL: فهرست (default) first = right side */}
        <div
          className="flex gap-1 bg-stone-100/80 dark:bg-zinc-800 rounded-xl p-1"
          role="tablist"
          aria-label="نحوه نمایش شبکه"
        >
          <ViewTab
            selected={view === "list"}
            onClick={() => setView("list")}
            label="فهرست"
          />
          <ViewTab
            selected={view === "map"}
            onClick={() => setView("map")}
            label="نقشه"
          />
        </div>

        {insights.hub && insights.hub.count > 0 && (
          <button
            type="button"
            onClick={() => setView("map")}
            className="w-full flex items-center gap-2.5 rounded-xl bg-brand-50/80 dark:bg-brand-500/10 px-3 py-2.5 text-start active:opacity-80 transition-opacity"
          >
            <span className="w-8 h-8 rounded-lg bg-[color:var(--circle-surface)] dark:bg-zinc-900 text-brand-600 flex items-center justify-center shrink-0 ring-1 ring-brand-100 dark:ring-brand-500/20">
              <GraphIcon className="w-4 h-4" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[12px] font-bold text-ink dark:text-zinc-100 truncate">
                بیشترین ارتباط از طریق {insights.hub.name} است
              </span>
              <span className="block text-[11px] text-ink-muted mt-0.5 nums truncate">
                {insights.hub.name} شما را به{" "}
                {toPersianDigits(insights.hub.count)} نفر دیگر متصل می‌کند
              </span>
            </span>
            <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 shrink-0">
              نمایش در نقشه
            </span>
          </button>
        )}

        {view === "map" ? (
          <div className="card p-3 overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-0.5 mb-1">
              <h2 className="text-[13px] font-bold text-ink dark:text-zinc-100">
                نقشه ارتباطات
              </h2>
              <span className="text-[11px] text-ink-faint">
                نزدیک‌تر به مرکز = مستقیم‌تر
              </span>
            </div>
            <TrustGraph />
          </div>
        ) : (
          <div className="space-y-3">
            <PeopleGroup
              title="ارتباط‌های مستقیم"
              count={directNodes.length}
              empty="هنوز کسی را مستقیم اضافه نکرده‌اید."
            >
              {directNodes.map((n) => {
                const person = getPerson(n.id);
                return (
                  <PersonRow
                    key={n.id}
                    id={n.id}
                    name={n.name}
                    avatar={n.avatar}
                    relation={
                      person ? viewerRelationPhrase(person) : "مستقیم"
                    }
                    levelBadge={person?.level ?? n.level}
                  />
                );
              })}
            </PeopleGroup>

            <PeopleGroup
              title="ارتباط‌های غیرمستقیم"
              subtitle="افرادی که از طریق آشنایان به شما متصل‌اند"
              count={viaNodes.length}
              empty="هنوز کسی از مسیر دیگران به شما وصل نیست."
            >
              {viaNodes.map((n) => (
                <PersonRow
                  key={n.id}
                  id={n.id}
                  name={n.name}
                  avatar={n.avatar}
                  relation={viaPathLabel(pathToMe(n.id, graph.parent), nameOf)}
                />
              ))}
            </PeopleGroup>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

function ViewTab({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg text-[13px] font-bold transition-colors ${
        selected
          ? "bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-100/80 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/25"
          : "text-ink-muted dark:text-zinc-400"
      }`}
    >
      {label}
    </button>
  );
}

function PeopleGroup({
  title,
  subtitle,
  count,
  empty,
  children,
}: {
  title: string;
  subtitle?: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-stone-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-bold text-ink dark:text-zinc-100">
            {title}
          </h2>
          <span className="inline-flex min-w-[1.2rem] h-5 px-1.5 items-center justify-center rounded-full bg-stone-100 dark:bg-zinc-800 text-[10px] font-extrabold text-ink-muted nums">
            {toPersianDigits(count)}
          </span>
        </div>
        {subtitle && (
          <p className="text-[11px] text-ink-faint mt-1 leading-snug">
            {subtitle}
          </p>
        )}
      </div>
      {count === 0 ? (
        <p className="px-3.5 py-4 text-[12px] text-ink-faint">{empty}</p>
      ) : (
        <ul className="divide-y divide-stone-100 dark:divide-zinc-800">{children}</ul>
      )}
    </section>
  );
}

function PersonRow({
  id,
  name,
  avatar,
  relation,
  levelBadge,
}: {
  id: string;
  name: string;
  avatar?: string;
  relation: string;
  levelBadge?: TrustLevel;
}) {
  return (
    <li>
      <Link
        href={`/person/${id}`}
        className="flex items-center gap-3 px-3.5 py-2.5 active:bg-stone-50 dark:active:bg-zinc-800/50"
      >
        <Avatar name={name} src={avatar} size="sm" showLevel={false} />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold text-ink dark:text-zinc-100 truncate">
            {name}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] text-ink-muted truncate">
              {relation}
            </span>
            {levelBadge && (
              <span
                className={`shrink-0 chip !py-0 !px-1.5 !text-[10px] font-bold ${levelChip[levelBadge]} dark:bg-zinc-800`}
              >
                {levelShort[levelBadge]}
              </span>
            )}
          </span>
        </span>
        <span className="text-ink-faint text-sm" aria-hidden>
          ‹
        </span>
      </Link>
    </li>
  );
}
