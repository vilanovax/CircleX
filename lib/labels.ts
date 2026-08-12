import type {
  BadgeType,
  EventKind,
  ListingType,
  Privacy,
  RelationType,
  TrustLevel,
} from "./types";
import { toPersianDigits } from "./persian";

export const relationLabels: Record<RelationType, string> = {
  family: "خانواده",
  friend: "دوست",
  colleague: "همکار",
  neighbor: "همسایه",
  acquaintance: "آشنا",
};

export const relationEmoji: Record<RelationType, string> = {
  family: "👨‍👩‍👧",
  friend: "🤝",
  colleague: "💼",
  neighbor: "🏠",
  acquaintance: "🙂",
};

export const levelLabels: Record<TrustLevel, string> = {
  A: "نزدیکان",
  B: "مورد اعتماد",
  C: "آشنایان",
};

/** Placement inside the viewer's personal circle (not a global trust score). */
export const levelShort: Record<TrustLevel, string> = {
  A: "نزدیکان",
  B: "مورد اعتماد",
  C: "آشنایان",
};

/** Single-letter tier token — used only for compact visual badges/toggles. */
export const levelLetter: Record<TrustLevel, string> = {
  A: "A",
  B: "B",
  C: "C",
};

/** Tailwind classes for each trust level (text + subtle bg). */
export const levelChip: Record<TrustLevel, string> = {
  A: "bg-green-50 text-levelA",
  B: "bg-blue-50 text-levelB",
  C: "bg-amber-50 text-levelC",
};

export const levelDot: Record<TrustLevel, string> = {
  A: "bg-levelA",
  B: "bg-levelB",
  C: "bg-levelC",
};

/** Compact degree digit for avatar badges (A=۱ closest). */
export const levelDegreeFa: Record<TrustLevel, string> = {
  A: "۱",
  B: "۲",
  C: "۳",
};

/** Accessible explanation of A/B/C trust tiers. */
export const levelHint: Record<TrustLevel, string> = {
  A: "جایگاه در حلقه شما: نزدیکان",
  B: "جایگاه در حلقه شما: مورد اعتماد",
  C: "جایگاه در حلقه شما: آشنایان",
};

export const listingTypeLabels: Record<ListingType, string> = {
  sale: "فروش",
  donation: "اهدا / خیریه",
  exchange: "معاوضه",
  loan: "قرض موقت",
  service: "خدمات",
};

export const listingTypeEmoji: Record<ListingType, string> = {
  sale: "🏷️",
  donation: "🎁",
  exchange: "🔄",
  loan: "⏳",
  service: "🛠️",
};

export const listingTypeChip: Record<ListingType, string> = {
  sale: "bg-brand-50 text-brand-700",
  donation: "bg-pink-50 text-pink-600",
  exchange: "bg-teal-50 text-teal-600",
  loan: "bg-indigo-50 text-indigo-600",
  service: "bg-orange-50 text-orange-600",
};

export const eventKindLabels: Record<EventKind, string> = {
  class: "کلاس و کارگاه",
  family: "دورهمی خانوادگی",
  charity: "بازارچه و خیریه",
  kids: "کودکان",
  trip: "سفر گروهی",
  social: "دورهمی",
};

export const eventKindEmoji: Record<EventKind, string> = {
  class: "🧘",
  family: "🍲",
  charity: "🎗️",
  kids: "🧒",
  trip: "🏞️",
  social: "🎉",
};

export const eventKindChip: Record<EventKind, string> = {
  class: "bg-teal-50 text-teal-600",
  family: "bg-rose-50 text-rose-600",
  charity: "bg-pink-50 text-pink-600",
  kids: "bg-sky-50 text-sky-600",
  trip: "bg-emerald-50 text-emerald-600",
  social: "bg-violet-50 text-violet-600",
};

export const badgeLabels: Record<BadgeType, string> = {
  verify_item: "این مورد را از نزدیک دیده‌ام",
  know_seller: "فروشنده را شخصاً می‌شناسم",
  verify_quality: "وضعیت اعلام‌شده را شخصاً بررسی کرده‌ام",
  dealt_before: "قبلاً با این فروشنده معامله داشته‌ام",
};

/** Past-tense / third-person lines for endorsement feed. */
export const badgeResultLabels: Record<BadgeType, string> = {
  verify_item: "این مورد را از نزدیک دیده است",
  know_seller: "فروشنده را شخصاً می‌شناسد",
  verify_quality: "وضعیت اعلام‌شده را شخصاً بررسی کرده است",
  dealt_before: "قبلاً با این فروشنده معامله داشته است",
};

export const badgeEmoji: Record<BadgeType, string> = {
  verify_item: "✅",
  know_seller: "👤",
  verify_quality: "⭐",
  dealt_before: "🤝",
};

/** Plain-language audience labels (detail / picker). Keep short — feed hides these. */
export const privacyLabels: Record<Privacy, string> = {
  A: "نزدیک‌ترین‌ها",
  AB: "نزدیک و مطمئن",
  ABC: "همهٔ حلقه",
  referral: "با معرفی",
  approved: "با تأیید من",
};

/** Longer privacy copy for listing detail — matches A/AB/ABC model, not named rings. */
export const privacyDetailLabels: Record<Privacy, string> = {
  A: "قابل‌مشاهده فقط برای نزدیک‌ترین‌های فروشنده",
  AB: "قابل‌مشاهده برای نزدیک و مطمئن فروشنده",
  ABC: "قابل‌مشاهده تا سطح آشنایان فروشنده — نه عموم",
  referral: "فقط با معرفی دیده می‌شود",
  approved: "فقط با تأیید فروشنده دیده می‌شود",
};

export const privacyEmoji: Record<Privacy, string> = {
  A: "🔒",
  AB: "🔐",
  ABC: "👥",
  referral: "🪪",
  approved: "✋",
};

/** Format a Toman price with Persian digits and Persian thousands separators. */
export function formatPrice(price?: number): string {
  if (price == null) return "";
  const grouped = price
    .toLocaleString("en-US")
    .replace(/,/g, "٬");
  return `${toPersianDigits(grouped)} تومان`;
}
