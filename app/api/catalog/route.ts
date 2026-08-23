import { getPublicCatalog } from "@/lib/app-settings";
import { withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return withDb(async () => {
    const catalog = await getPublicCatalog();
    return Response.json(catalog);
  });
}
