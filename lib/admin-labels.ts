import { maskPhone } from "./phone";

export function redactAdminPhone(phone: string, full: boolean): string {
  return full ? phone : maskPhone(phone);
}

export const ADMIN_ROLE_LABELS: Record<string, string> = {
  superadmin: "مدیر کل",
  moderator: "ناظر",
  support: "پشتیبانی",
  analyst: "تحلیل‌گر",
};

export const REPORT_REASON_LABELS: Record<string, string> = {
  inappropriate: "محتوای نامناسب",
  misleading: "گمراه‌کننده",
  spam: "اسپم یا تبلیغ بی‌ربط",
  other: "دلیل دیگر",
};

export const REPORT_STATUS_LABELS: Record<string, string> = {
  open: "باز",
  reviewed: "بررسی‌شده",
  dismissed: "رد شده",
};

export const INVITE_STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار",
  accepted: "پذیرفته",
  expired: "منقضی",
  revoked: "لغو شده",
};

export const INVITE_KIND_LABELS: Record<string, string> = {
  personal: "شخصی",
  wave: "موجی",
};

export const JOIN_REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار",
  accepted: "پذیرفته",
  rejected: "رد شده",
};

export const CONTENT_KIND_LABELS: Record<string, string> = {
  listing: "آگهی",
  request: "درخواست",
  event: "رویداد",
};

export const FLAG_LABELS: Record<string, string> = {
  aiPolish: "بازنویسی آگهی با هوش مصنوعی",
  waveInvites: "دعوت گروهی",
  requests: "درخواست‌ها",
  events: "رویدادها",
  listingReports: "گزارش آگهی",
  watches: "گوش‌به‌زنگ",
};

export const FLAG_HINTS: Record<string, string> = {
  aiPolish: "فقط وقتی کلید OpenAI هم باشد متن آگهی را بازنویسی می‌کند",
  waveInvites: "لینک گروهی از صفحهٔ دعوت",
  requests: "ثبت درخواست جدید در حلقه",
  events: "ساخت رویداد و دورهمی",
  listingReports: "گزارش آگهی از سوی اعضا",
  watches: "گوش‌به‌زنگ عبارت یا شخص",
};

export const BROADCAST_AUDIENCE_LABELS: Record<string, string> = {
  all: "همهٔ اعضا",
  incomplete: "پروفایل ناقص",
};

export function adminPerson(
  row: { id: string; name: string; phoneNormalized: string },
  fullPhone: boolean,
) {
  return {
    id: row.id,
    name: row.name,
    phone: redactAdminPhone(row.phoneNormalized, fullPhone),
  };
}
