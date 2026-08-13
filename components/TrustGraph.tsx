"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { resolveAvatarSrc } from "@/lib/avatar";
import {
  buildTrustGraph,
  connectionPathSentence,
  depthRingLabel,
  pathToMe,
} from "@/lib/graph";
import { relationLabels } from "@/lib/labels";
import { viewerRelationPhrase } from "@/lib/trust";

const SIZE = 340;
const BRAND = "#7c3aed";
const RING = "rgba(120,113,108,0.42)";

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

  const pathCopy = useMemo(() => {
    if (!selected || pathChain.length === 0) return null;
    return connectionPathSentence(pathChain, (id) =>
      id === "me" ? "شما" : (nodeById[id]?.name ?? "؟"),
    );
  }, [selected, pathChain, nodeById]);

  return (
    <div>
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-brand-50/70 via-[color:var(--circle-surface)] to-teal-50/50 dark:from-brand-500/10 dark:via-zinc-900 dark:to-teal-500/5">
        <svg
          viewBox={`-12 -12 ${SIZE + 24} ${SIZE + 36}`}
          className="w-full select-none"
          onClick={() => setSelected(null)}
          role="img"
          aria-label="نقشه ارتباطات شبکه شما"
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

          {ringRadii.map((r, i) => {
            const depth = i + 1;
            const labelY = SIZE / 2 - r;
            return (
              <g key={i}>
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={r}
                  fill="none"
                  className="stroke-stone-300/80 dark:stroke-zinc-600/55"
                  strokeWidth={1.15}
                  strokeDasharray="4 5"
                />
                <rect
                  x={SIZE / 2 - 28}
                  y={labelY - 7}
                  width={56}
                  height={14}
                  rx={7}
                  className="fill-[color:var(--circle-surface)] dark:fill-zinc-900"
                  opacity={0.92}
                />
                <text
                  x={SIZE / 2}
                  y={labelY + 3.5}
                  textAnchor="middle"
                  fontSize={8.5}
                  fontWeight={700}
                  className="fill-zinc-500 dark:fill-zinc-400"
                >
                  {depthRingLabel(depth)}
                </text>
              </g>
            );
          })}

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
                  strokeWidth={hot ? 3 : 1.35}
                  strokeLinecap="round"
                  className={
                    hot
                      ? "transition-[stroke-width,opacity] duration-200"
                      : `stroke-stone-400 dark:stroke-zinc-500 transition-opacity duration-200 ${
                          selected ? "opacity-12" : "opacity-70"
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
                      dim(n.id) ? "opacity-22" : "opacity-100"
                    }`}
                  >
                    {(isMe || onPath || isSelected) && (
                      <circle
                        r={r + (isSelected ? 7 : 5)}
                        fill={BRAND}
                        opacity={isSelected ? 0.28 : isMe ? 0.16 : 0.12}
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
                        isMe || isSelected || onPath ? BRAND : RING
                      }
                      strokeWidth={
                        isMe ? 2 : isSelected ? 3.25 : onPath ? 2.6 : 2.2
                      }
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

      <div className="mt-3 min-h-[88px]">
        {selectedNode && selectedPerson && pathCopy ? (
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
                </div>
                <p className="text-[12px] text-ink-muted mt-0.5">
                  {selectedNode.inCircle
                    ? viewerRelationPhrase(selectedPerson)
                    : relationLabels[selectedPerson.relation]}
                  {" · "}
                  {depthRingLabel(selectedNode.depth)}
                </p>
              </div>
            </div>
            <p className="text-[13px] font-semibold text-ink dark:text-zinc-100 leading-relaxed">
              {pathCopy.sentence}
            </p>
            <p className="text-[11px] text-ink-muted mt-1 nums leading-relaxed">
              مسیر: {pathCopy.trail}
            </p>
            <div className="flex gap-2 mt-3">
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
          <div className="rounded-xl bg-stone-50/90 dark:bg-zinc-800/50 px-3 py-3 text-center">
            <p className="text-[13px] font-semibold text-ink dark:text-zinc-200">
              یک نفر را لمس کن
            </p>
            <p className="text-[12px] text-ink-faint dark:text-zinc-500 mt-0.5 leading-relaxed">
              مسیر اتصالش تا تو روشن می‌شود — مستقیم یا از طریق دیگران.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
