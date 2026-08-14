import { prisma } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { getSessionUser, toSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return jsonError("وارد نشده‌ای", 401, "unauthorized");
  return Response.json({ user: toSessionUser(user) });
}

export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const body = await readJson<{ name?: string; avatar?: string; city?: string }>(
    req,
  );
  const name = body?.name?.trim() ?? "";
  if (name.length < 2) {
    return jsonError("نام را حداقل با دو حرف بنویس", 400);
  }

  const user = await prisma.user.update({
    where: { id: session.id },
    data: {
      name,
      avatar: body?.avatar?.trim() || undefined,
      city: body?.city?.trim() || undefined,
      profileCompletedAt: session.profileCompletedAt
        ? undefined
        : new Date(),
    },
  });

  return Response.json({ user: toSessionUser(user) });
}
