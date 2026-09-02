import type { AppFeedbackKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  FEEDBACK_BODY_MAX,
  FEEDBACK_DAILY_MAX,
  FEEDBACK_PATH_MAX,
  type FeedbackKind,
} from "@/lib/feedback";
import { jsonError, readJson, withDb } from "@/lib/http";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const KINDS = new Set<FeedbackKind>(["issue", "suggestion", "contact"]);

function parseKind(raw: unknown): FeedbackKind | null {
  if (typeof raw !== "string") return null;
  return KINDS.has(raw as FeedbackKind) ? (raw as FeedbackKind) : null;
}

export async function POST(req: Request) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const body = await readJson<{
      kind?: unknown;
      body?: unknown;
      path?: unknown;
    }>(req);

    const kind = parseKind(body?.kind);
    if (!kind) return jsonError("نوع پیام را انتخاب کن", 400);

    const text =
      typeof body?.body === "string" ? body.body.replace(/\s+/g, " ").trim() : "";
    if (text.length < 8) {
      return jsonError("پیامت خیلی کوتاه است — کمی بیشتر بنویس", 400);
    }
    if (text.length > FEEDBACK_BODY_MAX) {
      return jsonError("پیام خیلی بلند است", 400);
    }

    const pathRaw = typeof body?.path === "string" ? body.path.trim() : "";
    const path =
      pathRaw.length > 0 ? pathRaw.slice(0, FEEDBACK_PATH_MAX) : null;

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const todayCount = await prisma.appFeedback.count({
      where: {
        userId: session.id,
        createdAt: { gte: dayStart },
      },
    });
    if (todayCount >= FEEDBACK_DAILY_MAX) {
      return jsonError(
        "امروز به سقف پیام رسیدی — فردا دوباره بفرست",
        429,
        "rate_limited",
      );
    }

    const row = await prisma.appFeedback.create({
      data: {
        userId: session.id,
        kind: kind as AppFeedbackKind,
        body: text,
        path,
      },
    });

    return Response.json({
      ok: true,
      id: row.id,
    });
  });
}
