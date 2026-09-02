export const FEEDBACK_BODY_MAX = 800;
export const FEEDBACK_PATH_MAX = 200;
/** Soft cap so one person cannot flood the ops queue. */
export const FEEDBACK_DAILY_MAX = 5;

export type FeedbackKind = "issue" | "suggestion" | "contact";

export const FEEDBACK_KIND_LABELS: Record<FeedbackKind, string> = {
  issue: "مشکل",
  suggestion: "پیشنهاد",
  contact: "تماس",
};

export const FEEDBACK_KIND_HINTS: Record<FeedbackKind, string> = {
  issue: "چیزی خراب است یا گیر کرده‌ای",
  suggestion: "ایده‌ای برای بهتر شدن سیرکل",
  contact: "حرف دیگری با تیم داری",
};

export const FEEDBACK_STATUS_LABELS = {
  open: "باز",
  reviewed: "بررسی‌شده",
  closed: "بسته",
} as const;
