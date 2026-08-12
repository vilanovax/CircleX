import { LISTINGS } from "./mock-data";
import { toPersianDigits } from "./persian";
import type { ListingType } from "./types";

export type PriceHint = {
  id: string;
  /** Chip label, e.g. «میانگین حلقه». */
  label: string;
  amount: number;
  note: string;
};

function roundNice(n: number): number {
  if (n < 100_000) return Math.round(n / 5_000) * 5_000;
  if (n < 1_000_000) return Math.round(n / 50_000) * 50_000;
  if (n < 10_000_000) return Math.round(n / 100_000) * 100_000;
  return Math.round(n / 500_000) * 500_000;
}

function keywordBoost(text: string): number | null {
  const t = text;
  if (/آیفون\s*1[345]|iphone\s*1[345]/i.test(t)) return 28_000_000;
  if (/آیفون|iphone/i.test(t)) return 18_000_000;
  if (/مبل\s*سه‌?نفره|مبل راحتی/.test(t)) return 8_500_000;
  if (/مبل/.test(t)) return 6_000_000;
  if (/یخچال/.test(t)) return 12_000_000;
  if (/دوچرخه/.test(t)) return 4_500_000;
  if (/پیانو|آموزش/.test(t)) return 600_000;
  if (/پراید|خودرو|ماشین/.test(t)) return 250_000_000;
  return null;
}

function conditionFactor(condition?: string, text?: string): number {
  const c = `${condition ?? ""} ${text ?? ""}`;
  if (/نو و استفاده|کاملاً?\s*نو|آکبند/.test(c)) return 1.15;
  if (/در حد نو|کم\s*استفاده/.test(c)) return 1.05;
  if (/ایراد|رد نشستن|خط و خش|لک/.test(c)) return 0.85;
  if (/کارکرده/.test(c)) return 0.92;
  return 1;
}

/**
 * Suggest fair circle prices from similar mock listings + keyword priors.
 * Not a market oracle — a gentle range for non-pro sellers.
 */
export function suggestListingPrices(input: {
  category: string;
  type: ListingType;
  text: string;
  condition?: string;
}): PriceHint[] {
  if (input.type !== "sale" && input.type !== "service") return [];

  const comps = LISTINGS.filter(
    (l) =>
      l.type === input.type &&
      l.price != null &&
      (l.category === input.category ||
        (input.category && l.category.includes(input.category.slice(0, 4)))),
  );
  const prices = comps
    .map((l) => l.price!)
    .filter((p) => p > 0)
    .sort((a, b) => a - b);

  const boost = keywordBoost(input.text);
  const factor = conditionFactor(input.condition, input.text);

  let mid: number;
  if (prices.length >= 2) {
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    mid = boost != null ? (avg + boost) / 2 : avg;
  } else if (boost != null) {
    mid = boost;
  } else if (prices.length === 1) {
    mid = prices[0];
  } else if (input.type === "service") {
    mid = 500_000;
  } else {
    mid = 3_000_000;
  }

  mid = roundNice(mid * factor);
  const low = roundNice(mid * 0.85);
  const high = roundNice(mid * 1.12);

  const unit = input.type === "service" ? "هر جلسه / خدمت" : "پیشنهاد فروش";

  return [
    {
      id: "low",
      label: "سریع‌فروش",
      amount: low,
      note: `${unit} · کمی پایین‌تر از میانگین حلقه`,
    },
    {
      id: "mid",
      label: "میانگین حلقه",
      amount: mid,
      note: prices.length
        ? `بر اساس ${toPersianDigits(prices.length)} آگهی مشابه در دمو`
        : "برآورد اولیه از دسته و متن",
    },
    {
      id: "high",
      label: "بالاتر",
      amount: high,
      note: "اگر وضعیت بهتر از معمول است",
    },
  ];
}

export function formatPriceAmount(amount: number): string {
  return toPersianDigits(amount.toLocaleString("en-US"));
}
