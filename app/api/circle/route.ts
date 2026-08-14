import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { memberFromEdge, pendingPersonFromInvite, toClientInvite } from "@/lib/mappers";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const [edges, inviteRows] = await Promise.all([
    prisma.circleEdge.findMany({
      where: { fromUserId: session.id },
      include: { to: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invite.findMany({
      where: { inviterUserId: session.id, status: "pending" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const now = Date.now();
  const live = inviteRows.filter((r) => r.expiresAt.getTime() > now);
  const expiredIds = inviteRows
    .filter((r) => r.expiresAt.getTime() <= now)
    .map((r) => r.id);
  if (expiredIds.length > 0) {
    await prisma.invite.updateMany({
      where: { id: { in: expiredIds } },
      data: { status: "expired" },
    });
  }

  const pending = live.map(toClientInvite);
  return Response.json({
    members: edges.map(memberFromEdge),
    pending,
    pendingPeople: pending.map(pendingPersonFromInvite),
  });
}
