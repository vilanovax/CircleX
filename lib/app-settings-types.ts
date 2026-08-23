export type AppFlags = {
  aiPolish: boolean;
  waveInvites: boolean;
  requests: boolean;
  events: boolean;
  listingReports: boolean;
  watches: boolean;
};

export type GrowthSettings = {
  inviteTtlDays: number;
  waveMaxUses: number;
};

export type AuthSettings = {
  otpTtlMinutes: number;
  otpMaxAttempts: number;
};

export type CatalogCity = {
  name: string;
  enabled: boolean;
  regions: string[];
  hoods: string[];
};

export type CatalogSettings = {
  cities: CatalogCity[];
  categories: string[];
};

export type AppSettings = {
  flags: AppFlags;
  growth: GrowthSettings;
  auth: AuthSettings;
  catalog: CatalogSettings;
  updatedAt: string | null;
};

export type PublicCatalog = {
  cities: CatalogCity[];
  categories: string[];
  flags: AppFlags;
  growth: GrowthSettings;
};

export const DEFAULT_FLAGS: AppFlags = {
  aiPolish: true,
  waveInvites: true,
  requests: true,
  events: true,
  listingReports: true,
  watches: true,
};

export const DEFAULT_GROWTH: GrowthSettings = {
  inviteTtlDays: 7,
  waveMaxUses: 10,
};

export const DEFAULT_AUTH: AuthSettings = {
  otpTtlMinutes: 5,
  otpMaxAttempts: 5,
};

export const DEFAULT_CATEGORIES = [
  "لوازم خانه",
  "الکترونیک",
  "پوشاک",
  "کودک",
  "ورزش",
  "آموزش",
  "خودرو",
  "خدمات",
  "کتاب",
  "اهدا",
  "لوازم دیجیتال",
  "خدمات فنی",
];

export function catalogAreaNames(catalog: CatalogSettings): string[] {
  const names: string[] = [];
  for (const city of catalog.cities) {
    if (!city.enabled) continue;
    names.push(...city.regions, ...city.hoods);
  }
  return names;
}

export function inviteTtlMs(days: number): number {
  return Math.max(1, days) * 24 * 60 * 60 * 1000;
}

export function otpTtlMs(minutes: number): number {
  return Math.max(1, minutes) * 60 * 1000;
}
