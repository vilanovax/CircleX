import { ADMIN_ROLES, canSeeFullPhone, requireAdmin } from "@/lib/admin-auth";
import { listAdminUsers } from "@/lib/admin-users";
import { csvResponse, csvTable, EXPORT_CAP } from "@/lib/admin-csv";
import { redactAdminPhone } from "@/lib/admin-labels";
import { isUserBanned } from "@/lib/ban";
import { prisma } from "@/lib/db";
import { jsonError, withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

export async function GET(req: Request) {
  return withDb(async () => {
    const url = new URL(req.url);
    const kind = url.searchParams.get("kind") ?? "";

    if (kind === "users") {
      const auth = await requireAdmin(req, { roles: [...ADMIN_ROLES.usersRead] });
      if (!auth.ok) return auth.response;
      const fullPhone = canSeeFullPhone(
        auth.actor.kind === "session" ? auth.actor.admin.role : "superadmin",
      );
      const listed = await listAdminUsers({
        take: EXPORT_CAP,
        skip: 0,
        fullPhone,
        includeTotal: false,
      });
      const body = csvTable(
        [
          "id",
          "name",
          "phone",
          "city",
          "profile",
          "banned",
          "createdAt",
          "circles",
          "listings",
          "invites",
        ],
        listed.items.map((row) => [
          row.id,
          row.name,
          row.phone,
          row.city,
          row.profileCompleted ? "complete" : "incomplete",
          row.banned ? "1" : "0",
          row.createdAt,
          row.circleCount,
          row.listingCount,
          row.inviteCount,
        ]),
      );
      return csvResponse(`circle-users-${stamp()}.csv`, body);
    }

    if (kind === "invites") {
      const auth = await requireAdmin(req, { roles: [...ADMIN_ROLES.usersRead] });
      if (!auth.ok) return auth.response;
      const fullPhone = canSeeFullPhone(
        auth.actor.kind === "session" ? auth.actor.admin.role : "superadmin",
      );
      const rows = await prisma.invite.findMany({
        orderBy: { createdAt: "desc" },
        take: EXPORT_CAP,
        select: {
          code: true,
          kind: true,
          status: true,
          useCount: true,
          maxUses: true,
          invitedName: true,
          invitedPhone: true,
          createdAt: true,
          expiresAt: true,
          inviter: { select: { name: true, phoneNormalized: true } },
        },
      });
      const body = csvTable(
        [
          "code",
          "kind",
          "status",
          "uses",
          "maxUses",
          "inviter",
          "inviterPhone",
          "guest",
          "guestPhone",
          "createdAt",
          "expiresAt",
        ],
        rows.map((row) => [
          row.code,
          row.kind,
          row.status,
          row.useCount,
          row.maxUses,
          row.inviter.name,
          redactAdminPhone(row.inviter.phoneNormalized, fullPhone),
          row.invitedName,
          row.invitedPhone
            ? redactAdminPhone(row.invitedPhone, fullPhone)
            : "",
          row.createdAt.toISOString(),
          row.expiresAt.toISOString(),
        ]),
      );
      return csvResponse(`circle-invites-${stamp()}.csv`, body);
    }

    if (kind === "reports") {
      const auth = await requireAdmin(req);
      if (!auth.ok) return auth.response;
      const fullPhone = canSeeFullPhone(
        auth.actor.kind === "session" ? auth.actor.admin.role : "superadmin",
      );
      const rows = await prisma.listingReport.findMany({
        orderBy: { createdAt: "desc" },
        take: EXPORT_CAP,
        select: {
          id: true,
          reason: true,
          status: true,
          createdAt: true,
          listing: {
            select: {
              title: true,
              seller: { select: { name: true, phoneNormalized: true } },
            },
          },
          reporter: { select: { name: true, phoneNormalized: true } },
        },
      });
      const body = csvTable(
        [
          "id",
          "listing",
          "reason",
          "status",
          "seller",
          "sellerPhone",
          "reporter",
          "reporterPhone",
          "createdAt",
        ],
        rows.map((row) => [
          row.id,
          row.listing.title,
          row.reason,
          row.status,
          row.listing.seller.name,
          redactAdminPhone(row.listing.seller.phoneNormalized, fullPhone),
          row.reporter.name,
          redactAdminPhone(row.reporter.phoneNormalized, fullPhone),
          row.createdAt.toISOString(),
        ]),
      );
      return csvResponse(`circle-reports-${stamp()}.csv`, body);
    }

    if (kind === "message-reports") {
      const auth = await requireAdmin(req);
      if (!auth.ok) return auth.response;
      const fullPhone = canSeeFullPhone(
        auth.actor.kind === "session" ? auth.actor.admin.role : "superadmin",
      );
      const rows = await prisma.messageReport.findMany({
        orderBy: { createdAt: "desc" },
        take: EXPORT_CAP,
        select: {
          id: true,
          reason: true,
          status: true,
          hiddenMessage: true,
          createdAt: true,
          accused: { select: { name: true, phoneNormalized: true } },
          reporter: { select: { name: true, phoneNormalized: true } },
        },
      });
      const body = csvTable(
        [
          "id",
          "reason",
          "status",
          "hiddenMessage",
          "accused",
          "accusedPhone",
          "reporter",
          "reporterPhone",
          "createdAt",
        ],
        rows.map((row) => [
          row.id,
          row.reason,
          row.status,
          row.hiddenMessage ? "1" : "0",
          row.accused.name,
          redactAdminPhone(row.accused.phoneNormalized, fullPhone),
          row.reporter.name,
          redactAdminPhone(row.reporter.phoneNormalized, fullPhone),
          row.createdAt.toISOString(),
        ]),
      );
      return csvResponse(`circle-message-reports-${stamp()}.csv`, body);
    }

    return jsonError("kind نامعتبر است", 400, "invalid");
  });
}
