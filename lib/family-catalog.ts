import type { ListingType } from "./types";

export type HouseholdItem = {
  key: string;
  title: string;
  description: string;
  type: ListingType;
  price?: number;
  category: string;
  image: string;
  images: string[];
  condition: string;
};

const HOUSE = "لوازم خانه";

export const HOUSEHOLD_ITEMS: HouseholdItem[] = [
  {
    key: "phone",
    title: "گوشی موبایل سالم، با جعبه",
    description:
      "گوشی شخصی است. صفحه بدون خط، باتری هنوز خوب کار می‌کند. شارژر داخل جعبه است.",
    type: "sale",
    price: 6_800_000,
    category: HOUSE,
    image:
      "/listings/smartphone.jpg",
    images: [
      "/listings/smartphone.jpg",
      "/listings/smartphone-back.jpg",
    ],
    condition: "در حد نو",
  },
  {
    key: "tablet",
    title: "تبلت برای مطالعه و فیلم",
    description:
      "تبلت خانگی است. برای کتاب و فیلم استفاده می‌شد. کاور هم همراهش هست.",
    type: "sale",
    price: 4_200_000,
    category: HOUSE,
    image:
      "/listings/tablet.jpg",
    images: [
      "/listings/tablet.jpg",
    ],
    condition: "سالم با ایراد جزئی",
  },
  {
    key: "sofa",
    title: "مبل راحتی سه‌نفره",
    description:
      "مبل پذیرایی خانه است. پارچه تمیز، فنرها سالم. به‌خاطر تغییر دکوراسیون می‌فروشم.",
    type: "sale",
    price: 8_500_000,
    category: HOUSE,
    image:
      "/listings/fabric-sofa.jpg",
    images: [
      "/listings/fabric-sofa.jpg",
      "/listings/living-room-sofa.jpg",
    ],
    condition: "سالم با ایراد جزئی",
  },
  {
    key: "loveseat",
    title: "سوفا دونفره پارچه‌ای",
    description:
      "سوفا کوچک اتاق نشیمن. مناسب آپارتمان. یک لکه خیلی کم روی دسته دارد.",
    type: "sale",
    price: 5_400_000,
    category: HOUSE,
    image:
      "/listings/two-seat-sofa.jpg",
    images: [
      "/listings/two-seat-sofa.jpg",
    ],
    condition: "کارکرده تمیز",
  },
  {
    key: "laptop",
    title: "لپ‌تاپ برای کار روزمره",
    description:
      "لپ‌تاپ خانگی برای نامه و وب. صفحه‌کلید سالم، شارژ نگه می‌دارد. کیف همراه است.",
    type: "sale",
    price: 12_500_000,
    category: HOUSE,
    image:
      "/listings/macbook.jpg",
    images: [
      "/listings/macbook.jpg",
    ],
    condition: "سالم",
  },
  {
    key: "table",
    title: "میز ناهارخوری چهارنفره",
    description:
      "میز چوبی خانه. چهار صندلی جدا فروخته می‌شود. یک خط کم روی سطح دارد.",
    type: "sale",
    price: 3_900_000,
    category: HOUSE,
    image:
      "/listings/dining-table.jpg",
    images: [
      "/listings/dining-table.jpg",
    ],
    condition: "کارکرده تمیز",
  },
  {
    key: "chair",
    title: "صندلی چوبی سالم — دو عدد",
    description:
      "دو صندلی ناهارخوری. رنگ یکدست، پایه‌ها محکم. از خانه اضافه آمده.",
    type: "sale",
    price: 1_200_000,
    category: HOUSE,
    image:
      "/listings/wooden-chair.jpg",
    images: [
      "/listings/wooden-chair.jpg",
    ],
    condition: "سالم",
  },
  {
    key: "fridge",
    title: "یخچال فریزر خانگی",
    description:
      "یخچال آشپزخانه. سرما خوب است، صدا معمولی. به‌خاطر نقل‌مکان می‌فروشم.",
    type: "sale",
    price: 9_800_000,
    category: HOUSE,
    image:
      "/listings/refrigerator.jpg",
    images: [
      "/listings/refrigerator.jpg",
    ],
    condition: "سالم",
  },
  {
    key: "tv",
    title: "تلویزیون صفحه تخت",
    description:
      "تلویزیون اتاق نشیمن. تصویر واضح، ریموت دارد. پایه سالم است.",
    type: "sale",
    price: 7_200_000,
    category: HOUSE,
    image:
      "/listings/flat-tv.jpg",
    images: [
      "/listings/flat-tv.jpg",
    ],
    condition: "سالم",
  },
  {
    key: "bookshelf",
    title: "کتابخانه چوبی دیواری",
    description:
      "قفسه کتاب خانه. چهار طبقه، ایستاده و محکم. جمع‌وجور برای راهرو یا اتاق.",
    type: "sale",
    price: 2_600_000,
    category: HOUSE,
    image:
      "/listings/bookshelf.jpg",
    images: [
      "/listings/bookshelf.jpg",
    ],
    condition: "کارکرده تمیز",
  },
  {
    key: "books",
    title: "چند جلد کتاب خانه — رایگان",
    description:
      "کتاب‌های داستان و عمومی که دیگر نمی‌خوانیم. تمیز و سالم. رایگان برای کسی که می‌خواهد.",
    type: "donation",
    category: HOUSE,
    image:
      "/listings/stacked-books.jpg",
    images: [
      "/listings/stacked-books.jpg",
    ],
    condition: "سالم",
  },
];

export function twoItemsForPhone(phone: string): [HouseholdItem, HouseholdItem] {
  let hash = 0;
  for (let i = 0; i < phone.length; i++) {
    hash = (hash + phone.charCodeAt(i) * (i + 1)) % 997;
  }
  const a = HOUSEHOLD_ITEMS[hash % HOUSEHOLD_ITEMS.length];
  const b =
    HOUSEHOLD_ITEMS[(hash + 3) % HOUSEHOLD_ITEMS.length] === a
      ? HOUSEHOLD_ITEMS[(hash + 4) % HOUSEHOLD_ITEMS.length]
      : HOUSEHOLD_ITEMS[(hash + 3) % HOUSEHOLD_ITEMS.length];
  return [a, b];
}
