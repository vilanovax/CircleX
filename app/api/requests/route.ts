import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { toClientRequest } from "@/lib/mappers";
import { parseRequestWrite } from "@/lib/social-payload";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const parsed = parseRequestWrite(await readJson(req));
    if (!parsed.ok) return jsonError(parsed.error, 400);

    const row = await prisma.wantRequest.create({
      data: {
        requesterId: session.id,
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category,
        image: parsed.data.image,
        budget: parsed.data.budget ?? null,
        budgetUnit: parsed.data.budgetUnit ?? null,
        privacy: parsed.data.privacy,
        city: session.city || "تهران",
        area: parsed.data.area ?? null,
      },
    });

    return Response.json({ request: toClientRequest(row, session.id) });
  });
}
