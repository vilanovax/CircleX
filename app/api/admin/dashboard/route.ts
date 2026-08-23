import { existsSync } from "node:fs";
import { actorRole, requireAdmin } from "@/lib/admin-auth";
import { activeBanWhere } from "@/lib/ban";
import { prisma } from "@/lib/db";
import { withDb } from "@/lib/http";
import { getAppSettings } from "@/lib/app-settings";
import { uploadDir } from "@/lib/listing-upload";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;
    const role = actorRole(auth.actor);

    const now = new Date();
    const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const settings = await getAppSettings();

    const [
      users24h,
      users7d,
      usersIncomplete,
      invitesLive,
      invitesExpiredPending,
      invitesTotal,
      invitesAccepted,
      listings24h,
      requests24h,
      events24h,
      reportsOpen,
      otpLocked,
      sessionsActive,
      usersBanned,
      joinPending,
      listingsHidden,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: h24 } } }),
      prisma.user.count({ where: { createdAt: { gte: d7 } } }),
      prisma.user.count({ where: { profileCompletedAt: null } }),
      prisma.invite.count({
        where: { status: "pending", expiresAt: { gt: now } },
      }),
      prisma.invite.count({
        where: {
          OR: [
            { status: "expired" },
            { status: "pending", expiresAt: { lte: now } },
          ],
        },
      }),
      prisma.invite.count(),
      prisma.invite.count({ where: { status: "accepted" } }),
      prisma.marketListing.count({ where: { createdAt: { gte: h24 } } }),
      prisma.wantRequest.count({ where: { createdAt: { gte: h24 } } }),
      prisma.gathering.count({ where: { createdAt: { gte: h24 } } }),
      prisma.listingReport.count({ where: { status: "open" } }),
      prisma.otpChallenge.count({
        where: { attempts: { gte: settings.auth.otpMaxAttempts } },
      }),
      prisma.session.count({ where: { expiresAt: { gt: now } } }),
      prisma.user.count({ where: activeBanWhere(now) }),
      prisma.circleJoinRequest.count({ where: { status: "pending" } }),
      prisma.marketListing.count({ where: { dealStatus: "inactive" } }),
    ]);

    let uploadReady = false;
    try {
      uploadReady = existsSync(uploadDir());
    } catch {
      uploadReady = false;
    }

    return Response.json({
      stats: {
        users24h,
        users7d,
        usersIncomplete,
        invitesLive,
        invitesExpiredPending,
        inviteAcceptRate:
          invitesTotal === 0 ? 0 : invitesAccepted / invitesTotal,
        invitesTotal,
        invitesAccepted,
        listings24h,
        requests24h,
        events24h,
        reportsOpen,
        otpLocked,
        sessionsActive,
        usersBanned,
        joinPending,
        listingsHidden,
      },
      viewer: {
        role,
        canSeeUsers: role !== "analyst",
      },
      health: {
        smsConfigured: Boolean(process.env.KAVENEGAR_API_KEY?.trim()),
        openaiConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
        uploadDirReady: uploadReady,
        webhookConfigured: Boolean(process.env.ADMIN_WEBHOOK_URL?.trim()),
      },
    });
  });
}
