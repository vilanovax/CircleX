import { listingAccess } from "@/lib/circle-network";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

async function hiddenPersonIds(userId: string): Promise<string[]> {
  const rows = await prisma.hiddenPerson.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { personId: true },
  });
  return rows.map((row) => row.personId);
}

export async function POST(req: Request) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const body = await readJson<{ personId?: unknown }>(req);
    const personId =
      typeof body?.personId === "string" ? body.personId.trim() : "";
    if (!personId) return jsonError("فرد نامعتبر است", 400);
    if (personId === session.id) {
      return jsonError("خودت را از فید پنهان نمی‌کنی", 403);
    }

    const person = await prisma.user.findUnique({
      where: { id: personId },
      select: { id: true },
    });
    if (!person) return jsonError("کاربر پیدا نشد", 404);

    const access = await listingAccess(session.id, person.id);
    if (!access.ok) return jsonError("این فرد در حلقهٔ تو نیست", 403);

    const existing = await prisma.hiddenPerson.findUnique({
      where: {
        userId_personId: { userId: session.id, personId: person.id },
      },
    });
    if (existing) {
      await prisma.hiddenPerson.delete({ where: { id: existing.id } });
    } else {
      await prisma.hiddenPerson.create({
        data: { userId: session.id, personId: person.id },
      });
    }

    return Response.json({ hiddenPeople: await hiddenPersonIds(session.id) });
  });
}
