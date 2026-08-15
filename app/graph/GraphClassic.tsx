"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import { lazyUi } from "@/lib/lazy-ui";
import { GraphIcon } from "@/components/Icons";
import { relationLabels } from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";
import { isActiveCircleMember } from "@/lib/circle-member";
import { viewerRelationPhrase } from "@/lib/trust";
import {
  buildTrustGraph,
  graphInsights,
  pathToMe,
} from "@/lib/graph";
import type { Person, RelationType } from "@/lib/types";

const TrustGraph = lazyUi(() => import("@/components/TrustGraph"), {
  loading: () => (
    <div
      className="w-full aspect-square min-h-[420px] rounded-xl bg-stone-100/80 dark:bg-zinc-800/60 animate-pulse"
      aria-hidden
    />
  ),
});

type ViewMode = "map" | "list";
type RelationFilter = RelationType | "all";

const ABOVE_FOLD_AVATARS = 4;
const RELATION_ORDER: RelationType[] = [
  "family",
  "friend",
  "colleague",
  "neighbor",
  "acquaintance",
];

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

function matchesRelationFilter(
  id: string,
  filter: RelationFilter,
  getPerson: (id: string) => Person | undefined,
  parent: Record<string, string>,
  networkLinks: { fromId: string; toId: string; relationType: RelationType }[],
): boolean {
  if (filter === "all" || id === "me") return true;

  const person = getPerson(id);
  if (person && isActiveCircleMember(person) && person.relation === filter) {
    return true;
  }

  // FoF edge type (e.g. لیلا → حسین as colleague)
  for (const link of networkLinks) {
    if (link.relationType !== filter) continue;
    if (link.fromId === "me" || link.toId === "me") continue;
    if (link.fromId === id || link.toId === id) return true;
  }

  // Anyone reached through a direct member of this relation
  const bridgeId = parent[id];
  if (bridgeId && bridgeId !== "me") {
    const bridge = getPerson(bridgeId);
    if (
      bridge &&
      isActiveCircleMember(bridge) &&
      bridge.relation === filter
    ) {
      return true;
    }
  }

  return false;
}

export default function GraphClassic() {
  const people = useStore((s) => s.people);
  const getPerson = useStore((s) => s.getPerson);
  const networkLinks = useStore((s) => s.networkLinks);
  const circleReady = useStore((s) => s.circleReady);
  const circleFull = useStore((s) => s.circleFull);
  const refreshGraph = useStore((s) => s.refreshGraph);
  const [view, setView] = useState<ViewMode>("list");
  const [mapFocus, setMapFocus] = useState<string | null>(null);
  const [relationFilter, setRelationFilter] = useState<RelationFilter>("all");

  useEffect(() => {
    if (!circleReady) return;
    void refreshGraph();
  }, [circleReady, refreshGraph]);

  const graph = useMemo(
    () => buildTrustGraph(people, [], [], getPerson, undefined, networkLinks),
    [people, getPerson, networkLinks],
  );
  const insights = useMemo(() => graphInsights(graph), [graph]);

  const nameOf = (id: string) =>
    id === "me" ? "شما" : (graph.nodes.find((x) => x.id === id)?.name ?? "؟");

  const relationCounts = useMemo(() => {
    const counts: Partial<Record<RelationType, number>> = {};
    for (const n of graph.nodes) {
      if (n.id === "me") continue;
      for (const rel of RELATION_ORDER) {
        if (
          matchesRelationFilter(
            n.id,
            rel,
            getPerson,
            graph.parent,
            networkLinks,
          )
        ) {
          counts[rel] = (counts[rel] ?? 0) + 1;
        }
      }
    }
    return counts;
  }, [graph.nodes, graph.parent, getPerson, networkLinks]);

  const highlightIds = useMemo(() => {
    if (relationFilter === "all") return null;
    const ids = new Set<string>();
    for (const n of graph.nodes) {
      if (n.id === "me") continue;
      if (
        matchesRelationFilter(
          n.id,
          relationFilter,
          getPerson,
          graph.parent,
          networkLinks,
        )
      ) {
        ids.add(n.id);
      }
    }
    return ids;
  }, [relationFilter, graph.nodes, graph.parent, getPerson, networkLinks]);

  const directNodes = useMemo(
    () =>
      graph.nodes
        .filter((n) => n.depth === 1)
        .filter(
          (n) =>
            relationFilter === "all" ||
            matchesRelationFilter(
              n.id,
              relationFilter,
              getPerson,
              graph.parent,
              networkLinks,
            ),
        )
        .sort((a, b) => a.name.localeCompare(b.name, "fa")),
    [graph.nodes, graph.parent, relationFilter, getPerson, networkLinks],
  );
  const viaNodes = useMemo(
    () =>
      graph.nodes
        .filter((n) => n.depth >= 2)
        .filter(
          (n) =>
            relationFilter === "all" ||
            matchesRelationFilter(
              n.id,
              relationFilter,
              getPerson,
              graph.parent,
              networkLinks,
            ),
        )
        .sort((a, b) => a.depth - b.depth || a.name.localeCompare(b.name, "fa")),
    [graph.nodes, graph.parent, relationFilter, getPerson, networkLinks],
  );

  const chipRelations = useMemo(
    () => RELATION_ORDER.filter((rel) => (relationCounts[rel] ?? 0) > 0),
    [relationCounts],
  );

  const subtitle = circleFull
    ? `${toPersianDigits(insights.reach)} نفر · ${toPersianDigits(insights.direct)} ارتباط مستقیم`
    : `${toPersianDigits(insights.direct)} ارتباط مستقیم`;

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Header title="نقشه ارتباط‌ها" subtitle={subtitle} back />

      <div className="px-4 pt-3 space-y-3 listing-detail-rise">
        {/* RTL: فهرست (default) first = right side */}
        <div
          className="flex gap-1 bg-stone-100/80 dark:bg-zinc-800 rounded-xl p-1"
          role="tablist"
          aria-label="نحوه نمایش ارتباط‌ها"
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

        {chipRelations.length > 0 && (
          <div
            className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-0.5 px-0.5"
            role="group"
            aria-label="فیلتر نسبت"
          >
            <RelationChip
              active={relationFilter === "all"}
              label="همه"
              count={insights.reach}
              onClick={() => setRelationFilter("all")}
            />
            {chipRelations.map((rel) => (
              <RelationChip
                key={rel}
                active={relationFilter === rel}
                label={relationLabels[rel]}
                count={relationCounts[rel] ?? 0}
                onClick={() => setRelationFilter(rel)}
              />
            ))}
          </div>
        )}

        {circleFull && insights.hub && insights.hub.count > 1 && (
          <button
            type="button"
            onClick={() => {
              setMapFocus(insights.hub!.id);
              setView("map");
            }}
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
                {insights.hub.name} تو را به{" "}
                {toPersianDigits(insights.hub.count)} نفر دیگر متصل می‌کند
              </span>
            </span>
            <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 shrink-0">
              نمایش روی نقشه
            </span>
          </button>
        )}

        {view === "map" ? (
          <div className="card p-2.5 overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-0.5 mb-1">
              <h2 className="text-[13px] font-bold text-ink dark:text-zinc-100">
                نقشه ارتباط‌ها
              </h2>
              <span className="text-[11px] text-ink-faint">
                دو انگشت · بکش
              </span>
            </div>
            {circleFull ? (
              <TrustGraph
                graph={graph}
                getPerson={getPerson}
                focusId={mapFocus}
                highlightIds={highlightIds}
              />
            ) : (
              <div
                className="w-full aspect-square min-h-[420px] rounded-xl bg-stone-100/80 dark:bg-zinc-800/60 animate-pulse"
                aria-hidden
              />
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <PeopleGroup
              title="ارتباط‌های مستقیم"
              count={directNodes.length}
              empty={
                relationFilter === "all"
                  ? "هنوز کسی را مستقیم اضافه نکرده‌ای."
                  : `در «${relationLabels[relationFilter]}» ارتباط مستقیمی نیست.`
              }
            >
              {directNodes.map((n, idx) => {
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
                    eager={idx < ABOVE_FOLD_AVATARS}
                  />
                );
              })}
            </PeopleGroup>

            {!circleFull ? (
              <section className="card overflow-hidden">
                <div className="px-3.5 py-2.5 border-b border-stone-100 dark:border-zinc-800">
                  <h2 className="text-[13px] font-bold text-ink dark:text-zinc-100">
                    از طریق آشنایان
                  </h2>
                </div>
                <ul className="divide-y divide-stone-100 dark:divide-zinc-800">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 px-3.5 py-2.5 animate-pulse"
                    >
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-24 rounded bg-zinc-100 dark:bg-zinc-800" />
                        <div className="h-2.5 w-32 rounded bg-zinc-100 dark:bg-zinc-800" />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <PeopleGroup
                title="از طریق آشنایان"
                subtitle="افرادی که از طریق آشنایان به تو متصل‌اند"
                count={viaNodes.length}
                empty={
                  relationFilter === "all"
                    ? "هنوز کسی از مسیر دیگران به تو وصل نیست."
                    : `با فیلتر «${relationLabels[relationFilter]}» کسی از مسیر دیگران نیست.`
                }
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
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

function RelationChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chip whitespace-nowrap !px-2.5 !py-1.5 border text-[12px] nums shrink-0 ${
        active
          ? "bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/20"
          : "bg-[color:var(--circle-surface)] text-ink-muted dark:text-zinc-300 border-stone-200/70 dark:border-zinc-700"
      }`}
    >
      {label}
      <span className={active ? "text-white/80" : "text-ink-faint"}>
        {" "}
        {toPersianDigits(count)}
      </span>
    </button>
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
  eager,
}: {
  id: string;
  name: string;
  avatar?: string;
  relation: string;
  eager?: boolean;
}) {
  return (
    <li>
      <Link
        href={`/person/${id}`}
        className="flex items-center gap-3 px-3.5 py-2.5 active:bg-stone-50 dark:active:bg-zinc-800/50"
      >
        <Avatar
          name={name}
          src={avatar}
          size="sm"
          showLevel={false}
          eager={eager}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold text-ink dark:text-zinc-100 truncate">
            {name}
          </span>
          <span className="mt-0.5 block text-[11px] text-ink-muted truncate">
            {relation}
          </span>
        </span>
        <span className="text-ink-faint text-sm" aria-hidden>
          ‹
        </span>
      </Link>
    </li>
  );
}
