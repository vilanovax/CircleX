/** Copy for personal feed-hide (listing or seller). Seller is never notified. */

export const hideListingCopy = {
  title: "این آگهی در فید نیاید",
  titleHidden: "دوباره در فید نشان بده",
  hint: "فقط برای تو کنار می‌رود. فروشنده خبردار نمی‌شود.",
  hintHidden: "الان فقط از فید تو کنار رفته؛ از پروفایل هم برمی‌گردد.",
  banner:
    "این آگهی را از فیدت کنار گذاشته‌ای. لینک هنوز باز می‌شود. از پروفایل، بخش مخفی‌ها، دوباره نشانش می‌دهی.",
  toastOn: "از فیدت کنار رفت — در پروفایل، بخش مخفی‌ها",
  toastOff: "دوباره در فید می‌آید",
  fail: "مخفی نشد",
} as const;

export function hidePersonCopy(name: string) {
  return {
    title: "آگهی‌های این فروشنده در فید نیاید",
    titleHidden: "آگهی‌هایش دوباره در فید بیاید",
    hint: "حلقه و گفتگو سر جایش می‌ماند. فقط فید تو خلوت می‌شود.",
    hintHidden: "گفتگو و عضویت در حلقه تغییری نمی‌کند.",
    banner: `آگهی‌های ${name} در فید تو نمی‌آید. گفتگو و حلقه سر جایش می‌ماند.`,
    toastOn: `آگهی‌های ${name} از فیدت کنار رفت — در پروفایل، بخش مخفی‌ها`,
    toastOff: `آگهی‌های ${name} دوباره در فید می‌آید`,
  };
}

export const hideConfirmListing = {
  title: "این آگهی از فید کنار برود؟",
  body: "فقط برای تو پنهان می‌شود؛ فروشنده خبردار نمی‌شود. بعداً از پروفایل، بخش مخفی‌ها، دوباره نشان می‌دهی.",
  confirm: "از فید کنار بگذار",
} as const;

export function hideConfirmPerson(name: string) {
  return {
    title: `آگهی‌های ${name} از فید کنار برود؟`,
    body: "فقط فید تو خلوت می‌شود. گفتگو، حلقه و پروفایلش سر جایش می‌ماند. بعداً از پروفایل، بخش مخفی‌ها، برمی‌گردانی.",
    confirm: "آگهی‌هایش نیاید",
  };
}

export const hiddenProfileCopy = {
  tab: "مخفی‌ها",
  emptyTitle: "هنوز چیزی مخفی نکرده‌ای",
  emptyText:
    "اگر آگهی یا فروشنده‌ای را از فید کنار بگذاری، اینجا می‌ماند تا هر وقت خواستی محدودیت نمایش را برداری.",
  peopleHeading: "افراد — آگهی‌هایشان در فید نمی‌آید",
  listingsHeading: "آگهی‌ها — فقط همین‌ها از فید کنار رفته",
  restore: "رفع محدودیت نمایش",
  restorePersonToast: "آگهی‌هایش دوباره در فید می‌آید",
  restoreListingToast: "دوباره در فید می‌آید",
  missingListing: "این آگهی دیگر در دسترس نیست",
  accountRow: "آگهی‌ها و افراد مخفی",
  accountHint: "چیزی که از فید کنار گذاشته‌ای",
} as const;
