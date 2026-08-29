"use client";

import Link from "next/link";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { resolveAvatarSrc } from "@/lib/avatar";
import {
  connectionPathSentence,
  depthRingLabel,
  pathToMe,
  type TrustGraph as TrustGraphModel,
} from "@/lib/graph";
import { relationLabels } from "@/lib/labels";
import { viewerRelationPhrase } from "@/lib/trust";
import type { Person } from "@/lib/types";
import { personHref } from "@/lib/nav-back";

const BRAND = "#7c3aed";
const RING = "rgba(120,113,108,0.42)";
const MIN_K = 1;
const MAX_K = 2.8;

const ekey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function TrustGraph({
  graph,
  getPerson,
  focusId = null,
  highlightIds = null,
}: {
  graph: TrustGraphModel;
  getPerson: (id: string) => Person | undefined;
  focusId?: string | null;
  /** When set, nodes outside this set are dimmed ( «me» always stays bright). */
  highlightIds?: Set<string> | null;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [showFaces, setShowFaces] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setShowFaces(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const nodeById = useMemo(() => {
    const map = new Map<string, (typeof graph.nodes)[number]>();
    for (let i = 0; i < graph.nodes.length; i++) {
      const n = graph.nodes[i];
      map.set(n.id, n);
    }
    return map;
  }, [graph]);

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

  const filtering = Boolean(highlightIds && highlightIds.size > 0);
  const dim = (id: string) => {
    if (selected != null) return !pathNodes.has(id);
    if (!filtering || id === "me") return false;
    return !highlightIds!.has(id);
  };
  const edgeFaint = (from: string, to: string) => {
    if (selected != null) return !pathEdges.has(ekey(from, to));
    if (!filtering) return false;
    const ok = (id: string) => id === "me" || highlightIds!.has(id);
    return !(ok(from) && ok(to));
  };
  const size = graph.size;

  const selectedNode = selected ? nodeById.get(selected) ?? null : null;
  const selectedPerson = selected ? getPerson(selected) : null;

  const pathCopy = useMemo(() => {
    if (!selected || pathChain.length === 0) return null;
    return connectionPathSentence(pathChain, (id) =>
      id === "me" ? "شما" : (nodeById.get(id)?.name ?? "؟"),
    );
  }, [selected, pathChain, nodeById]);

  useEffect(() => {
    if (focusId) setSelected(focusId);
  }, [focusId]);

  const svgRef = useRef<SVGSVGElement>(null);
  const viewRef = useRef({ cx: size / 2, cy: size / 2, k: 1 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{
    dist: number;
    k: number;
    midSvg: { x: number; y: number };
  } | null>(null);
  const pan = useRef<{
    x: number;
    y: number;
    cx: number;
    cy: number;
  } | null>(null);
  const dragged = useRef(false);

  const applyView = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const { cx, cy, k } = viewRef.current;
    const w = size / k;
    svg.setAttribute("viewBox", `${cx - w / 2} ${cy - w / 2} ${w} ${w}`);
    const next = k > 1.02;
    setZoomed((z) => (z === next ? z : next));
  };

  const resetView = () => {
    viewRef.current = { cx: size / 2, cy: size / 2, k: 1 };
    applyView();
  };

  const clampCenter = () => {
    const { k } = viewRef.current;
    if (k <= 1.001) {
      viewRef.current.k = 1;
      viewRef.current.cx = size / 2;
      viewRef.current.cy = size / 2;
      return;
    }
    const half = size / (2 * k);
    const pad = half * 0.35;
    viewRef.current.cx = clamp(viewRef.current.cx, half - pad, size - half + pad);
    viewRef.current.cy = clamp(viewRef.current.cy, half - pad, size - half + pad);
  };

  useEffect(() => {
    viewRef.current = { cx: size / 2, cy: size / 2, k: 1 };
    applyView();
    // size is the only reset trigger — applyView reads refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  const clientToSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: size / 2, y: size / 2 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const m = svg.getScreenCTM();
    if (!m) return { x: size / 2, y: size / 2 };
    const p = pt.matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged.current = false;
    if (pointers.current.size === 1) {
      pan.current = {
        x: e.clientX,
        y: e.clientY,
        cx: viewRef.current.cx,
        cy: viewRef.current.cy,
      };
      pinch.current = null;
    } else if (pointers.current.size >= 2) {
      const pts = Array.from(pointers.current.values());
      const a = pts[0]!;
      const b = pts[1]!;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        k: viewRef.current.k,
        midSvg: clientToSvg(mid.x, mid.y),
      };
      pan.current = null;
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width < 1) return;

    if (pointers.current.size >= 2 && pinch.current) {
      const pts = Array.from(pointers.current.values());
      const a = pts[0]!;
      const b = pts[1]!;
      const dist = Math.max(8, Math.hypot(a.x - b.x, a.y - b.y));
      const k = clamp((pinch.current.k * dist) / pinch.current.dist, MIN_K, MAX_K);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const w = size / k;
      const fx = (mid.x - rect.left) / rect.width;
      const fy = (mid.y - rect.top) / rect.height;
      viewRef.current.k = k;
      viewRef.current.cx = pinch.current.midSvg.x - fx * w + w / 2;
      viewRef.current.cy = pinch.current.midSvg.y - fy * w + w / 2;
      clampCenter();
      dragged.current = true;
      applyView();
      return;
    }

    if (pointers.current.size === 1 && pan.current && viewRef.current.k > 1.02) {
      const dx = e.clientX - pan.current.x;
      const dy = e.clientY - pan.current.y;
      if (Math.hypot(dx, dy) > 5) dragged.current = true;
      const w = size / viewRef.current.k;
      viewRef.current.cx = pan.current.cx - (dx / rect.width) * w;
      viewRef.current.cy = pan.current.cy - (dy / rect.height) * w;
      clampCenter();
      applyView();
    } else if (pointers.current.size === 1 && pan.current) {
      const dx = e.clientX - pan.current.x;
      const dy = e.clientY - pan.current.y;
      if (Math.hypot(dx, dy) > 8) dragged.current = true;
    }
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) pan.current = null;
    if (pointers.current.size === 1) {
      const only = Array.from(pointers.current.values())[0]!;
      pan.current = {
        x: only.x,
        y: only.y,
        cx: viewRef.current.cx,
        cy: viewRef.current.cy,
      };
    }
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      if (rect.width < 1) return;
      const k0 = viewRef.current.k;
      const k = clamp(k0 * (e.deltaY < 0 ? 1.12 : 1 / 1.12), MIN_K, MAX_K);
      if (k === k0) return;
      const w = size / k;
      const fx = (e.clientX - rect.left) / rect.width;
      const fy = (e.clientY - rect.top) / rect.height;
      const focus = clientToSvg(e.clientX, e.clientY);
      viewRef.current.k = k;
      viewRef.current.cx = focus.x - fx * w + w / 2;
      viewRef.current.cy = focus.y - fy * w + w / 2;
      clampCenter();
      applyView();
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
    // zoom helpers close over size + refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  const selectNode = (id: string) => {
    if (dragged.current) return;
    setSelected((s) => (s === id ? null : id));
  };

  const legend = graph.legend;

  return (
    <div>
      {legend.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-1 pb-2">
          {legend.map((ring) => (
            <span
              key={ring.key}
              className="text-[11px] font-bold text-ink-muted dark:text-zinc-400 nums"
            >
              {ring.label}
              <span className="text-ink-faint font-semibold">
                {" "}
                {ring.count}
              </span>
            </span>
          ))}
        </div>
      ) : null}
      <div
        dir="ltr"
        className="relative rounded-xl overflow-hidden bg-gradient-to-br from-brand-50/70 via-[color:var(--circle-surface)] to-teal-50/50 dark:from-brand-500/10 dark:via-zinc-900 dark:to-teal-500/5"
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${size} ${size}`}
          className="w-full aspect-square select-none block touch-none"
          style={{ touchAction: "none" }}
          onClick={() => {
            if (!dragged.current) setSelected(null);
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="img"
          aria-label="نقشه ارتباط‌های حلقه‌ات"
        >
          <defs>
            <radialGradient id="tg-center-glow" cx="50%" cy="50%" r="45%">
              <stop offset="0%" stopColor={BRAND} stopOpacity="0.16" />
              <stop offset="70%" stopColor={BRAND} stopOpacity="0.04" />
              <stop offset="100%" stopColor={BRAND} stopOpacity="0" />
            </radialGradient>
            <clipPath id="tg-clip-me">
              <circle r={graph.meR} />
            </clipPath>
            <clipPath id="tg-clip-node">
              <circle r={graph.nodeR} />
            </clipPath>
          </defs>

          <circle
            cx={size / 2}
            cy={size / 2}
            r={Math.max(size * 0.22, (graph.rings[0]?.radius ?? 80) * 0.62)}
            fill="url(#tg-center-glow)"
          />

          {graph.rings.map((ring) => (
            <circle
              key={ring.key}
              cx={size / 2}
              cy={size / 2}
              r={ring.radius}
              fill="none"
              className="stroke-stone-300/80 dark:stroke-zinc-600/55"
              strokeWidth={1.15}
              strokeDasharray="4 5"
            />
          ))}

          <g>
            {graph.edges.map((e) => {
              const a = nodeById.get(e.from);
              const b = nodeById.get(e.to);
              if (!a || !b) return null;
              const hot = pathEdges.has(ekey(e.from, e.to));
              const faint = !hot && edgeFaint(e.from, e.to);
              return (
                <line
                  key={ekey(e.from, e.to)}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={hot ? BRAND : undefined}
                  strokeWidth={hot ? 3 : 1.2}
                  strokeLinecap="round"
                  className={
                    hot
                      ? "transition-[stroke-width,opacity] duration-200"
                      : `stroke-stone-400 dark:stroke-zinc-500 transition-opacity duration-200 ${
                          faint
                            ? "opacity-[0.06]"
                            : selected
                              ? "opacity-15"
                              : "opacity-55"
                        }`
                  }
                />
              );
            })}
          </g>

          {graph.nodes.map((n) => {
            const isMe = n.id === "me";
            const r = isMe ? graph.meR : graph.nodeR;
            const onPath = pathNodes.has(n.id);
            const isSelected = selected === n.id;
            const showName = true;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x} ${n.y})`}
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (!isMe) selectNode(n.id);
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
                          selectNode(n.id);
                        }
                      }
                }
                aria-label={isMe ? undefined : n.name}
              >
                <g
                  className={`transition-opacity duration-200 ${
                    dim(n.id)
                      ? "opacity-[0.12] grayscale"
                      : "opacity-100"
                  }`}
                >
                  {(isMe || onPath || isSelected) && (
                    <circle
                      r={r + (isSelected ? 7 : 5)}
                      fill={BRAND}
                      opacity={isSelected ? 0.28 : isMe ? 0.16 : 0.12}
                    />
                  )}
                  <circle r={r} className="fill-white dark:fill-zinc-800" />
                  {showFaces ? (
                    <image
                      href={resolveAvatarSrc(n.name, n.avatar)}
                      x={-r}
                      y={-r}
                      width={r * 2}
                      height={r * 2}
                      clipPath={`url(#tg-clip-${isMe ? "me" : "node"})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  ) : null}
                  <circle
                    r={r}
                    fill="none"
                    stroke={isMe || isSelected || onPath ? BRAND : RING}
                    strokeWidth={
                      isMe ? 2.4 : isSelected ? 3.1 : onPath ? 2.4 : 2
                    }
                  />
                  {showName ? (
                    <text
                      y={r + 12}
                      textAnchor="middle"
                      fontSize={isMe ? 10 : 8.5}
                      fontWeight={onPath || isMe || isSelected ? 700 : 600}
                      className="fill-zinc-700 dark:fill-zinc-300"
                    >
                      {n.name.length > 7 ? `${n.name.slice(0, 6)}…` : n.name}
                    </text>
                  ) : null}
                </g>
              </g>
            );
          })}
        </svg>

        {zoomed ? (
          <button
            type="button"
            onClick={resetView}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[color:var(--circle-surface)]/95 dark:bg-zinc-900/95 px-3 py-1.5 text-[11px] font-bold text-brand-700 dark:text-brand-300 shadow-sm ring-1 ring-stone-200/80 dark:ring-zinc-700"
          >
            نمایش همه
          </button>
        ) : null}
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
                href={personHref(selected, "graph")}
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
              مسیر وصل شدنش روشن می‌شود. دو انگشت بزن تا نزدیک شوی، بعد
              بکش.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(TrustGraph);
