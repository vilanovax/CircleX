import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { toClientDirectMessage } from "@/lib/mappers";
import {
  assertCanSendDm,
  DM_TEXT_MAX,
  loadInbox,
  peopleForMessagePeers,
} from "@/lib/server-messages";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");
    const inbox = await loadInbox(session.id);
    return Response.json(inbox);
  });
}

export async function POST(req: Request) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const body = await readJson<{
      peerId?: unknown;
      text?: unknown;
      listingId?: unknown;
    }>(req);
    const peerId = typeof body?.peerId === "string" ? body.peerId.trim() : "";
    const text = typeof body?.text === "string" ? body.text : "";
    const listingId =
      typeof body?.listingId === "string" && body.listingId.trim()
        ? body.listingId.trim()
        : undefined;

    if (!peerId) return jsonError("مخاطب نامعتبر است", 400);
    if (text.length > DM_TEXT_MAX) {
      return jsonError("پیام خیلی بلند است", 400);
    }
    if (!text.trim() && !listingId) {
      return jsonError("متن پیام خالی است", 400);
    }

    const auth = await assertCanSendDm(session.id, peerId, listingId);
    if (!auth.ok) return jsonError(auth.error, auth.status);

    const row = await prisma.directMessage.create({
      data: {
        fromUserId: session.id,
        toUserId: peerId,
        text: text.trim(),
        listingId: listingId ?? null,
      },
    });

    await prisma.threadPreference
      .updateMany({
        where: { userId: session.id, peerId, deletedAt: { not: null } },
        data: { deletedAt: null, archived: false },
      })
      .catch(() => {});

    const [peer] = await peopleForMessagePeers(session.id, [peerId]);
    return Response.json({
      message: toClientDirectMessage(row, session.id),
      peer: peer ?? null,
    });
  });
}
