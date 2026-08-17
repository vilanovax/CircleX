import { AVATAR_IMAGES } from "@/lib/avatar";
import { prisma } from "@/lib/db";
import { twoItemsForPhone } from "@/lib/family-catalog";
import { inviteExpectedInclude } from "@/lib/mappers";
import { isValidIranMobile, normalizePhone } from "@/lib/phone";
import type { InviteKind } from "@prisma/client";

const AVATAR_POOL = AVATAR_IMAGES.filter((src) => src !== "/avatars/01.webp");

type Candidate = {
  phone: string;
  name: string;
  inviteId: string;
  kind: InviteKind;
};

function cleanName(raw?: string | null): string {
  const name = (raw ?? "")
    .replace(/[0-9۰-۹+]/g, "")
    .replace(/[،,;|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
  return name;
}

function avatarFor(phone: string, used: Set<string>): string {
  let hash = 0;
  for (let i = 0; i < phone.length; i++) hash += phone.charCodeAt(i);
  for (let i = 0; i < AVATAR_POOL.length; i++) {
    const src = AVATAR_POOL[(hash + i) % AVATAR_POOL.length];
    if (!used.has(src)) return src;
  }
  return AVATAR_POOL[hash % AVATAR_POOL.length];
}

export async function seedFamilyCircle(inviterId: string, inviterPhone: string) {
  const invites = await prisma.invite.findMany({
    where: {
      inviterUserId: inviterId,
      relationType: "family",
      status: { in: ["pending", "accepted"] },
    },
    include: inviteExpectedInclude,
  });

  const seen = new Set<string>();
  const candidates: Candidate[] = [];
  for (const invite of invites) {
    if (invite.kind === "personal" && invite.invitedPhone) {
      const phone = normalizePhone(invite.invitedPhone);
      if (!isValidIranMobile(phone) || phone === inviterPhone || seen.has(phone)) {
        continue;
      }
      seen.add(phone);
      candidates.push({
        phone,
        name: cleanName(invite.invitedName) || "عضو خانواده",
        inviteId: invite.id,
        kind: "personal",
      });
    }
    if (invite.kind === "wave") {
      for (const row of invite.expected) {
        const phone = normalizePhone(row.phone);
        if (!isValidIranMobile(phone) || phone === inviterPhone || seen.has(phone)) {
          continue;
        }
        seen.add(phone);
        candidates.push({
          phone,
          name: cleanName(row.name) || "عضو خانواده",
          inviteId: invite.id,
          kind: "wave",
        });
      }
    }
  }

  const usedAvatars = new Set(
    (
      await prisma.user.findMany({
        where: { avatar: { not: "" } },
        select: { avatar: true },
      })
    )
      .map((u) => u.avatar)
      .filter(Boolean),
  );

  const sellerIds: string[] = [];

  for (const person of candidates) {
    const existing = await prisma.user.findUnique({
      where: { phoneNormalized: person.phone },
    });
    const avatar = existing?.avatar || avatarFor(person.phone, usedAvatars);
    usedAvatars.add(avatar);

    const user = existing
      ? existing.profileCompletedAt
        ? existing.avatar
          ? existing
          : await prisma.user.update({
              where: { id: existing.id },
              data: { avatar },
            })
        : await prisma.user.update({
            where: { id: existing.id },
            data: {
              name: existing.name.trim() || person.name,
              avatar: existing.avatar || avatar,
              city: existing.city || "تهران",
              profileCompletedAt: new Date(),
            },
          })
      : await prisma.user.create({
          data: {
            phoneNormalized: person.phone,
            name: person.name,
            avatar,
            city: "تهران",
            profileCompletedAt: new Date(),
          },
        });

    if (user.id === inviterId) continue;
    sellerIds.push(user.id);

    const edge = await prisma.circleEdge.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: inviterId,
          toUserId: user.id,
        },
      },
    });
    if (!edge) {
      await prisma.circleEdge.create({
        data: {
          fromUserId: inviterId,
          toUserId: user.id,
          relationType: "family",
          trustGroup: "B",
        },
      });
    }

    await prisma.inviteAcceptance.upsert({
      where: {
        inviteId_userId: { inviteId: person.inviteId, userId: user.id },
      },
      create: { inviteId: person.inviteId, userId: user.id },
      update: {},
    });

    await prisma.inviteExpected.updateMany({
      where: {
        inviteId: person.inviteId,
        phone: person.phone,
        joinedUserId: null,
      },
      data: { joinedUserId: user.id },
    });

    const invite = invites.find((row) => row.id === person.inviteId);
    if (!invite) continue;
    const useCount = await prisma.inviteAcceptance.count({
      where: { inviteId: invite.id },
    });
    const maxUses = Math.max(invite.maxUses, useCount);
    await prisma.invite.update({
      where: { id: invite.id },
      data: {
        useCount,
        maxUses,
        status:
          invite.kind === "personal" || useCount >= maxUses
            ? "accepted"
            : "pending",
        acceptedByUserId:
          invite.kind === "personal" ? user.id : invite.acceptedByUserId,
        acceptedAt:
          invite.kind === "personal" || useCount >= maxUses
            ? new Date()
            : invite.acceptedAt,
      },
    });
  }

  const uniqueSellers = Array.from(new Set(sellerIds));
  for (const sellerId of uniqueSellers) {
    const have = await prisma.marketListing.count({ where: { sellerId } });
    if (have >= 2) continue;
    const seller = await prisma.user.findUnique({ where: { id: sellerId } });
    if (!seller) continue;
    const [first, second] = twoItemsForPhone(seller.phoneNormalized);
    const need = [first, second].slice(0, 2 - have);
    for (const item of need) {
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
          condition: item.condition,
          privacy: "ABC",
          city: seller.city || "تهران",
          dealStatus: "available",
        },
      });
    }
  }

  return { people: uniqueSellers.length };
}
