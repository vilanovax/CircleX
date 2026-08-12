"use client";

import {
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import ListingImagePicker from "@/components/ListingImagePicker";
import PrivacyPicker from "@/components/PrivacyPicker";
import VoiceDictateButton from "@/components/VoiceDictateButton";
import { useToast } from "@/components/Toast";
import { withBasePath } from "@/lib/avatar";
import {
  applyDraftAnswers,
  draftListingFromText,
  type DraftSpec,
  type ListingDraft,
} from "@/lib/listing-draft";
import { createPolishedListingDraft } from "@/lib/listing-polish";
import { listingTypeEmoji, listingTypeLabels } from "@/lib/labels";
import {
  formatPriceAmount,
  suggestListingPrices,
  type PriceHint,
} from "@/lib/price-suggest";
import { useStore } from "@/lib/store";
import { toEnglishDigits } from "@/lib/persian";
import type { ListingSpec, ListingType, Privacy } from "@/lib/types";

const TYPES: ListingType[] = ["sale", "service", "donation", "exchange", "loan"];

export type ListingInput = {
  title: string;
  description: string;
  type: ListingType;
  price?: number;
  category: string;
  image: string;
  images?: string[];
  privacy: Privacy;
  condition?: string;
  specs?: ListingSpec[];
};

export type ListingComposeHandle = {
  submit: () => void;
  canSubmit: boolean;
  primaryLabel: string;
  hint?: string;
  step: "compose" | "review";
  goBack?: () => void;
};

const ListingComposeForm = forwardRef<
  ListingComposeHandle,
  {
    onSubmit: (input: ListingInput) => void;
    onCancel?: () => void;
    cancelLabel?: string;
    submitLabel?: string;
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
    hideActions = false,
    onCanSubmitChange,
    onFooterMetaChange,
  },
  ref,
) {
  const { people } = useStore();
  const { show } = useToast();
  const circle = people.filter((p) => p.inMyCircle);

  const [step, setStep] = useState<"compose" | "review">("compose");
  const [type, setType] = useState<ListingType>("sale");
  const [rawText, setRawText] = useState("");
  const [price, setPrice] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [emoji, setEmoji] = useState("📦");
  const [privacy, setPrivacy] = useState<Privacy>("AB");

  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [editableSpecs, setEditableSpecs] = useState<DraftSpec[]>([]);
  const [removedLabels, setRemovedLabels] = useState<Set<string>>(new Set());
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [priceHints, setPriceHints] = useState<PriceHint[]>([]);
  const [polishing, setPolishing] = useState(false);
  const [draftSource, setDraftSource] = useState<"local" | "openai" | null>(
    null,
  );
  const [aiConfigured, setAiConfigured] = useState(false);
  const [voiceInterim, setVoiceInterim] = useState("");
  const [voiceListening, setVoiceListening] = useState(false);

  const coverImage = photos[0] ?? emoji;
  const needsPrice = type === "sale" || type === "service";
  const parsedPrice =
    needsPrice && price
      ? Number(toEnglishDigits(price).replace(/\D/g, "")) || undefined
      : undefined;

  const canCompose = rawText.trim().length >= 12 && !polishing;
  const canReview = Boolean(title.trim() && description.trim()) && !polishing;
  const canSubmit = step === "compose" ? canCompose : canReview;
  const primaryLabel =
    step === "compose"
      ? polishing
        ? "در حال آماده‌سازی…"
        : "ادامه و پیش‌نمایش"
      : submitLabel;
  const hint =
    step === "compose"
      ? polishing
        ? "متن را ساخت‌یافته می‌کنیم…"
        : canCompose
          ? undefined
          : "چند جمله درباره کالا بنویس (حداقل ۱۲ حرف)"
      : canReview
        ? undefined
        : "عنوان و توضیح کوتاه را چک کن";

  const livePriceHints =
    priceHints.length > 0
      ? priceHints
      : needsPrice && rawText.trim().length >= 12
        ? suggestListingPrices({
            category:
              category ||
              draftListingFromText({ text: rawText, type }).category,
            type,
            text: rawText,
            condition: condition || undefined,
          })
        : [];

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
    let cancelled = false;
    fetch(withBasePath("/api/listing-draft"))
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setAiConfigured(Boolean(d?.aiConfigured));
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  function applyDraftToForm(
    next: ListingDraft,
    hints: PriceHint[],
    source: "local" | "openai",
  ) {
    setDraft(next);
    setTitle(next.title);
    setDescription(next.description);
    setCategory(next.category);
    setCondition(next.condition ?? "");
    setAnswers({});
    setRemovedLabels(new Set());
    setEditableSpecs(next.specs);
    setEditingLabel(null);
    setPriceHints(hints);
    setDraftSource(source);
    if (!price && hints[1]) {
      setPrice(String(hints[1].amount));
    }
    setStep("review");
  }

  async function goToReview() {
    if (!canCompose || polishing) return;
    setPolishing(true);
    try {
      const res = await fetch(withBasePath("/api/listing-draft"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: rawText,
          type,
          price: parsedPrice,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        applyDraftToForm(
          data.draft as ListingDraft,
          (data.priceHints as PriceHint[]) ?? [],
          data.source === "openai" ? "openai" : "local",
        );
        return;
      }
    } catch {
      /* local fallback */
    } finally {
      setPolishing(false);
    }

    const next = createPolishedListingDraft({
      text: rawText,
      type,
      price: parsedPrice,
    });
    const hints = suggestListingPrices({
      category: next.category,
      type,
      text: rawText,
      condition: next.condition,
    });
    applyDraftToForm(next, hints, "local");
  }

  async function rePolish() {
    if (!rawText.trim() || polishing) return;
    setPolishing(true);
    try {
      const res = await fetch(withBasePath("/api/listing-draft"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: rawText,
          type,
          price: parsedPrice,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const next = data.draft as ListingDraft;
        setDraft(next);
        setTitle(next.title);
        setDescription(next.description);
        setCategory(next.category);
        setCondition(next.condition ?? "");
        setEditableSpecs((prev) =>
          mergeSpecs(next.specs, prev, removedLabels),
        );
        setPriceHints((data.priceHints as PriceHint[]) ?? []);
        setDraftSource(data.source === "openai" ? "openai" : "local");
        setAiConfigured(Boolean(data.aiConfigured));
        show(
          data.source === "openai"
            ? "عنوان و توضیح با مدل بهبود یافت ✓"
            : aiConfigured
              ? "پولیش محلی اعمال شد"
              : "استخراج محلی — برای مدل، OPENAI_API_KEY بگذار",
        );
        return;
      }
    } catch {
      show("پولیش ممکن نشد");
    } finally {
      setPolishing(false);
    }
  }

  function publish() {
    if (!canReview) return;
    const specs: ListingSpec[] = editableSpecs.map(({ label, value }) => ({
      label,
      value,
    }));
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
      condition: condition.trim() || undefined,
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
      goBack: step === "review" ? goBack : undefined,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- submit closes over latest state
    [
      canSubmit,
      primaryLabel,
      hint,
      step,
      rawText,
      type,
      price,
      photos,
      emoji,
      privacy,
      title,
      description,
      category,
      condition,
      answers,
      draft,
      editableSpecs,
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
          mergeSpecs(computed, prevSpecs, removedLabels),
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

  return (
    <div className="flex flex-col">
      {step === "compose" ? (
        <>
          <div className="mb-3.5 rounded-xl bg-stone-50/90 dark:bg-zinc-800/50 px-3 py-2.5">
            <p className="text-[12px] text-ink-muted dark:text-zinc-400 leading-relaxed">
              چند عکس و چند جمله کافی است. عنوان، وضعیت و مشخصات را در مرحله بعد
              از متنت پیشنهاد می‌دهیم تا تأیید کنی.
            </p>
          </div>

          <section className="mb-4">
            <label className="block text-[13px] font-bold mb-1.5 text-ink dark:text-zinc-200">
              نوع آگهی
            </label>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-0.5 px-0.5">
              {TYPES.map((t) => {
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    aria-pressed={active}
                    className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-bold border flex items-center gap-1 transition-[transform,colors] duration-150 active:scale-[0.97] ${
                      active
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-[color:var(--circle-surface)] dark:bg-zinc-900 text-ink-muted border-stone-200/80 dark:border-zinc-700"
                    }`}
                  >
                    <span className="text-sm leading-none" aria-hidden>
                      {listingTypeEmoji[t]}
                    </span>
                    {listingTypeLabels[t]}
                  </button>
                );
              })}
            </div>
          </section>

          <ListingImagePicker
            photos={photos}
            onPhotosChange={setPhotos}
            emoji={emoji}
            onEmojiChange={setEmoji}
            onError={(msg) => show(msg)}
            category={listingTypeLabels[type]}
          />

          <section className="mb-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <label
                htmlFor="listing-raw"
                className="block text-[13px] font-bold text-ink dark:text-zinc-200"
              >
                درباره آگهی بنویس یا بگو
              </label>
              <VoiceDictateButton
                disabled={polishing}
                onError={(msg) => show(msg)}
                onListeningChange={setVoiceListening}
                onInterim={setVoiceInterim}
                onFinal={(phrase) => {
                  const piece = phrase.trim();
                  if (!piece) return;
                  setRawText((prev) =>
                    prev.trim() ? `${prev.trim()} ${piece}` : piece,
                  );
                  setVoiceInterim("");
                }}
              />
            </div>
            <textarea
              id="listing-raw"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="مثلاً: مبل سه‌نفره مخمل سبز، حدود سه سال استفاده، بدون پارگی کمی رد نشستن روی نشیمن. به‌خاطر تغییر دکوراسیون می‌فروشم. بازدید و ارسال با باربری اوکیه."
              rows={5}
              className="field resize-none min-h-[8rem] leading-relaxed"
            />
            {voiceListening && (
              <div className="mt-2 rounded-xl border border-rose-200/80 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-500/10 px-3 py-2">
                <p className="text-[10px] font-bold text-rose-700 dark:text-rose-300 mb-0.5">
                  در حال شنیدن…
                </p>
                <p className="text-[12px] text-ink dark:text-zinc-100 leading-relaxed min-h-[1.25rem]">
                  {voiceInterim || "صحبت کن — متن موقت اینجا می‌آید"}
                </p>
              </div>
            )}
            <p className="text-[11px] text-ink-faint mt-1.5 leading-relaxed">
              وضعیت، ابعاد، بازدید و ایرادها را همین‌جا بگو — بعد جدا می‌کنیم.
            </p>
          </section>

          {needsPrice && (
            <section className="mb-3">
              <label
                htmlFor="listing-price"
                className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
              >
                قیمت (تومان)
              </label>
              <input
                id="listing-price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="numeric"
                placeholder="مثلاً ۸۵۰۰۰۰۰"
                className="field nums"
              />
              {livePriceHints.length > 0 && (
                <div className="mt-2">
                  <p className="text-[11px] text-ink-faint mb-1.5">
                    پیشنهاد قیمت از آگهی‌های مشابه حلقه
                  </p>
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                    {livePriceHints.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        title={h.note}
                        onClick={() => setPrice(String(h.amount))}
                        className={`shrink-0 chip !px-2.5 !py-1.5 !text-[11px] border ${
                          price === String(h.amount) ||
                          Number(toEnglishDigits(price).replace(/\D/g, "")) ===
                            h.amount
                            ? "bg-brand-600 text-white border-brand-600"
                            : "bg-stone-50 text-ink-muted border-stone-200/80 dark:bg-zinc-800 dark:border-zinc-700"
                        }`}
                      >
                        <span className="font-bold">{h.label}</span>
                        <span className="nums ms-1">
                          {formatPriceAmount(h.amount)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <div className={hideActions ? "mb-2" : "mb-5"}>
            <PrivacyPicker
              value={privacy}
              onChange={setPrivacy}
              circle={circle}
              showCircleLink
              compact
            />
          </div>
        </>
      ) : (
        <>
          <div className="mb-3.5 rounded-xl bg-brand-50/80 dark:bg-brand-500/10 px-3 py-2.5 border border-brand-100/80 dark:border-brand-500/20">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] text-brand-800 dark:text-brand-200 leading-relaxed">
                پیش‌نمایش ساختاریافته
                {draftSource === "openai"
                  ? " · بهبود با مدل"
                  : " · استخراج محلی"}
                . ردیف‌ها را ویرایش یا حذف کن.
              </p>
              <button
                type="button"
                disabled={polishing}
                onClick={() => void rePolish()}
                className="shrink-0 text-[11px] font-bold text-brand-700 dark:text-brand-300 px-2 py-1 rounded-lg bg-white/70 dark:bg-zinc-900/50 border border-brand-200/60 dark:border-brand-500/30 disabled:opacity-50"
              >
                {polishing
                  ? "…"
                  : aiConfigured
                    ? "دوباره با AI"
                    : "دوباره پولیش"}
              </button>
            </div>
            {!aiConfigured && (
              <p className="text-[10px] text-brand-700/80 dark:text-brand-300/70 mt-1.5 leading-relaxed">
                برای پولیش مدل، متغیر{" "}
                <span className="font-mono">OPENAI_API_KEY</span> را در محیط
                سرور بگذار.
              </p>
            )}
          </div>

          {photos.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3">
              {photos.map((src, i) => (
                <div
                  key={`${i}-${src.slice(0, 20)}`}
                  className="w-14 h-14 rounded-lg overflow-hidden shrink-0 ring-1 ring-stone-200/70 dark:ring-zinc-700"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <section className="mb-3">
            <label
              htmlFor="listing-title"
              className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
            >
              عنوان
            </label>
            <input
              id="listing-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="field"
              maxLength={80}
            />
          </section>

          <section className="mb-3">
            <label
              htmlFor="listing-desc"
              className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
            >
              توضیح کوتاه (داستان فروش)
            </label>
            <textarea
              id="listing-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="field resize-none min-h-[5rem] leading-relaxed"
            />
          </section>

          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <section>
              <label
                htmlFor="listing-category"
                className="block text-[12px] font-bold mb-1 text-ink dark:text-zinc-200"
              >
                دسته
              </label>
              <input
                id="listing-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="field !text-[13px]"
              />
            </section>
            <section>
              <label
                htmlFor="listing-condition"
                className="block text-[12px] font-bold mb-1 text-ink dark:text-zinc-200"
              >
                وضعیت
              </label>
              <input
                id="listing-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="مثلاً سالم"
                className="field !text-[13px]"
              />
            </section>
          </div>

          {needsPrice && livePriceHints.length > 0 && (
            <section className="mb-3">
              <p className="text-[12px] font-bold text-ink dark:text-zinc-200 mb-1.5">
                پیشنهاد قیمت
              </p>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-1.5">
                {livePriceHints.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    title={h.note}
                    onClick={() => setPrice(String(h.amount))}
                    className={`shrink-0 chip !px-2.5 !py-1.5 !text-[11px] border ${
                      Number(toEnglishDigits(price).replace(/\D/g, "")) ===
                      h.amount
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-stone-50 text-ink-muted border-stone-200/80 dark:bg-zinc-800 dark:border-zinc-700"
                    }`}
                  >
                    {h.label}
                    <span className="nums ms-1">
                      {formatPriceAmount(h.amount)}
                    </span>
                  </button>
                ))}
              </div>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="numeric"
                className="field nums !text-[13px]"
                placeholder="قیمت نهایی"
              />
            </section>
          )}

          {draft && draft.questions.length > 0 && (
            <section className="mb-4 space-y-3">
              <p className="text-[13px] font-bold text-ink dark:text-zinc-200">
                چند سؤال کوتاه
              </p>
              {draft.questions.map((q) => (
                <div key={q.id}>
                  <p className="text-[12px] text-ink-muted mb-1.5">{q.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {q.options.map((opt) => {
                      const active = answers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => pickAnswer(q.id, opt)}
                          aria-pressed={active}
                          className={`chip !px-2.5 !py-1 !text-[11px] border transition-colors ${
                            active
                              ? "bg-brand-600 text-white border-brand-600"
                              : "bg-stone-50 text-ink-muted border-stone-200/80 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          )}

          <section className="mb-4">
            <p className="text-[13px] font-bold text-ink dark:text-zinc-200 mb-2">
              مشخصات استخراج‌شده
            </p>
            {editableSpecs.length === 0 ? (
              <p className="text-[12px] text-ink-faint leading-relaxed px-0.5">
                هنوز مشخصاتی استخراج نشد — بعد از انتشار خریدار می‌تواند ازت
                بپرسد.
              </p>
            ) : (
              <ul className="rounded-xl border border-stone-200/80 dark:border-zinc-700 overflow-hidden divide-y divide-stone-100 dark:divide-zinc-800">
                {editableSpecs.map((s) => (
                  <li
                    key={s.label}
                    className="px-3 py-2.5 bg-[color:var(--circle-surface)] dark:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <p className="text-[11px] text-ink-faint">{s.label}</p>
                          <span
                            className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              s.confidence === "confirmed"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                                : "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
                            }`}
                          >
                            {s.confidence === "confirmed"
                              ? "از متن"
                              : "پیشنهاد"}
                          </span>
                        </div>
                        {editingLabel === s.label ? (
                          <input
                            value={s.value}
                            onChange={(e) =>
                              updateSpecValue(s.label, e.target.value)
                            }
                            onBlur={() => setEditingLabel(null)}
                            autoFocus
                            className="field !py-1.5 !text-[13px]"
                          />
                        ) : (
                          <p className="text-[13px] font-semibold text-ink dark:text-zinc-100">
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
                          className="text-[11px] font-bold text-brand-600 dark:text-brand-400 px-1"
                        >
                          {editingLabel === s.label ? "تمام" : "ویرایش"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSpec(s.label)}
                          className="text-[11px] font-bold text-ink-faint px-1"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-ink-faint mt-2 leading-relaxed">
              ابعاد یا ادعاهای حساس را فقط اگر مطمئنی نگه دار.
            </p>
          </section>

          {!hideActions && (
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
              className={`btn-primary !py-3.5 shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-transform duration-150 ${
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
