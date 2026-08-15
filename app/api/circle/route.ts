import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import {
  inviteExpectedInclude,
  memberFromEdge,
  pendingPersonFromInvite,
  toClientInvite,
  toClientJoinRequest,
  toClientListing,
} from "@/lib/mappers";
import { getSessionUser } from "@/lib/server-auth";
import { seedFamilyCircle } from "@/lib/server-family-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  await seedFamilyCircle(session.id, session.phoneNormalized);

  const [edges, inviteRows, joinRows] = await Promise.all([
    prisma.circleEdge.findMany({
      where: { fromUserId: session.id },
      include: { to: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invite.findMany({
      where: { inviterUserId: session.id, status: "pending" },
      orderBy: { createdAt: "desc" },
      include: inviteExpectedInclude,
    }),
    prisma.circleJoinRequest.findMany({
      where: { hostUserId: session.id, status: "pending" },
      include: { guest: true },
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
  const sellerIds = [session.id, ...edges.map((edge) => edge.toUserId)];
  const marketRows = await prisma.marketListing.findMany({
    where: { sellerId: { in: sellerIds } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    members: edges.map(memberFromEdge),
    pending,
    pendingPeople: pending.map(pendingPersonFromInvite),
    listings: marketRows.map((row) => toClientListing(row, session.id)),
    joinRequests: joinRows.map(toClientJoinRequest),
  });
}
