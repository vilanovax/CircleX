import type { ListingSpec, ListingType, Privacy } from "./types";

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

export const LISTING_DEAL = ["available", "reserved", "agreed"] as const;

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
  condition?: string;
  specs?: ListingSpec[];
};

function asTrimmed(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
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
  const image = asTrimmed(raw.image, 2_000_000);
  if (!image) return { ok: false, error: "عکس یا تصویر آگهی لازم است" };

  const imagesRaw = Array.isArray(raw.images) ? raw.images : [];
  const images = imagesRaw
    .map((item) => asTrimmed(item, 2_000_000))
    .filter(Boolean)
    .slice(0, 8);
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
      condition,
      specs,
    },
  };
}
