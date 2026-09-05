import {
  DEMO_DIRECT,
  DEMO_FOF,
  VIEWER_LISTING_DEFS,
  type DemoPersonKey,
} from "@/lib/demo-circle-catalog";
import { CIRCLO_PEER_ID } from "@/lib/circlo";
import { threadKey } from "@/lib/listing-privacy";
import { relationLabels, relationTowardName } from "@/lib/labels";
import { messageSentAt, sentAtFromRelative } from "@/lib/mappers";
import type {
  CircleEvent,
  Listing,
  Message,
  Offer,
  Person,
  Privacy,
  BudgetUnit,
  Request,
} from "@/lib/types";

export type DemoRequestDef = {
  id: string;
  requesterKey: DemoPersonKey;
  /** FoF only: bridge key for trustPath (must be in viewer's circle). */
  viaKey?: DemoPersonKey;
  title: string;
  description: string;
  category: string;
  image: string;
  budget?: number;
  budgetUnit?: BudgetUnit;
  privacy: Privacy;
  postedAt: string;
  city?: string;
  area?: string;
};

export type DemoOfferDef = {
  id: string;
  requestId: string;
  fromKey: DemoPersonKey;
  message: string;
  price?: number;
  postedAt: string;
};

/** Five circle wants — bound to demo people at runtime (real user ids). */
export const DEMO_REQUEST_DEFS: DemoRequestDef[] = [
  {
    id: "demo_req_piano",
    requesterKey: "leila",
    title: "معلم پیانو برای کودک می‌خوام",
    description:
      "برای دخترم (۷ ساله) دنبال معلم پیانو صبور هستم. ترجیحاً خانه یا نزدیک ونک. هفته‌ای یک جلسه.",
    category: "آموزش",
    image: "🎹",
    budget: 2_500_000,
    budgetUnit: "session",
    privacy: "ABC",
    postedAt: "۲ ساعت پیش",
    city: "تهران",
    area: "ونک",
  },
  {
    id: "demo_req_android",
    requesterKey: "ali",
    title: "گوشی اندروید دست‌دوم — ترجیحاً رایگان",
    description:
      "برای کار سبک و پیام. مدل متوسط کافی است. اگر اضافه دارید مجانی یا خیلی ارزان خبر بدهید.",
    category: "لوازم دیجیتال",
    image: "📱",
    budgetUnit: "negotiable",
    privacy: "ABC",
    postedAt: "۵ ساعت پیش",
    city: "تهران",
    area: "ستارخان",
  },
  {
    id: "demo_req_bike",
    requesterKey: "reza",
    title: "دوچرخه شهری سالم برای رفت‌وآمد",
    description:
      "سایز ۲۶. ترمزها باید درست باشد. قفل همراه امتیاز است. بازدید در پارکینگ ممکن است.",
    category: "ورزش",
    image: "🚲",
    budget: 5_000_000,
    budgetUnit: "total",
    privacy: "AB",
    postedAt: "دیروز",
    city: "تهران",
    area: "پونک",
  },
  {
    id: "demo_req_math",
    requesterKey: "hossein",
    viaKey: "leila",
    title: "معلم خصوصی ریاضی پایه هفتم",
    description:
      "پسرم پایه هفتم است؛ ریاضی‌اش ضعیف شده. معلم باحوصله، آنلاین یا حضوری نزدیک یوسف‌آباد.",
    category: "آموزش",
    image: "📐",
    budget: 1_800_000,
    budgetUnit: "session",
    privacy: "ABC",
    postedAt: "دیروز",
    city: "تهران",
    area: "یوسف‌آباد",
  },
  {
    id: "demo_req_stroller",
    requesterKey: "maryam",
    viaKey: "reza",
    title: "کالسکه کودک تمیز کارکرده",
    description:
      "کالسکه سبک برای پیاده‌روی. اگر دیگه لازم ندارید و تمیزه، حتی رایگان هم عالی است.",
    category: "کودک",
    image: "🍼",
    budget: 3_000_000,
    budgetUnit: "total",
    privacy: "AB",
    postedAt: "۳ روز پیش",
    city: "تهران",
    area: "یوسف‌آباد",
  },
];

export const DEMO_OFFER_DEFS: DemoOfferDef[] = [
  {
    id: "demo_offer_piano",
    requestId: "demo_req_piano",
    fromKey: "reza",
    message:
      "خواهرزنم پیانو درس می‌دهد، با بچه‌ها خیلی خوبه. اگر بخوای معرفیش کنم.",
    price: 2_200_000,
    postedAt: "۱ ساعت پیش",
  },
  {
    id: "demo_offer_android",
    requestId: "demo_req_android",
    fromKey: "reza",
    message:
      "یه سامسونگ A14 تمیز دارم که دیگه استفاده نمی‌کنم. می‌تونم مجانی بدم به حلقه.",
    postedAt: "۳ ساعت پیش",
  },
  {
    id: "demo_offer_bike",
    requestId: "demo_req_bike",
    fromKey: "ali",
    message: "دوچرخه شهری سایز ۲۶ سالم دارم. قفل هم همراهشه. بگو بیای ببینی.",
    price: 4_200_000,
    postedAt: "۱۰ ساعت پیش",
  },
];

/** Two wants posted by the logged-in viewer — others in the circle have acted. */
export const VIEWER_REQUEST_DEFS: Omit<DemoRequestDef, "requesterKey">[] = [
  {
    id: "demo_req_me_lamp",
    title: "چراغ مطالعه سالم برای میز کار",
    description:
      "چراغ رومیزی با نور سفید. اگر اضافه دارید بگویید — نو لازم نیست، فقط سالم باشد.",
    category: "لوازم خانه",
    image: "💡",
    budget: 800_000,
    budgetUnit: "total",
    privacy: "ABC",
    postedAt: "دیروز",
    city: "تهران",
    area: "سعادت‌آباد",
  },
  {
    id: "demo_req_me_english",
    title: "تمرین مکالمه انگلیسی هفته‌ای یک جلسه",
    description:
      "سطح متوسط. ترجیحاً حضوری نزدیک محله یا آنلاین. صبور باشد، برای کار می‌خواهم روان‌تر حرف بزنم.",
    category: "آموزش",
    image: "🗣️",
    budget: 1_500_000,
    budgetUnit: "session",
    privacy: "AB",
    postedAt: "۳ ساعت پیش",
    city: "تهران",
    area: "آنلاین",
  },
];

export const VIEWER_OFFER_DEFS: DemoOfferDef[] = [
  {
    id: "demo_offer_me_lamp_reza",
    requestId: "demo_req_me_lamp",
    fromKey: "reza",
    message:
      "یه چراغ مطالعه ایکیا دارم که دیگه لازم ندارم. سالمه، حبابشم عوض کردم. ۶۵۰ می‌دم.",
    price: 650_000,
    postedAt: "۸ ساعت پیش",
  },
  {
    id: "demo_offer_me_lamp_ali",
    requestId: "demo_req_me_lamp",
    fromKey: "ali",
    message:
      "همسایه‌ام یکی اضافه داره. می‌تونم امانت چندروزه برات بگیرم تا خودت بخری.",
    postedAt: "۵ ساعت پیش",
  },
  {
    id: "demo_offer_me_english_leila",
    requestId: "demo_req_me_english",
    fromKey: "leila",
    message:
      "خودم هفته‌ای یک جلسه می‌تونم بیام. با سطح متوسط راحت‌ام. اگر بخوای اول یک جلسه آزمایشی.",
    price: 1_200_000,
    postedAt: "۱ ساعت پیش",
  },
];

type ViewerMessageDef = {
  id: string;
  fromKey: DemoPersonKey;
  fromMe: boolean;
  text: string;
  postedAt: string;
  read: boolean;
  listingTitle?: string;
};

/**
 * Incoming (and one reply) threads about the viewer's own listings / request.
 * Bound to live person + listing ids at runtime.
 */
export const VIEWER_MESSAGE_DEFS: ViewerMessageDef[] = [
  {
    id: "demo_msg_reza_books_1",
    fromKey: "reza",
    fromMe: false,
    text: "کتاب‌های کودک رو دیدم. هنوز می‌تونی بدی؟ خواهرزاده‌ام کلاس دومه.",
    postedAt: "دیروز",
    read: true,
    listingTitle: "کتاب‌های کودک ۷–۹ سال — رایگان",
  },
  {
    id: "demo_msg_reza_books_2",
    fromKey: "reza",
    fromMe: true,
    text: "آره هنوز هست. هر وقت خواستی بیا بردار.",
    postedAt: "دیروز",
    read: true,
    listingTitle: "کتاب‌های کودک ۷–۹ سال — رایگان",
  },
  {
    id: "demo_msg_leila_move_1",
    fromKey: "leila",
    fromMe: false,
    text: "برای جابه‌جایی آخر هفته می‌تونم کمکت کنم. چند تا کارتن داریم، ماشین هم هست.",
    postedAt: "۵ ساعت پیش",
    read: false,
    listingTitle: "کمک در جابه‌جایی خانه — یک روز",
  },
  {
    id: "demo_msg_leila_english_1",
    fromKey: "leila",
    fromMe: false,
    text: "برای درخواست زبانت هم اگر هنوز بازه، خودم می‌تونم هفته‌ای یک جلسه بیام.",
    postedAt: "۳ ساعت پیش",
    read: false,
  },
  {
    id: "demo_msg_ali_sofa_1",
    fromKey: "ali",
    fromMe: false,
    text: "سلام، مبل راحتی هنوز هست؟ برای پذیرایی کوچیک می‌خوام.",
    postedAt: "۲ ساعت پیش",
    read: true,
    listingTitle: "مبل راحتی دونفره — سالم",
  },
  {
    id: "demo_msg_ali_sofa_2",
    fromKey: "ali",
    fromMe: true,
    text: "آره هنوز هست. می‌تونی بیای ببینی — عصرها خانه‌ام.",
    postedAt: "۲ ساعت پیش",
    read: true,
    listingTitle: "مبل راحتی دونفره — سالم",
  },
  {
    id: "demo_msg_ali_sofa_3",
    fromKey: "ali",
    fromMe: false,
    text: "عالی. پنجشنبه عصر اوکی هستی؟ می‌خوام قبلش ابعاد را هم بپرسم.",
    postedAt: "۴۰ دقیقه پیش",
    read: false,
    listingTitle: "مبل راحتی دونفره — سالم",
  },
];

const DEMO_NAME_BY_KEY: Record<string, string> = Object.fromEntries([
  ...DEMO_DIRECT.map((p) => [p.key, p.name] as const),
  ...DEMO_FOF.map((p) => [p.key, p.name] as const),
]);

function personByDemoKey(
  people: Person[],
  key: DemoPersonKey,
): Person | undefined {
  const name = DEMO_NAME_BY_KEY[key];
  if (!name) return undefined;
  return people.find((p) => p.name === name && p.id !== "me");
}

function viaLabel(bridge: Person): string {
  return `${relationLabels[bridge.relation]} من`;
}

/** Build request + offer rows using live demo person ids. */
export function bindDemoRequests(people: Person[]): {
  requests: Request[];
  offers: Offer[];
} {
  const requests: Request[] = [];
  for (const def of DEMO_REQUEST_DEFS) {
    const requester = personByDemoKey(people, def.requesterKey);
    if (!requester) continue;

    let trustPath: Request["trustPath"] = [];
    if (def.viaKey) {
      const bridge = personByDemoKey(people, def.viaKey);
      if (!bridge || !bridge.inMyCircle) continue;
      const fofMeta = DEMO_FOF.find((f) => f.key === def.requesterKey);
      trustPath = [
        {
          personId: bridge.id,
          relationLabel: viaLabel(bridge),
          ...(fofMeta
            ? {
                priorRelationLabel: relationTowardName(
                  fofMeta.viaRelation,
                  bridge.name,
                ),
              }
            : {}),
        },
      ];
    } else if (!requester.inMyCircle) {
      continue;
    }

    requests.push({
      id: def.id,
      title: def.title,
      description: def.description,
      category: def.category,
      image: def.image,
      requesterId: requester.id,
      postedAt: def.postedAt,
      budget: def.budget,
      budgetUnit: def.budgetUnit,
      privacy: def.privacy,
      trustPath,
      endorsements: [],
      city: def.city ?? requester.city,
      area: def.area,
    });
  }

  for (const def of VIEWER_REQUEST_DEFS) {
    requests.push({
      id: def.id,
      title: def.title,
      description: def.description,
      category: def.category,
      image: def.image,
      requesterId: "me",
      postedAt: def.postedAt,
      budget: def.budget,
      budgetUnit: def.budgetUnit,
      privacy: def.privacy,
      trustPath: [],
      endorsements: [],
      city: def.city,
      area: def.area,
    });
  }

  const requestIds = new Set(requests.map((r) => r.id));
  const offers: Offer[] = [];
  for (const def of [...DEMO_OFFER_DEFS, ...VIEWER_OFFER_DEFS]) {
    if (!requestIds.has(def.requestId)) continue;
    const from = personByDemoKey(people, def.fromKey);
    if (!from) continue;
    offers.push({
      id: def.id,
      requestId: def.requestId,
      fromId: from.id,
      message: def.message,
      price: def.price,
      postedAt: def.postedAt,
    });
  }

  return { requests, offers };
}

export function isDemoRequestId(id: string): boolean {
  return id.startsWith("demo_req_");
}

export function isDemoOfferId(id: string): boolean {
  return id.startsWith("demo_offer_");
}

export function isDemoMessageId(id: string): boolean {
  return id.startsWith("demo_msg_");
}

export function viewerListingsMissing(listings: Listing[]): boolean {
  const mine = listings.filter((l) => l.sellerId === "me");
  return VIEWER_LISTING_DEFS.some(
    (def) => !mine.some((l) => l.title === def.title),
  );
}

/** True when the home feed is missing the shared demo circle catalog. */
export function demoNetworkListingsMissing(listings: Listing[]): boolean {
  const titles = new Set(listings.map((l) => l.title));
  const expected = DEMO_DIRECT.flatMap((p) =>
    p.listings.map((item) => item.title),
  );
  if (expected.length === 0) return false;
  const hits = expected.filter((title) => titles.has(title)).length;
  return hits < Math.min(3, expected.length);
}

export function demoSocialMissing(
  requests: Request[],
  events: CircleEvent[],
): boolean {
  const reqTitles = new Set(requests.map((r) => r.title));
  const expectedReq = DEMO_REQUEST_DEFS.map((d) => d.title);
  if (expectedReq.length > 0) {
    const hits = expectedReq.filter((t) => reqTitles.has(t)).length;
    if (hits < Math.min(2, expectedReq.length)) return true;
  }
  const eventTitles = new Set(events.map((e) => e.title));
  if (!eventTitles.has("کلاس یوگای صبحگاهی") && !eventTitles.has("قرار بازی کودکان در پارک")) {
    return true;
  }
  return false;
}

export function circleCatalogIncomplete(
  listings: Listing[],
  membersLength: number,
  requests: Request[] = [],
  events: CircleEvent[] = [],
): boolean {
  if (membersLength === 0 && listings.length === 0) return true;
  return (
    viewerListingsMissing(listings) ||
    demoNetworkListingsMissing(listings) ||
    demoSocialMissing(requests, events)
  );
}

function listingIdByTitle(
  listings: Listing[],
  title: string | undefined,
): string | undefined {
  if (!title) return undefined;
  return listings.find((l) => l.sellerId === "me" && l.title === title)?.id;
}

export function bindViewerMessages(
  people: Person[],
  listings: Listing[],
): Message[] {
  const out: Message[] = [];
  for (const def of VIEWER_MESSAGE_DEFS) {
    const peer = personByDemoKey(people, def.fromKey);
    if (!peer) continue;
    const listingId = listingIdByTitle(listings, def.listingTitle);
    out.push({
      id: def.id,
      peerId: peer.id,
      fromMe: def.fromMe,
      text: def.text,
      postedAt: def.postedAt,
      sentAt: sentAtFromRelative(def.postedAt),
      read: def.read,
      ...(def.fromMe ? { seenByPeer: true } : {}),
      ...(listingId ? { listingId } : {}),
    });
  }
  return out;
}

export function isLocalPendingMessageId(id: string): boolean {
  return id.startsWith("local_");
}

export function reconcileDemoMessages(
  prev: Message[],
  people: Person[],
  listings: Listing[],
): Message[] {
  const bound = bindViewerMessages(people, listings);
  // Keep server + in-flight rows even if the peer is not in the current circle.
  const userRows = prev.filter((m) => !isDemoMessageId(m.id));
  return [...userRows, ...bound];
}

/** Server inbox wins; keep optimistic sends and seeded demo threads. */
export function mergeInboxMessages(
  server: Message[],
  prev: Message[],
  deletedPeerIds: string[],
): { messages: Message[]; revivedPeerIds: string[] } {
  const unreadKeys = new Set<string>();
  for (let i = 0; i < server.length; i++) {
    const m = server[i]!;
    if (m.fromMe || m.read) continue;
    unreadKeys.add(m.peerId);
    unreadKeys.add(threadKey(m.peerId, m.threadListingId));
  }
  const revivedPeerIds = deletedPeerIds.filter((id) => unreadKeys.has(id));
  const hide = new Set(
    deletedPeerIds.filter((id) => !unreadKeys.has(id) && id !== CIRCLO_PEER_ID),
  );
  const visible = server.filter((m) => {
    const key = threadKey(m.peerId, m.threadListingId);
    return !hide.has(m.peerId) && !hide.has(key);
  });
  const pending = prev.filter((m) => isLocalPendingMessageId(m.id));
  const demo = prev.filter((m) => isDemoMessageId(m.id));
  const messages = [...visible, ...pending, ...demo].sort(
    (a, b) => messageSentAt(a) - messageSentAt(b),
  );
  return { messages, revivedPeerIds };
}

/** Keep user-authored rows; replace seeded demo rows from the catalog. */
export function reconcileDemoRequests(
  prev: Request[],
  people: Person[],
): Request[] {
  const { requests: demo } = bindDemoRequests(people);
  const userRows = prev.filter(
    (r) =>
      r.requesterId === "me" &&
      !isDemoRequestId(r.id) &&
      !/^r[1-9]$/.test(r.id),
  );
  // Drop legacy mock (sara/…) and previous demo binds.
  return [...userRows, ...demo];
}

export function reconcileDemoOffers(prev: Offer[], people: Person[]): Offer[] {
  const { offers: demo } = bindDemoRequests(people);
  const userRows = prev.filter(
    (o) => o.fromId === "me" && !isDemoOfferId(o.id) && !/^o[1-9]$/.test(o.id),
  );
  return [...userRows, ...demo];
}
