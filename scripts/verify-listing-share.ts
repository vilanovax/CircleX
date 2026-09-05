import { loadHomeFeed } from "@/lib/circle-network";
import { prisma } from "@/lib/db";
import {
  recordListingForwardGrant,
  sellerReachableViaForward,
} from "@/lib/listing-share-access";
import { viewerCanSeeListing } from "@/lib/server-listing-visibility";
import { notifyEndorsementOpenedListing } from "@/lib/server-notices";

const PREFIX = "share-qa-";
const PHONES = {
  a: "09109990101",
  b: "09109990102",
  c1: "09109990111",
  c2: "09109990112",
  c3: "09109990113",
  c4: "09109990114",
} as const;

function fail(message: string): never {
  throw new Error(message);
}

async function canSee(
  viewerId: string,
  listing: {
    id: string;
    sellerId: string;
    privacy: string;
    hideIdentity: boolean;
    dealStatus: string | null;
    excludeRelationTypes: unknown;
  },
): Promise<boolean> {
  return viewerCanSeeListing({
    viewerId,
    sellerId: listing.sellerId,
    privacy: listing.privacy,
    dealStatus: listing.dealStatus,
    listingId: listing.id,
    hideIdentity: listing.hideIdentity,
    excludeRelationTypes: listing.excludeRelationTypes,
  });
}

async function upsertUser(phone: string, name: string) {
  return prisma.user.upsert({
    where: { phoneNormalized: phone },
    create: {
      phoneNormalized: phone,
      name,
      avatar: "/avatars/01.webp",
      profileCompletedAt: new Date(),
    },
    update: {
      name,
      avatar: "/avatars/01.webp",
      profileCompletedAt: new Date(),
    },
  });
}

async function edge(fromUserId: string, toUserId: string, trustGroup: "A" | "C") {
  await prisma.circleEdge.upsert({
    where: {
      fromUserId_toUserId: { fromUserId, toUserId },
    },
    create: {
      fromUserId,
      toUserId,
      trustGroup,
      relationType: "friend",
    },
    update: { trustGroup, relationType: "friend" },
  });
}

async function listing(
  sellerId: string,
  privacy: string,
  title: string,
  hideIdentity = false,
) {
  return prisma.marketListing.create({
    data: {
      sellerId,
      title,
      description: "آگهی تست مسیر اعتماد",
      type: "sale",
      category: "متفرقه",
      image: "/listings/stacked-books.jpg",
      images: ["/listings/stacked-books.jpg"],
      privacy,
      hideIdentity,
      dealStatus: "available",
    },
  });
}

async function cleanup() {
  const phones = Object.values(PHONES);
  await prisma.user.deleteMany({ where: { phoneNormalized: { in: phones } } });
}

async function main() {
  await cleanup();

  const A = await upsertUser(PHONES.a, `${PREFIX}A`);
  const B = await upsertUser(PHONES.b, `${PREFIX}B`);
  const C1 = await upsertUser(PHONES.c1, `${PREFIX}C1`);
  const C2 = await upsertUser(PHONES.c2, `${PREFIX}C2`);
  const C3 = await upsertUser(PHONES.c3, `${PREFIX}C3`);
  const C4 = await upsertUser(PHONES.c4, `${PREFIX}C4`);

  await edge(B.id, A.id, "A");
  await edge(B.id, C1.id, "C");
  await edge(B.id, C2.id, "C");
  await edge(B.id, C3.id, "C");
  await edge(B.id, C4.id, "C");

  const open = await listing(A.id, "ABC", `${PREFIX}open-vouch`);
  if (await canSee(C1.id, open)) fail("1: C should not see open listing before vouch");
  await prisma.listingEndorsement.create({
    data: {
      listingId: open.id,
      personId: B.id,
      types: ["verify_item"],
    },
  });
  await notifyEndorsementOpenedListing({
    listingId: open.id,
    title: open.title,
    sellerId: A.id,
    endorserId: B.id,
    endorserName: B.name,
    privacy: open.privacy,
    dealStatus: open.dealStatus,
    hideIdentity: open.hideIdentity,
  });
  if (!(await canSee(C1.id, open))) fail("1: C should see open listing after B vouches");
  const otherBeforeFwd = await listing(A.id, "ABC", `${PREFIX}other-before-fwd`);
  if (await canSee(C1.id, otherBeforeFwd)) {
    fail("1: vouch must not open A's other ads");
  }
  const feed1 = await loadHomeFeed(C1.id);
  if (!feed1.listings.some((row) => row.id === open.id)) {
    fail("1: open listing should appear in C's feed");
  }
  const notice = await prisma.systemNotice.findFirst({
    where: {
      userId: C1.id,
      listingId: open.id,
      kind: "listing_share",
    },
  });
  if (!notice) fail("1: C should get a notice after B vouches");
  console.log("1 ok — open listing + vouch → C feed + notice");

  const fwdOpen = await listing(A.id, "ABC", `${PREFIX}open-forward`);
  const otherOpen = await listing(A.id, "ABC", `${PREFIX}other-open`);
  const tight = await listing(A.id, "A", `${PREFIX}tight`);
  if (await canSee(C2.id, fwdOpen)) fail("2: C should not see listing before forward");
  await recordListingForwardGrant({
    listingId: fwdOpen.id,
    sellerId: A.id,
    granteeId: C2.id,
    sourceId: B.id,
    privacy: fwdOpen.privacy,
    hideIdentity: fwdOpen.hideIdentity,
  });
  if (!(await canSee(C2.id, fwdOpen))) fail("2: forwarded open listing should unlock");
  if (!(await canSee(C2.id, otherOpen))) {
    fail("2: other open listings of A should unlock");
  }
  if (await canSee(C2.id, tight)) fail("2: restricted listing must stay closed");
  if (!(await sellerReachableViaForward(C2.id, A.id))) {
    fail("2: A's profile should open after ABC forward");
  }
  const feed2 = await loadHomeFeed(C2.id);
  if (!feed2.listings.some((row) => row.id === fwdOpen.id)) {
    fail("2: forwarded listing should appear in C's feed");
  }
  console.log("2 ok — ABC forward → listing + other open ads + profile");

  const restricted = await listing(A.id, "A", `${PREFIX}restricted`);
  await prisma.listingEndorsement.create({
    data: {
      listingId: restricted.id,
      personId: B.id,
      types: ["know_seller"],
    },
  });
  if (await canSee(C3.id, restricted)) fail("3: vouch must not open a tight listing");
  await recordListingForwardGrant({
    listingId: restricted.id,
    sellerId: A.id,
    granteeId: C3.id,
    sourceId: B.id,
    privacy: restricted.privacy,
    hideIdentity: restricted.hideIdentity,
  });
  if (await canSee(C3.id, restricted)) fail("3: forward must not open a tight listing");
  const grant3 = await prisma.listingVisibilityGrant.findFirst({
    where: { listingId: restricted.id, granteeId: C3.id },
  });
  if (grant3) fail("3: restricted forward must not create a grant");
  console.log("3 ok — restricted listing stays closed");

  const referral = await listing(A.id, "referral", `${PREFIX}referral`);
  const leftoverOpen = await listing(A.id, "ABC", `${PREFIX}leftover-open`);
  await recordListingForwardGrant({
    listingId: referral.id,
    sellerId: A.id,
    granteeId: C4.id,
    sourceId: B.id,
    privacy: referral.privacy,
    hideIdentity: referral.hideIdentity,
  });
  if (!(await canSee(C4.id, referral))) fail("4: referral forward should unlock that listing");
  if (await canSee(C4.id, leftoverOpen)) {
    fail("4: referral forward must not open A's other ads");
  }
  if (await sellerReachableViaForward(C4.id, A.id)) {
    fail("4: referral forward must not open A's profile catalog");
  }
  console.log("4 ok — referral forward unlocks only that listing");

  await cleanup();
  console.log("all four share scenarios passed");
}

main()
  .catch(async (err) => {
    console.error(err instanceof Error ? err.message : err);
    await cleanup().catch(() => {});
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
