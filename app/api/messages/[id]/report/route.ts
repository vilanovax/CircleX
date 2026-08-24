import type { ListingReportReason } from "@prisma/client";
import { notifyAdminOfMessageReport } from "@/lib/admin-notify";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { DM_TEXT_MAX } from "@/lib/server-messages";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const REASONS = new Set<ListingReportReason>([
  "inappropriate",
  "misleading",
  "spam",
  "other",
]);

function parseReason(raw: unknown): ListingReportReason | null {
  if (typeof raw !== "string") return null;
  return REASONS.has(raw as ListingReportReason)
    ? (raw as ListingReportReason)
    : null;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const messageId = String(params.id ?? "").trim();
    if (!messageId) return jsonError("نامعتبر است", 400);

    const message = await prisma.directMessage.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        fromUserId: true,
        toUserId: true,
        text: true,
        hiddenAt: true,
      },
    });
    if (!message) return jsonError("پیام پیدا نشد", 404);
    if (message.hiddenAt) {
      return jsonError("این پیام دیگر در گفتگو نیست", 400);
    }
    if (message.fromUserId === session.id) {
      return jsonError("نمی‌توانی پیام خودت را گزارش کنی", 400);
    }
    if (message.toUserId !== session.id) {
      return jsonError("این پیام در گفتگوی تو نیست", 403);
    }

    const body = await readJson<{ reason?: unknown; note?: unknown }>(req);
    const reason = parseReason(body?.reason);
    if (!reason) return jsonError("دلیل گزارش نامعتبر است", 400);

    const noteRaw = typeof body?.note === "string" ? body.note.trim() : "";
    const note = noteRaw.length > 0 ? noteRaw.slice(0, 500) : null;
    if (reason === "other" && !note) {
      return jsonError("برای «دلیل دیگر» توضیح کوتاه لازم است", 400);
    }

    const snapshot = message.text.trim().slice(0, DM_TEXT_MAX) || "—";

    const existing = await prisma.messageReport.findUnique({
      where: {
        messageId_reporterId: {
          messageId: message.id,
          reporterId: session.id,
        },
      },
    });
    if (existing) {
      return Response.json({
        ok: true,
        alreadyReported: true,
        reportId: existing.id,
      });
    }

    const accused = await prisma.user.findUnique({
      where: { id: message.fromUserId },
      select: { id: true, name: true, phoneNormalized: true },
    });
    if (!accused) return jsonError("فرستنده پیدا نشد", 404);

    const report = await prisma.messageReport.create({
      data: {
        messageId: message.id,
        reporterId: session.id,
        accusedId: accused.id,
        reason,
        note,
        textSnapshot: snapshot,
      },
    });

    await notifyAdminOfMessageReport({
      reportId: report.id,
      reason: report.reason,
      note: report.note,
      snapshot,
      accused: {
        id: accused.id,
        name: accused.name || "—",
        phone: accused.phoneNormalized,
      },
      reporter: {
        id: session.id,
        name: session.name || "—",
        phone: session.phoneNormalized,
      },
      createdAt: report.createdAt.toISOString(),
    });

    return Response.json({
      ok: true,
      alreadyReported: false,
      reportId: report.id,
    });
  });
}
