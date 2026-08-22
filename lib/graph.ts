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

/** BFS from «me» — enough for the list tab without packing rings. */
export interface TrustWalk {
  edges: GraphEdge[];
  parent: Record<string, string>;
  depth: Map<string, number>;
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

function addEdge(
  a: string,
  b: string,
  edges: GraphEdge[],
  edgeKeys: Set<string>,
  adj: Map<string, Set<string>>,
) {
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
}

/**
 * Reachability from «me» via the circle and FoF links.
 * Skips radial packing so the list tab can paint before the map layout.
 */
export function walkTrustNetwork(
  people: Person[],
  getPerson: (id: string) => Person | undefined,
  networkLinks: { fromId: string; toId: string }[] = [],
  listings: Listing[] = [],
  requests: Request[] = [],
): TrustWalk {
  const edges: GraphEdge[] = [];
  const edgeKeys = new Set<string>();
  const adj = new Map<string, Set<string>>();

  const link = (a: string, b: string) => addEdge(a, b, edges, edgeKeys, adj);

  for (let i = 0; i < people.length; i++) {
    const p = people[i];
    if (isActiveCircleMember(p)) link("me", p.id);
  }

  const known = (id: string) => id === "me" || Boolean(getPerson(id));
  for (let i = 0; i < networkLinks.length; i++) {
    const l = networkLinks[i];
    const a = l.fromId === "me" ? "me" : l.fromId;
    const b = l.toId === "me" ? "me" : l.toId;
    if (!known(a) || !known(b)) continue;
    link(a, b);
  }

  const chains: string[][] = [
    ...listings.map((l) => [
      "me",
      ...l.trustPath.map((h) => h.personId),
      l.sellerId,
    ]),
    ...requests.map((r) => [
      "me",
      ...r.trustPath.map((h) => h.personId),
      r.requesterId,
    ]),
  ];
  for (let c = 0; c < chains.length; c++) {
    const chain = chains[c]!;
    for (let i = 0; i < chain.length - 1; i++) {
      const a = chain[i]!;
      const b = chain[i + 1]!;
      if (!known(a) || !known(b)) continue;
      link(a, b);
    }
  }

  const depth = new Map<string, number>([["me", 0]]);
  const parent = new Map<string, string>();
  const queue = ["me"];
  let q = 0;
  while (q < queue.length) {
    const cur = queue[q++]!;
    const d = depth.get(cur)!;
    const nbs = adj.get(cur);
    if (!nbs) continue;
    nbs.forEach((nb) => {
      if (!depth.has(nb)) {
        depth.set(nb, d + 1);
        parent.set(nb, cur);
        queue.push(nb);
      }
    });
  }

  return {
    edges,
    parent: Object.fromEntries(parent),
    depth,
  };
}

/**
 * Pack a finished BFS walk onto concentric rings. Call this only when the
 * map tab needs coordinates — the list tab can stop at `walkTrustNetwork`.
 */
export function layoutTrustGraph(
  walk: TrustWalk,
  getPerson: (id: string) => Person | undefined,
  viewSize?: number,
): TrustGraph {
  const { edges, parent, depth } = walk;

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
        const par = parent[id] ?? "me";
        if (!groups.has(par)) groups.set(par, []);
        groups.get(par)!.push(id);
      });
      const n = lane.ids.length;
      const fallbackGap = 360 / Math.max(n, 1);
      let cursor = 0;
      groups.forEach((children) => {
        const par = parent[children[0]!] ?? "me";
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

  const nodes: GraphNode[] = Array.from(depth.entries())
    .filter(([id]) => id === "me" || Boolean(getPerson(id)))
    .map(([id, d]) => {
    const p = getPerson(id);
    const a = ((angle.get(id) ?? -90) * Math.PI) / 180;
    const r = radius.get(id) ?? 0;
    return {
      id,
      name: id === "me" ? "شما" : p?.name?.trim() || "عضو حلقه",
      avatar: p?.avatar ?? resolveAvatarSrc(p?.name ?? id),
      level: id === "me" ? undefined : p?.level,
      depth: d,
      parentId: parent[id],
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
    parent,
    maxDepth,
    size,
    rings,
    nodeR,
    meR,
    legend,
  };
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
  networkLinks: { fromId: string; toId: string }[] = [],
): TrustGraph {
  return layoutTrustGraph(
    walkTrustNetwork(people, getPerson, networkLinks, listings, requests),
    getPerson,
    viewSize,
  );
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

/** Headline numbers from a laid-out graph (map tab / tests). */
export function graphInsights(graph: TrustGraph): GraphInsights {
  const depth = new Map<string, number>();
  const nodesById = new Map(graph.nodes.map((n) => [n.id, n]));
  for (const n of graph.nodes) depth.set(n.id, n.depth);
  return graphInsightsFromWalk({ parent: graph.parent, depth }, (id) => {
    const n = nodesById.get(id);
    if (!n || n.id === "me") return undefined;
    return { id: n.id, name: n.name, level: n.level ?? "B" } as Person;
  });
}

export function graphInsightsFromWalk(
  walk: {
    parent: Record<string, string>;
    depth: Map<string, number>;
  },
  getPerson: (id: string) => Person | undefined,
): GraphInsights {
  const nameById: Record<string, string> = { me: "شما" };
  const through = new Map<string, number>();
  let direct = 0;
  let viaOthers = 0;
  let levelA = 0;
  let reach = 0;

  walk.depth.forEach((d, id) => {
    if (id === "me") return;
    const person = getPerson(id);
    if (!person && d !== 0) return;
    reach += 1;
    if (d === 1) {
      direct += 1;
      if (person?.level === "A") levelA += 1;
    } else if (d >= 2) {
      viaOthers += 1;
    }
    nameById[id] = person?.name?.trim() || "؟";
    const chain = pathToMe(id, walk.parent);
    for (let i = 1; i < chain.length - 1; i++) {
      const hop = chain[i]!;
      through.set(hop, (through.get(hop) ?? 0) + 1);
    }
  });

  let hub: GraphInsights["hub"] = null;
  through.forEach((count, id) => {
    if (!hub || count > hub.count) {
      hub = { id, name: nameById[id] ?? "؟", count };
    }
  });

  return {
    reach,
    levelA,
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
    .map((id) => (id === "me" ? "تو" : nameOf(id)))
    .join(" ← ");
  if (chain.length <= 2) {
    const name = nameOf(chain[chain.length - 1] ?? "");
    return {
      sentence: `${name} را مستقیم می‌شناسی.`,
      trail,
    };
  }
  const vias = chain.slice(1, -1).map((id) => nameOf(id));
  if (vias.length === 1) {
    return {
      sentence: `از طریق ${vias[0]} به حلقه‌ات وصل است.`,
      trail,
    };
  }
  return {
    sentence: `از طریق ${vias.join(" و ")} به حلقه‌ات وصل است.`,
    trail,
  };
}
