import { LISTING_PRIVACY } from "./listing-payload";
import { isAllowedListingImage } from "./listing-photo";
import { parseArea } from "./place";
import type {
  BudgetUnit,
  EventKind,
  Privacy,
} from "./types";

const BUDGET_UNITS: BudgetUnit[] = [
  "session",
  "month",
  "total",
  "negotiable",
];

const EVENT_KINDS: EventKind[] = [
  "class",
  "family",
  "charity",
  "kids",
  "trip",
  "social",
];

function parseSocialImage(value: unknown, fallback: string): string | null {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const raw = value.trim();
  const image = raw.startsWith("data:image/")
    ? raw.slice(0, 2_000_000)
    : raw.slice(0, 240);
  if (!isAllowedListingImage(image)) return null;
  return image;
}

function asTrimmed(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export type RequestWriteInput = {
  title: string;
  description: string;
  category: string;
  image: string;
  budget?: number;
  budgetUnit?: BudgetUnit;
  privacy: Privacy;
  area?: string;
};

export type EventWriteInput = {
  title: string;
  description: string;
  kind: EventKind;
  image: string;
  date: string;
  time?: string;
  location: string;
  capacity?: number;
  privacy: Privacy;
};

export type OfferWriteInput = {
  message: string;
  price?: number;
};

export function parseRequestWrite(
  body: unknown,
  extraAreas: Iterable<string> = [],
): { ok: true; data: RequestWriteInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "بدنه نامعتبر است" };
  }
  const raw = body as Record<string, unknown>;
  const title = asTrimmed(raw.title, 80);
  const description = asTrimmed(raw.description, 2000);
  if (title.length < 2) return { ok: false, error: "عنوان درخواست را بنویس" };
  if (description.length < 2) {
    return { ok: false, error: "توضیح درخواست را بنویس" };
  }
  const privacy = (raw.privacy as Privacy) || "ABC";
  if (!LISTING_PRIVACY.includes(privacy)) {
    return { ok: false, error: "محدوده نمایش نامعتبر است" };
  }
  const category = asTrimmed(raw.category, 40) || "متفرقه";
  const image = parseSocialImage(raw.image, "🔎");
  if (!image) return { ok: false, error: "عکس درخواست باید روی همین اپ باشد" };
  let budget: number | undefined;
  if (raw.budget !== undefined && raw.budget !== null && raw.budget !== "") {
    const n = Number(raw.budget);
    if (!Number.isFinite(n) || n < 0 || n > 99_999_999_999) {
      return { ok: false, error: "بودجه نامعتبر است" };
    }
    budget = Math.round(n);
  }
  let budgetUnit: BudgetUnit | undefined;
  if (typeof raw.budgetUnit === "string") {
    if (!BUDGET_UNITS.includes(raw.budgetUnit as BudgetUnit)) {
      return { ok: false, error: "واحد بودجه نامعتبر است" };
    }
    budgetUnit = raw.budgetUnit as BudgetUnit;
  }
  const area = parseArea(raw.area, extraAreas);
  return {
    ok: true,
    data: { title, description, category, image, budget, budgetUnit, privacy, area },
  };
}

export function parseEventWrite(
  body: unknown,
): { ok: true; data: EventWriteInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "بدنه نامعتبر است" };
  }
  const raw = body as Record<string, unknown>;
  const title = asTrimmed(raw.title, 80);
  const description = asTrimmed(raw.description, 2000);
  if (title.length < 2) return { ok: false, error: "عنوان رویداد را بنویس" };
  if (description.length < 2) {
    return { ok: false, error: "توضیح رویداد را بنویس" };
  }
  const kind = raw.kind as EventKind;
  if (!EVENT_KINDS.includes(kind)) {
    return { ok: false, error: "نوع رویداد نامعتبر است" };
  }
  const privacy = (raw.privacy as Privacy) || "ABC";
  if (!LISTING_PRIVACY.includes(privacy)) {
    return { ok: false, error: "محدوده نمایش نامعتبر است" };
  }
  const date = asTrimmed(raw.date, 80);
  if (date.length < 2) return { ok: false, error: "تاریخ رویداد را بنویس" };
  const location = asTrimmed(raw.location, 120);
  if (location.length < 2) return { ok: false, error: "مکان رویداد را بنویس" };
  const image = parseSocialImage(raw.image, "🎉");
  if (!image) return { ok: false, error: "عکس رویداد باید روی همین اپ باشد" };
  const time = asTrimmed(raw.time, 20) || undefined;
  let capacity: number | undefined;
  if (
    raw.capacity !== undefined &&
    raw.capacity !== null &&
    raw.capacity !== ""
  ) {
    const n = Number(raw.capacity);
    if (!Number.isFinite(n) || n < 1 || n > 999) {
      return { ok: false, error: "ظرفیت نامعتبر است" };
    }
    capacity = Math.round(n);
  }
  return {
    ok: true,
    data: {
      title,
      description,
      kind,
      image,
      date,
      time,
      location,
      capacity,
      privacy,
    },
  };
}

export function parseOfferWrite(
  body: unknown,
): { ok: true; data: OfferWriteInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "بدنه نامعتبر است" };
  }
  const raw = body as Record<string, unknown>;
  const message = asTrimmed(raw.message, 500);
  if (message.length < 2) return { ok: false, error: "متن پیشنهاد را بنویس" };
  let price: number | undefined;
  if (raw.price !== undefined && raw.price !== null && raw.price !== "") {
    const n = Number(raw.price);
    if (!Number.isFinite(n) || n < 0 || n > 99_999_999_999) {
      return { ok: false, error: "قیمت نامعتبر است" };
    }
    price = Math.round(n);
  }
  return { ok: true, data: { message, price } };
}

export const PIN_THREAD_MAX = 3;
