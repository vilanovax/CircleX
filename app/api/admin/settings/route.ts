import { writeAdminAudit } from "@/lib/admin-audit";
import {
  ADMIN_ROLES,
  actorRole,
  requireAdmin,
  sessionAdminId,
} from "@/lib/admin-auth";
import { getAppSettings, saveAppSettings } from "@/lib/app-settings";
import { jsonError, readJson, withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { roles: [...ADMIN_ROLES.all] });
    if (!auth.ok) return auth.response;
    const role = actorRole(auth.actor);
    const settings = await getAppSettings();
    return Response.json({
      settings,
      viewer: {
        role,
        canWrite: role === "superadmin",
      },
    });
  });
}

export async function PATCH(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req, {
      roles: [...ADMIN_ROLES.settingsWrite],
    });
    if (!auth.ok) return auth.response;
    const adminId = sessionAdminId(auth.actor);
    if (!adminId) return jsonError("دسترسی نداری", 403, "forbidden");

    const body = await readJson<{
      flags?: unknown;
      growth?: unknown;
      auth?: unknown;
      catalog?: unknown;
    }>(req);
    if (!body) return jsonError("بدنه نامعتبر است", 400);

    const current = await getAppSettings();
    const next = await saveAppSettings(
      {
        flags: { ...current.flags, ...(body.flags as object) },
        growth: { ...current.growth, ...(body.growth as object) },
        auth: { ...current.auth, ...(body.auth as object) },
        catalog: body.catalog
          ? (body.catalog as typeof current.catalog)
          : current.catalog,
        updatedAt: current.updatedAt,
      },
      adminId,
    );

    await writeAdminAudit({
      adminUserId: adminId,
      action: "settings.update",
      targetType: "AppSetting",
      targetId: "app",
      meta: {
        flags: next.flags,
        growth: next.growth,
        auth: next.auth,
        cityCount: next.catalog.cities.length,
        categoryCount: next.catalog.categories.length,
      },
    });

    return Response.json({ settings: next });
  });
}
