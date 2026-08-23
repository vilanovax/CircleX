import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

export async function writeAdminAudit(opts: {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string | null;
  meta?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.adminAuditLog.create({
    data: {
      adminUserId: opts.adminUserId,
      action: opts.action,
      targetType: opts.targetType,
      targetId: opts.targetId,
      reason: opts.reason?.trim() ? opts.reason.trim().slice(0, 500) : null,
      meta: opts.meta,
    },
  });
}
