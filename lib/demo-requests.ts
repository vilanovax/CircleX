import {
  DEMO_DIRECT,
  DEMO_FOF,
  type DemoPersonKey,
} from "@/lib/demo-circle-catalog";
import { relationLabels, relationTowardName } from "@/lib/labels";
import type { Offer, Person, Privacy, BudgetUnit, Request } from "@/lib/types";

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
    });
  }

  const requestIds = new Set(requests.map((r) => r.id));
  const offers: Offer[] = [];
  for (const def of DEMO_OFFER_DEFS) {
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
