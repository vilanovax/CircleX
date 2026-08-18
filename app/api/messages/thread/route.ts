import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { PIN_THREAD_MAX } from "@/lib/social-payload";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const body = await readJson<{
      peerId?: unknown;
      archived?: unknown;
      pinned?: unknown;
      deleted?: unknown;
    }>(req);
    const peerId = typeof body?.peerId === "string" ? body.peerId.trim() : "";
    if (!peerId || peerId === session.id) {
      return jsonError("مخاطب نامعتبر است", 400);
    }

    const peer = await prisma.user.findUnique({
      where: { id: peerId },
      select: { id: true },
    });
    if (!peer) return jsonError("مخاطب پیدا نشد", 404);

    const current = await prisma.threadPreference.findUnique({
      where: { userId_peerId: { userId: session.id, peerId } },
    });

    let archived = current?.archived ?? false;
    let pinned = current?.pinned ?? false;
    let deletedAt = current?.deletedAt ?? null;

    if (typeof body?.deleted === "boolean") {
      if (body.deleted) {
        deletedAt = new Date();
        archived = false;
        pinned = false;
      } else {
        deletedAt = null;
      }
    }
    if (typeof body?.archived === "boolean") {
      archived = body.archived;
      if (archived) pinned = false;
    }
    if (typeof body?.pinned === "boolean") {
      if (body.pinned) {
        const pinnedCount = await prisma.threadPreference.count({
          where: {
            userId: session.id,
            pinned: true,
            deletedAt: null,
            NOT: { peerId },
          },
        });
        if (pinnedCount >= PIN_THREAD_MAX) {
          return jsonError("حداکثر سه گفتگو را می‌توانی بالا نگه داری", 400);
        }
        pinned = true;
        archived = false;
        deletedAt = null;
      } else {
        pinned = false;
      }
    }

    const row = await prisma.threadPreference.upsert({
      where: { userId_peerId: { userId: session.id, peerId } },
      create: {
        userId: session.id,
        peerId,
        archived,
        pinned,
        deletedAt,
      },
      update: { archived, pinned, deletedAt },
    });

    return Response.json({
      peerId: row.peerId,
      archived: row.archived,
      pinned: row.pinned,
      deleted: Boolean(row.deletedAt),
    });
  });
}
