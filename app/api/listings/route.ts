import { Prisma } from "@prisma/client";
import { catalogExtraAreas } from "@/lib/app-settings";
import { prisma } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { toClientListing } from "@/lib/mappers";
import { parseListingWrite } from "@/lib/listing-payload";
import { getSessionUser } from "@/lib/server-auth";
import {
  assertExcludePeopleInCircle,
  listingViewerFlags,
  replaceListingExcludes,
} from "@/lib/server-listing-privacy";
import { fanoutListingWatches } from "@/lib/server-watches";
import { notifyDirectCircleListing } from "@/lib/server-notices";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const parsed = parseListingWrite(
    await readJson(req),
    await catalogExtraAreas(),
  );
  if (!parsed.ok) return jsonError(parsed.error, 400);
  const peopleOk = await assertExcludePeopleInCircle(
    session.id,
    parsed.data.excludePersonIds ?? [],
  );
  if (!peopleOk.ok) return jsonError(peopleOk.error, 400);

  const row = await prisma.marketListing.create({
    data: {
      sellerId: session.id,
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      price: parsed.data.price ?? null,
      category: parsed.data.category,
      image: parsed.data.image,
      images: parsed.data.images,
      condition: parsed.data.condition ?? null,
      privacy: parsed.data.privacy,
      hideIdentity: parsed.data.hideIdentity ?? false,
      excludeRelationTypes: parsed.data.excludeRelationTypes ?? [],
      city: session.city || "تهران",
      area: parsed.data.area ?? null,
      dealStatus: "available",
      specs: parsed.data.specs
        ? (parsed.data.specs as unknown as Prisma.InputJsonValue)
        : undefined,
    },
  });
  await replaceListingExcludes(row.id, parsed.data.excludePersonIds ?? []);
  const flags = await listingViewerFlags(session.id, [row]);

  void fanoutListingWatches({
    id: row.id,
    sellerId: row.sellerId,
    title: row.title,
    description: row.description,
    privacy: row.privacy,
    dealStatus: row.dealStatus,
    hideIdentity: row.hideIdentity,
    excludeRelationTypes: row.excludeRelationTypes,
  }).catch(() => {});

  void notifyDirectCircleListing({
    sellerId: row.sellerId,
    sellerName: session.name,
    listingId: row.id,
    title: row.title,
    privacy: row.privacy,
    dealStatus: row.dealStatus,
    hideIdentity: row.hideIdentity,
    excludeRelationTypes: row.excludeRelationTypes,
  }).catch(() => {});

  return Response.json({
    listing: toClientListing(row, session.id, [], {
      revealed: flags.revealedIds.has(row.id),
      excludePersonIds: flags.excludeIdsByListing.get(row.id),
      identityRevealedPeerIds: flags.revealPeersByListing.get(row.id),
    }),
  });
}
