import { prisma } from "@/lib/db";

/** True when the viewer sent or received a visible DM attached to this listing. */
export async function viewerHasListingMessages(
  viewerId: string,
  listingId: string,
): Promise<boolean> {
  const row = await prisma.directMessage.findFirst({
    where: {
      listingId,
      hiddenAt: null,
      OR: [{ toUserId: viewerId }, { fromUserId: viewerId }],
    },
    select: { id: true },
  });
  return Boolean(row);
}
