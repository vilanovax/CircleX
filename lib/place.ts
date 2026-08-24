/** Approximate place for listings/requests — neighborhood, not a street address. */

import { toEnglishDigits } from "@/lib/persian";
import { TEHRAN_HOODS } from "@/lib/tehran-hoods";

export { TEHRAN_HOODS };

export const AREA_CITYWIDE = "سراسر شهر";
export const AREA_ONLINE = "آنلاین";
export const AREA_SHIP = "ارسال";

export type AreaMode = "place" | "online" | "ship";

export const AREA_MODES: {
  id: AreaMode;
  label: string;
  hint: string;
}[] = [
  {
    id: "place",
    label: "حضوری",
    hint: "بازدید یا تحویل در شهر — محله اختیاری است",
  },
  {
    id: "online",
    label: "آنلاین",
    hint: "کار از راه دور است؛ محل لازم نیست",
  },
  {
    id: "ship",
    label: "ارسال",
    hint: "پست یا پیک؛ آدرس بعداً هماهنگ می‌شود",
  },
];

const SPECIALS = [AREA_CITYWIDE, AREA_ONLINE, AREA_SHIP] as const;

const TEHRAN_REGIONS = [
  "شمال تهران",
  "شرق تهران",
  "غرب تهران",
  "مرکز تهران",
] as const;

const KARAJ_HOODS = [
  "گوهردشت",
  "عظیمیه",
  "جهانشهر",
  "مهرشهر",
] as const;

export const CATALOG_CITY_SEED: {
  name: string;
  enabled: boolean;
  regions: string[];
  hoods: string[];
}[] = [
  {
    name: "تهران",
    enabled: true,
    regions: [...TEHRAN_REGIONS],
    hoods: [...TEHRAN_HOODS],
  },
  {
    name: "کرج",
    enabled: true,
    regions: [],
    hoods: [...KARAJ_HOODS],
  },
];

const BY_CITY: Record<
  string,
  { regions: readonly string[]; hoods: readonly string[] }
> = {
  تهران: { regions: TEHRAN_REGIONS, hoods: TEHRAN_HOODS },
  کرج: { regions: [], hoods: KARAJ_HOODS },
};

const ALLOWED = new Set<string>([
  ...SPECIALS,
  ...TEHRAN_REGIONS,
  ...TEHRAN_HOODS,
  ...KARAJ_HOODS,
]);

export function areaChoices(city?: string): string[] {
  const pack = BY_CITY[normalizeCity(city)];
  if (!pack) return [...SPECIALS];
  return [...SPECIALS, ...pack.regions, ...pack.hoods];
}

export function areaPlaces(city?: string): {
  regions: readonly string[];
  hoods: readonly string[];
} {
  return BY_CITY[normalizeCity(city)] ?? { regions: [], hoods: [] };
}

export function areaMode(area?: string): AreaMode {
  if (area === AREA_ONLINE) return "online";
  if (area === AREA_SHIP) return "ship";
  return "place";
}

export function areaFromMode(mode: AreaMode): string {
  if (mode === "online") return AREA_ONLINE;
  if (mode === "ship") return AREA_SHIP;
  return AREA_CITYWIDE;
}

export function foldAreaName(value: string): string {
  return toEnglishDigits(value)
    .replace(/\u200c/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

const ALLOWED_FOLD = new Map<string, string>();
Array.from(ALLOWED).forEach((name) => {
  ALLOWED_FOLD.set(foldAreaName(name), name);
});

export function parseArea(
  value: unknown,
  extra: Iterable<string> = [],
): string | undefined {
  const raw = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48);
  if (!raw) return undefined;
  if (ALLOWED.has(raw)) return raw;
  const folded = foldAreaName(raw);
  const known = ALLOWED_FOLD.get(folded);
  if (known) return known;
  for (const name of Array.from(extra)) {
    if (name === raw || foldAreaName(name) === folded) return name;
  }
  return undefined;
}

export function mergePlaceNames(
  primary: readonly string[],
  extra: readonly string[] = [],
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const name of [...primary, ...extra]) {
    const key = foldAreaName(name);
    if (key.length < 2 || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

export function compareHoodsFa(a: string, b: string): number {
  return foldAreaName(a).localeCompare(foldAreaName(b), "fa");
}

export function sortHoodsFa(hoods: readonly string[]): string[] {
  return [...hoods].sort(compareHoodsFa);
}

export function filterHoods(hoods: readonly string[], query: string): string[] {
  const q = foldAreaName(query);
  if (!q) return [];
  const starts: string[] = [];
  const rest: string[] = [];
  for (const name of hoods) {
    const folded = foldAreaName(name);
    if (folded.startsWith(q)) starts.push(name);
    else if (folded.includes(q)) rest.push(name);
  }
  starts.sort(compareHoodsFa);
  rest.sort(compareHoodsFa);
  return starts.concat(rest);
}

/** Short line for feed cards. */
export function placeCardLabel(city?: string, area?: string): string {
  const a = area?.trim();
  if (!a || a === AREA_CITYWIDE) return city?.trim() || "";
  if (a === AREA_ONLINE || a === AREA_SHIP) return a;
  return a;
}

/** Detail line: neighborhood plus city when useful. */
export function placeDetailLabel(city?: string, area?: string): string {
  const a = area?.trim();
  const c = city?.trim();
  if (!a || a === AREA_CITYWIDE) return c || "";
  if (a === AREA_ONLINE || a === AREA_SHIP) return a;
  if (c && !a.includes(c)) return `${a}، ${c}`;
  return a;
}

function normalizeCity(city?: string): string {
  return (city ?? "").replace(/\s+/g, " ").trim();
}
