import { toEnglishDigits, toPersianDigits } from "./persian";

/** Normalize Iranian mobile input to `09xxxxxxxxx` (or a shorter prefix while typing). */
export function normalizePhone(raw: string): string {
  let digits = toEnglishDigits(raw).replace(/\D/g, "");
  if (digits.startsWith("98") && digits.length === 12) {
    digits = `0${digits.slice(2)}`;
  }
  if (digits.startsWith("9") && digits.length === 10) {
    digits = `0${digits}`;
  }
  return digits.slice(0, 11);
}

export function isValidIranMobile(phone: string): boolean {
  return /^09\d{9}$/.test(normalizePhone(phone));
}

export function formatPhoneDisplay(phone: string): string {
  const d = normalizePhone(phone);
  if (d.length <= 4) return toPersianDigits(d);
  if (d.length <= 7) {
    return toPersianDigits(`${d.slice(0, 4)} ${d.slice(4)}`);
  }
  return toPersianDigits(`${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`);
}

/** `09121234567` → `۰۹۱۲•••۵۶۷` */
export function maskPhone(phone: string): string {
  const d = normalizePhone(phone);
  if (d.length < 11) return toPersianDigits(d);
  return toPersianDigits(`${d.slice(0, 4)}•••${d.slice(8)}`);
}