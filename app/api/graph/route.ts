import { loadGraphNetwork } from "@/lib/circle-network";
import { jsonError } from "@/lib/http";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const network = await loadGraphNetwork(session.id);
  const links = network.links.map((link) => ({
    ...link,
    fromId: link.fromId === session.id ? "me" : link.fromId,
    toId: link.toId === session.id ? "me" : link.toId,
  }));

  return Response.json({
    members: network.members,
    network: network.network,
    links,
  });
}
