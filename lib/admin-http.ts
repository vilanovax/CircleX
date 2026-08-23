export type AdminListMeta = {
  total: number;
  take: number;
  skip: number;
};

export function parseListParams(url: URL, fallbackTake = 50): {
  take: number;
  skip: number;
} {
  const take = Math.min(
    Math.max(Number(url.searchParams.get("limit") ?? fallbackTake) || fallbackTake, 1),
    100,
  );
  const skip = Math.max(Number(url.searchParams.get("skip") ?? 0) || 0, 0);
  return { take, skip };
}

export function listEnvelope<T>(
  items: T[],
  meta: AdminListMeta,
): { items: T[]; meta: AdminListMeta } {
  return { items, meta };
}

export function parseAdminReason(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 500) : "";
}

export function parseBoolParam(url: URL, key: string): boolean | undefined {
  const v = url.searchParams.get(key);
  if (v === "1" || v === "true") return true;
  if (v === "0" || v === "false") return false;
  return undefined;
}

export function parseHiddenParam(url: URL): boolean | undefined {
  const raw = url.searchParams.get("hidden");
  if (raw === "1" || raw === "true" || raw === "hidden") return true;
  if (raw === "0" || raw === "false" || raw === "visible") return false;
  return undefined;
}
