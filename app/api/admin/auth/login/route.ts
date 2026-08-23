import {
  createAdminSession,
  toAdminSessionUser,
} from "@/lib/admin-auth";
import {
  isValidAdminEmail,
  normalizeAdminEmail,
  verifyPassword,
} from "@/lib/admin-password";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withDb(async () => {
    const body = await readJson<{ email?: unknown; password?: unknown }>(req);
    const emailRaw = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const email = normalizeAdminEmail(emailRaw);

    if (!isValidAdminEmail(email) || password.length < 1) {
      return jsonError("ایمیل یا رمز نادرست است", 401, "unauthorized");
    }

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    const dummy =
      "scrypt:00000000000000000000000000000000:00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    const ok = verifyPassword(password, admin?.passwordHash ?? dummy);
    if (!admin || !ok) {
      return jsonError("ایمیل یا رمز نادرست است", 401, "unauthorized");
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });
    await createAdminSession(admin.id);
    return Response.json({ admin: toAdminSessionUser(admin) });
  });
}
