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
  BudgetUnit,
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
  donation: "اهدا",
  exchange: "تعویض",
  loan: "امانت",
  service: "خدمات",
};

/** Hide a trailing «رایگان» in the title when the price line already says it. */
export function listingDisplayTitle(
  title: string,
  type: ListingType,
): string {
  if (type !== "donation") return title;
  const trimmed = title
    .replace(/\s*[—–\-]\s*رایگان\s*$/, "")
    .replace(/\s*رایگان\s*$/, "")
    .trim();
  return trimmed || title;
}

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
  verify_item: "از نزدیک دیده‌ام",
  know_seller: "می‌شناسمش",
  verify_quality: "وضعیتش را چک کرده‌ام",
  dealt_before: "باهاش معامله کرده‌ام",
  word: "حرف",
};

export const badgeHints: Record<Exclude<BadgeType, "word">, string> = {
  verify_item: "یعنی عکس و توضیح با واقعیت جور است",
  know_seller: "از آشنایان یا زندگی واقعی می‌شناسی‌اش",
  verify_quality: "یعنی سالم بودن یا کارکردش را دیده‌ام، نه فقط عکس",
  dealt_before: "قوی‌ترین حرف — قبلاً دادوستد کرده‌اید",
};

/** Past-tense / third-person lines for endorsement feed. */
export const badgeResultLabels: Record<BadgeType, string> = {
  verify_item: "این را از نزدیک دیده است",
  know_seller: "این فرد را می‌شناسد",
  verify_quality: "وضعیت گفته‌شده را بررسی کرده است",
  dealt_before: "قبلاً با این فرد معامله کرده است",
  word: "حرفی گذاشته است",
};

export const ENDORSE_NOTE_MAX = 160;

/** Badges shown as checkboxes in the endorse sheet (not free-text). */
export const ITEM_BADGES: BadgeType[] = ["verify_item", "verify_quality"];
export const PERSON_BADGES: BadgeType[] = ["know_seller", "dealt_before"];

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
    note?: string;
  },
): string {
  const who = opts.endorserName;
  const claim = endorsementClaimAfterName(type, {
    sellerName: opts.sellerName,
  });
  const note = opts.note?.trim();
  if (note && type === "word") return `${who}: «${note}»`;
  const line = `${who} ${claim}.`;
  if (note) return `${line} «${note}»`;
  return line;
}

/** Predicate after the endorser’s name — so the name can be typeset separately. */
export function endorsementClaimAfterName(
  type: BadgeType,
  opts: { sellerName: string },
): string {
  const seller = opts.sellerName;
  switch (type) {
    case "know_seller":
      return `${seller} را می‌شناسد`;
    case "dealt_before":
      return `قبلاً با ${seller} معامله کرده است`;
    case "verify_item":
      return "این آگهی را از نزدیک دیده است";
    case "verify_quality":
      return "وضعیت این آگهی را بررسی کرده است";
    case "word":
      return "حرفی گذاشته است";
    default:
      return badgeResultLabels[type];
  }
}

export function formatEndorsementPreview(
  types: BadgeType[],
  opts: {
    meName: string;
    sellerName: string;
    listingTitle?: string;
    note?: string;
  },
): string {
  const who = opts.meName.trim() || "تو";
  const seller = opts.sellerName;
  const item = opts.listingTitle?.trim();
  const claims = types
    .filter((t) => t !== "word")
    .map((type) => {
      switch (type) {
        case "verify_item":
          return item ? `«${item}» را از نزدیک دیده` : "این را از نزدیک دیده";
        case "verify_quality":
          return "وضعیتش را چک کرده";
        case "know_seller":
          return `${seller} را می‌شناسد`;
        case "dealt_before":
          return `قبلاً با ${seller} معامله کرده`;
        default:
          return "";
      }
    })
    .filter(Boolean);
  let head = "";
  if (claims.length === 1) head = `${who} ${claims[0]}.`;
  else if (claims.length === 2) head = `${who} ${claims[0]} و ${claims[1]}.`;
  else if (claims.length > 2) {
    head = `${who} ${claims.slice(0, -1).join("، ")} و ${claims[claims.length - 1]}.`;
  }
  const note = opts.note?.trim();
  if (head && note) return `${head} «${note}»`;
  if (note) return `${who}: «${note}»`;
  return head;
}

export const badgeEmoji: Record<BadgeType, string> = {
  verify_item: "✅",
  know_seller: "👤",
  verify_quality: "⭐",
  dealt_before: "🤝",
  word: "💬",
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

/** Short viewer-facing privacy line; uses seller name when known. */
export function listingPrivacyAudienceLine(
  privacy: Privacy,
  sellerName?: string,
): string {
  const who = sellerName?.trim();
  switch (privacy) {
    case "A":
      return who
        ? `فقط نزدیکان ${who} این آگهی را می‌بینند`
        : "فقط نزدیکان فروشنده این آگهی را می‌بینند";
    case "AB":
      return who
        ? `فقط نزدیکان و افراد مورد اعتماد ${who} این آگهی را می‌بینند`
        : "فقط نزدیکان و افراد مورد اعتماد فروشنده این آگهی را می‌بینند";
    case "ABC":
      return who
        ? `فقط اعضای حلقهٔ ${who} این آگهی را می‌بینند`
        : "فقط اعضای حلقهٔ فروشنده این آگهی را می‌بینند";
    case "referral":
      return "فقط با معرفی دیده می‌شود";
    case "approved":
      return who
        ? `فقط با اجازهٔ ${who} دیده می‌شود`
        : "فقط با اجازهٔ فروشنده دیده می‌شود";
  }
}

/** Viewer-facing privacy copy on request detail (not the requester’s «حلقهٔ من»). */
export const requestPrivacyDetailLabels: Record<Privacy, string> = {
  A: "فقط نزدیکان درخواست‌دهنده می‌بینند — نه اینترنت عمومی",
  AB: "نزدیکان و افراد مورد اعتماد درخواست‌دهنده می‌بینند — نه اینترنت عمومی",
  ABC: "همهٔ حلقهٔ درخواست‌دهنده می‌بینند — نه اینترنت عمومی",
  referral: "فقط با معرفی دیده می‌شود — نه اینترنت عمومی",
  approved: "فقط با اجازهٔ درخواست‌دهنده دیده می‌شود",
};

/** Detail privacy line with requester name when known. */
export function requestPrivacyAudienceLine(
  privacy: Privacy,
  requesterName?: string,
): string {
  const who = requesterName?.trim();
  switch (privacy) {
    case "A":
      return who
        ? `نمایش فقط برای نزدیکان ${who}`
        : "نمایش فقط برای نزدیکان درخواست‌دهنده";
    case "AB":
      return who
        ? `نمایش فقط برای نزدیکان و افراد مورد اعتماد ${who}`
        : "نمایش فقط برای نزدیکان و افراد مورد اعتماد درخواست‌دهنده";
    case "ABC":
      return who
        ? `نمایش فقط برای حلقهٔ ${who}`
        : "نمایش فقط برای حلقهٔ درخواست‌دهنده";
    case "referral":
      return "نمایش فقط با معرفی";
    case "approved":
      return who
        ? `نمایش فقط با اجازهٔ ${who}`
        : "نمایش فقط با اجازهٔ درخواست‌دهنده";
  }
}

/** Request amount line — never uses the word «بودجه». */
export function formatRequestBudget(
  budget?: number,
  unit?: BudgetUnit,
): string {
  if (unit === "negotiable" || budget == null) return "توافقی";
  const amount = `تا ${formatPrice(budget)}`;
  if (unit === "session") return `${amount} · هر جلسه`;
  if (unit === "month") return `${amount} · ماهانه`;
  return amount;
}

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
