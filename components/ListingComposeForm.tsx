"use client";

import {
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import ListingImagePicker from "@/components/ListingImagePicker";
import PrivacyPicker from "@/components/PrivacyPicker";
import { useToast } from "@/components/Toast";
import {
  applyDraftAnswers,
  draftListingFromText,
  type ListingDraft,
} from "@/lib/listing-draft";
import { listingTypeEmoji, listingTypeLabels } from "@/lib/labels";
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
  const [image, setImage] = useState("📦");
  const [privacy, setPrivacy] = useState<Privacy>("AB");

  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const needsPrice = type === "sale" || type === "service";
  const parsedPrice =
    needsPrice && price
      ? Number(toEnglishDigits(price).replace(/\D/g, "")) || undefined
      : undefined;

  const canCompose = rawText.trim().length >= 12;
  const canReview = Boolean(title.trim() && description.trim());
  const canSubmit = step === "compose" ? canCompose : canReview;
  const primaryLabel =
    step === "compose" ? "ادامه و پیش‌نمایش" : submitLabel;
  const hint =
    step === "compose"
      ? canCompose
        ? undefined
        : "چند جمله درباره کالا بنویس (حداقل ۱۲ حرف)"
      : canReview
        ? undefined
        : "عنوان و توضیح کوتاه را چک کن";

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

  function goToReview() {
    if (!canCompose) return;
    const next = draftListingFromText({
      text: rawText,
      type,
      price: parsedPrice,
    });
    setDraft(next);
    setTitle(next.title);
    setDescription(next.description);
    setCategory(next.category);
    setCondition(next.condition ?? "");
    setAnswers({});
    setStep("review");
  }

  function publish() {
    if (!canReview || !draft) return;
    const withAnswers = applyDraftAnswers(draft, answers);
    const specs: ListingSpec[] = withAnswers.specs.map(
      ({ label, value }) => ({ label, value }),
    );
    const images =
      image.startsWith("data:image/") || image.startsWith("http")
        ? [image]
        : undefined;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      type,
      price: parsedPrice,
      category: category.trim() || listingTypeLabels[type],
      image,
      images,
      privacy,
      condition: condition.trim() || undefined,
      specs: specs.length ? specs : undefined,
    });
  }

  function submit() {
    if (step === "compose") goToReview();
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
      image,
      privacy,
      title,
      description,
      category,
      condition,
      answers,
      draft,
    ],
  );

  function pickAnswer(qid: string, value: string) {
    setAnswers((prev) => {
      const next = { ...prev };
      if (prev[qid] === value) delete next[qid];
      else next[qid] = value;
      return next;
    });
  }

  const liveSpecs =
    draft != null
      ? applyDraftAnswers(
          {
            ...draft,
            title,
            description,
            category,
            condition: condition || undefined,
          },
          answers,
        ).specs
      : [];

  return (
    <div className="flex flex-col">
      {step === "compose" ? (
        <>
          <div className="mb-3.5 rounded-xl bg-stone-50/90 dark:bg-zinc-800/50 px-3 py-2.5">
            <p className="text-[12px] text-ink-muted dark:text-zinc-400 leading-relaxed">
              عکس و چند جمله کافی است. عنوان، وضعیت و مشخصات را در مرحله بعد
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
            value={image}
            onChange={setImage}
            onError={(msg) => show(msg)}
            category={listingTypeLabels[type]}
          />

          <section className="mb-3">
            <label
              htmlFor="listing-raw"
              className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
            >
              درباره آگهی بنویس
            </label>
            <textarea
              id="listing-raw"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="مثلاً: مبل سه‌نفره مخمل سبز، حدود سه سال استفاده، بدون پارگی کمی رد نشستن روی نشیمن. به‌خاطر تغییر دکوراسیون می‌فروشم. بازدید و ارسال با باربری اوکیه."
              rows={5}
              className="field resize-none min-h-[8rem] leading-relaxed"
            />
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
            <p className="text-[12px] text-brand-800 dark:text-brand-200 leading-relaxed">
              پیش‌نمایش ساختاریافته از متنت. موارد «احتمالاً» را قبل از انتشار
              اصلاح یا حذف کن.
            </p>
          </div>

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

          {liveSpecs.length > 0 && (
            <section className="mb-4">
              <p className="text-[13px] font-bold text-ink dark:text-zinc-200 mb-2">
                مشخصات استخراج‌شده
              </p>
              <ul className="rounded-xl border border-stone-200/80 dark:border-zinc-700 overflow-hidden divide-y divide-stone-100 dark:divide-zinc-800">
                {liveSpecs.map((s) => (
                  <li
                    key={`${s.label}-${s.value}`}
                    className="flex items-start justify-between gap-3 px-3 py-2.5 bg-[color:var(--circle-surface)] dark:bg-zinc-900"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] text-ink-faint">{s.label}</p>
                      <p className="text-[13px] font-semibold text-ink dark:text-zinc-100 mt-0.5">
                        {s.value}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        s.confidence === "confirmed"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
                      }`}
                    >
                      {s.confidence === "confirmed" ? "از متن" : "پیشنهاد"}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-ink-faint mt-2 leading-relaxed">
                ابعاد یا ادعاهای حساس را فقط اگر در متن گفته‌ای نگه دار؛ در غیر
                این صورت حذف کن.
              </p>
            </section>
          )}

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
