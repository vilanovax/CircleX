"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SheetShell from "@/components/SheetShell";
import { useStore } from "@/lib/store";
import { toPersianDigits } from "@/lib/persian";

const STEPS = [
  {
    emoji: "🛡️",
    title: "اینجا کسی غریبه نیست",
    body: "سیرکل خرید، فروش و خدمات را فقط بین خانواده، دوستان و آشنایان مورد اعتماد شما انجام می‌دهد — نه دیوار و نه غریبه.",
    hint: "هر معامله از یک رابطه‌ی واقعی شروع می‌شود.",
  },
  {
    emoji: "👥",
    title: "حلقه‌ی اعتمادت را بساز",
    body: "هر نفر را در یکی از سه دایره بگذار: «نزدیک»، «مورد اعتماد» یا «آشنا». همین دایره‌ها تعیین می‌کنند چه کسی آگهی‌هایت را می‌بیند.",
    hint: "از تب «حلقه» می‌توانی خانواده و دوستان را اضافه کنی.",
  },
  {
    emoji: "🏷️",
    title: "اولین آگهی یا درخواست",
    body: "چیزی برای فروش، اهدا یا معاوضه داری؟ ثبت کن. دنبال چیزی هستی؟ درخواست بگذار. می‌خواهی دورهمی بگذاری؟ رویداد بساز.",
    hint: "دکمه + پایین صفحه همه‌ی این‌ها را یک‌جا باز می‌کند.",
  },
  {
    emoji: "🗺️",
    title: "نقشه‌ی حلقه را ببین",
    body: "گراف اعتماد نشان می‌دهد چه کسی به چه کسی وصل است و هر آگهی از چه مسیری به تو رسیده — مثل «دوستِ همکارِ خواهرت».",
    hint: "بعد از شروع، از صفحه «حلقه» یا جزئیات هر آگهی به گراف می‌رسی.",
  },
] as const;

export default function Onboarding() {
  const { hydrated, onboarded } = useStore();
  if (!hydrated || onboarded) return null;
  return <OnboardingDialog />;
}

function OnboardingDialog() {
  const router = useRouter();
  const { completeOnboarding } = useStore();
  const [step, setStep] = useState(0);

  const finish = useCallback(
    (navigateTo?: string) => {
      completeOnboarding();
      if (navigateTo) router.push(navigateTo);
    },
    [completeOnboarding, router],
  );

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const s = STEPS[step];

  return (
    <SheetShell
      onClose={() => finish()}
      labelledBy="onboarding-title"
      zClass="z-50"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium text-ink-faint nums">
          مرحله {toPersianDigits(step + 1)} از {toPersianDigits(STEPS.length)}
        </span>
        <button
          type="button"
          onClick={() => finish()}
          className="text-xs text-ink-faint active:text-ink-muted"
        >
          رد کردن
        </button>
      </div>

      <div className="flex flex-col items-center text-center pt-2">
        <div className="w-20 h-20 rounded-2xl bg-stone-100/80 dark:bg-zinc-800 flex items-center justify-center text-4xl mb-5">
          {s.emoji}
        </div>
        <h2
          id="onboarding-title"
          className="text-xl font-extrabold text-ink dark:text-zinc-100"
        >
          {s.title}
        </h2>
        <p className="text-sm text-ink-muted dark:text-zinc-400 leading-relaxed mt-2 px-2">
          {s.body}
        </p>
        <p className="text-xs text-ink-faint mt-3 px-3 leading-relaxed">
          {s.hint}
        </p>
      </div>

      <div className="flex justify-center gap-1.5 mt-6" aria-hidden>
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === step
                ? "w-5 bg-brand-600"
                : "w-1.5 bg-stone-200 dark:bg-zinc-700"
            }`}
          />
        ))}
      </div>

      <div className="flex gap-2 mt-6">
        {!isFirst && (
          <button
            type="button"
            onClick={() => setStep((v) => v - 1)}
            className="btn-ghost flex-1 !py-3.5"
          >
            قبلی
          </button>
        )}
        {isLast ? (
          <div className={`flex flex-col gap-2 ${isFirst ? "w-full" : "flex-1"}`}>
            <button
              type="button"
              onClick={() => finish("/graph")}
              className="btn-primary w-full !py-3.5 text-base"
            >
              مشاهده گراف اعتماد
            </button>
            <button
              type="button"
              onClick={() => finish()}
              className="btn-ghost w-full !py-2.5 text-sm"
            >
              شروع در خانه
            </button>
          </div>
        ) : step === 1 ? (
          <div className={`flex flex-col gap-2 ${isFirst ? "w-full" : "flex-1"}`}>
            <button
              type="button"
              onClick={() => setStep((v) => v + 1)}
              className="btn-primary w-full !py-3.5 text-base"
            >
              بعدی
            </button>
            <Link
              href="/circle"
              onClick={() => finish()}
              className="btn-ghost w-full !py-2.5 text-sm text-center"
            >
              الان حلقه بسازم
            </Link>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setStep((v) => v + 1)}
            className={`btn-primary !py-3.5 text-base ${isFirst ? "w-full" : "flex-1"}`}
          >
            بعدی
          </button>
        )}
      </div>
    </SheetShell>
  );
}
