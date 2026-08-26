import {
  ENDORSE_NOTE_MAX,
  ITEM_BADGES,
  LISTING_NOTE_MAX,
  PERSON_BADGES,
} from "./labels";
import {
  canonicalListingImage,
  isAllowedListingImage,
} from "./listing-photo";
import { LISTING_PHOTO_MAX_COUNT } from "./media";
import { parseArea } from "./place";
import {
  parsePersonIds,
  parseRelationTypes,
} from "./listing-privacy";
import type {
  BadgeType,
  ListingSpec,
  ListingType,
  Privacy,
  RelationType,
} from "./types";

export const LISTING_TYPES: ListingType[] = [
  "sale",
  "donation",
  "exchange",
  "loan",
  "service",
];

export const LISTING_PRIVACY: Privacy[] = [
  "A",
  "AB",
  "ABC",
  "referral",
  "approved",
];

export const LISTING_DEAL = [
  "available",
  "reserved",
  "agreed",
  "inactive",
] as const;

export type ListingDealStatus = (typeof LISTING_DEAL)[number];

export type ListingWriteInput = {
  title: string;
  description: string;
  type: ListingType;
  price?: number;
  category: string;
  image: string;
  images: string[];
  privacy: Privacy;
  hideIdentity?: boolean;
  excludePersonIds?: string[];
  excludeRelationTypes?: RelationType[];
  condition?: string;
  specs?: ListingSpec[];
  area?: string;
};

function asTrimmed(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function parseListingImageValue(value: unknown): string {
  if (typeof value !== "string") return "";
  const raw = value.trim();
  if (raw.startsWith("data:image/")) return raw.slice(0, 2_000_000);
  return asTrimmed(canonicalListingImage(raw), 240);
}

export function parseSpecs(value: unknown): ListingSpec[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const specs: ListingSpec[] = [];
  for (const item of value.slice(0, 16)) {
    if (!item || typeof item !== "object") continue;
    const row = item as { label?: unknown; value?: unknown };
    const label = asTrimmed(row.label, 40);
    const specValue = asTrimmed(row.value, 80);
    if (!label || !specValue) continue;
    specs.push({ label, value: specValue });
  }
  return specs.length ? specs : undefined;
}

export function parseDealStatus(value: unknown): ListingDealStatus | undefined {
  if (typeof value !== "string") return undefined;
  return LISTING_DEAL.includes(value as ListingDealStatus)
    ? (value as ListingDealStatus)
    : undefined;
}

export function parseListingWrite(
  body: unknown,
  extraAreas: Iterable<string> = [],
): { ok: true; data: ListingWriteInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "بدنه نامعتبر است" };
  }
  const raw = body as Record<string, unknown>;
  const title = asTrimmed(raw.title, 80);
  const description = asTrimmed(raw.description, 2000);
  if (title.length < 2) return { ok: false, error: "عنوان آگهی را بنویس" };
  if (description.length < 2) return { ok: false, error: "توضیح آگهی را بنویس" };

  const type = raw.type as ListingType;
  if (!LISTING_TYPES.includes(type)) {
    return { ok: false, error: "نوع آگهی نامعتبر است" };
  }

  const privacy = (raw.privacy as Privacy) || "ABC";
  if (!LISTING_PRIVACY.includes(privacy)) {
    return { ok: false, error: "محدوده نمایش نامعتبر است" };
  }

  const category = asTrimmed(raw.category, 40) || "متفرقه";
  const image = parseListingImageValue(raw.image);
  if (!image) return { ok: false, error: "عکس یا تصویر آگهی لازم است" };
  if (!isAllowedListingImage(image)) {
    return {
      ok: false,
      error:
        "این عکس اینجا ذخیره نشده. از همین صفحه عکس بگذار یا تصویر نمادین انتخاب کن.",
    };
  }

  const imagesRaw = Array.isArray(raw.images) ? raw.images : [];
  const images = imagesRaw
    .map((item) => parseListingImageValue(item))
    .filter(Boolean)
    .slice(0, LISTING_PHOTO_MAX_COUNT);
  if (images.some((src) => !isAllowedListingImage(src))) {
    return {
      ok: false,
      error:
        "یکی از عکس‌ها اینجا ذخیره نشده. دوباره از همین صفحه بارگذاری کن.",
    };
  }
  if (images.length === 0) images.push(image);

  let price: number | undefined;
  if (raw.price !== undefined && raw.price !== null && raw.price !== "") {
    const n = Number(raw.price);
    if (!Number.isFinite(n) || n < 0 || n > 99_999_999_999) {
      return { ok: false, error: "قیمت نامعتبر است" };
    }
    price = Math.round(n);
  }

  const condition = asTrimmed(raw.condition, 40) || undefined;
  const specs = parseSpecs(raw.specs);
  const area = parseArea(raw.area, extraAreas);
  const hideIdentity = raw.hideIdentity === true;
  const excludePersonIds = parsePersonIds(raw.excludePersonIds);
  const excludeRelationTypes = parseRelationTypes(raw.excludeRelationTypes);

  return {
    ok: true,
    data: {
      title,
      description,
      type,
      price,
      category,
      image,
      images,
      privacy,
      hideIdentity,
      excludePersonIds,
      excludeRelationTypes,
      condition,
      specs,
      area,
    },
  };
}

const ENDORSE_TYPES = [...ITEM_BADGES, ...PERSON_BADGES] as const;
const ENDORSE_TYPE_SET = new Set<string>(ENDORSE_TYPES);

export function parseEndorsementWrite(body: unknown):
  | { ok: true; types: BadgeType[]; note?: string; clear: boolean }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "بدنه نامعتبر است" };
  }
  const raw = body as Record<string, unknown>;
  const seen = new Set<BadgeType>();
  const types: BadgeType[] = [];
  if (Array.isArray(raw.types)) {
    for (const item of raw.types) {
      if (typeof item !== "string" || !ENDORSE_TYPE_SET.has(item)) {
        return { ok: false, error: "گزینهٔ نامعتبر است" };
      }
      const type = item as BadgeType;
      if (seen.has(type)) continue;
      seen.add(type);
      types.push(type);
    }
  }
  types.sort(
    (a, b) => ENDORSE_TYPES.indexOf(a) - ENDORSE_TYPES.indexOf(b),
  );

  const noteRaw = typeof raw.note === "string" ? raw.note.trim() : "";
  const note = noteRaw ? noteRaw.slice(0, ENDORSE_NOTE_MAX) : undefined;
  if (types.length === 0 && !note) {
    return { ok: true, types: [], clear: true };
  }
  return { ok: true, types, note, clear: false };
}

export function parseEndorsementVisibility(body: unknown):
  | { ok: true; personId: string; hidden: boolean }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "بدنه نامعتبر است" };
  }
  const raw = body as Record<string, unknown>;
  const personId = asTrimmed(raw.personId, 64);
  if (personId.length < 8) {
    return { ok: false, error: "نظر نامعتبر است" };
  }
  if (typeof raw.hidden !== "boolean") {
    return { ok: false, error: "وضعیت نمایش نامعتبر است" };
  }
  return { ok: true, personId, hidden: raw.hidden };
}

export function parsePersonalNote(body: unknown):
  | { ok: true; note: string }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "بدنه نامعتبر است" };
  }
  const raw = (body as Record<string, unknown>).note;
  if (raw == null) return { ok: true, note: "" };
  if (typeof raw !== "string") {
    return { ok: false, error: "یادداشت نامعتبر است" };
  }
  return { ok: true, note: raw.trim().slice(0, LISTING_NOTE_MAX) };
}
