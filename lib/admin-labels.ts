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

export const EXPORT_KIND_LABELS: Record<string, string> = {
  users: "کاربران",
  invites: "دعوت‌ها",
  reports: "گزارش آگهی",
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "user.ban": "مسدود حساب",
  "user.unban": "رفع مسدود",
  "user.sessions.revoke": "ابطال سشن",
  "listing.moderate": "اعتدال آگهی",
  "request.moderate": "اعتدال درخواست",
  "event.moderate": "اعتدال رویداد",
  "listing_report.update": "رسیدگی به گزارش",
  "invite.revoke": "لغو دعوت",
  "invite.extend": "تمدید دعوت",
  "broadcast.send": "ارسال اعلامیه",
  "settings.update": "تغییر تنظیمات",
  "operator.create": "ساخت اپراتور",
  "operator.update": "ویرایش اپراتور",
};

export const AUDIT_TARGET_LABELS: Record<string, string> = {
  User: "کاربر",
  MarketListing: "آگهی",
  WantRequest: "درخواست",
  Gathering: "رویداد",
  ListingReport: "گزارش آگهی",
  Invite: "دعوت",
  Broadcast: "اعلامیه",
  AppSetting: "تنظیمات",
  admin_user: "اپراتور",
};

export const AUDIT_META_LABELS: Record<string, string> = {
  hidden: "مخفی",
  previousHidden: "مخفی قبلی",
  clearImage: "حذف عکس",
  permanent: "مسدود دائم",
  bannedUntil: "تا",
  previousBannedAt: "مسدود قبلی از",
  previousBannedUntil: "مسدود قبلی تا",
  sessionsRevoked: "سشن باطل‌شده",
  status: "وضعیت",
  hideListing: "مخفی کردن آگهی",
  noticeToReporter: "پیام به گزارش‌دهنده",
  previousStatus: "وضعیت قبلی",
  previousExpiresAt: "انقضای قبلی",
  expiresAt: "انقضا",
  audience: "مخاطب",
  sentCount: "تعداد ارسال",
  cap: "سقف",
  email: "ایمیل",
  role: "نقش",
  name: "نام",
  disabled: "غیرفعال",
  flags: "فلگ‌ها",
  growth: "رشد",
  auth: "احراز",
  previousDealStatus: "وضعیت قبلی آگهی",
  nextDealStatus: "وضعیت بعدی آگهی",
  passwordReset: "بازنشانی رمز",
  cityCount: "تعداد شهر",
  categoryCount: "تعداد دسته",
};

const AUDIT_SKIP_META = new Set(["listingId"]);
const AUDIT_NESTED_META = new Set(["flags", "growth", "auth", "catalog"]);

export function auditMetaRows(
  meta: unknown,
): { key: string; label: string; value: string }[] {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return [];
  const rows: { key: string; label: string; value: string }[] = [];
  for (const [key, raw] of Object.entries(meta as Record<string, unknown>)) {
    if (AUDIT_SKIP_META.has(key) || raw == null) continue;
    const label = AUDIT_META_LABELS[key] ?? key;
    if (AUDIT_NESTED_META.has(key) && typeof raw === "object") {
      rows.push({ key, label, value: "به‌روز شد" });
      continue;
    }
    if (typeof raw === "boolean") {
      rows.push({ key, label, value: raw ? "بله" : "خیر" });
      continue;
    }
    if (typeof raw === "number") {
      rows.push({ key, label, value: String(raw) });
      continue;
    }
    if (typeof raw === "string") {
      if (key === "role") {
        rows.push({ key, label, value: ADMIN_ROLE_LABELS[raw] ?? raw });
        continue;
      }
      if (key === "status" || key === "previousStatus") {
        rows.push({
          key,
          label,
          value: REPORT_STATUS_LABELS[raw] ?? INVITE_STATUS_LABELS[raw] ?? raw,
        });
        continue;
      }
      if (key === "previousDealStatus" || key === "nextDealStatus") {
        const deal: Record<string, string> = {
          inactive: "مخفی",
          available: "موجود",
        };
        rows.push({ key, label, value: deal[raw] ?? raw });
        continue;
      }
      if (key === "audience") {
        rows.push({
          key,
          label,
          value: BROADCAST_AUDIENCE_LABELS[raw] ?? raw,
        });
        continue;
      }
      rows.push({ key, label, value: raw });
    }
  }
  return rows;
}

export type AuditGroup = "all" | "users" | "content" | "invites" | "ops";

export const AUDIT_GROUP_TYPES: Record<Exclude<AuditGroup, "all">, string[]> = {
  users: ["User"],
  content: ["MarketListing", "WantRequest", "Gathering", "ListingReport"],
  invites: ["Invite"],
  ops: ["admin_user", "AppSetting", "Broadcast"],
};

export function auditTargetHref(targetType: string, targetId: string): string | null {
  switch (targetType) {
    case "User":
      return `/admin/users/${targetId}`;
    case "MarketListing":
      return "/admin/content?kind=listing";
    case "WantRequest":
      return "/admin/content?kind=request";
    case "Gathering":
      return "/admin/content?kind=event";
    case "ListingReport":
      return "/admin/reports";
    case "Invite":
      return "/admin/invites";
    case "Broadcast":
      return "/admin/broadcasts";
    case "AppSetting":
      return "/admin/settings";
    case "admin_user":
      return "/admin/operators";
    default:
      return null;
  }
}

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
