import {
  DEMO_DIRECT,
  DEMO_FOF,
  DEMO_PHONES,
  VIEWER_LISTING_DEFS,
} from "@/lib/demo-circle-catalog";
import { HOUSEHOLD_ITEMS } from "@/lib/family-catalog";
import { getAppSettings } from "@/lib/app-settings";
import { prisma } from "@/lib/db";
import { TEHRAN_HOODS } from "@/lib/tehran-hoods";

export async function loadTehranHoods(): Promise<string[]> {
  const settings = await getAppSettings();
  const tehran = settings.catalog.cities.find(
    (city) => city.enabled && city.name.trim() === "تهران",
  );
  const hoods = (tehran?.hoods ?? []).map((name) => name.trim()).filter((name) => name.length >= 2);
  return hoods.length > 0 ? hoods : [...TEHRAN_HOODS];
}

/** Stable pick so re-seed does not reshuffle, but ads still spread across hoods. */
export function pickTehranHood(key: string, hoods: string[]): string {
  const list = hoods.length > 0 ? hoods : TEHRAN_HOODS;
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return list[Math.abs(hash) % list.length]!;
}

export async function assignTehranHoodsToListings(
  listings: { id: string; title: string; sellerId: string; area: string | null }[],
  hoods: string[],
) {
  for (const row of listings) {
    const area = pickTehranHood(`${row.sellerId}:${row.title}`, hoods);
    if (row.area === area) continue;
    await prisma.marketListing.update({
      where: { id: row.id },
      data: { area },
    });
  }
}

export async function assignTehranHoodsToWants(
  wants: { id: string; title: string; requesterId: string; area: string | null }[],
  hoods: string[],
) {
  for (const row of wants) {
    const area = pickTehranHood(`${row.requesterId}:${row.title}`, hoods);
    if (row.area === area) continue;
    await prisma.wantRequest.update({
      where: { id: row.id },
      data: { area },
    });
  }
}

function seedListingTitles(): string[] {
  return Array.from(
    new Set([
      ...DEMO_DIRECT.flatMap((person) => person.listings.map((item) => item.title)),
      ...DEMO_FOF.flatMap((person) => person.listings.map((item) => item.title)),
      ...VIEWER_LISTING_DEFS.map((item) => item.title),
      ...HOUSEHOLD_ITEMS.map((item) => item.title),
    ]),
  );
}

/** Assign a Tehran hood from catalog settings to every seeded listing and want. */
export async function backfillAllSeedTehranAreas(): Promise<{
  listings: number;
  wants: number;
  hoods: number;
}> {
  const hoods = await loadTehranHoods();
  const demoUsers = await prisma.user.findMany({
    where: { phoneNormalized: { in: Object.values(DEMO_PHONES) } },
    select: { id: true },
  });
  const demoIds = demoUsers.map((user) => user.id);
  const titles = seedListingTitles();

  const listings = await prisma.marketListing.findMany({
    where: {
      OR: [
        ...(demoIds.length > 0 ? [{ sellerId: { in: demoIds } }] : []),
        { title: { in: titles } },
      ],
    },
    select: { id: true, title: true, sellerId: true, area: true },
  });
  await assignTehranHoodsToListings(listings, hoods);

  const wants = await prisma.wantRequest.findMany({
    where: {
      OR: [
        ...(demoIds.length > 0 ? [{ requesterId: { in: demoIds } }] : []),
        { id: { startsWith: "demo_req_" } },
      ],
    },
    select: { id: true, title: true, requesterId: true, area: true },
  });
  await assignTehranHoodsToWants(wants, hoods);

  return { listings: listings.length, wants: wants.length, hoods: hoods.length };
}
