import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { notBannedWhere } from "./ban";
import { NOTICE_KIND } from "./server-notices";

export const BROADCAST_SEND_CAP = 400;

export type BroadcastAudience = "all" | "incomplete";

function audienceWhere(audience: BroadcastAudience): Prisma.UserWhereInput {
  const AND: Prisma.UserWhereInput[] = [notBannedWhere(new Date())];
  if (audience === "incomplete") {
    AND.push({ profileCompletedAt: null });
  }
  return { AND };
}

export async function countBroadcastAudience(
  audience: BroadcastAudience,
): Promise<number> {
  return prisma.user.count({ where: audienceWhere(audience) });
}

export async function sendBroadcast(opts: {
  title: string;
  body: string;
  actionHref: string | null;
  actionLabel: string | null;
  audience: BroadcastAudience;
  createdById: string;
}) {
  const users = await prisma.user.findMany({
    where: audienceWhere(opts.audience),
    select: { id: true },
    take: BROADCAST_SEND_CAP,
    orderBy: { createdAt: "desc" },
  });

  return prisma.$transaction(async (tx) => {
    if (users.length > 0) {
      await tx.systemNotice.createMany({
        data: users.map((user) => ({
          userId: user.id,
          kind: NOTICE_KIND.broadcast,
          title: opts.title,
          body: opts.body,
          actionHref: opts.actionHref,
          actionLabel: opts.actionLabel,
        })),
      });
    }
    return tx.broadcast.create({
      data: {
        title: opts.title,
        body: opts.body,
        actionHref: opts.actionHref,
        actionLabel: opts.actionLabel,
        audience: opts.audience,
        sentCount: users.length,
        createdById: opts.createdById,
      },
    });
  });
}
