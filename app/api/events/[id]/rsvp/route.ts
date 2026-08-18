import { listingAccess } from "@/lib/circle-network";
import { prisma } from "@/lib/db";
import { jsonError, withDb } from "@/lib/http";
import { toClientEvent } from "@/lib/mappers";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const event = await prisma.gathering.findUnique({
      where: { id: params.id },
      include: { rsvps: { select: { personId: true } } },
    });
    if (!event) return jsonError("رویداد پیدا نشد", 404);
    if (event.hostId === session.id) {
      return jsonError("میزبان از قبل در رویداد است", 403);
    }

    const access = await listingAccess(session.id, event.hostId);
    if (!access.ok) return jsonError("این رویداد در حلقه تو نیست", 403);

    const going = event.rsvps.some((r) => r.personId === session.id);
    if (going) {
      await prisma.gatheringRsvp.deleteMany({
        where: { eventId: event.id, personId: session.id },
      });
    } else {
      if (
        event.capacity != null &&
        event.rsvps.length >= event.capacity
      ) {
        return jsonError("ظرفیت رویداد پر است", 400);
      }
      await prisma.gatheringRsvp.create({
        data: { eventId: event.id, personId: session.id },
      });
    }

    const next = await prisma.gathering.findUnique({
      where: { id: event.id },
      include: { rsvps: { select: { personId: true } } },
    });
    return Response.json({
      event: toClientEvent(next!, session.id, access.trustPath),
    });
  });
}
