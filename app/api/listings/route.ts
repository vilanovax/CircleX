import { Prisma } from "@prisma/client";
import { catalogExtraAreas } from "@/lib/app-settings";
import { prisma } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { toClientListing } from "@/lib/mappers";
import { parseListingWrite } from "@/lib/listing-payload";
import { getSessionUser } from "@/lib/server-auth";
import { fanoutListingWatches } from "@/lib/server-watches";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const parsed = parseListingWrite(
    await readJson(req),
    await catalogExtraAreas(),
  );
  if (!parsed.ok) return jsonError(parsed.error, 400);

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
      city: session.city || "تهران",
      area: parsed.data.area ?? null,
      dealStatus: "available",
      specs: parsed.data.specs
        ? (parsed.data.specs as unknown as Prisma.InputJsonValue)
        : undefined,
    },
  });

  void fanoutListingWatches({
    id: row.id,
    sellerId: row.sellerId,
    title: row.title,
    description: row.description,
    privacy: row.privacy,
    dealStatus: row.dealStatus,
  }).catch(() => {});

  return Response.json({ listing: toClientListing(row, session.id) });
}
