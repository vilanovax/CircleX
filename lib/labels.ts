/**
 * Voice glossary (UI only — keep code identifiers unchanged):
 *   حلقه        people I added
 *   گروه        A/B/C buckets: نزدیکان / افراد مورد اعتماد / آشنایان
 *   مسیر ارتباط  how two people connect (not «اعتماد»)
 *   تأیید       a member’s claim (not a guarantee)
 *   سابقه       activity record
 *   آگهی / درخواست / رویداد
 *   Address the user as تو — rewrite the sentence, don’t paste «تو» onto «شما» copy.
 */
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

/** «خانوادهٔ عسل» — relation of someone toward the named person. */
export function relationTowardName(
  relation: RelationType,
  ofName: string,
): string {
  const base = relationLabels[relation];
  const name = ofName.trim();
  if (!name) return base;
  if (base.endsWith("ه") || base.endsWith("ة")) return `${base}ٔ ${name}`;
  return `${base}ِ ${name}`;
}

export const relationEmoji: Record<RelationType, string> = {
  family: "👨‍👩‍👧",
  friend: "🤝",
  colleague: "💼",
  neighbor: "🏠",
  acquaintance: "🙂",
};

export const levelLabels: Record<TrustLevel, string> = {
  A: "نزدیکان",
  B: "افراد مورد اعتماد",
  C: "آشنایان",
};

/** Placement inside the viewer's personal circle (not a global trust score). */
export const levelShort: Record<TrustLevel, string> = {
  A: "نزدیکان",
  B: "افراد مورد اعتماد",
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

/** Accessible explanation of A/B/C groups — never expose the letter in UI. */
export const levelHint: Record<TrustLevel, string> = {
  A: "افرادی که ارتباط خیلی نزدیکی با آن‌ها داری.",
  B: "افرادی که می‌شناسی و به آن‌ها اطمینان داری.",
  C: "افرادی که ارتباط محدودتری با آن‌ها داری.",
};

export const listingTypeLabels: Record<ListingType, string> = {
  sale: "فروش",
  donation: "رایگان / اهدا",
  exchange: "تعویض",
  loan: "امانت",
  service: "خدمات",
};

/** Short intent chips on compose — donation stays «رایگان» so the five buttons fit. */
export const listingTypeIntentLabels: Record<ListingType, string> = {
  sale: "فروش",
  donation: "رایگان",
  exchange: "تعویض",
  loan: "امانت",
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
  verify_item: "این را از نزدیک دیده‌ام",
  know_seller: "این فرد را می‌شناسم",
  verify_quality: "وضعیت گفته‌شده را بررسی کرده‌ام",
  dealt_before: "قبلاً با این فرد معامله کرده‌ام",
};

/** Past-tense / third-person lines for endorsement feed. */
export const badgeResultLabels: Record<BadgeType, string> = {
  verify_item: "این را از نزدیک دیده است",
  know_seller: "این فرد را می‌شناسد",
  verify_quality: "وضعیت گفته‌شده را بررسی کرده است",
  dealt_before: "قبلاً با این فرد معامله کرده است",
};

/** Badges that speak about the seller/person, not a specific listing item. */
export const personAboutBadges: BadgeType[] = ["know_seller", "dealt_before"];

export function isPersonAboutBadge(type: BadgeType): boolean {
  return personAboutBadges.includes(type);
}

/**
 * Third-person report for feeds/profile (not first-person chip labels).
 * Example: «رضا، سارا را می‌شناسد.»
 */
export function formatEndorsementReport(
  type: BadgeType,
  opts: {
    endorserName: string;
    sellerName: string;
    listingTitle?: string;
  },
): string {
  const who = opts.endorserName;
  const seller = opts.sellerName;
  const item = opts.listingTitle?.trim();
  switch (type) {
    case "know_seller":
      return `${who}، ${seller} را می‌شناسد.`;
    case "dealt_before":
      return `${who} قبلاً با ${seller} معامله کرده است.`;
    case "verify_item":
      return item
        ? `${who} «${item}» را از نزدیک دیده است.`
        : `${who} این را از نزدیک دیده است.`;
    case "verify_quality":
      return item
        ? `${who} وضعیت گفته‌شدهٔ «${item}» را بررسی کرده است.`
        : `${who} وضعیت گفته‌شده را بررسی کرده است.`;
    default:
      return `${who} — ${badgeResultLabels[type]}`;
  }
}

export const badgeEmoji: Record<BadgeType, string> = {
  verify_item: "✅",
  know_seller: "👤",
  verify_quality: "⭐",
  dealt_before: "🤝",
};

/** Plain-language audience labels (detail / picker). Keep short — feed hides these. */
export const privacyLabels: Record<Privacy, string> = {
  A: "فقط نزدیکان من",
  AB: "نزدیکان و افراد مورد اعتماد",
  ABC: "همهٔ حلقهٔ من",
  referral: "فقط با معرفی",
  approved: "فقط با اجازه من",
};

/** Longer privacy copy for listing detail — matches A/AB/ABC groups. */
export const privacyDetailLabels: Record<Privacy, string> = {
  A: "این آگهی را فقط نزدیکان فروشنده می‌بینند",
  AB: "این آگهی را نزدیکان و افراد مورد اعتماد فروشنده می‌بینند",
  ABC: "این آگهی را همهٔ حلقهٔ فروشنده می‌بینند — در اینترنت عمومی نه",
  referral: "فقط کسانی که معرفی شده‌اند این آگهی را می‌بینند",
  approved: "فقط کسانی که فروشنده اجازه بدهد این آگهی را می‌بینند",
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
