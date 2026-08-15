"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import SheetShell from "@/components/SheetShell";
import {
  CircleUsersIcon,
  HomeIcon,
  ShieldCheckIcon,
} from "@/components/Icons";
import { peekPendingInviteCode } from "@/lib/invite";
import { useStore } from "@/lib/store";
import { toPersianDigits } from "@/lib/persian";

type IconComp = ComponentType<{ className?: string }>;

const TRUST_CHIPS = [
  {
    key: "near",
    label: "نزدیک",
    tint: "bg-levelA/12 text-levelA border-levelA/35",
    sample: "خواهر، همسر",
  },
  {
    key: "trusted",
    label: "مورد اعتماد",
    tint: "bg-levelB/12 text-levelB border-levelB/35",
    sample: "همکار، همسایه",
  },
  {
    key: "known",
    label: "آشنا",
    tint: "bg-levelC/12 text-levelC border-levelC/35",
    sample: "دوستِ دوست",
  },
] as const;

const STEPS: ReadonlyArray<{
  Icon: IconComp;
  iconTone: string;
  title: string;
  body: string;
  hint: string;
  showChips: boolean;
}> = [
  {
    Icon: ShieldCheckIcon,
    iconTone: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
    title: "اینجا کسی غریبه نیست",
    body: "سیرکل خرید، فروش و خدمات را فقط بین خانواده، دوستان و آشنایانت انجام می‌دهد — نه بازار عمومی و نه غریبه.",
    hint: "هر معامله از یک رابطهٔ واقعی شروع می‌شود.",
    showChips: false,
  },
  {
    Icon: CircleUsersIcon,
    iconTone: "bg-levelB/12 text-levelB dark:bg-levelB/20",
    title: "حلقه‌ات را بساز",
    body: "جایگاه هر نفر را مشخص کن. همان تعیین می‌کند چه کسی آگهی‌ات را می‌بیند.",
    hint: "از تب «حلقه‌ی من» خانواده و دوستان را اضافه کن.",
    showChips: true,
  },
  {
    Icon: HomeIcon,
    iconTone: "bg-levelA/12 text-levelA dark:bg-levelA/20",
    title: "خانه مال حلقه‌ات است",
    body: "بعد از دعوت، آگهی و درخواست و رویداد همان حلقه اینجا می‌آید.",
    hint: "اول حلقه، بعد معامله.",
    showChips: false,
  },
];

export default function Onboarding() {
  const { hydrated, sessionPhone, onboarded, profileCompletedAt } = useStore();
  if (!hydrated || !sessionPhone || onboarded) return null;
  if (!profileCompletedAt) return null;
  if (peekPendingInviteCode()) return null;
  return <OnboardingDialog />;
}

function OnboardingDialog() {
  const router = useRouter();
  const { completeOnboarding } = useStore();
  const [step, setStep] = useState(0);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const progressId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  const finish = useCallback(
    (navigateTo?: string) => {
      completeOnboarding();
      if (navigateTo) router.push(navigateTo);
    },
    [completeOnboarding, router],
  );

  const goNext = useCallback(() => {
    setConfirmSkip(false);
    setStep((v) => Math.min(v + 1, STEPS.length - 1));
  }, []);

  const goPrev = useCallback(() => {
    setConfirmSkip(false);
    setStep((v) => Math.max(v - 1, 0));
  }, []);

  // Move focus to step title so Skip never steals it.
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      titleRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [step, confirmSkip]);

  // Keep background out of the a11y/interaction tree while the sheet is open.
  useEffect(() => {
    const shell = document.querySelector(".app-shell");
    if (!(shell instanceof HTMLElement)) return;

    const previous = shell.inert;
    shell.inert = true;
    return () => {
      shell.inert = previous;
    };
  }, []);

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const s = STEPS[step];
  const StepIcon = s.Icon;

  const footer = confirmSkip ? undefined : (
    <div className="pb-1 touch-manipulation">
      <div
        className="flex justify-center items-center gap-2 mb-4"
        role="progressbar"
        aria-labelledby={progressId}
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={step + 1}
        aria-valuetext={`مرحله ${toPersianDigits(step + 1)} از ${toPersianDigits(STEPS.length)}`}
      >
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === step
                ? "w-6 bg-brand-600"
                : i < step
                  ? "w-1.5 bg-brand-400/70 dark:bg-brand-500/50"
                  : "w-1.5 bg-stone-300 dark:bg-zinc-600"
            }`}
          />
        ))}
      </div>

      {isLast ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => finish("/circle?invite=1")}
            className="btn-primary w-full min-h-12 !py-3.5 text-base cursor-pointer active:scale-[0.99] transition-transform duration-150"
          >
            حلقه‌ات را بساز
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="btn-ghost flex-1 min-h-12 !py-3 cursor-pointer"
            >
              قبلی
            </button>
            <button
              type="button"
              onClick={() => finish()}
              className="btn-ghost flex-1 min-h-12 !py-3 cursor-pointer"
            >
              شروع در خانه
            </button>
          </div>
          <button
            type="button"
            onClick={() => finish("/graph")}
            className="min-h-11 text-sm font-semibold text-ink-muted dark:text-zinc-400 active:text-ink dark:active:text-zinc-200 cursor-pointer rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            نقشه‌ی ارتباط‌ها (اختیاری)
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          {!isFirst && (
            <button
              type="button"
              onClick={goPrev}
              className="btn-ghost flex-1 min-h-12 !py-3.5 cursor-pointer"
            >
              قبلی
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            className={`btn-primary min-h-12 !py-3.5 text-base cursor-pointer active:scale-[0.99] transition-transform duration-150 ${
              isFirst ? "w-full" : "flex-1"
            }`}
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  );

  const sheet = (
    <SheetShell
      onClose={() => {}}
      closeOnBackdrop={false}
      labelledBy={titleId}
      zClass="z-50"
      backdropClassName="bg-ink/55 backdrop-blur-[6px]"
      autoFocus={false}
      footer={footer}
      onEscape={() => {
        setConfirmSkip(true);
        return true;
      }}
    >
      {confirmSkip ? (
        <div className="flex flex-col items-center text-center pt-1 pb-2 touch-manipulation">
          <h2
            id={titleId}
            ref={titleRef}
            tabIndex={-1}
            className="text-lg font-extrabold text-ink dark:text-zinc-50 outline-none"
          >
            راهنما را رد می‌کنی؟
          </h2>
          <p className="text-sm text-ink-muted dark:text-zinc-300 leading-relaxed mt-2.5 px-1 max-w-[22rem]">
            بعداً از پروفایل دوباره می‌بینی. اول حلقه‌ات را بساز.
          </p>
          <div className="flex flex-col gap-2 w-full mt-6">
            <button
              type="button"
              onClick={() => finish("/circle?invite=1")}
              className="btn-primary w-full min-h-12 !py-3.5 text-base cursor-pointer"
            >
              حلقه‌ات را بساز
            </button>
            <button
              type="button"
              onClick={() => finish()}
              className="btn-ghost w-full min-h-11 !py-2.5 text-sm cursor-pointer"
            >
              رد کن و برو خانه
            </button>
            <button
              type="button"
              onClick={() => setConfirmSkip(false)}
              className="min-h-11 text-sm font-semibold text-ink-muted dark:text-zinc-400 active:text-ink dark:active:text-zinc-200 cursor-pointer rounded-lg"
            >
              ادامهٔ راهنما
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 mb-3">
            <p
              id={progressId}
              className="text-xs font-semibold text-ink-muted dark:text-zinc-400 nums"
            >
              مرحله {toPersianDigits(step + 1)} از{" "}
              {toPersianDigits(STEPS.length)}
            </p>
            <button
              type="button"
              onClick={() => setConfirmSkip(true)}
              className="min-h-11 min-w-[4.5rem] px-2 text-sm font-semibold text-ink-muted dark:text-zinc-400 active:text-ink dark:active:text-zinc-200 cursor-pointer rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              رد کردن
            </button>
          </div>

          <div
            key={step}
            className="flex flex-col items-center text-center pt-1 animate-fade-up"
          >
            <div
              className={`w-[4.5rem] h-[4.5rem] rounded-2xl flex items-center justify-center mb-5 ring-1 ring-black/[0.04] dark:ring-white/10 ${s.iconTone}`}
              aria-hidden
            >
              <StepIcon className="w-8 h-8" />
            </div>
            <h2
              id={titleId}
              ref={titleRef}
              tabIndex={-1}
              className="text-[1.25rem] font-extrabold text-ink dark:text-zinc-50 tracking-tight outline-none max-w-[18rem]"
            >
              {s.title}
            </h2>
            <p className="text-sm text-ink-muted dark:text-zinc-300 leading-relaxed mt-2.5 px-1 max-w-[22rem]">
              {s.body}
            </p>
            <p className="text-[13px] font-medium text-ink-muted/90 dark:text-zinc-400 mt-3 px-2 leading-relaxed max-w-[20rem]">
              {s.hint}
            </p>

            {s.showChips && (
              <ul className="w-full mt-5 space-y-2 text-start">
                {TRUST_CHIPS.map((chip) => (
                  <li
                    key={chip.key}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 min-h-12 ${chip.tint}`}
                  >
                    <span className="text-sm font-bold">{chip.label}</span>
                    <span className="text-xs font-medium opacity-85">
                      {chip.sample}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </SheetShell>
  );

  if (!mounted) return null;
  return createPortal(sheet, document.body);
}
