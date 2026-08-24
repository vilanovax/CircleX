const TEHRAN_OFFSET = "+03:30";

export function tehranDayKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Tehran" });
}

export function tehranMidnight(ymd: string): Date {
  return new Date(`${ymd}T00:00:00${TEHRAN_OFFSET}`);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function shiftYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const next = new Date(Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

export function enumerateTehranDays(days: number): string[] {
  const today = tehranDayKey(new Date());
  const start = shiftYmd(today, -(days - 1));
  const out: string[] = [];
  for (let i = 0; i < days; i += 1) {
    out.push(shiftYmd(start, i));
  }
  return out;
}

export function faDayLabel(ymd: string): string {
  return tehranMidnight(ymd).toLocaleDateString("fa-IR", {
    timeZone: "Asia/Tehran",
    month: "numeric",
    day: "numeric",
  });
}

export function faDayLong(ymd: string): string {
  return tehranMidnight(ymd).toLocaleDateString("fa-IR", {
    timeZone: "Asia/Tehran",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
