"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { resolveAvatarSrc } from "@/lib/avatar";
import { buildTrustGraph, pathToMe } from "@/lib/graph";
import { relationLabels, levelShort } from "@/lib/labels";
import type { TrustLevel } from "@/lib/types";

const SIZE = 340;
const LEVEL_HEX: Record<TrustLevel, string> = {
  A: "#16a34a",
  B: "#2563eb",
  C: "#d97706",
};
const BRAND = "#7c3aed";

const ekey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export default function TrustGraph() {
  const { people, listings, requests, getPerson } = useStore();
  const [selected, setSelected] = useState<string | null>(null);

  const graph = useMemo(
    () => buildTrustGraph(people, listings, requests, getPerson, SIZE),
    [people, listings, requests, getPerson],
  );

  const nodeById = useMemo(
    () => Object.fromEntries(graph.nodes.map((n) => [n.id, n])),
    [graph],
  );

  const { pathNodes, pathEdges, pathChain } = useMemo(() => {
    if (!selected) {
      return {
        pathNodes: new Set<string>(),
        pathEdges: new Set<string>(),
        pathChain: [] as string[],
      };
    }
    const chain = pathToMe(selected, graph.parent);
    const nodes = new Set(chain);
    const edges = new Set<string>();
    for (let i = 0; i < chain.length - 1; i++) {
      edges.add(ekey(chain[i], chain[i + 1]));
    }
    return { pathNodes: nodes, pathEdges: edges, pathChain: chain };
  }, [selected, graph.parent]);

  const dim = (id: string) => selected != null && !pathNodes.has(id);
  const ringRadii = [SIZE * 0.2, SIZE * 0.33, SIZE * 0.45].slice(
    0,
    graph.maxDepth,
  );

  const selectedNode = selected ? nodeById[selected] : null;
  const selectedPerson = selected ? getPerson(selected) : null;
  const pathLabels = pathChain
    .slice()
    .reverse()
    .map((id) => (id === "me" ? "شما" : nodeById[id]?.name ?? "؟"));

  return (
    <div>
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-brand-50/70 via-[color:var(--circle-surface)] to-teal-50/50 dark:from-brand-500/10 dark:via-zinc-900 dark:to-teal-500/5">
        <svg
          viewBox={`-12 -12 ${SIZE + 24} ${SIZE + 36}`}
          className="w-full select-none"
          onClick={() => setSelected(null)}
          role="img"
          aria-label="گراف حلقه‌ی اعتماد"
        >
          <defs>
            <radialGradient id="tg-center-glow" cx="50%" cy="50%" r="45%">
              <stop offset="0%" stopColor={BRAND} stopOpacity="0.16" />
              <stop offset="70%" stopColor={BRAND} stopOpacity="0.04" />
              <stop offset="100%" stopColor={BRAND} stopOpacity="0" />
            </radialGradient>
            <filter id="tg-soft" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={SIZE * 0.42}
            fill="url(#tg-center-glow)"
          />

          {ringRadii.map((r, i) => (
            <circle
              key={i}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={r}
              fill="none"
              className="stroke-stone-300/70 dark:stroke-zinc-600/50"
              strokeWidth={1}
              strokeDasharray="3 5"
            />
          ))}

          <g className="animate-appear">
            {graph.edges.map((e, i) => {
              const a = nodeById[e.from];
              const b = nodeById[e.to];
              if (!a || !b) return null;
              const hot = pathEdges.has(ekey(e.from, e.to));
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={hot ? BRAND : undefined}
                  strokeWidth={hot ? 2.75 : 1.15}
                  strokeLinecap="round"
                  className={
                    hot
                      ? "transition-[stroke-width,opacity] duration-200"
                      : `stroke-stone-300 dark:stroke-zinc-600 transition-opacity duration-200 ${
                          selected ? "opacity-15" : "opacity-55"
                        }`
                  }
                />
              );
            })}
          </g>

          {graph.nodes.map((n, i) => {
            const isMe = n.id === "me";
            const r = isMe ? 20 : 15.5;
            const onPath = pathNodes.has(n.id);
            const isSelected = selected === n.id;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x} ${n.y})`}
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (!isMe) setSelected((s) => (s === n.id ? null : n.id));
                }}
                className={isMe ? "cursor-default" : "cursor-pointer"}
                role={isMe ? undefined : "button"}
                tabIndex={isMe ? undefined : 0}
                onKeyDown={
                  isMe
                    ? undefined
                    : (ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          setSelected((s) => (s === n.id ? null : n.id));
                        }
                      }
                }
                aria-label={isMe ? undefined : n.name}
              >
                <g
                  className="animate-appear"
                  style={{
                    animationDelay: `${n.depth * 140 + (i % 7) * 36}ms`,
                  }}
                >
                  <g
                    className={`transition-opacity duration-200 ${
                      dim(n.id) ? "opacity-25" : "opacity-100"
                    }`}
                  >
                    {(isMe || onPath || isSelected) && (
                      <circle
                        r={r + (isSelected ? 7 : 5)}
                        fill={isMe ? BRAND : LEVEL_HEX[n.level ?? "C"]}
                        opacity={isSelected ? 0.28 : 0.16}
                        filter={isMe ? "url(#tg-soft)" : undefined}
                      />
                    )}
                    <defs>
                      <clipPath id={`tg-clip-${n.id}`}>
                        <circle r={r} />
                      </clipPath>
                    </defs>
                    <image
                      href={resolveAvatarSrc(n.name, n.avatar)}
                      x={-r}
                      y={-r}
                      width={r * 2}
                      height={r * 2}
                      clipPath={`url(#tg-clip-${n.id})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                    <circle
                      r={r}
                      fill="none"
                      stroke={
                        isMe
                          ? "rgba(255,255,255,0.35)"
                          : LEVEL_HEX[n.level ?? "C"]
                      }
                      strokeWidth={isMe ? 2 : isSelected ? 3 : 2.4}
                    />
                    <text
                      y={r + 12}
                      textAnchor="middle"
                      fontSize={9.5}
                      fontWeight={onPath || isMe || isSelected ? 700 : 500}
                      className="fill-zinc-700 dark:fill-zinc-300"
                    >
                      {n.name}
                    </text>
                  </g>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-center gap-3.5 text-[11px] text-ink-muted dark:text-zinc-400 mt-3 px-1">
        {(
          [
            ["A", "bg-levelA"],
            ["B", "bg-levelB"],
            ["C", "bg-levelC"],
          ] as const
        ).map(([lvl, cls]) => (
          <span key={lvl} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cls}`} aria-hidden />
            سطح {lvl}
          </span>
        ))}
      </div>

      <div className="mt-3 min-h-[72px]">
        {selectedNode && selectedPerson ? (
          <div className="rounded-xl border border-brand-200/70 dark:border-brand-500/25 bg-brand-50/50 dark:bg-brand-500/10 p-3.5 animate-fade-up">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-white dark:ring-zinc-900 bg-zinc-100 dark:bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveAvatarSrc(
                    selectedPerson.name,
                    selectedPerson.avatar,
                  )}
                  alt=""
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-bold text-[14px] text-ink dark:text-zinc-100 truncate">
                    {selectedPerson.name}
                  </p>
                  {selectedNode.level && (
                    <span
                      className="chip !py-0.5 !px-2 text-white"
                      style={{
                        backgroundColor: LEVEL_HEX[selectedNode.level],
                      }}
                    >
                      {levelShort[selectedNode.level]}
                    </span>
                  )}
                  <span className="chip !py-0.5 !px-2 bg-[color:var(--circle-surface)] text-ink-muted ring-1 ring-stone-200/70 dark:ring-zinc-700">
                    {relationLabels[selectedPerson.relation]}
                  </span>
                </div>
                <p className="text-[12px] text-ink dark:text-zinc-200 font-medium mt-1 leading-relaxed">
                  {pathLabels.join(" ← ")}
                </p>
              </div>
            </div>
            {!selectedNode.inCircle && (
              <p className="text-[11px] text-ink-muted mb-2 leading-relaxed">
                خارج از حلقه‌ی مستقیم — از مسیر اعتماد به تو وصل است.
              </p>
            )}
            <div className="flex gap-2">
              <Link
                href={`/person/${selected}`}
                className="btn-primary flex-1 !py-2.5 text-sm text-center"
              >
                مشاهده پروفایل
              </Link>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="btn-ghost !py-2.5 px-4 text-sm"
              >
                بستن
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-[12px] text-ink-faint dark:text-zinc-500 py-3 leading-relaxed px-2">
            روی هر نفر بزن تا مسیر اعتمادش تا تو روشن شود.
          </p>
        )}
      </div>
    </div>
  );
}
