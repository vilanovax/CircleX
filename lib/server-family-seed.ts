import { prisma } from "@/lib/db";
import { twoItemsForPhone } from "@/lib/family-catalog";
import {
  assignTehranHoodsToListings,
  loadTehranHoods,
  pickTehranHood,
} from "@/lib/seed-tehran-area";
import { backfillFamilyReciprocals } from "@/lib/server-family-reciprocal";

/**
 * Seed demo listings only for people already in the inviter's family circle.
 * Never creates users, edges, or invite acceptances — that requires a real accept.
 */
export async function seedFamilyCircle(inviterId: string, _inviterPhone: string) {
  await backfillFamilyReciprocals(inviterId);
  const hoods = await loadTehranHoods();

  const familyEdges = await prisma.circleEdge.findMany({
    where: { fromUserId: inviterId, relationType: "family" },
    select: { toUserId: true },
  });
  const uniqueSellers = Array.from(
    new Set(familyEdges.map((edge) => edge.toUserId)),
  );

  for (const sellerId of uniqueSellers) {
    const have = await prisma.marketListing.count({ where: { sellerId } });
    if (have >= 2) continue;
    const seller = await prisma.user.findUnique({ where: { id: sellerId } });
    if (!seller) continue;
    const [first, second] = twoItemsForPhone(seller.phoneNormalized);
    const need = [first, second].slice(0, 2 - have);
    for (const item of need) {
      await prisma.marketListing.create({
        data: {
          sellerId,
          title: item.title,
          description: item.description,
          type: item.type,
          price: item.price ?? null,
          category: item.category,
          image: item.image,
          images: item.images,
          condition: item.condition,
          privacy: "ABC",
          city: seller.city || "تهران",
          area: pickTehranHood(`${sellerId}:${item.title}`, hoods),
          dealStatus: "available",
        },
      });
    }
  }

  if (uniqueSellers.length > 0) {
    const familyListings = await prisma.marketListing.findMany({
      where: { sellerId: { in: uniqueSellers } },
      select: { id: true, title: true, sellerId: true, area: true },
    });
    await assignTehranHoodsToListings(familyListings, hoods);
  }

  return { people: uniqueSellers.length };
}
