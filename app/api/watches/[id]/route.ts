import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const id = String(params.id ?? "").trim();
    if (!id) return jsonError("نامعتبر است", 400);

    const row = await prisma.listingWatch.findFirst({
      where: { id, userId: session.id },
      select: { id: true, adminDisabledAt: true },
    });
    if (!row) return jsonError("پیدا نشد", 404);

    const body = await readJson<{ enabled?: unknown }>(req);
    if (typeof body?.enabled !== "boolean") {
      return jsonError("وضعیت نامعتبر است", 400);
    }
    if (row.adminDisabledAt && body.enabled) {
      return jsonError("این گوش‌به‌زنگ توسط تیم سیرکل خاموش شده", 403);
    }

    const updated = await prisma.listingWatch.update({
      where: { id: row.id },
      data: { enabled: body.enabled },
      include: {
        target: { select: { id: true, name: true, avatar: true } },
      },
    });
    return Response.json({
      watch: {
        id: updated.id,
        kind: updated.kind,
        phrase: updated.phrase,
        enabled: updated.enabled,
        adminLocked: Boolean(updated.adminDisabledAt),
        createdAt: updated.createdAt.toISOString(),
        target: updated.target
          ? {
              id: updated.target.id,
              name: updated.target.name || "عضو حلقه",
              avatar: updated.target.avatar,
            }
          : null,
      },
    });
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const id = String(params.id ?? "").trim();
    if (!id) return jsonError("نامعتبر است", 400);

    const row = await prisma.listingWatch.findFirst({
      where: { id, userId: session.id },
      select: { id: true },
    });
    if (!row) return jsonError("پیدا نشد", 404);

    await prisma.listingWatch.delete({ where: { id: row.id } });
    return Response.json({ ok: true });
  });
}
