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
  dealStatus?: "available" | "reserved" | "agreed" | "inactive";
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
          "/listings/laptop-desk.jpg",
        images: [
          "/listings/laptop-desk.jpg",
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
          "/listings/leather-bag.jpg",
        images: [
          "/listings/leather-bag.jpg",
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
          "/listings/cordless-drill.jpg",
        images: [
          "/listings/cordless-drill.jpg",
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
          "/listings/terracotta-pot.jpg",
        images: [
          "/listings/terracotta-pot.jpg",
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
          "/listings/city-bicycle.jpg",
        images: [
          "/listings/city-bicycle.jpg",
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
          "/listings/headphones.jpg",
        images: [
          "/listings/headphones.jpg",
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
          "/listings/stacked-books.jpg",
        images: [
          "/listings/stacked-books.jpg",
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
          "/listings/open-laptop.jpg",
        images: [
          "/listings/open-laptop.jpg",
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
          "/listings/baby-stroller.jpg",
        images: [
          "/listings/baby-stroller.jpg",
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
          "/listings/wooden-desk.jpg",
        images: [
          "/listings/wooden-desk.jpg",
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
          "/listings/child-clothes.jpg",
        images: [
          "/listings/child-clothes.jpg",
        ],
        condition: "سالم",
        privacy: "ABC",
      },
    ],
  },
];

/**
 * Three listings posted *by the logged-in viewer* so they can test
 * seller inbox, profile ads, and incoming messages from the demo circle.
 * Seeded idempotently by title.
 */
export const VIEWER_LISTING_DEFS: DemoListingDef[] = [
  {
    title: "مبل راحتی دونفره — سالم",
    description:
      "مبل پارچه‌ای دونفره. فنرها سالم، پارچه تمیز. مناسب پذیرایی کوچک. بازدید در خانه.",
    type: "sale",
    price: 4_800_000,
    category: "لوازم خانه",
    image:
      "/listings/fabric-sofa.jpg",
    images: [
      "/listings/fabric-sofa.jpg",
    ],
    condition: "کارکرده تمیز",
    privacy: "ABC",
  },
  {
    title: "کمک در جابه‌جایی خانه — یک روز",
    description:
      "جمع کردن کارتن و حمل سبک داخل تهران. ماشین کوچک دارم. یک روز کامل هماهنگ می‌کنیم.",
    type: "service",
    price: 1_200_000,
    category: "خدمات",
    image:
      "/listings/cardboard-boxes.jpg",
    images: [
      "/listings/cardboard-boxes.jpg",
    ],
    privacy: "ABC",
  },
  {
    title: "کتاب‌های کودک ۷–۹ سال — رایگان",
    description:
      "چند جلد داستان و علمی که دیگر نمی‌خوانیم. تمیز و بدون پارگی. رایگان برای حلقه.",
    type: "donation",
    category: "کتاب",
    image:
      "/listings/children-books.jpg",
    images: [
      "/listings/children-books.jpg",
    ],
    condition: "سالم",
    privacy: "ABC",
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
