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

/**
 * Normalise Persian text for search/compare:
 * unify Arabic ك/ي → Persian ک/ی, strip diacritics, convert digits,
 * collapse whitespace, lowercase.
 */
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
