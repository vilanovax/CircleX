import type { ListingSpec } from "./types";

/** Specs the buyer already sees as title/price chips — skip in the table. */
export const HIDDEN_SPEC_LABELS = new Set(["قیمت", "قابل مذاکره"]);

const HERO_PRIORITY = [
  "کارکرد",
  "مدل / رنگ",
  "مدل (سال تولید)",
  "سلامت باتری",
  "محل سرویس",
  "رنگ",
  "سال",
  "مدل",
  "بیمه",
];

export function visibleListingSpecs(specs: ListingSpec[]): ListingSpec[] {
  return specs.filter((s) => !HIDDEN_SPEC_LABELS.has(s.label));
}

/** Three scan-first facts, or empty when the listing has fewer than three. */
export function pickHeroSpecs(specs: ListingSpec[]): ListingSpec[] {
  const visible = visibleListingSpecs(specs);
  if (visible.length < 3) return [];

  const used = new Set<string>();
  const picked: ListingSpec[] = [];

  function take(row: ListingSpec) {
    if (used.has(row.label) || picked.length >= 3) return;
    used.add(row.label);
    picked.push(row);
  }

  for (const label of HERO_PRIORITY) {
    const row = visible.find((s) => s.label === label);
    if (row) take(row);
  }
  for (const row of visible) take(row);

  return picked.length === 3 ? picked : [];
}
