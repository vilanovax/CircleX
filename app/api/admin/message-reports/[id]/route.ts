import type { ListingReportStatus } from "@prisma/client";
import { writeAdminAudit } from "@/lib/admin-audit";
import { ADMIN_ROLES, requireAdmin, sessionAdminId } from "@/lib/admin-auth";
import { parseAdminReason } from "@/lib/admin-http";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import {
  notifyMessageHidden,
  notifyMessageReportResolved,
} from "@/lib/server-notices";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { roles: [...ADMIN_ROLES.contentWrite] });
    if (!auth.ok) return auth.response;
    const adminId = sessionAdminId(auth.actor);
    if (!adminId) return jsonError("دسترسی نداری", 403, "forbidden");

    const body = await readJson<{
      status?: unknown;
      hideMessage?: unknown;
      noticeToReporter?: unknown;
      reason?: unknown;
    }>(req);

    const statusRaw = body?.status;
    if (statusRaw !== "reviewed" && statusRaw !== "dismissed") {
      return jsonError("وضعیت نامعتبر است", 400);
    }
    const status: Exclude<ListingReportStatus, "open"> = statusRaw;
    const hideMessage = body?.hideMessage === true;
    const noticeToReporter = body?.noticeToReporter === true;
    const reason = parseAdminReason(body?.reason);

    const report = await prisma.messageReport.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        reporterId: true,
        accusedId: true,
        messageId: true,
        hiddenMessage: true,
      },
    });
    if (!report) return jsonError("گزارش پیدا نشد", 404);

    let didHide = report.hiddenMessage;
    await prisma.$transaction(async (tx) => {
      if (hideMessage && report.messageId) {
        const msg = await tx.directMessage.findUnique({
          where: { id: report.messageId },
          select: { id: true, hiddenAt: true },
        });
        if (msg && !msg.hiddenAt) {
          await tx.directMessage.update({
            where: { id: msg.id },
            data: { hiddenAt: new Date() },
          });
          didHide = true;
        }
      }
      await tx.messageReport.update({
        where: { id: report.id },
        data: {
          status,
          hiddenMessage: didHide,
        },
      });
    });

    if (hideMessage && didHide && !report.hiddenMessage) {
      await notifyMessageHidden({ senderId: report.accusedId });
    }

    if (noticeToReporter) {
      await notifyMessageReportResolved({
        reporterId: report.reporterId,
        status,
        hiddenMessage: didHide,
      });
    }

    await writeAdminAudit({
      adminUserId: adminId,
      action: "message_report.update",
      targetType: "MessageReport",
      targetId: report.id,
      reason: reason || null,
      meta: {
        status,
        hideMessage,
        noticeToReporter,
        accusedId: report.accusedId,
      },
    });

    return Response.json({
      ok: true,
      id: report.id,
      status,
      hideMessage: didHide,
      noticeToReporter,
    });
  });
}
