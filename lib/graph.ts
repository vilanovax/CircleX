import { isActiveCircleMember } from "./circle-member";
import type { Listing, Person, Request, TrustLevel } from "./types";
import { resolveAvatarSrc } from "./avatar";

export interface GraphNode {
  id: string;
  name: string;
  avatar: string;
  level?: TrustLevel;
  depth: number;
  parentId?: string;
  inCircle: boolean;
  x: number;
  y: number;
  /** Distance from center — used to draw the ring this node sits on. */
  ring: number;
  /** How many nodes share this ring (for label crowding). */
  ringCount: number;
}

export interface GraphRing {
  key: string;
  radius: number;
  label: string;
  count: number;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface TrustGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** node id -> parent id (one step closer to me) */
  parent: Record<string, string>;
  maxDepth: number;
  size: number;
  rings: GraphRing[];
  nodeR: number;
  meR: number;
  legend: GraphRing[];
}

const LEVEL_RING_LABEL: Record<TrustLevel, string> = {
  A: "نزدیکان",
  B: "مورد اعتماد",
  C: "آشنایان",
};

const VIEW_MIN = 360;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Build a radial trust graph centred on "me". Direct members sit on A→B→C
 * rings packed by circumference (never more faces than the ring can hold).
 * Friends-of-friends sit further out, near the person who connects them.
 */
export function buildTrustGraph(
  people: Person[],
  listings: Listing[],
  requests: Request[],
  getPerson: (id: string) => Person | undefined,
  viewSize?: number,
): TrustGraph {
  const edges: GraphEdge[] = [];
  const edgeKeys = new Set<string>();
  const adj = new Map<string, Set<string>>();

  const link = (a: string, b: string) => {
    if (a === b) return;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (!edgeKeys.has(key)) {
      edgeKeys.add(key);
      edges.push({ from: a, to: b });
    }
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  };

  people.filter(isActiveCircleMember).forEach((p) => link("me", p.id));

  const chains: string[][] = [
    ...listings.map((l) => ["me", ...l.trustPath.map((h) => h.personId), l.sellerId]),
    ...requests.map((r) => ["me", ...r.trustPath.map((h) => h.personId), r.requesterId]),
  ];
  chains.forEach((chain) => {
    for (let i = 0; i < chain.length - 1; i++) link(chain[i], chain[i + 1]);
  });

  const depth = new Map<string, number>([["me", 0]]);
  const parent = new Map<string, string>();
  const queue = ["me"];
  while (queue.length) {
    const cur = queue.shift()!;
    const d = depth.get(cur)!;
    (adj.get(cur) ?? new Set<string>()).forEach((nb) => {
      if (!depth.has(nb)) {
        depth.set(nb, d + 1);
        parent.set(nb, cur);
        queue.push(nb);
      }
    });
  }

  const byDepth = new Map<number, string[]>();
  depth.forEach((d, id) => {
    if (id === "me") return;
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d)!.push(id);
  });

  const byLevel: Record<TrustLevel, string[]> = { A: [], B: [], C: [] };
  (byDepth.get(1) ?? []).forEach((id) => {
    const level = getPerson(id)?.level ?? "B";
    byLevel[level].push(id);
  });
  (["A", "B", "C"] as TrustLevel[]).forEach((lvl) => {
    byLevel[lvl].sort((a, b) =>
      (getPerson(a)?.name ?? "").localeCompare(getPerson(b)?.name ?? "", "fa"),
    );
  });

  const maxDepth = Math.max(1, ...Array.from(byDepth.keys()));
  const viaIds: string[] = [];
  for (let d = 2; d <= maxDepth; d++) {
    viaIds.push(...(byDepth.get(d) ?? []));
  }
  viaIds.sort((a, b) =>
    (getPerson(a)?.name ?? "").localeCompare(getPerson(b)?.name ?? "", "fa"),
  );

  type Seat = { id: string; group: "A" | "B" | "C" | "via" };
  const directs: Seat[] = [
    ...byLevel.A.map((id) => ({ id, group: "A" as const })),
    ...byLevel.B.map((id) => ({ id, group: "B" as const })),
    ...byLevel.C.map((id) => ({ id, group: "C" as const })),
  ];
  const vias: Seat[] = viaIds.map((id) => ({ id, group: "via" as const }));
  const crowd = directs.length + vias.length;

  const nodeR = crowd > 24 ? 12.5 : crowd > 14 ? 13.5 : 15;
  const meR = 19;
  const minArc = nodeR * 2 + 14;
  const ringGap = nodeR * 2 + 18;
  const innerR = meR + nodeR + 22;

  type Lane = { key: string; ids: string[]; label: string; via: boolean };
  const planned: Lane[] = [];

  const groupLabel = (group: Seat["group"]) =>
    group === "via" ? "از طریق دیگران" : LEVEL_RING_LABEL[group];

  const pack = (seats: Seat[], via: boolean) => {
    let i = 0;
    let ringIndex = 0;
    let r = planned.length === 0 ? innerR : innerR + planned.length * ringGap;
    while (i < seats.length) {
      const cap = Math.min(
        10,
        Math.max(6, Math.floor((2 * Math.PI * r) / minArc)),
      );
      const slice = seats.slice(i, i + cap);
      const first = slice[0]!;
      const labeled = !planned.some((p) => p.label === groupLabel(first.group));
      planned.push({
        key: `${first.group}-${ringIndex}`,
        ids: slice.map((s) => s.id),
        label: labeled ? groupLabel(first.group) : "",
        via,
      });
      i += slice.length;
      ringIndex += 1;
      r += ringGap;
    }
  };

  pack(directs, false);
  pack(vias, true);

  const lastR =
    planned.length === 0 ? innerR : innerR + (planned.length - 1) * ringGap;
  const size = viewSize ?? Math.max(VIEW_MIN, Math.ceil(2 * (lastR + nodeR + 22)));

  const legend: GraphRing[] = [
    { key: "A", radius: 0, label: LEVEL_RING_LABEL.A, count: byLevel.A.length },
    { key: "B", radius: 0, label: LEVEL_RING_LABEL.B, count: byLevel.B.length },
    { key: "C", radius: 0, label: LEVEL_RING_LABEL.C, count: byLevel.C.length },
    { key: "via", radius: 0, label: "از طریق دیگران", count: viaIds.length },
  ].filter((item) => item.count > 0);
  const C = size / 2;
  const fitScale = lastR > 0 ? clamp((C - nodeR - 26) / lastR, 0.72, 1) : 1;

  const angle = new Map<string, number>([["me", -90]]);
  const radius = new Map<string, number>([["me", 0]]);
  const ringCount = new Map<string, number>([["me", 1]]);
  const rings: GraphRing[] = [];

  planned.forEach((lane, laneIndex) => {
    const r = (innerR + laneIndex * ringGap) * fitScale;
    rings.push({
      key: lane.key,
      radius: r,
      label: lane.label,
      count: lane.ids.length,
    });

    if (lane.via) {
      const groups = new Map<string, string[]>();
      lane.ids.forEach((id) => {
        const par = parent.get(id) ?? "me";
        if (!groups.has(par)) groups.set(par, []);
        groups.get(par)!.push(id);
      });
      const n = lane.ids.length;
      const fallbackGap = 360 / Math.max(n, 1);
      let cursor = 0;
      groups.forEach((children) => {
        const par = parent.get(children[0]!) ?? "me";
        const base = angle.get(par) ?? -90 + cursor * fallbackGap;
        const spread = children.length === 1 ? 0 : 22;
        children.forEach((id, j) => {
          angle.set(id, base + (j - (children.length - 1) / 2) * spread);
          radius.set(id, r);
          ringCount.set(id, n);
        });
        cursor += children.length;
      });
    } else {
      const n = lane.ids.length;
      // Gap at 12 o'clock so the ring title does not sit on a face.
      const start = -90 + 180 / n + laneIndex * (9 + 180 / n);
      lane.ids.forEach((id, i) => {
        angle.set(id, start + (360 / n) * i);
        radius.set(id, r);
        ringCount.set(id, n);
      });
    }
  });

  const nodes: GraphNode[] = Array.from(depth.entries()).map(([id, d]) => {
    const p = getPerson(id);
    const a = ((angle.get(id) ?? -90) * Math.PI) / 180;
    const r = radius.get(id) ?? 0;
    return {
      id,
      name: id === "me" ? "شما" : p?.name ?? "؟",
      avatar: p?.avatar ?? resolveAvatarSrc(p?.name ?? id),
      level: id === "me" ? undefined : p?.level,
      depth: d,
      parentId: parent.get(id),
      inCircle: id === "me" ? true : Boolean(p && isActiveCircleMember(p)),
      x: C + r * Math.cos(a),
      y: C + r * Math.sin(a),
      ring: r,
      ringCount: ringCount.get(id) ?? 1,
    };
  });

  return {
    nodes,
    edges,
    parent: Object.fromEntries(parent),
    maxDepth,
    size,
    rings,
    nodeR,
    meR,
    legend,
  };
}

/** The chain of node ids from a node up to "me" (inclusive of both). */
export function pathToMe(nodeId: string, parent: Record<string, string>): string[] {
  const path = [nodeId];
  let cur = nodeId;
  while (parent[cur]) {
    cur = parent[cur];
    path.push(cur);
  }
  return path;
}

export interface GraphInsights {
  /** People reachable through the network (excludes me). */
  reach: number;
  /** Direct, closest (level-A) members. */
  levelA: number;
  /** Direct circle size (inMyCircle / depth-1). */
  direct: number;
  /** Reachable only through someone else (depth ≥ 2). */
  viaOthers: number;
  /** The connector most trust paths pass through, if any. */
  hub: { id: string; name: string; count: number } | null;
}

/** Headline numbers for the trust graph. */
export function graphInsights(graph: TrustGraph): GraphInsights {
  const nameById: Record<string, string> = Object.fromEntries(
    graph.nodes.map((n) => [n.id, n.name]),
  );
  const through = new Map<string, number>();
  graph.nodes.forEach((n) => {
    if (n.id === "me") return;
    const chain = pathToMe(n.id, graph.parent);
    chain.slice(1, -1).forEach((id) => {
      through.set(id, (through.get(id) ?? 0) + 1);
    });
  });

  let hub: GraphInsights["hub"] = null;
  through.forEach((count, id) => {
    if (!hub || count > hub.count) {
      hub = { id, name: nameById[id] ?? "؟", count };
    }
  });

  const direct = graph.nodes.filter((n) => n.id !== "me" && n.depth === 1).length;
  const viaOthers = graph.nodes.filter((n) => n.depth >= 2).length;

  return {
    reach: graph.nodes.length - 1,
    levelA: graph.nodes.filter((n) => n.level === "A").length,
    direct,
    viaOthers,
    hub,
  };
}

/** Plain-language hop label for a depth ring (1 = direct). */
export function depthRingLabel(depth: number): string {
  if (depth <= 1) return "مستقیم";
  return "از طریق آشنایان";
}

/** Human path sentence from selected node toward me. */
export function connectionPathSentence(
  pathFromNodeToMe: string[],
  nameOf: (id: string) => string,
): { sentence: string; trail: string } {
  const chain = pathFromNodeToMe.slice().reverse();
  const trail = chain
    .map((id) => (id === "me" ? "شما" : nameOf(id)))
    .join(" ← ");
  if (chain.length <= 2) {
    const name = nameOf(chain[chain.length - 1] ?? "");
    return {
      sentence: `${name} را مستقیم می‌شناسید.`,
      trail,
    };
  }
  const vias = chain.slice(1, -1).map((id) => nameOf(id));
  if (vias.length === 1) {
    return {
      sentence: `از طریق ${vias[0]} به حلقهٔ شما وصل است.`,
      trail,
    };
  }
  return {
    sentence: `از طریق ${vias.join(" و ")} به حلقهٔ شما وصل است.`,
    trail,
  };
}
