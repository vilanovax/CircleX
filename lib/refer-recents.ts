const STORAGE_PREFIX = "circle.referRecents.";
const MAX_RECENTS = 8;

function storageKey(viewerId: string): string {
  return `${STORAGE_PREFIX}${viewerId || "me"}`;
}

export function loadReferRecents(viewerId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(viewerId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const value of parsed) {
      if (typeof value !== "string" || !value || seen.has(value)) continue;
      seen.add(value);
      ids.push(value);
      if (ids.length >= MAX_RECENTS) break;
    }
    return ids;
  } catch {
    return [];
  }
}

export function rememberReferRecipient(viewerId: string, peerId: string): void {
  if (typeof window === "undefined" || !peerId) return;
  const next = [
    peerId,
    ...loadReferRecents(viewerId).filter((id) => id !== peerId),
  ].slice(0, MAX_RECENTS);
  try {
    localStorage.setItem(storageKey(viewerId), JSON.stringify(next));
  } catch {
    /* private mode / quota */
  }
}
