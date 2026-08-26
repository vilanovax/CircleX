"use client";

import {
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
  useRef,
  useCallback,
  useMemo,
  memo,
  startTransition,
  type ComponentType,
} from "react";
import ListingImagePicker from "@/components/ListingImagePicker";
import ListingPrivacySection from "@/components/ListingPrivacySection";
import {
  ListingEditRow,
  ListingEditRows,
  ListingEditSectionSheet,
} from "@/components/ListingEditSection";
import AreaPicker from "@/components/AreaPicker";
import { activeCircle } from "@/lib/circle-member";
import { listingPrivacySummary } from "@/lib/listing-privacy";
import CatalogCategorySelect from "@/components/CatalogCategorySelect";
import VoiceDictateButton from "@/components/VoiceDictateButton";
import { useToast } from "@/components/Toast";
import { useStore } from "@/lib/store";
import { AREA_CITYWIDE } from "@/lib/place";
import { withBasePath } from "@/lib/avatar";
import { useCatalog } from "@/lib/use-catalog";
import {
  applyDraftAnswers,
  draftListingFromText,
  looksExtractedFromText,
  type DraftSpec,
  type ListingDraft,
} from "@/lib/listing-draft";
import { createPolishedListingDraft } from "@/lib/listing-polish";
import {
  ClockIcon,
  GiftIcon,
  TagIcon,
  SwapIcon,
  WrenchIcon,
} from "@/components/Icons";
import {
  formatPrice,
  listingTypeIntentLabels,
  listingTypeLabels,
} from "@/lib/labels";
import {
  formatPriceAmount,
  suggestListingPrices,
  type PriceHint,
} from "@/lib/price-suggest";
import { formatTomanInput, toEnglishDigits, toPersianDigits } from "@/lib/persian";
import { isListingPhoto } from "@/lib/listing-image";
import type { ListingSpec, ListingType, Privacy, RelationType } from "@/lib/types";

const TYPE_ICONS: Record<ListingType, ComponentType<{ className?: string }>> = {
  sale: TagIcon,
  donation: GiftIcon,
  exchange: SwapIcon,
  loan: ClockIcon,
  service: WrenchIcon,
};

const TYPES: ListingType[] = ["sale", "donation", "exchange", "loan", "service"];

const OWNED_SPEC_LABELS = new Set([
  "تعویض با",
  "مدت امانت",
  "ودیعه",
  "قابل مذاکره",
  "هزینه",
]);

function seedFromListing(input: ListingInput) {
  const gallery = (
    input.images && input.images.length > 0 ? input.images : [input.image]
  ).filter(Boolean);
  const photos = gallery.filter(isListingPhoto);
  const emoji =
    photos.length > 0
      ? "📦"
      : isListingPhoto(input.image)
        ? "📦"
        : input.image.trim() || "📦";
  const specs = input.specs ?? [];
  const swap = specs.find((s) => s.label === "تعویض با");
  const duration = specs.find((s) => s.label === "مدت امانت");
  const deposit = specs.find((s) => s.label === "ودیعه");
  const nego = specs.find((s) => s.label === "قابل مذاکره");
  const cost = specs.find((s) => s.label === "هزینه");
  const extras: DraftSpec[] = specs
    .filter((s) => !OWNED_SPEC_LABELS.has(s.label))
    .map((s) => ({ ...s, confidence: "confirmed" as const }));
  const noDeposit = Boolean(deposit?.value.includes("بدون"));
  return {
    type: input.type,
    title: input.title,
    description: input.description,
    category: input.category,
    condition: input.condition ?? "",
    privacy: input.privacy,
    hideIdentity: Boolean(input.hideIdentity),
    excludePersonIds: input.excludePersonIds ?? [],
    excludeRelationTypes: input.excludeRelationTypes ?? [],
    area: input.area ?? AREA_CITYWIDE,
    photos,
    emoji,
    price:
      input.price != null && input.price > 0
        ? formatTomanInput(String(input.price))
        : "",
    priceAgreed:
      input.type === "service" &&
      (cost?.value === "توافقی" || input.price == null),
    negotiable: Boolean(nego && /بله|کمی/.test(nego.value)),
    exchangeFor: swap?.value ?? "",
    loanDuration: duration?.value ?? "",
    loanNoDeposit: noDeposit,
    loanDeposit:
      deposit && !noDeposit ? formatTomanInput(deposit.value) : "",
    editableSpecs: extras,
  };
}

const GENERIC_CATEGORIES = new Set([
  "فروش",
  "رایگان / اهدا",
  "رایگان",
  "تعویض",
  "امانت",
  "خدمات",
  "اهدا",
]);

type FieldSource = "text" | "suggested" | "user";

export type ListingInput = {
  title: string;
  description: string;
  type: ListingType;
  price?: number;
  category: string;
  image: string;
  images?: string[];
  privacy: Privacy;
  hideIdentity?: boolean;
  excludePersonIds?: string[];
  excludeRelationTypes?: RelationType[];
  condition?: string;
  specs?: ListingSpec[];
  area?: string;
};

export type ListingComposeHandle = {
  submit: () => void;
  canSubmit: boolean;
  primaryLabel: string;
  hint?: string;
  step: "compose" | "review";
  goBack?: () => void;
};

function SourceBadge({ source }: { source?: FieldSource | DraftSpec["confidence"] }) {
  const kind =
    source === "confirmed" || source === "text"
      ? "text"
      : source === "suggested"
        ? "suggested"
        : null;
  if (!kind) return null;
  return (
    <span
      className={`shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
        kind === "text"
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
      }`}
    >
      {kind === "text" ? "از حرف شما" : "پیشنهادی"}
    </span>
  );
}

function extraChipClass(active: boolean) {
  return `shrink-0 chip min-h-9 !px-2.5 !py-1.5 !text-[11px] border transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.97] ${
    active
      ? "bg-brand-50 text-brand-800 border-brand-400 dark:bg-brand-500/15 dark:text-brand-200 dark:border-brand-500/40"
      : "bg-[color:var(--circle-surface)] text-ink-muted border-stone-200/80 dark:bg-zinc-900 dark:border-zinc-700"
  }`;
}

function sourceFromDraft(
  value: string | undefined,
  rawText: string,
  aiRewritten: boolean,
): FieldSource {
  if (!value?.trim()) return "suggested";
  if (looksExtractedFromText(value, rawText)) return "text";
  if (aiRewritten) return "suggested";
  return "suggested";
}

const ListingComposeForm = forwardRef<
  ListingComposeHandle,
  {
    onSubmit: (input: ListingInput) => void | Promise<void>;
    onCancel?: () => void;
    cancelLabel?: string;
    submitLabel?: string;
    /** Prefill and open on the review step (edit existing listing). */
    initial?: ListingInput;
    /** Hide bottom buttons when parent provides a pinned footer. */
    hideActions?: boolean;
    onCanSubmitChange?: (can: boolean) => void;
    onFooterMetaChange?: (meta: {
      canSubmit: boolean;
      primaryLabel: string;
      hint?: string;
      step: "compose" | "review";
    }) => void;
  }
>(function ListingComposeForm(
  {
    onSubmit,
    onCancel,
    cancelLabel = "انصراف",
    submitLabel = "انتشار آگهی",
    initial,
    hideActions = false,
    onCanSubmitChange,
    onFooterMetaChange,
  },
  ref,
) {
  const { show } = useToast();
  const catalog = useCatalog();
  const editMode = Boolean(initial);
  const seed = initial ? seedFromListing(initial) : null;
  const meCity = useStore((s) => s.me.city);
  const people = useStore((s) => s.people);
  const [editSection, setEditSection] = useState<
    null | "details" | "privacy" | "area" | "specs" | "questions" | "deal"
  >(null);

  const [step, setStep] = useState<"compose" | "review">(
    editMode ? "review" : "compose",
  );
  const [type, setType] = useState<ListingType>(seed?.type ?? "sale");
  const [rawText, setRawText] = useState("");
  const rawTextRef = useRef(editMode ? seed?.description ?? "" : "");
  const [rawLongEnough, setRawLongEnough] = useState(false);
  const [deferredRaw, setDeferredRaw] = useState("");
  const [price, setPrice] = useState(seed?.price ?? "");
  const [photos, setPhotos] = useState<string[]>(seed?.photos ?? []);
  const [emoji, setEmoji] = useState(seed?.emoji ?? "📦");
  const [privacy, setPrivacy] = useState<Privacy>(seed?.privacy ?? "AB");
  const [hideIdentity, setHideIdentity] = useState(seed?.hideIdentity ?? false);
  const [excludePersonIds, setExcludePersonIds] = useState<string[]>(
    seed?.excludePersonIds ?? [],
  );
  const [excludeRelationTypes, setExcludeRelationTypes] = useState<
    RelationType[]
  >(seed?.excludeRelationTypes ?? []);
  const [area, setArea] = useState(seed?.area ?? AREA_CITYWIDE);

  const [exchangeFor, setExchangeFor] = useState(seed?.exchangeFor ?? "");
  const [loanDuration, setLoanDuration] = useState(seed?.loanDuration ?? "");
  const [loanDeposit, setLoanDeposit] = useState(seed?.loanDeposit ?? "");
  const [loanNoDeposit, setLoanNoDeposit] = useState(seed?.loanNoDeposit ?? false);
  const [negotiable, setNegotiable] = useState(seed?.negotiable ?? false);
  const [priceAgreed, setPriceAgreed] = useState(seed?.priceAgreed ?? false);

  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [title, setTitle] = useState(seed?.title ?? "");
  const [description, setDescription] = useState(seed?.description ?? "");
  const [category, setCategory] = useState(seed?.category ?? "");
  const [condition, setCondition] = useState(seed?.condition ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [editableSpecs, setEditableSpecs] = useState<DraftSpec[]>(
    seed?.editableSpecs ?? [],
  );
  const [removedLabels, setRemovedLabels] = useState<Set<string>>(new Set());
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [priceHints, setPriceHints] = useState<PriceHint[]>([]);
  const [polishing, setPolishing] = useState(false);
  const [attemptedCompose, setAttemptedCompose] = useState(false);

  const [titleSource, setTitleSource] = useState<FieldSource>(
    editMode ? "user" : "suggested",
  );
  const [descriptionSource, setDescriptionSource] = useState<FieldSource>(
    editMode ? "user" : "suggested",
  );
  const [categorySource, setCategorySource] = useState<FieldSource>(
    editMode ? "user" : "suggested",
  );
  const [conditionSource, setConditionSource] = useState<FieldSource>(
    editMode ? "user" : "suggested",
  );
  const [priceSource, setPriceSource] = useState<FieldSource>("user");

  const onImageError = useCallback((msg: string) => show(msg), [show]);
  const onRawChange = useCallback((text: string) => {
    rawTextRef.current = text;
    setRawText(text);
    const ok = text.trim().length >= 12;
    setRawLongEnough((prev) => (prev === ok ? prev : ok));
    startTransition(() => setDeferredRaw(text));
  }, []);

  const coverImage = photos[0] ?? emoji;
  const needsPrice = (type === "sale" || type === "service") && !priceAgreed;
  const parsedPrice =
    needsPrice && price
      ? Number(toEnglishDigits(price).replace(/\D/g, "")) || undefined
      : undefined;

  const extrasReady =
    type === "exchange"
      ? exchangeFor.trim().length >= 2
      : type === "loan"
        ? loanDuration.trim().length >= 1
        : true;

  const canReview = Boolean(title.trim() && description.trim()) && !polishing;
  const canSubmit = step === "compose" ? !polishing : canReview;
  const primaryLabel =
    step === "compose"
      ? polishing
        ? "در حال آماده‌سازی…"
        : "ساخت پیش‌نمایش"
      : submitLabel;
  const hint =
    step === "compose"
      ? polishing
        ? "متن را ساخت‌یافته می‌کنیم…"
        : attemptedCompose && !rawLongEnough
          ? "برای ادامه، یک جمله درباره آگهی بنویس."
          : attemptedCompose && type === "exchange" && !exchangeFor.trim()
            ? "بنویس با چه چیزی تعویض می‌کنی."
            : attemptedCompose && type === "loan" && !loanDuration.trim()
              ? "مدت امانت را بنویس."
              : undefined
      : canReview
        ? undefined
        : "عنوان و توضیح کوتاه را چک کن";

  const livePriceHints = useMemo(() => {
    if (priceHints.length > 0) return priceHints;
    if (editMode || !needsPrice || deferredRaw.trim().length < 12) return [];
    return suggestListingPrices({
      category:
        category ||
        draftListingFromText({ text: deferredRaw, type }).category,
      type,
      text: deferredRaw,
      condition: condition || undefined,
    });
  }, [priceHints, editMode, needsPrice, deferredRaw, category, type, condition]);

  useEffect(() => {
    onCanSubmitChange?.(canSubmit);
    onFooterMetaChange?.({ canSubmit, primaryLabel, hint, step });
  }, [
    canSubmit,
    primaryLabel,
    hint,
    step,
    onCanSubmitChange,
    onFooterMetaChange,
  ]);

  useEffect(() => {
    if (type !== "service") setPriceAgreed(false);
    if (type !== "sale" && type !== "service") setNegotiable(false);
  }, [type]);

  function mergeSpecs(
    computed: DraftSpec[],
    prev: DraftSpec[],
    removed: Set<string>,
  ): DraftSpec[] {
    const byLabel = new Map<string, DraftSpec>();
    for (const s of prev) {
      if (!removed.has(s.label)) byLabel.set(s.label, s);
    }
    for (const s of computed) {
      if (removed.has(s.label)) continue;
      if (!byLabel.has(s.label)) byLabel.set(s.label, s);
    }
    return Array.from(byLabel.values());
  }

  function ownedSpecs(): ListingSpec[] {
    const out: ListingSpec[] = [];
    if (type === "exchange" && exchangeFor.trim()) {
      out.push({ label: "تعویض با", value: exchangeFor.trim() });
    }
    if (type === "loan") {
      if (loanDuration.trim()) {
        out.push({ label: "مدت امانت", value: loanDuration.trim() });
      }
      if (loanNoDeposit) {
        out.push({ label: "ودیعه", value: "بدون ودیعه" });
      } else if (loanDeposit.trim()) {
        const n = Number(toEnglishDigits(loanDeposit).replace(/\D/g, ""));
        if (n > 0) out.push({ label: "ودیعه", value: formatPrice(n) });
      }
    }
    if (type === "service" && priceAgreed) {
      out.push({ label: "هزینه", value: "توافقی" });
    } else if ((type === "sale" || type === "service") && negotiable) {
      out.push({ label: "قابل مذاکره", value: "بله" });
    }
    return out;
  }

  function applyDraftToForm(
    next: ListingDraft,
    hints: PriceHint[],
    aiRewritten: boolean,
  ) {
    const swap = next.specs.find((s) => s.label === "تعویض با");
    if (type === "exchange" && !exchangeFor.trim() && swap) {
      setExchangeFor(swap.value);
    }
    const duration = next.specs.find((s) => s.label === "مدت امانت");
    if (type === "loan" && !loanDuration.trim() && duration) {
      setLoanDuration(duration.value);
    }
    const deposit = next.specs.find((s) => s.label === "ودیعه");
    if (type === "loan" && deposit && !loanDeposit.trim() && !loanNoDeposit) {
      if (deposit.value.includes("بدون")) setLoanNoDeposit(true);
    }
    const nego = next.specs.find((s) => s.label === "قابل مذاکره");
    if (
      (type === "sale" || type === "service") &&
      nego &&
      nego.value !== "خیر"
    ) {
      setNegotiable(true);
    }

    setDraft({
      ...next,
      questions: next.questions.filter((q) => {
        if (q.id === "negotiable" && (negotiable || priceAgreed || nego)) {
          return false;
        }
        return true;
      }),
    });
    setTitle(next.title);
    setDescription(next.description);
    setCategory(next.category);
    setCondition(next.condition ?? "");
    setAnswers({});
    setRemovedLabels(new Set());
    setEditableSpecs(
      next.specs.filter((s) => !OWNED_SPEC_LABELS.has(s.label)),
    );
    setEditingLabel(null);
    setPriceHints(hints);
    setTitleSource(sourceFromDraft(next.title, rawTextRef.current, aiRewritten));
    setDescriptionSource(
      sourceFromDraft(next.description, rawTextRef.current, aiRewritten),
    );
    setCategorySource(
      GENERIC_CATEGORIES.has(next.category) ? "suggested" : "text",
    );
    setConditionSource(
      next.condition
        ? sourceFromDraft(next.condition, rawTextRef.current, false)
        : "suggested",
    );
    if (!price && needsPrice && hints[1]) {
      setPrice(formatTomanInput(String(hints[1].amount)));
      setPriceSource("suggested");
    } else if (price) {
      setPriceSource("text");
    }
    setStep("review");
  }

  async function goToReview() {
    if (polishing) return;
    if (rawTextRef.current.trim().length < 12 || !extrasReady) {
      setAttemptedCompose(true);
      return;
    }
    setPolishing(true);
    try {
      const res = await fetch(withBasePath("/api/listing-draft"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: rawTextRef.current,
          type,
          price: parsedPrice,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        applyDraftToForm(
          data.draft as ListingDraft,
          (data.priceHints as PriceHint[]) ?? [],
          data.source === "openai",
        );
        return;
      }
    } catch {
      /* local fallback */
    } finally {
      setPolishing(false);
    }

    const next = createPolishedListingDraft({
      text: rawTextRef.current,
      type,
      price: parsedPrice,
    });
    const hints = suggestListingPrices({
      category: next.category,
      type,
      text: rawTextRef.current,
      condition: next.condition,
    });
    applyDraftToForm(next, hints, false);
  }

  function publish() {
    if (!canReview) return;
    if (type === "exchange" && !exchangeFor.trim()) {
      show("بنویس با چه چیزی تعویض می‌کنی.");
      return;
    }
    if (type === "loan" && !loanDuration.trim()) {
      show("مدت امانت را بنویس.");
      return;
    }
    const specs: ListingSpec[] = [
      ...ownedSpecs(),
      ...editableSpecs
        .filter((s) => !OWNED_SPEC_LABELS.has(s.label))
        .map(({ label, value }) => ({ label, value })),
    ];
    const images = photos.length > 0 ? photos : undefined;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      type,
      price: parsedPrice,
      category: category.trim() || listingTypeLabels[type],
      image: coverImage,
      images,
      privacy,
      hideIdentity,
      excludePersonIds,
      excludeRelationTypes,
      area,
      condition: type === "service" ? undefined : condition.trim() || undefined,
      specs: specs.length ? specs : undefined,
    });
  }

  function submit() {
    if (step === "compose") void goToReview();
    else publish();
  }

  function goBack() {
    if (step === "review") setStep("compose");
  }

  useImperativeHandle(
    ref,
    () => ({
      submit,
      canSubmit,
      primaryLabel,
      hint,
      step,
      goBack: !editMode && step === "review" ? goBack : undefined,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- submit closes over latest state
    [
      canSubmit,
      primaryLabel,
      hint,
      step,
      editMode,
      type,
      price,
      photos,
      emoji,
      privacy,
      hideIdentity,
      excludePersonIds,
      excludeRelationTypes,
      area,
      title,
      description,
      category,
      condition,
      answers,
      draft,
      editableSpecs,
      exchangeFor,
      loanDuration,
      loanDeposit,
      loanNoDeposit,
      negotiable,
      priceAgreed,
    ],
  );

  function pickAnswer(qid: string, value: string) {
    setAnswers((prev) => {
      const nextAnswers = { ...prev };
      if (prev[qid] === value) delete nextAnswers[qid];
      else nextAnswers[qid] = value;

      if (draft) {
        const computed = applyDraftAnswers(
          {
            ...draft,
            title,
            description,
            category,
            condition: condition || undefined,
          },
          nextAnswers,
        ).specs;
        setEditableSpecs((prevSpecs) =>
          mergeSpecs(
            computed.filter((s) => !OWNED_SPEC_LABELS.has(s.label)),
            prevSpecs,
            removedLabels,
          ),
        );
      }
      return nextAnswers;
    });
  }

  function removeSpec(label: string) {
    setRemovedLabels((prev) => new Set(prev).add(label));
    setEditableSpecs((prev) => prev.filter((s) => s.label !== label));
    if (editingLabel === label) setEditingLabel(null);
  }

  function updateSpecValue(label: string, value: string) {
    setEditableSpecs((prev) =>
      prev.map((s) =>
        s.label === label
          ? { ...s, value, confidence: "confirmed" as const }
          : s,
      ),
    );
  }

  const priceHintsRow =
    needsPrice && livePriceHints.length > 0 ? (
      <div className="mt-2">
        <p className="text-[11px] text-ink-faint mb-1.5">
          قیمت آگهی‌های مشابه حلقه
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {livePriceHints.map((h) => (
            <button
              key={h.id}
              type="button"
              title={h.note}
              onClick={() => {
                setPrice(formatTomanInput(String(h.amount)));
                setPriceSource("suggested");
              }}
              className={`${extraChipClass(
                Number(toEnglishDigits(price).replace(/\D/g, "")) === h.amount,
              )} !flex !flex-col !items-stretch !gap-0.5 !px-2 !py-2 w-full`}
            >
              <span className="font-bold leading-snug">{h.label}</span>
              <span className="nums text-[12.5px] leading-snug">
                {formatPriceAmount(h.amount)}
              </span>
            </button>
          ))}
        </div>
      </div>
    ) : null;

  const showCondition = type !== "service";
  const showSource = !editMode;
  const detailsPreview = [category, showCondition ? condition : ""]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" · ");
  const privacyPreview = useMemo(() => {
    const names = activeCircle(people)
      .filter((person) => excludePersonIds.includes(person.id))
      .map((person) => person.name);
    return listingPrivacySummary({
      privacy,
      hideIdentity,
      excludePersonNames: names,
      excludeRelationTypes,
    }).join(" ");
  }, [
    people,
    excludePersonIds,
    privacy,
    hideIdentity,
    excludeRelationTypes,
  ]);
  const questionsPreview = useMemo(() => {
    if (!draft?.questions.length) return "";
    const done = draft.questions.filter((q) => Boolean(answers[q.id])).length;
    if (done === 0) return "اختیاری";
    return `${toPersianDigits(done)} از ${toPersianDigits(draft.questions.length)} جواب`;
  }, [draft, answers]);
  const dealLabel =
    type === "service"
      ? "هزینه"
      : type === "exchange"
        ? "تعویض"
        : type === "loan"
          ? "امانت"
          : "قیمت";
  const dealPreview = useMemo(() => {
    if (type === "donation") return "رایگان";
    if (type === "exchange") return exchangeFor.trim() || "مشخص نشده";
    if (type === "loan") {
      const depositN = Number(toEnglishDigits(loanDeposit).replace(/\D/g, ""));
      const parts = [
        loanDuration.trim(),
        loanNoDeposit ? "بدون ودیعه" : depositN > 0 ? formatPrice(depositN) : "",
      ].filter(Boolean);
      return parts.join(" · ") || "مشخص نشده";
    }
    if (type === "service" && priceAgreed) return "توافقی";
    const n = Number(toEnglishDigits(price).replace(/\D/g, ""));
    const base = n > 0 ? formatPrice(n) : "وارد نشده";
    return negotiable ? `${base} · قابل مذاکره` : base;
  }, [
    type,
    exchangeFor,
    loanDuration,
    loanNoDeposit,
    loanDeposit,
    priceAgreed,
    price,
    negotiable,
  ]);

  const typeFields = (
    <>
      {type === "exchange" && (
        <section className="mb-4">
          <label
            htmlFor="listing-exchange"
            className="block text-[13px] font-bold mb-1.5 text-ink dark:text-zinc-200"
          >
            با چه چیزی تعویض می‌کنی؟
          </label>
          <input
            id="listing-exchange"
            value={exchangeFor}
            onChange={(e) => setExchangeFor(e.target.value)}
            placeholder="مثلاً دوچرخه شهری، یا مبلغ معادل"
            className="field"
          />
        </section>
      )}

      {type === "loan" && (
        <section className="mb-4 space-y-3">
          <div>
            <label
              htmlFor="listing-loan-duration"
              className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
            >
              تا کی؟
            </label>
            <input
              id="listing-loan-duration"
              value={loanDuration}
              onChange={(e) => setLoanDuration(e.target.value)}
              placeholder="مثلاً یک هفته، تا جمعه"
              className="field"
            />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label
                htmlFor="listing-loan-deposit"
                className="block text-[13px] font-bold text-ink dark:text-zinc-200"
              >
                ودیعه
              </label>
              <button
                type="button"
                aria-pressed={loanNoDeposit}
                onClick={() => {
                  setLoanNoDeposit((v) => {
                    const next = !v;
                    if (next) setLoanDeposit("");
                    return next;
                  });
                }}
                className={extraChipClass(loanNoDeposit)}
              >
                بدون ودیعه
              </button>
            </div>
            {!loanNoDeposit && (
              <div className="relative">
                <input
                  id="listing-loan-deposit"
                  value={loanDeposit}
                  onChange={(e) => {
                    setLoanNoDeposit(false);
                    setLoanDeposit(formatTomanInput(e.target.value));
                  }}
                  inputMode="numeric"
                  placeholder="اختیاری"
                  className="field nums !pl-14"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-ink-muted pointer-events-none">
                  تومان
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {(type === "sale" || type === "service") && (
        <section className="mb-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label
              htmlFor="listing-price"
              className="flex items-center gap-1.5 text-[13px] font-bold text-ink dark:text-zinc-200"
            >
              {type === "service" ? "هزینه" : "قیمت"}
            </label>
            <div className="flex gap-1.5">
              {type === "service" && (
                <button
                  type="button"
                  aria-pressed={priceAgreed}
                  onClick={() => {
                    setPriceAgreed((v) => {
                      const next = !v;
                      if (next) setNegotiable(false);
                      return next;
                    });
                  }}
                  className={extraChipClass(priceAgreed)}
                >
                  توافقی
                </button>
              )}
              {!priceAgreed && (
                <button
                  type="button"
                  aria-pressed={negotiable}
                  onClick={() => setNegotiable((v) => !v)}
                  className={extraChipClass(negotiable)}
                >
                  قابل مذاکره
                </button>
              )}
            </div>
          </div>
          {needsPrice && (
            <>
              <div className="relative">
                <input
                  id="listing-price"
                  value={price}
                  onChange={(e) => {
                    setPrice(formatTomanInput(e.target.value));
                    setPriceSource("user");
                  }}
                  inputMode="numeric"
                  placeholder={
                    type === "service" ? "مثلاً ۴۰۰٬۰۰۰" : "مثلاً ۸٬۵۰۰٬۰۰۰"
                  }
                  className="field nums !pl-14"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-ink-muted pointer-events-none">
                  تومان
                </span>
              </div>
              {priceHintsRow}
            </>
          )}
          {priceAgreed && (
            <p className="text-[11px] text-ink-faint mt-1.5 leading-relaxed">
              هزینه بعد از هماهنگی مشخص می‌شود.
            </p>
          )}
        </section>
      )}
    </>
  );

  return (
    <div className="flex flex-col">
      {step === "compose" ? (
        <>
          <ListingTypePicker type={type} onChange={setType} />

          <ListingImagePicker
            photos={photos}
            onPhotosChange={setPhotos}
            emoji={emoji}
            onEmojiChange={setEmoji}
            onError={onImageError}
            category={listingTypeLabels[type]}
          />

          <ListingRawTextBlock
            value={rawText}
            polishing={polishing}
            onChange={onRawChange}
          />

          {typeFields}
        </>
      ) : (
        <>
          {editMode ? (
            <ListingTypePicker type={type} onChange={setType} />
          ) : null}

          <ListingImagePicker
            photos={photos}
            onPhotosChange={setPhotos}
            emoji={emoji}
            onEmojiChange={setEmoji}
            onError={onImageError}
            category={listingTypeLabels[type]}
            compact
          />

          {!editMode ? (
            <p className="text-[12.5px] text-ink-muted dark:text-zinc-400 mb-4 leading-relaxed">
              {listingTypeIntentLabels[type]}
              {area ? ` · ${area}` : ""}
            </p>
          ) : null}

          {showSource ? (
            <p className="text-[12.5px] text-ink-muted leading-relaxed mb-4 rounded-xl bg-stone-50 dark:bg-zinc-800/50 px-3 py-2.5">
              از حرف تو پر شد. هر جا لازم بود اصلاح کن.
            </p>
          ) : null}

          <section className="mb-5">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="listing-title"
                className="text-[13.5px] font-semibold text-ink dark:text-zinc-200"
              >
                عنوان
              </label>
              <span className="nums text-[11px] text-ink-faint">
                {toPersianDigits(title.length)}/{toPersianDigits(80)}
              </span>
            </div>
            <input
              id="listing-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleSource("user");
              }}
              className="field"
              maxLength={80}
            />
          </section>

          <section className="mb-5">
            <label
              htmlFor="listing-desc"
              className="block text-[13.5px] font-semibold mb-1.5 text-ink dark:text-zinc-200"
            >
              توضیح کوتاه
            </label>
            <textarea
              id="listing-desc"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDescriptionSource("user");
              }}
              rows={editMode ? 2 : 3}
              className={`field resize-none leading-relaxed ${
                editMode ? "min-h-[4.5rem]" : "min-h-[5.5rem]"
              }`}
            />
          </section>

          {editMode ? typeFields : null}
              <ListingEditRows>
                {!editMode && type !== "donation" ? (
                  <ListingEditRow
                    label={dealLabel}
                    value={dealPreview}
                    onClick={() => setEditSection("deal")}
                  />
                ) : null}
                <ListingEditRow
                  label="دسته و وضعیت"
                  value={detailsPreview || "انتخاب نشده"}
                  onClick={() => setEditSection("details")}
                />
                <ListingEditRow
                  label="حریم خصوصی"
                  value={privacyPreview}
                  onClick={() => setEditSection("privacy")}
                />
                <ListingEditRow
                  label="محدوده"
                  value={area}
                  onClick={() => setEditSection("area")}
                />
                {!editMode && draft && draft.questions.length > 0 ? (
                  <ListingEditRow
                    label="چند سؤال کوتاه"
                    value={questionsPreview}
                    onClick={() => setEditSection("questions")}
                  />
                ) : null}
                {editableSpecs.length > 0 ? (
                  <ListingEditRow
                    label="مشخصات"
                    value={editableSpecs
                      .map((s) => `${s.label}: ${s.value}`)
                      .join(" · ")}
                    onClick={() => setEditSection("specs")}
                  />
                ) : null}
              </ListingEditRows>
              {editSection === "deal" ? (
                <ListingEditSectionSheet
                  title={dealLabel}
                  labelledBy="edit-listing-deal"
                  onClose={() => setEditSection(null)}
                >
                  {typeFields}
                </ListingEditSectionSheet>
              ) : null}
              {editSection === "details" ? (
                <ListingEditSectionSheet
                  title="دسته و وضعیت"
                  labelledBy="edit-listing-details"
                  onClose={() => setEditSection(null)}
                >
                  <section className="mb-5">
                    <label
                      htmlFor="listing-category-review"
                      className="flex items-center gap-1.5 text-[13.5px] font-semibold mb-1.5 text-ink dark:text-zinc-200"
                    >
                      دسته
                      {showSource && categorySource === "suggested" ? (
                        <SourceBadge source={categorySource} />
                      ) : null}
                    </label>
                    <CatalogCategorySelect
                      id="listing-category-review"
                      value={category}
                      categories={catalog.categories}
                      onChange={(next) => {
                        setCategory(next);
                        setCategorySource("user");
                      }}
                    />
                  </section>
                  {showCondition ? (
                    <section>
                      <label
                        htmlFor="listing-condition-review"
                        className="flex items-center gap-1.5 text-[13.5px] font-semibold mb-1.5 text-ink dark:text-zinc-200"
                      >
                        وضعیت کالا
                        {showSource ? (
                          <SourceBadge source={conditionSource} />
                        ) : null}
                      </label>
                      <input
                        id="listing-condition-review"
                        value={condition}
                        onChange={(e) => {
                          setCondition(e.target.value);
                          setConditionSource("user");
                        }}
                        placeholder="مثلاً سالم، در حد نو"
                        className="field"
                      />
                    </section>
                  ) : null}
                </ListingEditSectionSheet>
              ) : null}
              {editSection === "privacy" ? (
                <ListingEditSectionSheet
                  title="حریم خصوصی"
                  labelledBy="edit-listing-privacy"
                  onClose={() => setEditSection(null)}
                >
                  <ListingPrivacySection
                    privacy={privacy}
                    onPrivacy={setPrivacy}
                    hideIdentity={hideIdentity}
                    onHideIdentity={setHideIdentity}
                    excludePersonIds={excludePersonIds}
                    onExcludePersonIds={setExcludePersonIds}
                    excludeRelationTypes={excludeRelationTypes}
                    onExcludeRelationTypes={setExcludeRelationTypes}
                    canHideIdentity={
                      !editMode || Boolean(initial?.hideIdentity)
                    }
                    initialPrivacy={editMode ? initial?.privacy : undefined}
                    initialExcludePersonIds={
                      editMode ? initial?.excludePersonIds : undefined
                    }
                    initialExcludeRelationTypes={
                      editMode ? initial?.excludeRelationTypes : undefined
                    }
                  />
                </ListingEditSectionSheet>
              ) : null}
              {editSection === "area" ? (
                <ListingEditSectionSheet
                  title="محدوده"
                  labelledBy="edit-listing-area"
                  onClose={() => setEditSection(null)}
                >
                  <AreaPicker city={meCity} value={area} onChange={setArea} />
                </ListingEditSectionSheet>
              ) : null}
              {editSection === "questions" && draft ? (
                <ListingEditSectionSheet
                  title="چند سؤال کوتاه"
                  labelledBy="edit-listing-questions"
                  onClose={() => setEditSection(null)}
                >
                  <p className="text-[12px] text-ink-muted mb-3 leading-relaxed">
                    اختیاری — جواب بده تا آگهی برای طرف مقابل کامل‌تر شود.
                  </p>
                  <div className="space-y-3.5">
                    {draft.questions.map((q) => (
                      <div key={q.id}>
                        <p className="text-[12.5px] text-ink-muted mb-1.5">
                          {q.label}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {q.options.map((opt) => {
                            const active = answers[q.id] === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => pickAnswer(q.id, opt)}
                                aria-pressed={active}
                                className={extraChipClass(active)}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ListingEditSectionSheet>
              ) : null}
              {editSection === "specs" ? (
                <ListingEditSectionSheet
                  title="مشخصات"
                  labelledBy="edit-listing-specs"
                  onClose={() => setEditSection(null)}
                >
                  <ul className="rounded-xl border border-stone-200/80 dark:border-zinc-700 overflow-hidden divide-y divide-stone-100 dark:divide-zinc-800">
                    {editableSpecs.map((s) => (
                      <li
                        key={s.label}
                        className="px-3 py-2.5 bg-[color:var(--circle-surface)] dark:bg-zinc-900"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <p className="text-[11px] text-ink-faint">
                                {s.label}
                              </p>
                              {showSource ? (
                                <SourceBadge source={s.confidence} />
                              ) : null}
                            </div>
                            {editingLabel === s.label ? (
                              <input
                                value={s.value}
                                onChange={(e) =>
                                  updateSpecValue(s.label, e.target.value)
                                }
                                onBlur={() => setEditingLabel(null)}
                                autoFocus
                                className="field !py-1.5 !text-[13.5px]"
                              />
                            ) : (
                              <p className="text-[13.5px] font-semibold text-ink dark:text-zinc-100">
                                {s.value}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingLabel(
                                  editingLabel === s.label ? null : s.label,
                                )
                              }
                              className="text-[11px] font-bold text-brand-600 dark:text-brand-400 min-h-9 px-1"
                            >
                              {editingLabel === s.label ? "تمام" : "ویرایش"}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSpec(s.label)}
                              className="text-[11px] font-bold text-ink-faint min-h-9 px-1"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {showSource ? (
                    <p className="text-[11px] text-ink-faint mt-2 leading-relaxed">
                      ابعاد یا ادعاهای حساس را فقط اگر درست‌اند نگه دارید.
                    </p>
                  ) : null}
                </ListingEditSectionSheet>
              ) : null}

          {!hideActions && !editMode && (
            <button
              type="button"
              onClick={goBack}
              className="text-[12px] font-bold text-brand-600 dark:text-brand-400 mb-3 self-start"
            >
              ‹ بازگشت به متن
            </button>
          )}
        </>
      )}

      {!hideActions && (
        <div className="pt-3 border-t border-stone-200/70 dark:border-zinc-800">
          {hint && (
            <p className="text-[11px] text-ink-faint text-center mb-2">{hint}</p>
          )}
          <div className="flex gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn-ghost flex-1 !py-3.5 active:scale-[0.98] transition-transform duration-150"
              >
                {cancelLabel}
              </button>
            )}
            <button
              type="button"
              disabled={!canSubmit}
              onClick={submit}
              className={`btn-primary !py-3.5 shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-transform duration-150 disabled:opacity-60 ${
                onCancel ? "flex-1" : "w-full text-base"
              }`}
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default ListingComposeForm;

const ListingTypePicker = memo(function ListingTypePicker({
  type,
  onChange,
}: {
  type: ListingType;
  onChange: (type: ListingType) => void;
}) {
  return (
    <section className="mb-4">
      <label className="block text-[13px] font-bold mb-2 text-ink dark:text-zinc-200">
        می‌خواهی چه کاری انجام دهی؟
      </label>
      <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="نوع آگهی">
        {TYPES.map((t) => {
          const active = type === t;
          const Icon = TYPE_ICONS[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => onChange(t)}
              aria-pressed={active}
              className={`rounded-xl px-1 py-2 text-[11px] font-bold border flex flex-col items-center justify-center gap-1 min-h-[3.25rem] transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.97] ${
                active
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-[color:var(--circle-surface)] dark:bg-zinc-900 text-ink-muted border-stone-200/80 dark:border-zinc-700"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  active ? "text-white" : "text-ink-muted"
                }`}
              />
              {listingTypeIntentLabels[t]}
            </button>
          );
        })}
      </div>
    </section>
  );
});

const ListingRawTextBlock = memo(function ListingRawTextBlock({
  value,
  polishing,
  onChange,
}: {
  value: string;
  polishing: boolean;
  onChange: (text: string) => void;
}) {
  const { show } = useToast();
  const [voiceInterim, setVoiceInterim] = useState("");
  const [voiceListening, setVoiceListening] = useState(false);

  return (
    <section className="mb-3">
      <div className="flex items-center justify-between gap-2 mb-1">
        <label
          htmlFor="listing-raw"
          className="block text-[13px] font-bold text-ink dark:text-zinc-200"
        >
          یک جمله درباره آگهی
        </label>
        <VoiceDictateButton
          disabled={polishing}
          onError={(msg) => show(msg)}
          onListeningChange={setVoiceListening}
          onInterim={setVoiceInterim}
          onFinal={(phrase) => {
            const piece = phrase.trim();
            if (!piece) return;
            onChange(value.trim() ? `${value.trim()} ${piece}` : piece);
            setVoiceInterim("");
          }}
        />
      </div>
      <textarea
        id="listing-raw"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="مثلاً: مبل سبز سه‌نفره، کمی رد استفاده، بازدید اوکی."
        rows={3}
        className="field resize-none min-h-[5rem] leading-relaxed"
      />
      {voiceListening ? (
        <div className="mt-2 rounded-xl border border-rose-200/80 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-500/10 px-3 py-2">
          <p className="text-[11px] font-bold text-rose-700 dark:text-rose-300 mb-0.5">
            در حال شنیدن…
          </p>
          <p className="text-[12px] text-ink dark:text-zinc-100 leading-relaxed min-h-[1.25rem]">
            {voiceInterim || "حرف بزن — متن موقت اینجا می‌آید"}
          </p>
        </div>
      ) : null}
      <p className="text-[11px] text-ink-faint mt-1.5 leading-relaxed">
        وضعیت، مدت استفاده یا دلیل واگذاری را بنویس. جزئیات را در پیش‌نمایش کامل
        می‌کنیم.
      </p>
    </section>
  );
});

