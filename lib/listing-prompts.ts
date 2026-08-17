import type { Listing, ListingType } from "./types";

export type BuyerPrompt = {
  id: string;
  label: string;
  /** Prefill text for the message composer. */
  draft: string;
};

export type ChipStage = "opening" | "mid" | "agreed";

export type ThreadChipContext = {
  listing?: Listing | null;
  /** Viewer is the seller of the context listing. */
  isSeller?: boolean;
  threadLength?: number;
};

type Candidate = BuyerPrompt & {
  /** Drop when corpus matches any of these patterns. */
  skipIf?: RegExp[];
  /** Prefer when corpus matches (boosts rank). */
  boostIf?: RegExp[];
};

function hasSpec(listing: Listing, label: string): boolean {
  return (listing.specs ?? []).some((s) => s.label === label);
}

function specValue(listing: Listing, label: string): string | undefined {
  return listing.specs?.find((s) => s.label === label)?.value;
}

function listingCorpus(listing: Listing): string {
  const specs = (listing.specs ?? [])
    .map((s) => `${s.label} ${s.value}`)
    .join(" ");
  return [
    listing.title,
    listing.description,
    listing.category,
    listing.condition ?? "",
    listing.city ?? "",
    specs,
  ]
    .join(" ")
    .toLowerCase();
}

function mentions(corpus: string, re: RegExp): boolean {
  return re.test(corpus);
}

/** Short noun phrase for natural drafts (not the full title). */
export function listingSubject(listing: Listing): string {
  const raw = listing.title
    .replace(/\s*[—\-–|].*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return "این مورد";
  const words = raw.split(" ").filter(Boolean);
  if (words.length <= 3 && raw.length <= 28) return raw;
  const clipped = words.slice(0, 3).join(" ");
  return clipped.length <= 28 ? clipped : `${clipped.slice(0, 26).trim()}…`;
}

function greet(body: string): string {
  const t = body.trim();
  if (/^سلام/.test(t)) return t;
  return `سلام، وقت بخیر. ${t}`;
}

function isBulky(corpus: string): boolean {
  return /مبل|یخچال|میز ناهار|تخت|کمد|فرش|لوازم خانه|کابینت/.test(corpus);
}

type CatBucket =
  | "tv"
  | "phone"
  | "laptop"
  | "electronics"
  | "car"
  | "furniture"
  | "home"
  | "service"
  | "other";

function categoryBucket(listing: Listing): CatBucket {
  if (listing.type === "service") return "service";
  const c = listingCorpus(listing);
  if (/تلویزیون|تی\s*وی|\btv\b|ال\s*ای\s*دی|oled|qled/.test(c)) return "tv";
  if (/موبایل|گوشی|آیفون|سامسونگ|شیائومی/.test(c)) return "phone";
  if (/لپ\s*تاپ|مک\s*بوک|نوت\s*بوک|لپتاپ/.test(c)) return "laptop";
  if (/خودرو|ماشین|سواری|پراید|پژو|سمند|تیبا/.test(c)) return "car";
  if (/مبل|میز|صندلی|کمد|تخت|فرش/.test(c)) return "furniture";
  if (/لوازم خانه|آشپزخانه|یخچال|جارو/.test(c)) return "home";
  if (
    /الکترونیک|دیجیتال|کنسول|هدفون|اسپیکر|دوربین|تبلت/.test(c) ||
    listing.category.includes("دیجیتال") ||
    listing.category.includes("الکترونیک")
  ) {
    return "electronics";
  }
  return "other";
}

function resolveStage(
  listing: Listing | null | undefined,
  threadLength: number,
): ChipStage {
  const status = listing?.dealStatus ?? "available";
  if (status === "agreed") return "agreed";
  if (status === "reserved" || threadLength > 0) return "mid";
  return "opening";
}

function filterCandidates(corpus: string, items: Candidate[]): BuyerPrompt[] {
  return items
    .filter((c) => !(c.skipIf ?? []).some((re) => re.test(corpus)))
    .map((c) => {
      const boosted = (c.boostIf ?? []).some((re) => re.test(corpus));
      return { prompt: c, boosted };
    })
    .sort((a, b) => Number(b.boosted) - Number(a.boosted))
    .map(({ prompt: { id, label, draft } }) => ({ id, label, draft }));
}

function dedupe(prompts: BuyerPrompt[], limit: number): BuyerPrompt[] {
  const seen = new Set<string>();
  const out: BuyerPrompt[] = [];
  for (const p of prompts) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

function buyerOpeningCandidates(listing: Listing): Candidate[] {
  const type: ListingType = listing.type;
  const subject = listingSubject(listing);
  const bucket = categoryBucket(listing);
  const corpus = listingCorpus(listing);
  const out: Candidate[] = [];

  if (type === "donation") {
    out.push({
      id: "still-free",
      label: "هنوز آزاده؟",
      draft: greet(`اگر ${subject} هنوز آزاد باشه خوشحال می‌شم.`),
      skipIf: [/اهدا شده|تحویل داده|دیگر موجود نیست/],
    });
    out.push({
      id: "pickup",
      label: "تحویل چطور؟",
      draft: greet("چطور می‌تونم تحویل بگیرم؟"),
      skipIf: [/تحویل|پیکاپ|بیایید ببرید|خودتون بیاید/],
    });
    return out;
  }

  if (type === "service") {
    out.push({
      id: "schedule",
      label: "چه روزهایی؟",
      draft: greet("چه روزهایی وقت دارید؟"),
      skipIf: [/شنبه|یکشنبه|دوشنبه|سه‌شنبه|چهارشنبه|پنجشنبه|جمعه|هر روز/],
    });
    out.push({
      id: "service-price",
      label: "هزینه دقیق؟",
      draft: greet("هزینه دقیق چقدره؟"),
      skipIf: [/تومان|قیمت ثابت|هزینه از/],
    });
    out.push({
      id: "service-area",
      label: "محدوده خدمات؟",
      draft: greet("در چه محدوده‌ای خدمات می‌دید؟"),
      skipIf: [/تهران|محله|منطقه|فقط حضوری|آنلاین/],
    });
    out.push({
      id: "on-site",
      label: "در محل؟",
      draft: greet("امکان انجام در محل هست؟"),
      skipIf: [/در محل|منزل شما|نزد شما/],
    });
    out.push({
      id: "portfolio",
      label: "نمونه‌کار؟",
      draft: greet("نمونه‌کار دارید که ببینم؟"),
      skipIf: [/نمونه\s*کار|پورتفولیو/],
    });
    return out;
  }

  // sale / exchange / loan — availability first
  out.push({
    id: "available",
    label: "هنوز موجوده؟",
    draft: greet("هنوز موجوده؟"),
    skipIf: [/فروخته|رزرو شده|دیگر موجود نیست/],
  });

  // Category-specific gaps
  if (bucket === "tv") {
    out.push({
      id: "repair",
      label: "تعمیر داشته؟",
      draft: greet(`${subject} تا حالا تعمیر یا تعویض قطعه داشته؟`),
      skipIf: [/بدون تعمیر|تعمیر نشده|دست‌نخورده|آکبند|هیچ تعمیر/],
    });
    out.push({
      id: "screen-size",
      label: "چند اینچ؟",
      draft: greet("اندازه صفحه چند اینچه؟"),
      skipIf: [/اینچ|\d+\s*"|\d+\s*اینچ/],
    });
    out.push({
      id: "dead-pixel",
      label: "پیکسل سوخته؟",
      draft: greet("پیکسل سوخته یا مشکل تصویر نداره؟"),
      skipIf: [/پیکسل|بدون ایراد تصویر|تصویر سالم/],
    });
    out.push({
      id: "remote",
      label: "ریموت همراهشه؟",
      draft: greet("ریموت و پایه همراهشه؟"),
      skipIf: [/ریموت|کنترل|پایه دیوار|پایه رومیزی/],
    });
    out.push({
      id: "av-test",
      label: "تست تصویر؟",
      draft: greet("امکان تست تصویر و صدا هست؟"),
      skipIf: [/امکان تست|می‌تونید تست|تست حضوری/],
    });
  } else if (bucket === "phone" || bucket === "laptop") {
    out.push({
      id: "repair",
      label: "تعمیر / بازشدگی؟",
      draft: greet("تعمیر یا بازشدگی داشته؟"),
      skipIf: [/بدون تعمیر|باز نشده|تعمیر نشده|آکبند|دست‌نخورده/],
    });
    out.push({
      id: "battery",
      label: "سلامت باتری؟",
      draft: greet("سلامت باتری چقدره؟"),
      skipIf: [/باتری|سلامت باتری|cycle|سایکل/],
    });
    out.push({
      id: "box",
      label: "جعبه و لوازم؟",
      draft: greet("جعبه و لوازم کامل داره؟"),
      skipIf: [/جعبه|کارتن|لوازم جانبی|شارژر/],
    });
    if (bucket === "phone") {
      out.push({
        id: "register",
        label: "رجیستر؟",
        draft: greet("رجیستر و انتقال مالکیت انجام می‌شه؟"),
        skipIf: [/رجیستر|انتقال مالکیت|فعال‌سازی/],
      });
    }
    out.push({
      id: "scratches",
      label: "خط‌وخش؟",
      draft: greet("خط‌وخش یا ضربه داره؟"),
      skipIf: [/بدون خط|تمیز|سالم ظاهری|خط و خش نداره|خط‌وخش نداره/],
    });
  } else if (bucket === "electronics") {
    out.push({
      id: "repair",
      label: "تعمیر داشته؟",
      draft: greet("تعمیر یا تعویض قطعه داشته؟"),
      skipIf: [/بدون تعمیر|تعمیر نشده|آکبند/],
    });
    out.push({
      id: "model",
      label: "مدل دقیق؟",
      draft: greet("مدل دقیق و سال خریدش چیه؟"),
      skipIf: [/مدل\s|سال خرید|ساخت ۲۰|ساخت ۱۳/],
    });
    out.push({
      id: "box",
      label: "جعبه و لوازم؟",
      draft: greet("لوازم جانبی و جعبه داره؟"),
      skipIf: [/جعبه|لوازم جانبی|کارتن/],
    });
    out.push({
      id: "scratches",
      label: "ایراد ظاهری؟",
      draft: greet("خط‌وخش یا ایراد ظاهری داره؟"),
      skipIf: [/بدون خط|سالم ظاهری|تمیز/],
    });
  } else if (bucket === "car") {
    out.push({
      id: "paint",
      label: "رنگ‌شدگی؟",
      draft: greet("رنگ‌شدگی یا تعویض قطعه داشته؟"),
      skipIf: [/بدون رنگ|رنگ‌ندار|صفر رنگ|تعویض قطعه ندارد/],
    });
    out.push({
      id: "technical",
      label: "وضعیت فنی؟",
      draft: greet("وضعیت فنی چطوره؟"),
      skipIf: [/وضعیت فنی|فنی سالم|موتور سالم/],
    });
    out.push({
      id: "expert",
      label: "کارشناسی؟",
      draft: greet("کارشناسی شده؟"),
      skipIf: [/کارشناسی/],
    });
    out.push({
      id: "insurance",
      label: "بیمه تا کی؟",
      draft: greet("بیمه تا چه تاریخی داره؟"),
      skipIf: [/بیمه|بیمه شخص ثالث|بیمه بدنه/],
    });
  } else if (bucket === "furniture" || bucket === "home") {
    out.push({
      id: "dimensions",
      label: "ابعاد؟",
      draft: greet("ابعاد دقیقش چقدره؟"),
      skipIf: [/سانتی‌?متر|cm|متر\s|ابعاد|طول|عرض|ارتفاع/],
    });
    out.push({
      id: "wear",
      label: "پارگی یا لک؟",
      draft: greet("پارگی یا لک داره؟"),
      skipIf: [/بدون لک|پارگی نداره|سالم|تمیز/],
    });
    out.push({
      id: "carry",
      label: "حمل با کیه؟",
      draft: greet("حمل با خریدار است یا کمک می‌کنید؟"),
      skipIf: [/حمل با|ارسال|پیک|می‌رسونم/],
    });
    if (isBulky(corpus)) {
      out.push({
        id: "elevator",
        label: "آسانسور؟",
        draft: greet("از در و آسانسور عبور می‌کند؟ طبقه چندمه؟"),
        skipIf: [/آسانسور|طبقه/],
      });
    }
  } else {
    out.push({
      id: "repair",
      label: "تعمیر داشته؟",
      draft: greet("تا حالا تعمیر یا ایراد جدی داشته؟"),
      skipIf: [/بدون تعمیر|تعمیر نشده|آکبند|سالم کامل/],
    });
    out.push({
      id: "model",
      label: "مدل دقیق؟",
      draft: greet("مدل دقیق‌ترش چیه؟"),
      skipIf: [/مدل\s/],
    });
  }

  // Shared transactional gaps
  if (!hasSpec(listing, "بازدید") && !mentions(corpus, /امکان بازدید|می‌تونید ببینید|تست حضوری/)) {
    out.push({
      id: "visit",
      label: "امکان تست؟",
      draft: greet("امکان بازدید و تست هست؟"),
    });
  } else {
    out.push({
      id: "when-visit",
      label: "کی ببینم؟",
      draft: greet("چه زمانی می‌تونم ببینمش؟"),
    });
  }

  if (
    listing.price != null &&
    !mentions(corpus, /قیمت نهایی|غیرقابل مذاکره|فیکس/)
  ) {
    const negotiable = specValue(listing, "قابل مذاکره");
    if (!(negotiable && /بله|کمی/.test(negotiable))) {
      out.push({
        id: "final-price",
        label: "قیمت نهایی؟",
        draft: greet("قیمت نهایی چقدره؟"),
      });
    }
  }

  if (!hasSpec(listing, "ارسال") && !mentions(corpus, /ارسال|پیک|پست|می‌رسونم/)) {
    out.push({
      id: "shipping",
      label: "ارسال دارید؟",
      draft: greet("امکان ارسال هم دارید؟"),
    });
  }

  if (
    !hasSpec(listing, "ایراد اعلام‌شده") &&
    !listing.condition &&
    !mentions(corpus, /بدون ایراد|سالم کامل|خط و خش/)
  ) {
    out.push({
      id: "defects",
      label: "ایرادی داره؟",
      draft: greet("ایراد یا نکته‌ای هست که بدونم؟"),
    });
  }

  return out;
}

function buyerMidCandidates(listing: Listing): Candidate[] {
  const subject = listingSubject(listing);
  return [
    {
      id: "when-visit",
      label: "کی ببینم؟",
      draft: greet(`چه زمانی می‌تونم ${subject} را ببینم؟`),
    },
    {
      id: "area",
      label: "آدرس تقریبی؟",
      draft: greet("آدرس تقریبی برای بازدید کجاست؟"),
      skipIf: [/خیابان|محله|نزدیک مترو|منطقه/],
    },
    {
      id: "final-price",
      label: "قیمت نهایی؟",
      draft: greet("روی قیمت نهایی توافق کنیم؟"),
    },
    {
      id: "hold",
      label: "نگه می‌دارید؟",
      draft: greet("اگر جدی باشم تا فردا نگه می‌دارید؟"),
    },
  ];
}

function buyerAgreedCandidates(): Candidate[] {
  return [
    {
      id: "phone",
      label: "شماره تماس؟",
      draft: "لطفاً شماره تماسی بفرستید تا هماهنگ کنیم.",
    },
    {
      id: "address",
      label: "آدرس؟",
      draft: "لطفاً آدرس را ارسال کنید.",
    },
    {
      id: "today",
      label: "امروز هماهنگ؟",
      draft: "برای امروز هماهنگ کنیم؟",
    },
  ];
}

function sellerOpeningCandidates(listing: Listing): Candidate[] {
  const subject = listingSubject(listing);
  if (listing.type === "service") {
    return [
      {
        id: "seller-free",
        label: "این هفته وقت دارم",
        draft: "سلام، این هفته وقت دارم. بگید چه روزی راحت‌ترید.",
      },
      {
        id: "seller-scope",
        label: "جزئیات بگید",
        draft: "سلام، جزئیات کار را بگید تا دقیق‌تر بگم.",
      },
    ];
  }
  return [
    {
      id: "seller-available",
      label: "بله موجوده",
      draft: `سلام، بله ${subject} هنوز موجوده.`,
    },
    {
      id: "seller-visit",
      label: "بازدید اوکیه",
      draft: "سلام، بازدید با هماهنگی اوکیه. کی براتون راحت‌تره؟",
    },
    {
      id: "seller-price",
      label: "قیمت همونه",
      draft: "سلام، قیمت همان است که در آگهی نوشته شده.",
    },
  ];
}

function sellerMidCandidates(): Candidate[] {
  return [
    {
      id: "seller-time",
      label: "فردا اوکیه",
      draft: "فردا بعدازظهر برای بازدید اوکیه.",
    },
    {
      id: "seller-hold",
      label: "رزرو می‌کنم",
      draft: "تا هماهنگ کنیم موقتاً براتون نگه می‌دارم.",
    },
  ];
}

function sellerAgreedCandidates(): Candidate[] {
  return [
    {
      id: "seller-address",
      label: "آدرس می‌فرستم",
      draft: "آدرس را الان می‌فرستم.",
    },
    {
      id: "seller-phone",
      label: "تماس بگیرید",
      draft: "روی همین شماره پیام بدید یا تماس بگیرید.",
    },
  ];
}

function freeChatChips(threadLength: number): BuyerPrompt[] {
  if (threadLength > 0) return [];
  return [
    {
      id: "hi-ask",
      label: "سلام، سوالی داشتم",
      draft: "سلام، وقت بخیر. یک سوال داشتم.",
    },
    {
      id: "hi-check",
      label: "سلام، خوبی؟",
      draft: "سلام، وقت بخیر. حال شما خوبه؟",
    },
  ];
}

/**
 * Thread composer chips — listing-aware, role-aware, stage-aware.
 * Touch should insert `draft` into the input, not send.
 */
export function suggestThreadChips(ctx: ThreadChipContext): BuyerPrompt[] {
  const listing = ctx.listing ?? null;
  const threadLength = ctx.threadLength ?? 0;
  const isSeller = Boolean(ctx.isSeller && listing);

  if (!listing) return freeChatChips(threadLength);

  const stage = resolveStage(listing, threadLength);
  const corpus = listingCorpus(listing);

  let candidates: Candidate[];
  if (isSeller) {
    if (stage === "agreed") candidates = sellerAgreedCandidates();
    else if (stage === "mid") candidates = sellerMidCandidates();
    else candidates = sellerOpeningCandidates(listing);
  } else if (stage === "agreed") {
    candidates = buyerAgreedCandidates();
  } else if (stage === "mid") {
    candidates = buyerMidCandidates(listing);
  } else {
    candidates = buyerOpeningCandidates(listing);
  }

  return dedupe(filterCandidates(corpus, candidates), 6);
}

/**
 * Ready questions for buyers on listing detail — skip answered facts.
 */
export function listingBuyerPrompts(listing: Listing): BuyerPrompt[] {
  return suggestThreadChips({
    listing,
    isSeller: false,
    threadLength: 0,
  }).slice(0, 4);
}

/** Spec / description gaps buyers often need. */
export function listingMissingSpecPrompts(listing: Listing): BuyerPrompt[] {
  return listingBuyerPrompts(listing).filter((p) =>
    [
      "dimensions",
      "defects",
      "shipping",
      "visit",
      "visit-gap",
      "carry",
      "elevator",
      "repair",
      "screen-size",
      "battery",
      "box",
      "model",
    ].includes(p.id),
  );
}
