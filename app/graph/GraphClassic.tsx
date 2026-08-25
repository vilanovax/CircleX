"use client";

import Link from "next/link";
import {
  memo,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  graphInsightsFromWalk,
  layoutTrustGraph,
  pathToMe,
  walkTrustNetwork,
} from "@/lib/graph";
import type { NetworkLink, Person, RelationType } from "@/lib/types";

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

function preloadTrustGraph() {
  void import("@/components/TrustGraph");
}

function viaPathLabel(
  pathFromNodeToMe: string[],
  nameOf: (id: string) => string,
): string {
  const chain = pathFromNodeToMe.slice().reverse();
  const vias = chain.slice(1, -1).map(nameOf);
  if (vias.length === 0) return "مستقیم";
  if (vias.length === 1) return `از طریق ${vias[0]}`;
  if (vias.length === 2) return `از طریق ${vias[0]} و ${vias[1]}`;
  return `از طریق ${vias[0]} و ${toPersianDigits(vias.length - 1)} نفر دیگر`;
}

function indexPeerRelations(networkLinks: NetworkLink[]) {
  const map = new Map<string, Set<RelationType>>();
  for (let i = 0; i < networkLinks.length; i++) {
    const link = networkLinks[i];
    if (link.fromId === "me" || link.toId === "me") continue;
    let from = map.get(link.fromId);
    if (!from) {
      from = new Set();
      map.set(link.fromId, from);
    }
    from.add(link.relationType);
    let to = map.get(link.toId);
    if (!to) {
      to = new Set();
      map.set(link.toId, to);
    }
    to.add(link.relationType);
  }
  return map;
}

function relationsForId(
  id: string,
  getPerson: (id: string) => Person | undefined,
  parent: Record<string, string>,
  peerRelations: Map<string, Set<RelationType>>,
): Set<RelationType> {
  const out = new Set<RelationType>();
  const person = getPerson(id);
  if (person && isActiveCircleMember(person)) out.add(person.relation);
  const linked = peerRelations.get(id);
  if (linked) linked.forEach((rel) => out.add(rel));
  const bridgeId = parent[id];
  if (bridgeId && bridgeId !== "me") {
    const bridge = getPerson(bridgeId);
    if (bridge && isActiveCircleMember(bridge)) out.add(bridge.relation);
  }
  return out;
}

export default function GraphClassic() {
  const circleReady = useStore((s) => s.circleReady);
  const circleFull = useStore((s) => s.circleFull);
  const refreshGraph = useStore((s) => s.refreshGraph);
  const [view, setView] = useState<ViewMode>("list");
  const [mapFocus, setMapFocus] = useState<string | null>(null);

  useEffect(() => {
    if (!circleReady || circleFull) return;
    void refreshGraph();
  }, [circleReady, circleFull, refreshGraph]);

  useEffect(() => {
    const ric = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        cancelIdleCallback?: (id: number) => void;
      }
    ).requestIdleCallback;
    if (ric) {
      const id = ric(preloadTrustGraph, { timeout: 700 });
      return () =>
        (
          window as Window & { cancelIdleCallback?: (id: number) => void }
        ).cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(preloadTrustGraph, 280);
    return () => window.clearTimeout(t);
  }, []);

  const showMap = view === "map";

  const onList = useCallback(
    () => startTransition(() => setView("list")),
    [],
  );
  const onMap = useCallback(() => {
    preloadTrustGraph();
    startTransition(() => setView("map"));
  }, []);
  const onShowHub = useCallback((id: string) => {
    preloadTrustGraph();
    setMapFocus(id);
    startTransition(() => setView("map"));
  }, []);

  return (
    <main className="pb-24 min-h-[100dvh]">
      <GraphChrome
        view={showMap ? "map" : "list"}
        mapFocus={mapFocus}
        onList={onList}
        onMap={onMap}
        onShowHub={onShowHub}
      />
      <BottomNav />
    </main>
  );
}

const GraphChrome = memo(function GraphChrome({
  view,
  mapFocus,
  onList,
  onMap,
  onShowHub,
}: {
  view: ViewMode;
  mapFocus: string | null;
  onList: () => void;
  onMap: () => void;
  onShowHub: (id: string) => void;
}) {
  const people = useStore((s) => s.people);
  const getPerson = useStore((s) => s.getPerson);
  const networkLinks = useStore((s) => s.networkLinks);
  const circleFull = useStore((s) => s.circleFull);
  const [relationFilter, setRelationFilter] = useState<RelationFilter>("all");

  const walk = useMemo(
    () => walkTrustNetwork(people, getPerson, networkLinks),
    [people, getPerson, networkLinks],
  );
  const insights = useMemo(
    () => graphInsightsFromWalk(walk, getPerson),
    [walk, getPerson],
  );
  const nameById = useMemo(() => {
    const map: Record<string, string> = { me: "شما" };
    walk.depth.forEach((_, id) => {
      if (id === "me") return;
      map[id] = getPerson(id)?.name?.trim() || "؟";
    });
    return map;
  }, [walk, getPerson]);
  const nameOf = useCallback(
    (id: string) => nameById[id] ?? "؟",
    [nameById],
  );

  const peerRelations = useMemo(
    () => indexPeerRelations(networkLinks),
    [networkLinks],
  );
  const relationsById = useMemo(() => {
    const map = new Map<string, Set<RelationType>>();
    walk.depth.forEach((_, id) => {
      if (id === "me") return;
      map.set(id, relationsForId(id, getPerson, walk.parent, peerRelations));
    });
    return map;
  }, [walk, getPerson, peerRelations]);

  const relationCounts = useMemo(() => {
    const counts: Partial<Record<RelationType, number>> = {};
    relationsById.forEach((rels) => {
      rels.forEach((rel) => {
        counts[rel] = (counts[rel] ?? 0) + 1;
      });
    });
    return counts;
  }, [relationsById]);

  const highlightIds = useMemo(() => {
    if (relationFilter === "all") return null;
    const ids = new Set<string>();
    relationsById.forEach((rels, id) => {
      if (rels.has(relationFilter)) ids.add(id);
    });
    return ids;
  }, [relationFilter, relationsById]);

  const listNodes = useMemo(() => {
    const direct: {
      id: string;
      name: string;
      avatar?: string;
      relation: string;
    }[] = [];
    const via: {
      id: string;
      name: string;
      avatar?: string;
      relation: string;
      depth: number;
    }[] = [];
    walk.depth.forEach((d, id) => {
      if (id === "me") return;
      const person = getPerson(id);
      if (!person) return;
      if (relationFilter !== "all") {
        const rels = relationsById.get(id);
        if (!rels?.has(relationFilter)) return;
      }
      const relation =
        d === 1
          ? viewerRelationPhrase(person)
          : viaPathLabel(pathToMe(id, walk.parent), nameOf);
      const row = {
        id,
        name: person.name,
        avatar: person.avatar,
        relation,
      };
      if (d === 1) direct.push(row);
      else if (d >= 2) via.push({ ...row, depth: d });
    });
    direct.sort((a, b) => a.name.localeCompare(b.name, "fa"));
    via.sort(
      (a, b) => a.depth - b.depth || a.name.localeCompare(b.name, "fa"),
    );
    return { direct, via };
  }, [walk, getPerson, relationFilter, relationsById, nameOf]);

  const graph = useMemo(
    () => (view === "map" ? layoutTrustGraph(walk, getPerson) : null),
    [view, walk, getPerson],
  );

  const chipRelations = useMemo(
    () => RELATION_ORDER.filter((rel) => (relationCounts[rel] ?? 0) > 0),
    [relationCounts],
  );

  const onFilterAll = useCallback(
    () => startTransition(() => setRelationFilter("all")),
    [],
  );
  const onPickRelation = useCallback((rel: RelationType) => {
    startTransition(() => setRelationFilter(rel));
  }, []);

  const subtitle = circleFull
    ? `${toPersianDigits(insights.reach)} نفر · ${toPersianDigits(insights.direct)} ارتباط مستقیم`
    : `${toPersianDigits(insights.direct)} ارتباط مستقیم`;

  return (
    <>
      <Header title="نقشه ارتباط‌ها" subtitle={subtitle} back />

      <div className="px-4 pt-3 space-y-3">
        <div
          className="flex gap-1 bg-stone-100/80 dark:bg-zinc-800 rounded-xl p-1"
          role="tablist"
          aria-label="نحوه نمایش ارتباط‌ها"
        >
          <ViewTab selected={view === "list"} onClick={onList} label="فهرست" />
          <ViewTab
            selected={view === "map"}
            onClick={onMap}
            onPointerEnter={preloadTrustGraph}
            onFocus={preloadTrustGraph}
            label="نقشه"
          />
        </div>

        {chipRelations.length > 0 ? (
          <div
            className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-0.5 px-0.5"
            role="group"
            aria-label="فیلتر نسبت"
          >
            <RelationChip
              active={relationFilter === "all"}
              label="همه"
              count={insights.reach}
              onClick={onFilterAll}
            />
            {chipRelations.map((rel) => (
              <RelationChip
                key={rel}
                active={relationFilter === rel}
                label={relationLabels[rel]}
                count={relationCounts[rel] ?? 0}
                relation={rel}
                onPick={onPickRelation}
              />
            ))}
          </div>
        ) : null}

        {circleFull && insights.hub && insights.hub.count > 1 ? (
          <button
            type="button"
            onClick={() => onShowHub(insights.hub!.id)}
            onPointerEnter={preloadTrustGraph}
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
        ) : null}

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
            {circleFull && graph ? (
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
              count={listNodes.direct.length}
              empty={
                relationFilter === "all"
                  ? "هنوز کسی را مستقیم اضافه نکرده‌ای."
                  : `در «${relationLabels[relationFilter]}» ارتباط مستقیمی نیست.`
              }
            >
              {listNodes.direct.map((n, idx) => (
                  <PersonRow
                    key={n.id}
                    id={n.id}
                    name={n.name}
                    avatar={n.avatar}
                    relation={n.relation}
                    eager={idx < ABOVE_FOLD_AVATARS}
                  />
              ))}
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
                count={listNodes.via.length}
                empty={
                  relationFilter === "all"
                    ? "هنوز کسی از مسیر دیگران به تو وصل نیست."
                    : `با فیلتر «${relationLabels[relationFilter]}» کسی از مسیر دیگران نیست.`
                }
              >
                {listNodes.via.map((n) => (
                  <PersonRow
                    key={n.id}
                    id={n.id}
                    name={n.name}
                    avatar={n.avatar}
                    relation={n.relation}
                  />
                ))}
              </PeopleGroup>
            )}
          </div>
        )}
      </div>
    </>
  );
});

const RelationChip = memo(function RelationChip({
  active,
  label,
  count,
  onClick,
  onPick,
  relation,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick?: () => void;
  onPick?: (rel: RelationType) => void;
  relation?: RelationType;
}) {
  const handleClick = useCallback(() => {
    if (relation && onPick) onPick(relation);
    else onClick?.();
  }, [relation, onPick, onClick]);
  return (
    <button
      type="button"
      onClick={handleClick}
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
});

const ViewTab = memo(function ViewTab({
  selected,
  onClick,
  label,
  onPointerEnter,
  onFocus,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  onPointerEnter?: () => void;
  onFocus?: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onFocus={onFocus}
      className={`flex-1 py-2 rounded-lg text-[13px] font-bold transition-colors ${
        selected
          ? "bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-100/80 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/25"
          : "text-ink-muted dark:text-zinc-400"
      }`}
    >
      {label}
    </button>
  );
});

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
          <span className="inline-flex min-w-[1.2rem] h-5 px-1.5 items-center justify-center rounded-full bg-stone-100 dark:bg-zinc-800 text-[11px] font-extrabold text-ink-muted nums">
            {toPersianDigits(count)}
          </span>
        </div>
        {subtitle ? (
          <p className="text-[11px] text-ink-faint mt-1 leading-snug">
            {subtitle}
          </p>
        ) : null}
      </div>
      {count === 0 ? (
        <p className="px-3.5 py-4 text-[12px] text-ink-faint">{empty}</p>
      ) : (
        <ul className="divide-y divide-stone-100 dark:divide-zinc-800">
          {children}
        </ul>
      )}
    </section>
  );
}

const PersonRow = memo(function PersonRow({
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
    <li className="cv-row">
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
});
