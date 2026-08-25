import { prisma } from "@/lib/db";
import type { Prisma, TrustGroup } from "@prisma/client";

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * Family is mutual: adding someone as خانواده also puts you in their circle
 * so they see your listings. Existing reverse edges (any relation) are left alone.
 */
export async function ensureFamilyReciprocal(
  db: Db,
  fromUserId: string,
  toUserId: string,
  trustGroup: TrustGroup,
): Promise<void> {
  if (fromUserId === toUserId) return;
  await db.circleEdge.upsert({
    where: {
      fromUserId_toUserId: {
        fromUserId: toUserId,
        toUserId: fromUserId,
      },
    },
    create: {
      fromUserId: toUserId,
      toUserId: fromUserId,
      relationType: "family",
      trustGroup,
    },
    update: {},
  });
}

/** Create missing reverse edges for every family link that includes this user. */
export async function backfillFamilyReciprocals(userId: string): Promise<boolean> {
  const involved = await prisma.circleEdge.findMany({
    where: {
      relationType: "family",
      OR: [{ fromUserId: userId }, { toUserId: userId }],
    },
    select: { fromUserId: true, toUserId: true, trustGroup: true },
  });
  if (involved.length === 0) return false;

  const wanted = new Map<
    string,
    { fromUserId: string; toUserId: string; trustGroup: TrustGroup }
  >();
  for (const edge of involved) {
    if (edge.fromUserId === edge.toUserId) continue;
    const fromUserId = edge.toUserId;
    const toUserId = edge.fromUserId;
    const key = `${fromUserId}:${toUserId}`;
    if (!wanted.has(key)) {
      wanted.set(key, { fromUserId, toUserId, trustGroup: edge.trustGroup });
    }
  }
  const pairs = Array.from(wanted.values());
  if (pairs.length === 0) return false;

  const existing = await prisma.circleEdge.findMany({
    where: {
      OR: pairs.map((row) => ({
        fromUserId: row.fromUserId,
        toUserId: row.toUserId,
      })),
    },
    select: { fromUserId: true, toUserId: true },
  });
  const have = new Set(
    existing.map((row) => `${row.fromUserId}:${row.toUserId}`),
  );
  const missing = pairs.filter(
    (row) => !have.has(`${row.fromUserId}:${row.toUserId}`),
  );
  if (missing.length === 0) return false;

  await prisma.circleEdge.createMany({
    data: missing.map((row) => ({
      fromUserId: row.fromUserId,
      toUserId: row.toUserId,
      relationType: "family" as const,
      trustGroup: row.trustGroup,
    })),
    skipDuplicates: true,
  });
  return true;
}
