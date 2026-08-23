import { ADMIN_ROLES, canSeeFullPhone, requireAdmin } from "@/lib/admin-auth";
import { redactAdminPhone } from "@/lib/admin-labels";
import { banPublicState } from "@/lib/ban";
import { prisma } from "@/lib/db";
import { jsonError, withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

const READ_ROLES = ADMIN_ROLES.usersRead;

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { roles: [...READ_ROLES] });
    if (!auth.ok) return auth.response;
    const fullPhone = canSeeFullPhone(
      auth.actor.kind === "session" ? auth.actor.admin.role : "superadmin",
    );

    const now = new Date();
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        phoneNormalized: true,
        city: true,
        avatar: true,
        profileCompletedAt: true,
        createdAt: true,
        updatedAt: true,
        bannedAt: true,
        bannedUntil: true,
        banReason: true,
        edgesFrom: {
          orderBy: { createdAt: "desc" },
          take: 40,
          select: {
            id: true,
            trustGroup: true,
            relationType: true,
            displayName: true,
            to: { select: { id: true, name: true, phoneNormalized: true } },
          },
        },
        invitesSent: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            code: true,
            kind: true,
            status: true,
            useCount: true,
            maxUses: true,
            expiresAt: true,
            createdAt: true,
            invitedName: true,
          },
        },
        listings: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            title: true,
            type: true,
            dealStatus: true,
            createdAt: true,
          },
        },
        joinRequestsHost: {
          where: { status: "pending" },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            createdAt: true,
            guest: { select: { id: true, name: true, phoneNormalized: true } },
          },
        },
        _count: {
          select: {
            edgesFrom: true,
            edgesTo: true,
            listings: true,
            invitesSent: true,
            sessions: true,
          },
        },
      },
    });

    if (!user) return jsonError("کاربر پیدا نشد", 404);

    const [sessionsActive, sessions] = await Promise.all([
      prisma.session.count({
        where: { userId: user.id, expiresAt: { gt: now } },
      }),
      prisma.session.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, createdAt: true, expiresAt: true },
      }),
    ]);

    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        phone: redactAdminPhone(user.phoneNormalized, fullPhone),
        city: user.city,
        avatar: user.avatar,
        profileCompletedAt: user.profileCompletedAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        ban: banPublicState(user),
        sessions: sessions.map((row) => ({
          id: row.id,
          createdAt: row.createdAt.toISOString(),
          expiresAt: row.expiresAt.toISOString(),
          active: row.expiresAt.getTime() > now.getTime(),
        })),
        counts: {
          circle: user._count.edgesFrom,
          circledBy: user._count.edgesTo,
          listings: user._count.listings,
          invitesSent: user._count.invitesSent,
          sessions: user._count.sessions,
          sessionsActive,
        },
        circle: user.edgesFrom.map((edge) => ({
          id: edge.id,
          trustGroup: edge.trustGroup,
          relationType: edge.relationType,
          displayName: edge.displayName,
          person: {
            id: edge.to.id,
            name: edge.to.name,
            phone: redactAdminPhone(edge.to.phoneNormalized, fullPhone),
          },
        })),
        invites: user.invitesSent.map((invite) => ({
          id: invite.id,
          code: invite.code,
          kind: invite.kind,
          status: invite.status,
          useCount: invite.useCount,
          maxUses: invite.maxUses,
          expiresAt: invite.expiresAt.toISOString(),
          createdAt: invite.createdAt.toISOString(),
          invitedName: invite.invitedName,
        })),
        listings: user.listings.map((listing) => ({
          id: listing.id,
          title: listing.title,
          type: listing.type,
          dealStatus: listing.dealStatus,
          createdAt: listing.createdAt.toISOString(),
        })),
        joinRequests: user.joinRequestsHost.map((row) => ({
          id: row.id,
          createdAt: row.createdAt.toISOString(),
          guest: {
            id: row.guest.id,
            name: row.guest.name,
            phone: redactAdminPhone(row.guest.phoneNormalized, fullPhone),
          },
        })),
      },
    });
  });
}
