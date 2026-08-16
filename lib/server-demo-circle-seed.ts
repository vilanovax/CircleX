import { prisma } from "@/lib/db";
import {
  DEMO_DIRECT,
  DEMO_FOF,
  DEMO_JOIN_GUEST,
  DEMO_PENDING_INVITE,
  DEMO_PHONES,
  type DemoListingDef,
  type DemoPersonKey,
} from "@/lib/demo-circle-catalog";
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
      // Heal broken seed image URLs without recreating the listing.
      if (existing.image !== item.image) {
        await prisma.marketListing.update({
          where: { id: existing.id },
          data: { image: item.image, images: item.images },
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
        dealStatus: item.dealStatus ?? null,
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
 * one pending invite, one join request.
 */
export async function seedDemoCircle(viewerId: string, viewerPhone: string) {
  if (await demoCircleAlreadyLinked(viewerId)) return;

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
