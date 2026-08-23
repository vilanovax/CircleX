import type { Prisma } from "@prisma/client";
import { jsonError } from "./http";
import { prisma } from "./db";
import { CATALOG_CITY_SEED } from "./place";
import {
  catalogAreaNames,
  DEFAULT_AUTH,
  DEFAULT_CATEGORIES,
  DEFAULT_FLAGS,
  DEFAULT_GROWTH,
  type AppFlags,
  type AppSettings,
  type AuthSettings,
  type CatalogCity,
  type CatalogSettings,
  type GrowthSettings,
  type PublicCatalog,
} from "./app-settings-types";

export type { AppFlags, AppSettings, AuthSettings, CatalogCity, CatalogSettings, GrowthSettings, PublicCatalog };
export {
  catalogAreaNames,
  inviteTtlMs,
  otpTtlMs,
} from "./app-settings-types";

const SETTING_ID = "app";

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function asName(value: unknown, max = 40): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function parseFlags(raw: unknown): AppFlags {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    aiPolish: asBool(row.aiPolish, DEFAULT_FLAGS.aiPolish),
    waveInvites: asBool(row.waveInvites, DEFAULT_FLAGS.waveInvites),
    requests: asBool(row.requests, DEFAULT_FLAGS.requests),
    events: asBool(row.events, DEFAULT_FLAGS.events),
    listingReports: asBool(row.listingReports, DEFAULT_FLAGS.listingReports),
    watches: asBool(row.watches, DEFAULT_FLAGS.watches),
  };
}

function parseGrowth(raw: unknown): GrowthSettings {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    inviteTtlDays: asInt(row.inviteTtlDays, DEFAULT_GROWTH.inviteTtlDays, 1, 30),
    waveMaxUses: asInt(row.waveMaxUses, DEFAULT_GROWTH.waveMaxUses, 2, 20),
  };
}

function parseAuth(raw: unknown): AuthSettings {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    otpTtlMinutes: asInt(row.otpTtlMinutes, DEFAULT_AUTH.otpTtlMinutes, 1, 15),
    otpMaxAttempts: asInt(row.otpMaxAttempts, DEFAULT_AUTH.otpMaxAttempts, 3, 10),
  };
}

function parseCity(raw: unknown): CatalogCity | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const name = asName(row.name);
  if (name.length < 2) return null;
  const regions = Array.isArray(row.regions)
    ? row.regions.map((item) => asName(item)).filter((item) => item.length >= 2)
    : [];
  const hoods = Array.isArray(row.hoods)
    ? row.hoods.map((item) => asName(item)).filter((item) => item.length >= 2)
    : [];
  return {
    name,
    enabled: asBool(row.enabled, true),
    regions: Array.from(new Set(regions)).slice(0, 40),
    hoods: Array.from(new Set(hoods)).slice(0, 40),
  };
}

function parseCatalog(raw: unknown): CatalogSettings {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const cities = Array.isArray(row.cities)
    ? row.cities.map(parseCity).filter((c): c is CatalogCity => Boolean(c))
    : CATALOG_CITY_SEED.map((city) => ({
        name: city.name,
        enabled: city.enabled,
        regions: [...city.regions],
        hoods: [...city.hoods],
      }));
  const seen = new Set<string>();
  const unique: CatalogCity[] = [];
  for (const city of cities.slice(0, 40)) {
    if (seen.has(city.name)) continue;
    seen.add(city.name);
    unique.push(city);
  }
  const categories = Array.isArray(row.categories)
    ? Array.from(
        new Set(
          row.categories
            .map((item) => asName(item))
            .filter((item) => item.length >= 2),
        ),
      )
    : [...DEFAULT_CATEGORIES];
  return {
    cities: unique.length ? unique : CATALOG_CITY_SEED.map((city) => ({
      name: city.name,
      enabled: city.enabled,
      regions: [...city.regions],
      hoods: [...city.hoods],
    })),
    categories: categories.slice(0, 40),
  };
}

export function defaultAppSettings(): AppSettings {
  return {
    flags: { ...DEFAULT_FLAGS },
    growth: { ...DEFAULT_GROWTH },
    auth: { ...DEFAULT_AUTH },
    catalog: parseCatalog({
      cities: CATALOG_CITY_SEED,
      categories: DEFAULT_CATEGORIES,
    }),
    updatedAt: null,
  };
}

function toSettings(row: {
  flags: Prisma.JsonValue;
  growth: Prisma.JsonValue;
  auth: Prisma.JsonValue;
  catalog: Prisma.JsonValue;
  updatedAt: Date;
}): AppSettings {
  return {
    flags: parseFlags(row.flags),
    growth: parseGrowth(row.growth),
    auth: parseAuth(row.auth),
    catalog: parseCatalog(row.catalog),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getAppSettings(): Promise<AppSettings> {
  const existing = await prisma.appSetting.findUnique({
    where: { id: SETTING_ID },
  });
  if (existing) return toSettings(existing);
  const seed = defaultAppSettings();
  const created = await prisma.appSetting.upsert({
    where: { id: SETTING_ID },
    update: {},
    create: {
      id: SETTING_ID,
      flags: seed.flags,
      growth: seed.growth,
      auth: seed.auth,
      catalog: seed.catalog,
    },
  });
  return toSettings(created);
}

export async function saveAppSettings(
  next: AppSettings,
  updatedBy: string | null,
): Promise<AppSettings> {
  const flags = parseFlags(next.flags);
  const growth = parseGrowth(next.growth);
  const auth = parseAuth(next.auth);
  const catalog = parseCatalog(next.catalog);
  const row = await prisma.appSetting.upsert({
    where: { id: SETTING_ID },
    create: {
      id: SETTING_ID,
      flags,
      growth,
      auth,
      catalog,
      updatedBy,
    },
    update: {
      flags,
      growth,
      auth,
      catalog,
      updatedBy,
    },
  });
  return toSettings(row);
}

export async function getPublicCatalog(): Promise<PublicCatalog> {
  const settings = await getAppSettings();
  return {
    cities: settings.catalog.cities.filter((city) => city.enabled),
    categories: settings.catalog.categories,
    flags: settings.flags,
    growth: settings.growth,
  };
}

export async function catalogExtraAreas(): Promise<string[]> {
  const settings = await getAppSettings();
  return catalogAreaNames(settings.catalog);
}

export async function assertFlag(
  flag: keyof AppFlags,
): Promise<true | Response> {
  const settings = await getAppSettings();
  if (!settings.flags[flag]) {
    return jsonError("این قابلیت فعلاً خاموش است", 403, "flag_off");
  }
  return true;
}
