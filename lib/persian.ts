// Helpers for handling Persian / Arabic text and digits.

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Convert any Persian/Arabic digits in a string to ASCII 0-9. */
export function toEnglishDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (d) => {
    const fa = FA_DIGITS.indexOf(d);
    if (fa > -1) return String(fa);
    return String(AR_DIGITS.indexOf(d));
  });
}

/** Convert ASCII digits in a string to Persian digits (for display). */
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** Group a typed toman amount with Persian digits and thousands separators. */
export function formatTomanInput(raw: string): string {
  const digits = toEnglishDigits(raw).replace(/\D/g, "");
  if (!digits) return "";
  const trimmed = digits.replace(/^0+(?=\d)/, "");
  const grouped = trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, "٬");
  return toPersianDigits(grouped);
}

/** Parse a toman field (Persian/English digits, separators) into a positive integer. */
export function parseTomanInput(raw: string): number | undefined {
  const digits = toEnglishDigits(raw).replace(/\D/g, "");
  if (!digits) return undefined;
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

const FA_ONES = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
const FA_TENS = [
  "",
  "ده",
  "بیست",
  "سی",
  "چهل",
  "پنجاه",
  "شصت",
  "هفتاد",
  "هشتاد",
  "نود",
];
const FA_TEENS = [
  "ده",
  "یازده",
  "دوازده",
  "سیزده",
  "چهارده",
  "پانزده",
  "شانزده",
  "هفده",
  "هجده",
  "نوزده",
];
const FA_HUNDREDS = [
  "",
  "صد",
  "دویست",
  "سیصد",
  "چهارصد",
  "پانصد",
  "ششصد",
  "هفتصد",
  "هشتصد",
  "نهصد",
];
const FA_SCALES = ["", "هزار", "میلیون", "میلیارد"];

function faThreeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (h) parts.push(FA_HUNDREDS[h]);
  if (r >= 10 && r < 20) {
    parts.push(FA_TEENS[r - 10]);
  } else {
    const t = Math.floor(r / 10);
    const o = r % 10;
    if (t) parts.push(FA_TENS[t]);
    if (o) parts.push(FA_ONES[o]);
  }
  return parts.join(" و ");
}

/** Spoken Persian for a toman amount, e.g. ۳۰۰۰۰۰۰ → «سه میلیون تومان». */
export function tomanInWords(amount: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  let n = Math.floor(amount);
  if (n === 0) return null;
  const chunks: string[] = [];
  let scale = 0;
  while (n > 0 && scale < FA_SCALES.length) {
    const chunk = n % 1000;
    if (chunk) {
      const words = faThreeDigits(chunk);
      const scaleWord = FA_SCALES[scale];
      chunks.unshift(scaleWord ? `${words} ${scaleWord}` : words);
    }
    n = Math.floor(n / 1000);
    scale += 1;
  }
  if (!chunks.length) return null;
  return `${chunks.join(" و ")} تومان`;
}

/**
 * Normalise Persian text for search/compare:
 * unify Arabic ك/ي → Persian ک/ی, strip diacritics, convert digits,
 * collapse whitespace, lowercase.
 */
/** Format ISO date (YYYY-MM-DD) as Jalali (Shamsi); pass through legacy text dates. */
export function formatEventDateDisplay(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const d = new Date(`${date}T12:00:00`);
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(d);
  }
  return date;
}

export function normalizeFa(input: string): string {
  return toEnglishDigits(input)
    .replace(/ي/g, "ی") // Arabic ي → Persian ی
    .replace(/ك/g, "ک") // Arabic ك → Persian ک
    .replace(/[ً-ْٰ]/g, "") // tashkil / diacritics
    .replace(/‌/g, " ") // ZWNJ → space
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
