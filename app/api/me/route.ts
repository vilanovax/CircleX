import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { getSessionUser, toSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return jsonError("وارد نشده‌ای", 401, "unauthorized");
    return Response.json({ user: toSessionUser(user) });
  });
}

export async function PATCH(req: Request) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const body = await readJson<{
      name?: string;
      avatar?: string;
      city?: string;
      showOwnListingsInFeed?: boolean;
    }>(req);

    const data: {
      name?: string;
      avatar?: string;
      city?: string;
      profileCompletedAt?: Date;
      showOwnListingsInFeed?: boolean;
    } = {};

    if (typeof body?.showOwnListingsInFeed === "boolean") {
      data.showOwnListingsInFeed = body.showOwnListingsInFeed;
    }

    if (body?.name != null || body?.avatar != null || body?.city != null) {
      const name = body?.name?.trim() ?? session.name;
      if (name.length < 2) {
        return jsonError("نام را حداقل با دو حرف بنویس", 400);
      }
      data.name = name;
      if (body?.avatar != null) data.avatar = body.avatar.trim() || undefined;
      if (body?.city != null) data.city = body.city.trim() || undefined;
      if (!session.profileCompletedAt) data.profileCompletedAt = new Date();
    }

    if (Object.keys(data).length === 0) {
      return jsonError("بدنه نامعتبر است", 400);
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data,
    });

    return Response.json({ user: toSessionUser(user) });
  });
}
