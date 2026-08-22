/** Approximate place for listings/requests — neighborhood, not a street address. */

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

const TEHRAN_HOODS = [
  "پونک",
  "سعادت‌آباد",
  "شهرک غرب",
  "ونک",
  "تجریش",
  "پاسداران",
  "یوسف‌آباد",
  "انقلاب",
  "تهرانپارس",
  "نارمک",
  "ستارخان",
  "اکباتان",
] as const;

const KARAJ_HOODS = [
  "گوهردشت",
  "عظیمیه",
  "جهانشهر",
  "مهرشهر",
] as const;

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

export function parseArea(value: unknown): string | undefined {
  const raw = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
  if (!raw) return undefined;
  if (!ALLOWED.has(raw)) return undefined;
  return raw;
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
