import { isValidIranMobile, normalizePhone } from "./phone";

export type InvitePasteRow = {
  name?: string;
  phone: string;
};

export type InvitePasteResult = {
  valid: InvitePasteRow[];
  invalid: string[];
  duplicates: string[];
};

const PHONE_IN_LINE = /(?:\+98|0098|98|0)?9\d{9}/;

export function parseInviteLines(text: string): InvitePasteResult {
  const valid: InvitePasteRow[] = [];
  const invalid: string[] = [];
  const duplicates: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.replace(/\s/g, "").match(PHONE_IN_LINE);
    const fromDigits = normalizePhone(line);
    const phone = match
      ? normalizePhone(match[0])
      : isValidIranMobile(fromDigits)
        ? fromDigits
        : "";

    if (!phone || !isValidIranMobile(phone)) {
      invalid.push(line);
      continue;
    }
    if (seen.has(phone)) {
      duplicates.push(phone);
      continue;
    }
    seen.add(phone);

    let name = line
      .replace(match?.[0] ?? phone, "")
      .replace(/[،,;|]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (name.length > 40) name = name.slice(0, 40);
    valid.push(name ? { name, phone } : { phone });
  }

  return { valid, invalid, duplicates };
}
