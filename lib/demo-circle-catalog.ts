import type { ListingType, Privacy, RelationType, TrustLevel } from "./types";

/** Reserved Iranian mobiles for the demo circle (never use for real OTP users). */
export const DEMO_PHONES = {
  leila: "09001180001",
  ali: "09001180002",
  reza: "09001180003",
  hossein: "09001180004",
  maryam: "09001180005",
  kaveh: "09001180006",
  narges: "09001180007",
  joinGuest: "09001180008",
  pendingInvite: "09001180009",
} as const;

export type DemoPersonKey = keyof typeof DEMO_PHONES;

export type DemoListingDef = {
  title: string;
  description: string;
  type: ListingType;
  price?: number;
  category: string;
  image: string;
  images: string[];
  condition?: string;
  privacy: Privacy;
  dealStatus?: "available" | "reserved" | "agreed";
};

export type DemoPersonDef = {
  key: DemoPersonKey;
  name: string;
  city: string;
  avatar: string;
  /** How they sit in *your* circle when direct. */
  myRelation?: RelationType;
  myLevel?: TrustLevel;
  /** Short note for FoF cards (e.g. همکار لیلا). Filled at seed time if template. */
  note?: string;
  listings: DemoListingDef[];
};

/** Direct members seeded into the logged-in user's circle. */
export const DEMO_DIRECT: DemoPersonDef[] = [
  {
    key: "leila",
    name: "لیلا",
    city: "تهران",
    avatar: "/avatars/11.webp",
    myRelation: "colleague",
    myLevel: "B",
    listings: [
      {
        title: "آموزش اکسل برای کارهای اداری",
        description:
          "جلسات کوتاه برای گزارش و جدول. آنلاین یا نزدیک محل کار. صبور و با حوصله.",
        type: "service",
        price: 450_000,
        category: "آموزش",
        image:
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
        ],
        privacy: "ABC",
      },
      {
        title: "کیف چرمی اداری — تقریباً نو",
        description:
          "کیف کار روزمره. جیب لپ‌تاپ ۱۳ اینچ. یک خط خیلی کم روی دسته دارد.",
        type: "sale",
        price: 1_850_000,
        category: "پوشاک و اکسسوری",
        image:
          "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
        ],
        condition: "در حد نو",
        privacy: "AB",
      },
    ],
  },
  {
    key: "ali",
    name: "علی",
    city: "تهران",
    avatar: "/avatars/05.webp",
    myRelation: "neighbor",
    myLevel: "B",
    listings: [
      {
        title: "دریل و جعبه ابزار — امانت چندروزه",
        description:
          "برای کار کوچک خانه امانت می‌دهم. فقط به همسایه‌ها و آشنایان. تحویل در لابی.",
        type: "loan",
        category: "ابزار",
        image:
          "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
        ],
        condition: "سالم",
        privacy: "AB",
      },
      {
        title: "گلدان سفالی بزرگ — رایگان",
        description:
          "گلدان اضافه از بالکن. سنگین است؛ بهتر است خودت برداری. سالم و تمیز.",
        type: "donation",
        category: "لوازم خانه",
        image:
          "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80",
        ],
        condition: "سالم",
        privacy: "ABC",
      },
    ],
  },
  {
    key: "reza",
    name: "رضا",
    city: "تهران",
    avatar: "/avatars/03.webp",
    myRelation: "friend",
    myLevel: "A",
    listings: [
      {
        title: "دوچرخه شهری سایز ۲۶",
        description:
          "دوچرخه رفت‌وآمد. ترمزها تازه تنظیم شده. قفل همراه است. بازدید در پارکینگ.",
        type: "sale",
        price: 4_200_000,
        category: "ورزش",
        image:
          "https://images.unsplash.com/photo-1485965120182-cf1713bcabf1?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1485965120182-cf1713bcabf1?auto=format&fit=crop&w=800&q=80",
        ],
        condition: "کارکرده تمیز",
        privacy: "ABC",
      },
      {
        title: "هدفون بی‌سیم سالم",
        description:
          "کم استفاده شده. جعبه و کابل دارد. فقط برای نزدیکان می‌گذارم.",
        type: "sale",
        price: 2_100_000,
        category: "لوازم دیجیتال",
        image:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        ],
        condition: "در حد نو",
        privacy: "A",
      },
      {
        title: "کتاب‌های برنامه‌نویسی — چند جلد",
        description:
          "چند کتاب فنی که دیگر لازم ندارم. رایگان برای کسی که می‌خواهد یاد بگیرد.",
        type: "donation",
        category: "کتاب",
        image:
          "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
        ],
        condition: "سالم",
        privacy: "ABC",
        dealStatus: "available",
      },
    ],
  },
];

/** Friends-of-friends — connected through someone already in your circle. */
export const DEMO_FOF: {
  key: DemoPersonKey;
  name: string;
  city: string;
  avatar: string;
  /** Prefer this direct demo key as bridge; else first family member. */
  preferBridge: DemoPersonKey | "family";
  /** Relation of the *bridge* toward this person. */
  viaRelation: RelationType;
  noteTemplate: string;
  listings: DemoListingDef[];
}[] = [
  {
    key: "hossein",
    name: "حسین",
    city: "تهران",
    avatar: "/avatars/07.webp",
    preferBridge: "leila",
    viaRelation: "colleague",
    noteTemplate: "همکار {bridge}",
    listings: [
      {
        title: "تعمیر لپ‌تاپ و ارتقا رم",
        description:
          "تعمیر سخت‌افزار سبک و نصب سیستم. معمولاً همان روز. ضمانت کار یک هفته.",
        type: "service",
        price: 700_000,
        category: "خدمات فنی",
        image:
          "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
        ],
        privacy: "ABC",
      },
    ],
  },
  {
    key: "maryam",
    name: "مریم",
    city: "تهران",
    avatar: "/avatars/08.webp",
    preferBridge: "reza",
    viaRelation: "friend",
    noteTemplate: "دوست {bridge}",
    listings: [
      {
        title: "کالسکه کودک دست‌دوم تمیز",
        description:
          "کالسکه سبک مسافرتی. پارچه شسته شده. به‌خاطر بزرگ شدن بچه می‌فروشم.",
        type: "sale",
        price: 3_500_000,
        category: "کودک",
        image:
          "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=800&q=80",
        ],
        condition: "کارکرده تمیز",
        privacy: "ABC",
      },
    ],
  },
  {
    key: "kaveh",
    name: "کاوه",
    city: "کرج",
    avatar: "/avatars/09.webp",
    preferBridge: "ali",
    viaRelation: "neighbor",
    noteTemplate: "همسایه {bridge}",
    listings: [
      {
        title: "میز تحریر چوبی جمع‌وجور",
        description:
          "میز کار کوچک برای اتاق. کشو دارد. یک خط کم روی سطح. ارسال تا تهران ممکن است.",
        type: "sale",
        price: 2_800_000,
        category: "لوازم خانه",
        image:
          "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=800&q=80",
        ],
        condition: "سالم با ایراد جزئی",
        privacy: "AB",
      },
    ],
  },
  {
    key: "narges",
    name: "نرگس",
    city: "تهران",
    avatar: "/avatars/14.webp",
    preferBridge: "family",
    viaRelation: "family",
    noteTemplate: "فامیل {bridge}",
    listings: [
      {
        title: "لباس کودک ۳–۴ سال — رایگان",
        description:
          "چند دست لباس تمیز که دیگر اندازه نیست. رایگان برای خانواده حلقه.",
        type: "donation",
        category: "کودک",
        image:
          "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=80",
        ],
        condition: "سالم",
        privacy: "ABC",
      },
    ],
  },
];

export const DEMO_JOIN_GUEST = {
  key: "joinGuest" as const,
  name: "پویا",
  city: "تهران",
  avatar: "/avatars/18.webp",
};

export const DEMO_PENDING_INVITE = {
  key: "pendingInvite" as const,
  name: "نگار",
  phone: DEMO_PHONES.pendingInvite,
};
