import { prisma } from "@/lib/db";

/** Drop pending join requests for people who already have a host→guest edge. */
export function liveJoinRequests<T extends { guestUserId: string }>(
  rows: T[],
  memberIds: Set<string>,
): T[] {
  return rows.filter((row) => !memberIds.has(row.guestUserId));
}

export async function resolveJoinRequestsForMembers(
  hostUserId: string,
  memberIds: string[],
): Promise<void> {
  if (memberIds.length === 0) return;
  await prisma.circleJoinRequest.updateMany({
    where: {
      hostUserId,
      status: "pending",
      guestUserId: { in: memberIds },
    },
    data: { status: "accepted", resolvedAt: new Date() },
  });
}
