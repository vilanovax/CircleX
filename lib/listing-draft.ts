import type { ListingSpec, ListingType } from "./types";
import { listingTypeLabels } from "./labels";
import { normalizeFa, toEnglishDigits, toPersianDigits } from "./persian";

export type DraftConfidence = "confirmed" | "suggested";

export type DraftSpec = ListingSpec & {
  confidence: DraftConfidence;
};

export type DraftQuestion = {
  id: string;
  label: string;
  options: string[];
};

export type ListingDraft = {
  title: string;
  /** Short narrative — reason to sell / context, not a dump of specs. */
  description: string;
  category: string;
  condition?: string;
  specs: DraftSpec[];
  questions: DraftQuestion[];
};

const YEAR_WORDS: Record<string, number> = {
  یک: 1,
  دو: 2,
  سه: 3,
  چهار: 4,
  پنج: 5,
  شش: 6,
  هفت: 7,
  هشت: 8,
  نه: 9,
  ده: 10,
};

function parseYears(text: string): number | null {
  const n = text.match(
    /(?:حدود\s*)?([۰-۹0-9]+|یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده)\s*سال/,
  );
  if (!n) return null;
  const raw = toEnglishDigits(n[1]);
  if (/^\d+$/.test(raw)) return Number(raw);
  return YEAR_WORDS[n[1]] ?? null;
}

function detectCategory(text: string, type: ListingType): string {
  if (/مبل|کاناپه|میز|صندلی|یخچال|فرش/.test(text)) return "لوازم خانه";
  if (/آیفون|گوشی|موبایل|سامسونگ|شیائومی/.test(text)) return "الکترونیک";
  if (/لباس|کفش|پوشاک/.test(text)) return "پوشاک";
  if (/کودک|نوزاد|اسباب\s*بازی|کالسکه/.test(text)) return "کودک";
  if (/دوچرخه|تردمیل|ورزش/.test(text)) return "ورزش";
  if (/پیانو|آموزش|معلم|کلاس/.test(text)) return "آموزش";
  if (/پراید|ماشین|خودرو|اتومبیل/.test(text)) return "خودرو";
  if (type === "service") return "خدمات";
  if (type === "donation") return "اهدا";
  return listingTypeLabels[type];
}

function detectCondition(text: string, years: number | null): string | undefined {
  if (/نو\s*و?\s*استفاده\s*نشده|کاملاً?\s*نو/.test(text)) return "نو و استفاده‌نشده";
  if (/کم\s*استفاده|در\s*حد\s*نو/.test(text) && !years) return "بسیار کم‌استفاده";
  if (
    /ایراد|رد\s*(?:نشستن|استفاده)|خط\s*و\s*خش|لک/.test(text)
  ) {
    return "سالم با ایراد جزئی";
  }
  if (/کارکرده|دست\s*دوم/.test(text)) return "کارکرده تمیز";
  if (/سالم|تمیز/.test(text)) return "سالم و تمیز";
  if (years != null && years >= 2) return "کارکرده تمیز";
  return undefined;
}

function stripPriceTalk(s: string): string {
  return s
    .replace(/قیمت\s*[^،.؟!\n]*/g, " ")
    .replace(
      /[۰-۹0-9][۰-۹0-9,٬]*\s*(?:میلیون(?:\s*و\s*[۰-۹0-9,٬]*)?)?\s*(?:هزار)?\s*تومان/g,
      " ",
    )
    .replace(/[۰-۹0-9]+\s*میلیون(?:\s*تومان)?/g, " ");
}

function stripSellIntent(s: string): string {
  return s
    .replace(
      /را?\s*(?:می‌خواهم|میخواهم|می‌خوام|میخوام)\s*بفروشم/g,
      " ",
    )
    .replace(/می‌فروشم|میفروشم|فروشی است|فروشیه/g, " ")
    .replace(/اهدا می‌کنم|اهدا میکنم/g, " ")
    .replace(/کسی بخره|بخره کسی/g, " ");
}

function tidyPhrase(s: string): string {
  return s
    .replace(/\s*[،,]\s*/g, "، ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[،.\s]+|[،.\s]+$/g, "")
    .replace(/\s*را$/g, "")
    .trim();
}

function buildTitle(text: string, type: ListingType, category: string): string {
  const first = text
    .split(/[.؟!\n]/)
    .map((s) => s.trim())
    .find((s) => s.length >= 8);
  if (!first) return `آگهی ${listingTypeLabels[type]}`;

  let t = tidyPhrase(stripSellIntent(stripPriceTalk(first.split(/[،,]/)[0] ?? first)));

  if (t.length > 42) t = `${t.slice(0, 40).trim()}…`;
  if (t.length < 4) {
    return `${category} — ${listingTypeLabels[type]}`;
  }
  return t;
}

/** True when a draft field is mostly present in the user's own note. */
export function looksExtractedFromText(value: string, raw: string): boolean {
  const v = normalizeFa(value).trim();
  const t = normalizeFa(raw);
  if (!v || v.length < 3 || !t) return false;
  if (t.includes(v.slice(0, Math.min(12, v.length)))) return true;
  const words = v.split(/\s+/).filter((w) => w.length >= 3);
  if (words.length === 0) return false;
  const hits = words.filter((w) => t.includes(w)).length;
  return hits >= Math.ceil(words.length * 0.6);
}

function narrativeOnly(text: string, title: string): string {
  const bits: string[] = [];
  if (/تغییر دکوراسیون|جابه‌جایی|دیگر لازم|نمی‌خواهم/.test(text)) {
    const reason = text.match(
      /[^.؟!]*(?:تغییر دکوراسیون|جابه‌جایی|دیگر لازم|نمی‌خواهم)[^.؟!]*[.؟!]?/,
    );
    if (reason) bits.push(tidyPhrase(reason[0]));
  }
  if (/رد\s*(?:نشستن|استفاده)|ایراد|لک|خط\s*و\s*خش/.test(text)) {
    bits.push("کمی رد استفاده دارد.");
  }
  if (/بازدید|اوکی.*دید|میشه دید|می‌شه دید|در منزل/.test(text)) {
    bits.push("بازدید با هماهنگی ممکن است.");
  }

  if (bits.length > 0) return bits.join(" ");

  let leftover = tidyPhrase(stripSellIntent(stripPriceTalk(text)));
  const nt = normalizeFa(title);
  if (nt && leftover.startsWith(title)) {
    leftover = tidyPhrase(leftover.slice(title.length));
  } else if (nt && leftover.includes(title)) {
    leftover = tidyPhrase(leftover.replace(title, " "));
  }
  leftover = leftover.replace(/^[،.\s]+/, "");
  if (leftover.length < 8 || leftover === title) {
    return "جزئیات را در پیام بپرسید؛ هماهنگی از همان‌جا.";
  }
  if (leftover.length <= 160) return leftover;
  return `${leftover.slice(0, 157).trim()}…`;
}

/**
 * Rule-based stand-in for AI listing extraction.
 * Extracts structured fields from a free-form Persian note; never invents dimensions.
 */
export function draftListingFromText(input: {
  text: string;
  type: ListingType;
  price?: number;
}): ListingDraft {
  const text = normalizeFa(input.text);
  const type = input.type;
  const years = parseYears(text);
  const category = detectCategory(text, type);
  const condition = detectCondition(text, years);
  const specs: DraftSpec[] = [];
  const questions: DraftQuestion[] = [];

  const dim = text.match(
    /([۰-۹0-9]+)\s*[×xX]\s*([۰-۹0-9]+)(?:\s*[×xX]\s*([۰-۹0-9]+))?\s*(?:سانتی\s*متر|سم)?/,
  );
  if (dim) {
    const a = toPersianDigits(toEnglishDigits(dim[1]));
    const b = toPersianDigits(toEnglishDigits(dim[2]));
    const c = dim[3] ? toPersianDigits(toEnglishDigits(dim[3])) : null;
    specs.push({
      label: "ابعاد",
      value: c ? `${a} × ${b} × ${c} سانتی‌متر` : `${a} × ${b} سانتی‌متر`,
      confidence: "confirmed",
    });
  } else if (/مبل|میز|صندلی|یخچال/.test(text)) {
    questions.push({
      id: "dimensions",
      label: "ابعاد را می‌دانید؟",
      options: ["بعداً اضافه می‌کنم", "نمی‌دانم"],
    });
  }

  if (years != null) {
    specs.push({
      label: "مدت استفاده",
      value: `حدود ${toPersianDigits(years)} سال`,
      confidence: "confirmed",
    });
  }

  if (/بدون\s*پارگی/.test(text)) {
    specs.push({
      label: "سلامت پارچه",
      value: "بدون پارگی",
      confidence: "confirmed",
    });
  }
  if (/رد\s*نشستن|ایراد|لک|خط/.test(text)) {
    const defect = text.match(/[^.!؟\n]*(?:رد نشستن|ایراد|لک|خط و خش)[^.!؟\n]*/);
    specs.push({
      label: "ایراد اعلام‌شده",
      value: defect?.[0]?.trim() || "ایراد جزئی اعلام شده",
      confidence: "confirmed",
    });
  }

  if (/مخمل/.test(text)) {
    specs.push({
      label: "جنس روکش",
      value: "مخمل (احتمالاً)",
      confidence: "suggested",
    });
  } else if (/چرم/.test(text)) {
    specs.push({
      label: "جنس روکش",
      value: "چرم (احتمالاً)",
      confidence: "suggested",
    });
  }

  if (/بازدید|در منزل|بیایید ببینید|میشه دید|می‌شه دید/.test(text)) {
    specs.push({
      label: "بازدید",
      value: "بله — با هماهنگی قبلی",
      confidence: "confirmed",
    });
  } else if (type === "sale" || type === "exchange") {
    questions.push({
      id: "visit",
      label: "امکان بازدید هست؟",
      options: ["بله، با هماهنگی", "خیر", "بعداً مشخص می‌کنم"],
    });
  }

  if (/ارسال|پیک|باربری|پست/.test(text)) {
    specs.push({
      label: "ارسال",
      value: /هزینه با خریدار|خریدار/.test(text)
        ? "با باربری؛ هزینه با خریدار"
        : "امکان هماهنگی ارسال",
      confidence: "confirmed",
    });
  } else if (type === "sale") {
    questions.push({
      id: "shipping",
      label: "نحوه تحویل؟",
      options: [
        "فقط حضوری",
        "ارسال؛ هزینه با خریدار",
        "هماهنگی ارسال",
        "بعداً",
      ],
    });
  }

  if (/قابل مذاکره|مذاکره‌پذیر|تخفیف/.test(text) && input.price != null) {
    specs.push({
      label: "قابل مذاکره",
      value: "بله",
      confidence: "confirmed",
    });
  } else if (input.price != null && type === "sale") {
    questions.push({
      id: "negotiable",
      label: "قیمت قابل مذاکره است؟",
      options: ["بله", "خیر", "کمی"],
    });
  }

  if (/باتری/.test(text)) {
    const bat = text.match(/باتری\s*([۰-۹0-9]+)\s*٪?/);
    if (bat) {
      specs.push({
        label: "سلامت باتری",
        value: `${toPersianDigits(toEnglishDigits(bat[1]))}٪`,
        confidence: "confirmed",
      });
    }
  }

  const title = buildTitle(text, type, category);
  const description = narrativeOnly(text, title);

  return {
    title,
    description,
    category,
    condition,
    specs,
    questions: questions.slice(0, 4),
  };
}

export function applyDraftAnswers(
  draft: ListingDraft,
  answers: Record<string, string>,
): ListingDraft {
  const specs = [...draft.specs];
  const add = (label: string, value: string) => {
    if (specs.some((s) => s.label === label)) return;
    specs.push({ label, value, confidence: "confirmed" });
  };

  if (answers.visit?.startsWith("بله")) {
    add("بازدید", "بله — با هماهنگی قبلی");
  }
  if (answers.shipping === "فقط حضوری") {
    add("ارسال", "فقط تحویل حضوری");
  } else if (answers.shipping?.includes("هزینه با خریدار")) {
    add("ارسال", "با باربری؛ هزینه با خریدار");
  } else if (answers.shipping?.includes("هماهنگی")) {
    add("ارسال", "امکان هماهنگی ارسال");
  }
  if (answers.negotiable === "بله" || answers.negotiable === "کمی") {
    add("قابل مذاکره", answers.negotiable === "کمی" ? "کمی" : "بله");
  } else if (answers.negotiable === "خیر") {
    add("قابل مذاکره", "خیر");
  }

  return {
    ...draft,
    specs,
    questions: draft.questions.filter((q) => !answers[q.id]),
  };
}
