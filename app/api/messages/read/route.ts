import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { isCircloPeer } from "@/lib/circlo";
import { getSessionUser } from "@/lib/server-auth";
import { markNoticesRead } from "@/lib/server-notices";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const body = await readJson<{ peerId?: unknown; listingId?: unknown }>(req);
    const peerId = typeof body?.peerId === "string" ? body.peerId.trim() : "";
    const listingId =
      typeof body?.listingId === "string" && body.listingId.trim()
        ? body.listingId.trim()
        : undefined;
    if (!peerId) return jsonError("مخاطب نامعتبر است", 400);
    if (isCircloPeer(peerId)) {
      const updated = await markNoticesRead(session.id);
      return Response.json({ ok: true, updated });
    }
    if (peerId === session.id) {
      return jsonError("مخاطب نامعتبر است", 400);
    }

    const result = await prisma.directMessage.updateMany({
      where: {
        fromUserId: peerId,
        toUserId: session.id,
        readAt: null,
        hiddenAt: null,
        ...(listingId
          ? { listingId, listingScoped: true }
          : { listingScoped: false }),
      },
      data: { readAt: new Date() },
    });

    return Response.json({ ok: true, updated: result.count });
  });
}
