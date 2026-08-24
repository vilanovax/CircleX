import { writeAdminAudit } from "@/lib/admin-audit";
import {
  ADMIN_ROLES,
  requireAdmin,
  sessionAdminId,
} from "@/lib/admin-auth";
import { listEnvelope, parseListParams } from "@/lib/admin-http";
import { BROADCAST_AUDIENCE_LABELS } from "@/lib/admin-labels";
import { jsonError, readJson, withDb } from "@/lib/http";
import { prisma } from "@/lib/db";
import {
  BROADCAST_SEND_CAP,
  countBroadcastAudience,
  sendBroadcast,
  type BroadcastAudience,
} from "@/lib/server-broadcast";

export const dynamic = "force-dynamic";

function asTrimmed(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export async function GET(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { roles: [...ADMIN_ROLES.all] });
    if (!auth.ok) return auth.response;
    const url = new URL(req.url);
    const { take, skip } = parseListParams(url, 40);

    const [total, rows, audienceAll, audienceIncomplete] = await Promise.all([
      prisma.broadcast.count(),
      prisma.broadcast.findMany({
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      countBroadcastAudience("all"),
      countBroadcastAudience("incomplete"),
    ]);

    return Response.json({
      ...listEnvelope(
        rows.map((row) => ({
          id: row.id,
          title: row.title,
          body: row.body,
          actionHref: row.actionHref,
          actionLabel: row.actionLabel,
          audience: row.audience,
          audienceLabel:
            BROADCAST_AUDIENCE_LABELS[row.audience] ?? row.audience,
          sentCount: row.sentCount,
          createdAt: row.createdAt.toISOString(),
        })),
        { total, take, skip },
      ),
      cap: BROADCAST_SEND_CAP,
      audienceCounts: {
        all: audienceAll,
        incomplete: audienceIncomplete,
      },
    });
  });
}

export async function POST(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req, {
      roles: [...ADMIN_ROLES.broadcastWrite],
    });
    if (!auth.ok) return auth.response;
    const adminId = sessionAdminId(auth.actor);
    if (!adminId) return jsonError("دسترسی نداری", 403, "forbidden");

    const body = await readJson<{
      title?: unknown;
      body?: unknown;
      actionHref?: unknown;
      actionLabel?: unknown;
      audience?: unknown;
      confirm?: unknown;
    }>(req);

    const title = asTrimmed(body?.title, 80);
    const text = asTrimmed(body?.body, 500);
    if (title.length < 2) return jsonError("عنوان اعلامیه را بنویس", 400);
    if (text.length < 2) return jsonError("متن اعلامیه را بنویس", 400);
    if (body?.confirm !== true) {
      return jsonError("ارسال را تأیید کن", 400, "confirm_required");
    }

    const audience = body?.audience === "incomplete" ? "incomplete" : "all";
    const audienceOk: BroadcastAudience[] = ["all", "incomplete"];
    if (!audienceOk.includes(audience)) {
      return jsonError("مخاطب نامعتبر است", 400);
    }

    let actionHref = asTrimmed(body?.actionHref, 120) || null;
    if (actionHref && !actionHref.startsWith("/")) {
      return jsonError("لینک باید با / شروع شود", 400);
    }
    const actionLabel = asTrimmed(body?.actionLabel, 24) || null;
    if (actionHref && !actionLabel) {
      return jsonError("برچسب دکمه را بنویس", 400);
    }
    if (!actionHref) {
      actionHref = null;
    }

    const row = await sendBroadcast({
      title,
      body: text,
      actionHref,
      actionLabel: actionHref ? actionLabel : null,
      audience,
      createdById: adminId,
    });

    await writeAdminAudit({
      adminUserId: adminId,
      action: "broadcast.send",
      targetType: "Broadcast",
      targetId: row.id,
      meta: {
        audience: row.audience,
        sentCount: row.sentCount,
        cap: BROADCAST_SEND_CAP,
      },
    });

    return Response.json(
      {
        ok: true,
        id: row.id,
        sentCount: row.sentCount,
        createdAt: row.createdAt.toISOString(),
      },
      { status: 201 },
    );
  });
}
