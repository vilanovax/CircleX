"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_FLAGS,
  DEFAULT_GROWTH,
  type PublicCatalog,
} from "./app-settings-types";
import { CATALOG_CITY_SEED } from "./place";

export const FALLBACK_CATALOG: PublicCatalog = {
  cities: CATALOG_CITY_SEED.map((city) => ({
    name: city.name,
    enabled: city.enabled,
    regions: [...city.regions],
    hoods: [...city.hoods],
  })),
  categories: [...DEFAULT_CATEGORIES],
  flags: { ...DEFAULT_FLAGS },
  growth: { ...DEFAULT_GROWTH },
};

let cache: PublicCatalog | null = null;
let inflight: Promise<PublicCatalog> | null = null;

export function loadCatalog(): Promise<PublicCatalog> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = api<PublicCatalog>("/api/catalog")
    .then((data) => {
      cache = data;
      return data;
    })
    .catch(() => FALLBACK_CATALOG)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useCatalog(): PublicCatalog {
  const [data, setData] = useState<PublicCatalog>(cache ?? FALLBACK_CATALOG);

  useEffect(() => {
    let live = true;
    void loadCatalog().then((next) => {
      if (live) setData(next);
    });
    return () => {
      live = false;
    };
  }, []);

  return data;
}
