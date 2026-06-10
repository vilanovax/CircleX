import type { Listing, Person, Request, TrustLevel } from "./types";

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
}

const LEVEL_ORDER: Record<TrustLevel, number> = { A: 0, B: 1, C: 2 };

/**
 * Build a radial trust graph centred on "me". Circle members sit on the inner
 * ring; friends-of-friends fan out on deeper rings near the person who
 * connects them. Edges come from direct membership plus every post's trust path.
 */
export function buildTrustGraph(
  people: Person[],
  listings: Listing[],
  requests: Request[],
  getPerson: (id: string) => Person | undefined,
  size = 320,
): TrustGraph {
  const C = size / 2;
  const ringRadius = [0, size * 0.2, size * 0.33, size * 0.45];

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

  // Direct circle membership.
  people.filter((p) => p.inMyCircle).forEach((p) => link("me", p.id));

  // Trust-path chains from every post: me → hop0 → … → poster.
  const chains: string[][] = [
    ...listings.map((l) => ["me", ...l.trustPath.map((h) => h.personId), l.sellerId]),
    ...requests.map((r) => ["me", ...r.trustPath.map((h) => h.personId), r.requesterId]),
  ];
  chains.forEach((chain) => {
    for (let i = 0; i < chain.length - 1; i++) link(chain[i], chain[i + 1]);
  });

  // BFS from me → shortest depth + parent for each reachable node.
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

  // Group nodes by depth.
  const byDepth = new Map<number, string[]>();
  depth.forEach((d, id) => {
    if (id === "me") return;
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d)!.push(id);
  });

  const angle = new Map<string, number>([["me", -90]]);

  // Inner ring: spread evenly, grouped by trust level.
  const ring1 = (byDepth.get(1) ?? []).slice().sort((a, b) => {
    const pa = getPerson(a);
    const pb = getPerson(b);
    const la = pa ? LEVEL_ORDER[pa.level] : 9;
    const lb = pb ? LEVEL_ORDER[pb.level] : 9;
    return la - lb || (pa?.name ?? "").localeCompare(pb?.name ?? "");
  });
  ring1.forEach((id, i) => {
    angle.set(id, -90 + (360 / Math.max(ring1.length, 1)) * i);
  });

  // Deeper rings: cluster children around their parent's angle.
  const maxDepth = Math.max(1, ...Array.from(byDepth.keys()));
  for (let d = 2; d <= maxDepth; d++) {
    const groups = new Map<string, string[]>();
    (byDepth.get(d) ?? []).forEach((id) => {
      const par = parent.get(id)!;
      if (!groups.has(par)) groups.set(par, []);
      groups.get(par)!.push(id);
    });
    const spread = 18;
    groups.forEach((children) => {
      const base = angle.get(parent.get(children[0])!) ?? -90;
      children.forEach((id, j) => {
        angle.set(id, base + (j - (children.length - 1) / 2) * spread);
      });
    });
  }

  const nodes: GraphNode[] = Array.from(depth.entries()).map(([id, d]) => {
    const p = getPerson(id);
    const a = ((angle.get(id) ?? -90) * Math.PI) / 180;
    const r = ringRadius[Math.min(d, 3)];
    return {
      id,
      name: id === "me" ? "شما" : p?.name ?? "؟",
      avatar: id === "me" ? "🧑" : p?.avatar ?? "❓",
      level: id === "me" ? undefined : p?.level,
      depth: d,
      parentId: parent.get(id),
      inCircle: id === "me" ? true : Boolean(p?.inMyCircle),
      x: C + r * Math.cos(a),
      y: C + r * Math.sin(a),
    };
  });

  return {
    nodes,
    edges,
    parent: Object.fromEntries(parent),
    maxDepth,
    size,
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
  return path; // [node, …, "me"]
}
