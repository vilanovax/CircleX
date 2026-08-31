import { Prisma } from "@prisma/client";
import { listingAccess } from "@/lib/circle-network";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { listingEndorsementsInclude, toClientListing } from "@/lib/mappers";
import { catalogExtraAreas } from "@/lib/app-settings";
import { parseDealStatus, parseListingWrite } from "@/lib/listing-payload";
import { recordListingView } from "@/lib/listing-stats";
import { getSessionUser } from "@/lib/server-auth";
import {
  assertExcludePeopleInCircle,
  listingViewerFlags,
  replaceListingExcludes,
} from "@/lib/server-listing-privacy";
import { viewerMayReadListing } from "@/lib/server-listing-visibility";
import { fanoutListingWatches } from "@/lib/server-watches";
import { viewerHasListingMessages } from "@/lib/server-listing-thread";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const row = await prisma.marketListing.findUnique({
      where: { id: params.id },
      include: listingEndorsementsInclude,
    });
    if (!row) return jsonError("آگهی پیدا نشد", 404);
    if (row.dealStatus === "inactive" && row.sellerId !== session.id) {
      const [participated, accessEarly] = await Promise.all([
        viewerHasListingMessages(session.id, row.id),
        listingAccess(session.id, row.sellerId),
      ]);
      if (!participated && !accessEarly.ok) {
        return jsonError("آگهی پیدا نشد", 404);
      }
    }

    const flags = await listingViewerFlags(session.id, [row]);
    if (flags.blockedIds.has(row.id)) {
      return jsonError(
        "این آگهی برای شما قابل مشاهده نیست",
        403,
        "listing_not_visible",
      );
    }

    const access = await listingAccess(session.id, row.sellerId);
    if (!access.ok) {
      const viaMessage = await prisma.directMessage.findFirst({
        where: {
          listingId: row.id,
          hiddenAt: null,
          OR: [{ toUserId: session.id }, { fromUserId: session.id }],
          ...(row.hideIdentity ? { listingScoped: true } : {}),
        },
        select: { id: true },
      });
      if (!viaMessage) {
        return jsonError("این آگهی در حلقه تو نیست", 403);
      }
    } else if (row.sellerId !== session.id && row.dealStatus !== "inactive") {
      const allowed = await viewerMayReadListing({
        viewerId: session.id,
        sellerId: row.sellerId,
        privacy: row.privacy,
        dealStatus: row.dealStatus,
        listingId: row.id,
        excludeRelationTypes: row.excludeRelationTypes,
      });
      if (!allowed) {
        return jsonError("این آگهی برای شما قابل مشاهده نیست", 403, "listing_privacy");
      }
    }

    if (row.sellerId !== session.id) {
      void recordListingView({
        listingId: row.id,
        viewerId: session.id,
        sellerId: row.sellerId,
      }).catch(() => {});
    }

    const noteRow =
      row.sellerId === session.id
        ? null
        : await prisma.listingPersonalNote.findUnique({
            where: {
              userId_listingId: {
                userId: session.id,
                listingId: row.id,
              },
            },
            select: { body: true },
          });

    const viewerEdge =
      row.sellerId === session.id
        ? null
        : await prisma.circleEdge.findUnique({
            where: {
              fromUserId_toUserId: {
                fromUserId: session.id,
                toUserId: row.sellerId,
              },
            },
            select: { trustGroup: true },
          });
    const groupScore = { A: 3, B: 2, C: 1 } as const;

    return Response.json({
      listing: toClientListing(row, session.id, access.trustPath, {
        revealed: flags.revealedIds.has(row.id),
        excludePersonIds: flags.excludeIdsByListing.get(row.id),
        identityRevealedPeerIds: flags.revealPeersByListing.get(row.id),
        viewerDirect: row.sellerId === session.id || Boolean(viewerEdge),
        viewerTrustScore:
          row.sellerId === session.id
            ? undefined
            : viewerEdge
              ? groupScore[viewerEdge.trustGroup]
              : access.ok
                ? 1
                : 0,
      }),
      personalNote: noteRow?.body?.trim() ? noteRow.body : null,
    });
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const row = await prisma.marketListing.findUnique({
    where: { id: params.id },
  });
  if (!row) return jsonError("آگهی پیدا نشد", 404);
  if (row.sellerId !== session.id) {
    return jsonError("فقط صاحب آگهی می‌تواند آگهی را تغییر دهد", 403);
  }

  const body = await readJson<Record<string, unknown>>(req);
  if (!body || typeof body !== "object") {
    return jsonError("بدنه نامعتبر است", 400);
  }

  const dealStatus = parseDealStatus(body.dealStatus);
  const republish =
    row.dealStatus === "inactive" && dealStatus === "available";
  const isWrite =
    body.title != null ||
    body.description != null ||
    body.type != null ||
    body.image != null ||
    body.privacy != null ||
    body.hideIdentity != null ||
    body.excludePersonIds != null ||
    body.excludeRelationTypes != null;

  if (isWrite) {
    const parsed = parseListingWrite(body, await catalogExtraAreas());
    if (!parsed.ok) return jsonError(parsed.error, 400);
    if (!row.hideIdentity && parsed.data.hideIdentity) {
      return jsonError(
        "بعد از نمایش هویت روی آگهی نمی‌توانی دوباره پنهان کنی",
        400,
      );
    }
    const peopleOk = await assertExcludePeopleInCircle(
      session.id,
      parsed.data.excludePersonIds ?? [],
    );
    if (!peopleOk.ok) return jsonError(peopleOk.error, 400);

    const updated = await prisma.marketListing.update({
      where: { id: row.id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        type: parsed.data.type,
        price: parsed.data.price ?? null,
        category: parsed.data.category,
        image: parsed.data.image,
        images: parsed.data.images,
        condition: parsed.data.condition ?? null,
        privacy: parsed.data.privacy,
        hideIdentity: parsed.data.hideIdentity ?? false,
        excludeRelationTypes: parsed.data.excludeRelationTypes ?? [],
        specs: parsed.data.specs
          ? (parsed.data.specs as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        area: parsed.data.area ?? null,
        ...(dealStatus ? { dealStatus } : {}),
      },
      include: listingEndorsementsInclude,
    });
    await replaceListingExcludes(row.id, parsed.data.excludePersonIds ?? []);
    const flags = await listingViewerFlags(session.id, [updated]);
    if (republish) {
      void fanoutListingWatches({
        id: updated.id,
        sellerId: updated.sellerId,
        title: updated.title,
        description: updated.description,
        privacy: updated.privacy,
        dealStatus: updated.dealStatus,
        hideIdentity: updated.hideIdentity,
        excludeRelationTypes: updated.excludeRelationTypes,
      }).catch(() => {});
    }
    return Response.json({
      listing: toClientListing(updated, session.id, [], {
        revealed: flags.revealedIds.has(updated.id),
        excludePersonIds: flags.excludeIdsByListing.get(updated.id),
        identityRevealedPeerIds: flags.revealPeersByListing.get(updated.id),
      }),
    });
  }

  if (!dealStatus) return jsonError("وضعیت معامله نامعتبر است", 400);

  const updated = await prisma.marketListing.update({
    where: { id: row.id },
    data: { dealStatus },
    include: listingEndorsementsInclude,
  });

  if (republish) {
      void fanoutListingWatches({
        id: updated.id,
        sellerId: updated.sellerId,
        title: updated.title,
        description: updated.description,
        privacy: updated.privacy,
        dealStatus: updated.dealStatus,
        hideIdentity: updated.hideIdentity,
        excludeRelationTypes: updated.excludeRelationTypes,
      }).catch(() => {});
  }

  const flags = await listingViewerFlags(session.id, [updated]);
  return Response.json({
    listing: toClientListing(updated, session.id, [], {
      revealed: flags.revealedIds.has(updated.id),
      excludePersonIds: flags.excludeIdsByListing.get(updated.id),
      identityRevealedPeerIds: flags.revealPeersByListing.get(updated.id),
    }),
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const row = await prisma.marketListing.findUnique({
    where: { id: params.id },
    select: { id: true, sellerId: true },
  });
  if (!row) return jsonError("آگهی پیدا نشد", 404);
  if (row.sellerId !== session.id) {
    return jsonError("فقط صاحب آگهی می‌تواند آگهی را حذف کند", 403);
  }

  await prisma.marketListing.delete({ where: { id: row.id } });
  return Response.json({ ok: true });
}
