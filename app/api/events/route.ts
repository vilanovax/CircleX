import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { toClientEvent } from "@/lib/mappers";
import { parseEventWrite } from "@/lib/social-payload";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const parsed = parseEventWrite(await readJson(req));
    if (!parsed.ok) return jsonError(parsed.error, 400);

    const row = await prisma.gathering.create({
      data: {
        hostId: session.id,
        title: parsed.data.title,
        description: parsed.data.description,
        kind: parsed.data.kind,
        image: parsed.data.image,
        dateLabel: parsed.data.date,
        timeLabel: parsed.data.time ?? null,
        location: parsed.data.location,
        capacity: parsed.data.capacity ?? null,
        privacy: parsed.data.privacy,
        city: session.city || "تهران",
      },
      include: { rsvps: { select: { personId: true } } },
    });

    return Response.json({ event: toClientEvent(row, session.id) });
  });
}
