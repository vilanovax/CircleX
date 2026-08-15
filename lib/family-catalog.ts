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
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80",
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
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
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
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80",
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
      "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=800&q=80",
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
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
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
      "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=800&q=80",
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
      "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80",
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
      "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80",
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
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80",
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
      "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=800&q=80",
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
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
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
