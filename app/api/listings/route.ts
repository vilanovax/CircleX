import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { toClientListing } from "@/lib/mappers";
import { parseListingWrite } from "@/lib/listing-payload";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const parsed = parseListingWrite(await readJson(req));
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
      specs: parsed.data.specs
        ? (parsed.data.specs as unknown as Prisma.InputJsonValue)
        : undefined,
    },
  });

  return Response.json({ listing: toClientListing(row, session.id) });
}
