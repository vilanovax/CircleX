import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { toClientDirectMessage } from "@/lib/mappers";
import { isCircloPeer } from "@/lib/circlo";
import {
  CIRCLE_MEMBER_AVATAR,
  CIRCLE_MEMBER_NAME,
} from "@/lib/listing-privacy";
import {
  assertCanSendDm,
  DM_TEXT_MAX,
  loadInbox,
  peopleForMessagePeers,
} from "@/lib/server-messages";
import { getSessionUser } from "@/lib/server-auth";
import type { Person } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");
    const inbox = await loadInbox(session.id);
    return Response.json(inbox);
  });
}

export async function POST(req: Request) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const body = await readJson<{
      peerId?: unknown;
      text?: unknown;
      listingId?: unknown;
      listingScoped?: unknown;
    }>(req);
    let peerId = typeof body?.peerId === "string" ? body.peerId.trim() : "";
    const text = typeof body?.text === "string" ? body.text : "";
    const listingId =
      typeof body?.listingId === "string" && body.listingId.trim()
        ? body.listingId.trim()
        : undefined;
    let listingScoped = body?.listingScoped === true;

    if (listingId) {
      const listing = await prisma.marketListing.findUnique({
        where: { id: listingId },
        select: { sellerId: true, hideIdentity: true },
      });
      if (!listing) return jsonError("آگهی پیدا نشد", 404);
      if (listing.hideIdentity) listingScoped = true;
      if (!peerId && listingScoped) {
        peerId =
          listing.sellerId === session.id ? "" : listing.sellerId;
      }
    }

    if (!peerId) return jsonError("مخاطب نامعتبر است", 400);
    if (isCircloPeer(peerId)) {
      return jsonError("به سیرکلو نمی‌توان پیام داد", 400);
    }
    if (text.length > DM_TEXT_MAX) {
      return jsonError("پیام خیلی بلند است", 400);
    }
    if (!text.trim() && !listingId) {
      return jsonError("متن پیام خالی است", 400);
    }

    const auth = await assertCanSendDm(
      session.id,
      peerId,
      listingId,
      listingScoped,
    );
    if (!auth.ok) return jsonError(auth.error, auth.status);

    const row = await prisma.directMessage.create({
      data: {
        fromUserId: session.id,
        toUserId: peerId,
        text: text.trim(),
        listingId: listingId ?? null,
        listingScoped,
      },
    });

    await prisma.threadPreference
      .updateMany({
        where: {
          userId: session.id,
          peerId,
          listingId: listingScoped ? listingId ?? "" : "",
          deletedAt: { not: null },
        },
        data: { deletedAt: null, archived: false },
      })
      .catch(() => {});

    const listing = listingId
      ? await prisma.marketListing.findUnique({
          where: { id: listingId },
          select: { sellerId: true, hideIdentity: true },
        })
      : null;
    const revealed = listing
      ? await prisma.listingIdentityReveal.findUnique({
          where: {
            listingId_viewerId: {
              listingId: listingId!,
              viewerId: session.id,
            },
          },
          select: { viewerId: true },
        })
      : null;
    const peerHidden = Boolean(
      listingScoped &&
        listing?.hideIdentity &&
        listing.sellerId !== session.id &&
        !revealed,
    );

    let peer: Person | null = null;
    if (peerHidden) {
      peer = {
        id: peerId,
        name: CIRCLE_MEMBER_NAME,
        avatar: CIRCLE_MEMBER_AVATAR,
        relation: "acquaintance",
        level: "C",
        deals: 0,
        inMyCircle: false,
      };
    } else {
      const [found] = await peopleForMessagePeers(session.id, [peerId]);
      peer = found ?? null;
    }

    return Response.json({
      message: toClientDirectMessage(row, session.id, Date.now(), {
        peerHidden,
      }),
      peer,
    });
  });
}
