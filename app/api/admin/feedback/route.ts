import type { AppFeedbackKind, AppFeedbackStatus } from "@prisma/client";
import { actorRole, canSeeFullPhone, requireAdmin } from "@/lib/admin-auth";
import { listEnvelope, parseListParams } from "@/lib/admin-http";
import { redactAdminPhone } from "@/lib/admin-labels";
import { prisma } from "@/lib/db";
import { withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { allowSecret: true });
    if (!auth.ok) return auth.response;

    const fullPhone = canSeeFullPhone(actorRole(auth.actor));
    const url = new URL(req.url);
    const { take, skip } = parseListParams(url);
    const statusParam = url.searchParams.get("status") ?? "open";
    const kindParam = url.searchParams.get("kind") ?? "all";

    const statusFilter: AppFeedbackStatus | undefined =
      statusParam === "all"
        ? undefined
        : statusParam === "reviewed" || statusParam === "closed"
          ? statusParam
          : "open";

    const kindFilter: AppFeedbackKind | undefined =
      kindParam === "issue" ||
      kindParam === "suggestion" ||
      kindParam === "contact"
        ? kindParam
        : undefined;

    const where = {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(kindFilter ? { kind: kindFilter } : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.appFeedback.count({ where }),
      prisma.appFeedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          user: { select: { id: true, name: true, phoneNormalized: true } },
        },
      }),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      body: row.body,
      path: row.path,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      user: {
        id: row.user.id,
        name: row.user.name,
        phone: redactAdminPhone(row.user.phoneNormalized, fullPhone),
      },
    }));

    return Response.json(listEnvelope(items, { total, take, skip }));
  });
}
