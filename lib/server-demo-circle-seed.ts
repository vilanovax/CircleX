import { prisma } from "@/lib/db";
import {
  DEMO_DIRECT,
  DEMO_FOF,
  DEMO_JOIN_GUEST,
  DEMO_PENDING_INVITE,
  DEMO_PHONES,
  VIEWER_LISTING_DEFS,
  type DemoListingDef,
  type DemoPersonKey,
} from "@/lib/demo-circle-catalog";
import {
  DEMO_OFFER_DEFS,
  DEMO_REQUEST_DEFS,
  VIEWER_OFFER_DEFS,
  VIEWER_REQUEST_DEFS,
} from "@/lib/demo-requests";
import { createInviteRecord } from "@/lib/server-invite";
import type { RelationType, TrustGroup, User } from "@prisma/client";

export async function demoCircleAlreadyLinked(
  viewerId: string,
): Promise<boolean> {
  const marker = await prisma.user.findUnique({
    where: { phoneNormalized: DEMO_PHONES.leila },
    select: { id: true },
  });
  if (!marker) return false;
  const edge = await prisma.circleEdge.findUnique({
    where: {
      fromUserId_toUserId: {
        fromUserId: viewerId,
        toUserId: marker.id,
      },
    },
    select: { fromUserId: true },
  });
  return Boolean(edge);
}

async function ensureUser(input: {
  phone: string;
  name: string;
  city: string;
  avatar: string;
}): Promise<User> {
  const existing = await prisma.user.findUnique({
    where: { phoneNormalized: input.phone },
  });
  if (existing) {
    if (
      existing.profileCompletedAt &&
      existing.name.trim() &&
      existing.avatar
    ) {
      return existing;
    }
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name: existing.name.trim() || input.name,
        avatar: existing.avatar || input.avatar,
        city: existing.city || input.city,
        profileCompletedAt: existing.profileCompletedAt ?? new Date(),
      },
    });
  }
  return prisma.user.create({
    data: {
      phoneNormalized: input.phone,
      name: input.name,
      avatar: input.avatar,
      city: input.city,
      profileCompletedAt: new Date(),
    },
  });
}

async function ensureEdge(input: {
  fromUserId: string;
  toUserId: string;
  relationType: RelationType;
  trustGroup: TrustGroup;
  displayName?: string;
}) {
  if (input.fromUserId === input.toUserId) return;
  await prisma.circleEdge.upsert({
    where: {
      fromUserId_toUserId: {
        fromUserId: input.fromUserId,
        toUserId: input.toUserId,
      },
    },
    create: {
      fromUserId: input.fromUserId,
      toUserId: input.toUserId,
      relationType: input.relationType,
      trustGroup: input.trustGroup,
      displayName: input.displayName,
    },
    update: {},
  });
}

async function ensureListings(sellerId: string, items: DemoListingDef[]) {
  for (const item of items) {
    const existing = await prisma.marketListing.findFirst({
      where: { sellerId, title: item.title },
    });
    if (existing) {
      const data: { image?: string; images?: string[]; area?: string } = {};
      if (existing.image !== item.image) {
        data.image = item.image;
        data.images = item.images;
      }
      if (!existing.area && item.area) data.area = item.area;
      if (Object.keys(data).length > 0) {
        await prisma.marketListing.update({
          where: { id: existing.id },
          data,
        });
      }
      continue;
    }
    await prisma.marketListing.create({
      data: {
        sellerId,
        title: item.title,
        description: item.description,
        type: item.type,
        price: item.price ?? null,
        category: item.category,
        image: item.image,
        images: item.images,
        condition: item.condition ?? null,
        privacy: item.privacy,
        city: null,
        area: item.area ?? null,
        dealStatus: item.dealStatus ?? "available",
      },
    });
  }
}

async function ensureListingsFor(
  sellerId: string,
  city: string,
  items: DemoListingDef[],
) {
  await ensureListings(sellerId, items);
  await prisma.marketListing.updateMany({
    where: { sellerId, OR: [{ city: null }, { city: "" }] },
    data: { city },
  });
}

/**
 * Idempotent demo network for the logged-in user:
 * direct colleague / neighbor / friend, FoF through them and through family,
 * one pending invite, one join request, plus three listings posted by the viewer.
 *
 * Roster + catalog listings always backfill (so older accounts pick up
 * new seed ads). Invite / join-request rows only run on first link.
 */
export async function seedDemoCircle(viewerId: string, viewerPhone: string) {
  const alreadyLinked = await demoCircleAlreadyLinked(viewerId);
  await ensureDemoRoster(viewerId);
  if (!alreadyLinked) {
    await ensureDemoInviteAndJoin(viewerId, viewerPhone);
  }
  await ensureViewerListings(viewerId);
}

async function ensureViewerListings(viewerId: string) {
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { city: true },
  });
  await ensureListingsFor(
    viewerId,
    viewer?.city?.trim() || "تهران",
    VIEWER_LISTING_DEFS,
  );
}

async function ensureDemoRoster(viewerId: string) {
  const byKey = new Map<DemoPersonKey, User>();

  for (const person of DEMO_DIRECT) {
    const user = await ensureUser({
      phone: DEMO_PHONES[person.key],
      name: person.name,
      city: person.city,
      avatar: person.avatar,
    });
    byKey.set(person.key, user);
    if (user.id === viewerId) continue;

    await ensureEdge({
      fromUserId: viewerId,
      toUserId: user.id,
      relationType: person.myRelation ?? "acquaintance",
      trustGroup: person.myLevel ?? "B",
      displayName: person.name,
    });

    await ensureListingsFor(user.id, person.city, person.listings);
  }

  const myEdges = await prisma.circleEdge.findMany({
    where: { fromUserId: viewerId },
    include: { to: true },
    orderBy: { createdAt: "asc" },
  });

  const familyMembers = myEdges.filter(
    (e) =>
      e.relationType === "family" &&
      e.toUserId !== viewerId &&
      !(Object.values(DEMO_PHONES) as string[]).includes(e.to.phoneNormalized),
  );

  // Weave demo directs into the existing family wave so the map is not two islands.
  const leila = byKey.get("leila");
  const ali = byKey.get("ali");
  if (leila && familyMembers[0]) {
    await ensureEdge({
      fromUserId: familyMembers[0].toUserId,
      toUserId: leila.id,
      relationType: "friend",
      trustGroup: "B",
      displayName: leila.name,
    });
  }
  if (ali && familyMembers[1]) {
    await ensureEdge({
      fromUserId: familyMembers[1].toUserId,
      toUserId: ali.id,
      relationType: "neighbor",
      trustGroup: "B",
      displayName: ali.name,
    });
  }
  if (leila && ali) {
    await ensureEdge({
      fromUserId: leila.id,
      toUserId: ali.id,
      relationType: "acquaintance",
      trustGroup: "C",
      displayName: ali.name,
    });
  }

  for (const fof of DEMO_FOF) {
    const user = await ensureUser({
      phone: DEMO_PHONES[fof.key],
      name: fof.name,
      city: fof.city,
      avatar: fof.avatar,
    });
    byKey.set(fof.key, user);
    if (user.id === viewerId) continue;

    let bridge: User | undefined;
    if (fof.preferBridge === "family") {
      bridge = familyMembers[0]?.to ?? byKey.get("reza");
    } else {
      bridge = byKey.get(fof.preferBridge) ?? familyMembers[0]?.to;
    }
    if (!bridge || bridge.id === user.id) continue;

    await ensureEdge({
      fromUserId: bridge.id,
      toUserId: user.id,
      relationType: fof.viaRelation,
      trustGroup: "B",
      displayName: fof.name,
    });

    await ensureListingsFor(user.id, fof.city, fof.listings);
  }

  await ensureWantAndGatherings(viewerId, byKey);
}

async function ensureDemoInviteAndJoin(
  viewerId: string,
  viewerPhone: string,
) {
  // Pending personal invite (نگار) — once per viewer.
  const pendingPhone = DEMO_PENDING_INVITE.phone;
  if (pendingPhone !== viewerPhone) {
    const openInvite = await prisma.invite.findFirst({
      where: {
        inviterUserId: viewerId,
        invitedPhone: pendingPhone,
        status: "pending",
      },
    });
    if (!openInvite) {
      await createInviteRecord({
        inviterUserId: viewerId,
        relationType: "friend",
        trustGroup: "B",
        kind: "personal",
        invitedPhone: pendingPhone,
        invitedName: DEMO_PENDING_INVITE.name,
      });
    }
  }

  // Join request from پویا (not on roster) — once per viewer.
  const guest = await ensureUser({
    phone: DEMO_PHONES.joinGuest,
    name: DEMO_JOIN_GUEST.name,
    city: DEMO_JOIN_GUEST.city,
    avatar: DEMO_JOIN_GUEST.avatar,
  });
  if (guest.id !== viewerId) {
    const existingReq = await prisma.circleJoinRequest.findUnique({
      where: {
        hostUserId_guestUserId: {
          hostUserId: viewerId,
          guestUserId: guest.id,
        },
      },
    });
    if (!existingReq) {
      await prisma.circleJoinRequest.create({
        data: {
          hostUserId: viewerId,
          guestUserId: guest.id,
          status: "pending",
        },
      });
    }
  }
}

const DEMO_GATHERINGS: {
  id: string;
  hostKey: DemoPersonKey;
  title: string;
  description: string;
  kind: string;
  image: string;
  dateLabel: string;
  timeLabel?: string;
  location: string;
  capacity?: number;
  privacy: string;
  attendeeKeys: DemoPersonKey[];
}[] = [
  {
    id: "demo_evt_yoga",
    hostKey: "leila",
    title: "کلاس یوگای صبحگاهی",
    description:
      "یوگای ملایم صبحگاهی در فضای باز، مناسب همه‌ی سطح‌ها. زیراندازتان را بیاورید.",
    kind: "class",
    image: "🧘",
    dateLabel: "شنبه ۲۳ خرداد",
    timeLabel: "۰۷:۳۰",
    location: "پارک ملت، ورودی شمالی",
    capacity: 12,
    privacy: "ABC",
    attendeeKeys: ["ali", "reza"],
  },
  {
    id: "demo_evt_charity",
    hostKey: "maryam",
    title: "بازارچه‌ی خیریه‌ی محله",
    description:
      "بازارچه‌ی خیریه با دست‌سازه‌ها و خوراکی خانگی؛ درآمد صرف کودکان بی‌سرپرست می‌شود.",
    kind: "charity",
    image: "🎗️",
    dateLabel: "پنجشنبه ۲۸ خرداد",
    timeLabel: "۱۶:۰۰",
    location: "فرهنگسرای محله",
    privacy: "ABC",
    attendeeKeys: ["reza", "leila"],
  },
  {
    id: "demo_evt_kids",
    hostKey: "reza",
    title: "قرار بازی کودکان در پارک",
    description:
      "بعدازظهر بازی برای کودکان ۳ تا ۷ سال، با چند بازی گروهی و میان‌وعده‌ی سالم.",
    kind: "kids",
    image: "🧒",
    dateLabel: "یکشنبه ۲۴ خرداد",
    timeLabel: "۱۷:۰۰",
    location: "پارک قیطریه",
    capacity: 8,
    privacy: "AB",
    attendeeKeys: ["ali"],
  },
  {
    id: "demo_evt_trip",
    hostKey: "hossein",
    title: "سفر گروهی دو روزه به شمال",
    description:
      "سفر دسته‌جمعی به رامسر؛ اقامت ویلایی و برنامه‌ی طبیعت‌گردی. هزینه به‌صورت مشترک.",
    kind: "trip",
    image: "🏞️",
    dateLabel: "۱ تا ۳ تیر",
    location: "رامسر",
    capacity: 20,
    privacy: "AB",
    attendeeKeys: ["ali", "leila", "maryam"],
  },
];

async function ensureWantAndGatherings(
  viewerId: string,
  byKey: Map<DemoPersonKey, User>,
) {
  for (const def of DEMO_REQUEST_DEFS) {
    const requester = byKey.get(def.requesterKey);
    if (!requester || requester.id === viewerId) continue;
    await prisma.wantRequest.upsert({
      where: { id: def.id },
      create: {
        id: def.id,
        requesterId: requester.id,
        title: def.title,
        description: def.description,
        category: def.category,
        image: def.image,
        budget: def.budget ?? null,
        budgetUnit: def.budgetUnit ?? null,
        privacy: def.privacy,
        city: def.city ?? requester.city,
        area: def.area ?? null,
      },
      update: { area: def.area ?? undefined },
    });
  }

  for (const def of VIEWER_REQUEST_DEFS) {
    const id = `${def.id}__${viewerId}`;
    await prisma.wantRequest.upsert({
      where: { id },
      create: {
        id,
        requesterId: viewerId,
        title: def.title,
        description: def.description,
        category: def.category,
        image: def.image,
        budget: def.budget ?? null,
        budgetUnit: def.budgetUnit ?? null,
        privacy: def.privacy,
        city: def.city ?? "تهران",
        area: def.area ?? null,
      },
      update: { area: def.area ?? undefined },
    });
  }

  for (const def of [...DEMO_OFFER_DEFS, ...VIEWER_OFFER_DEFS]) {
    const from = byKey.get(def.fromKey);
    if (!from || from.id === viewerId) continue;
    const isViewerOffer = VIEWER_OFFER_DEFS.some((row) => row.id === def.id);
    const requestId = isViewerOffer
      ? `${def.requestId}__${viewerId}`
      : def.requestId;
    const request = await prisma.wantRequest.findUnique({
      where: { id: requestId },
      select: { id: true },
    });
    if (!request) continue;
    const offerId = isViewerOffer ? `${def.id}__${viewerId}` : def.id;
    await prisma.wantOffer.upsert({
      where: {
        requestId_fromId: { requestId, fromId: from.id },
      },
      create: {
        id: offerId,
        requestId,
        fromId: from.id,
        message: def.message,
        price: def.price ?? null,
      },
      update: {},
    });
  }

  for (const def of DEMO_GATHERINGS) {
    const host = byKey.get(def.hostKey);
    if (!host || host.id === viewerId) continue;
    await prisma.gathering.upsert({
      where: { id: def.id },
      create: {
        id: def.id,
        hostId: host.id,
        title: def.title,
        description: def.description,
        kind: def.kind,
        image: def.image,
        dateLabel: def.dateLabel,
        timeLabel: def.timeLabel ?? null,
        location: def.location,
        capacity: def.capacity ?? null,
        privacy: def.privacy,
        city: host.city,
      },
      update: {},
    });
    for (const key of def.attendeeKeys) {
      const person = byKey.get(key);
      if (!person || person.id === host.id) continue;
      await prisma.gatheringRsvp.upsert({
        where: {
          eventId_personId: { eventId: def.id, personId: person.id },
        },
        create: { eventId: def.id, personId: person.id },
        update: {},
      });
    }
  }
}
