import type { Person } from "@/lib/types";

export const CIRCLO_PEER_ID = "circlo";

export const CIRCLO_PERSON: Person = {
  id: CIRCLO_PEER_ID,
  name: "سیرکلو",
  avatar: "",
  relation: "acquaintance",
  level: "C",
  deals: 0,
  inMyCircle: false,
  note: "از سیرکل",
};

export function isCircloPeer(id: string | null | undefined): boolean {
  return id === CIRCLO_PEER_ID;
}
