"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { buildTrustGraph, pathToMe } from "@/lib/graph";
import { relationLabels, levelShort } from "@/lib/labels";
import type { TrustLevel } from "@/lib/types";

const SIZE = 320;
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

  // Highlighted path (node ids + edge keys) for the selected person.
  const { pathNodes, pathEdges } = useMemo(() => {
    if (!selected) return { pathNodes: new Set<string>(), pathEdges: new Set<string>() };
    const chain = pathToMe(selected, graph.parent);
    const nodes = new Set(chain);
    const edges = new Set<string>();
    for (let i = 0; i < chain.length - 1; i++) edges.add(ekey(chain[i], chain[i + 1]));
    return { pathNodes: nodes, pathEdges: edges };
  }, [selected, graph.parent]);

  const dim = (id: string) => selected != null && !pathNodes.has(id);
  const ringRadii = [SIZE * 0.2, SIZE * 0.33, SIZE * 0.45].slice(0, graph.maxDepth);

  const selectedNode = selected ? nodeById[selected] : null;
  const selectedPerson = selected ? getPerson(selected) : null;

  return (
    <div>
      <svg
        viewBox={`-20 -16 ${SIZE + 40} ${SIZE + 48}`}
        className="w-full select-none"
        onClick={() => setSelected(null)}
        role="img"
        aria-label="گراف حلقه‌ی اعتماد"
      >
        {/* concentric rings */}
        {ringRadii.map((r, i) => (
          <circle
            key={i}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={r}
            fill="none"
            className="stroke-zinc-200/70 dark:stroke-zinc-700/60"
            strokeWidth={1}
            strokeDasharray="2 4"
          />
        ))}

        {/* edges */}
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
              strokeWidth={hot ? 2.5 : 1.2}
              className={
                hot
                  ? ""
                  : `stroke-zinc-300 dark:stroke-zinc-600 ${selected ? "opacity-20" : "opacity-60"}`
              }
            />
          );
        })}

        {/* nodes */}
        {graph.nodes.map((n) => {
          const isMe = n.id === "me";
          const r = isMe ? 19 : 16;
          const onPath = pathNodes.has(n.id);
          return (
            <g
              key={n.id}
              transform={`translate(${n.x} ${n.y})`}
              onClick={(ev) => {
                ev.stopPropagation();
                if (!isMe) setSelected((s) => (s === n.id ? null : n.id));
              }}
              className={`cursor-pointer transition-opacity ${dim(n.id) ? "opacity-30" : "opacity-100"}`}
            >
              {(isMe || onPath) && (
                <circle r={r + 4} fill={isMe ? BRAND : LEVEL_HEX[n.level ?? "C"]} opacity={0.18} />
              )}
              <circle
                r={r}
                className={isMe ? "" : "fill-white dark:fill-zinc-900"}
                fill={isMe ? BRAND : undefined}
                stroke={isMe ? "none" : LEVEL_HEX[n.level ?? "C"]}
                strokeWidth={2.5}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={isMe ? 18 : 15}
              >
                {n.avatar}
              </text>
              <text
                y={r + 11}
                textAnchor="middle"
                fontSize={9}
                fontWeight={onPath || isMe ? 700 : 500}
                className="fill-zinc-600 dark:fill-zinc-300"
              >
                {n.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Readout */}
      <div className="px-1 mt-2 min-h-[64px]">
        {selectedNode && selectedPerson ? (
          <div className="card p-3 animate-fade-up">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">{selectedNode.avatar}</span>
              <span className="font-bold text-zinc-900">{selectedPerson.name}</span>
              {selectedNode.level && (
                <span
                  className="chip text-white"
                  style={{ backgroundColor: LEVEL_HEX[selectedNode.level] }}
                >
                  {levelShort[selectedNode.level]}
                </span>
              )}
              <span className="chip bg-zinc-100 text-zinc-500">
                {relationLabels[selectedPerson.relation]}
              </span>
            </div>
            <p className="text-sm text-brand-700 dark:text-brand-300 font-medium leading-relaxed">
              {pathToMe(selected!, graph.parent)
                .reverse()
                .map((id) => (id === "me" ? "شما" : nodeById[id]?.name ?? "؟"))
                .join(" ← ")}
            </p>
            {!selectedNode.inCircle && (
              <p className="text-[11px] text-zinc-400 mt-1">
                خارج از حلقه‌ی مستقیم — از طریق مسیر اعتماد به شما وصل است.
              </p>
            )}
          </div>
        ) : (
          <p className="text-center text-xs text-zinc-400 py-4">
            روی هر نفر بزن تا مسیر اعتمادش تا تو روشن شود.
          </p>
        )}
      </div>
    </div>
  );
}
