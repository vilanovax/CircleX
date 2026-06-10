"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

const STEPS = [
  {
    emoji: "🛡️",
    title: "اینجا کسی غریبه نیست",
    body: "سیرکل خرید، فروش و معرفی خدمات را فقط بین خانواده، دوستان و آشنایان مورد اعتماد شما انجام می‌دهد — نه غریبه‌ها.",
  },
  {
    emoji: "🔗",
    title: "مسیر اعتماد را ببین",
    body: "هر آگهی با یک مسیر روشن به شما می‌رسد: «این فروشنده، دوستِ همکارِ خواهرِ شماست.» پس با خیال راحت معامله می‌کنی.",
  },
  {
    emoji: "🏅",
    title: "سطح اعتماد A / B / C",
    body: "هر فرد را در یکی از سه سطح می‌گذاری: A نزدیک‌ترین‌ها، B مورد اعتمادها، C آشناها. همین سطح تعیین می‌کند چه کسی آگهی‌هایت را ببیند.",
  },
];

export default function Onboarding() {
  const { hydrated, onboarded, completeOnboarding } = useStore();
  const [step, setStep] = useState(0);

  if (!hydrated || onboarded) return null;

  const isLast = step === STEPS.length - 1;
  const s = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      <div className="relative w-full max-w-[480px]">
        <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm" />
        <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl p-6 pb-8 animate-slide-up">
          <div className="flex justify-end">
            <button
              onClick={completeOnboarding}
              className="text-xs text-zinc-400 active:text-zinc-600"
            >
              رد کردن
            </button>
          </div>

          <div className="flex flex-col items-center text-center pt-2">
            <div className="w-24 h-24 rounded-3xl bg-brand-50 flex items-center justify-center text-5xl mb-5">
              {s.emoji}
            </div>
            <h2 className="text-xl font-extrabold text-zinc-900">{s.title}</h2>
            <p className="text-sm text-zinc-500 leading-relaxed mt-2 px-2">
              {s.body}
            </p>
          </div>

          {/* progress dots */}
          <div className="flex justify-center gap-1.5 mt-6">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-5 bg-brand-600" : "w-1.5 bg-zinc-200"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => (isLast ? completeOnboarding() : setStep((v) => v + 1))}
            className="btn-primary w-full !py-3.5 text-base mt-6"
          >
            {isLast ? "شروع کنیم" : "بعدی"}
          </button>
        </div>
      </div>
    </div>
  );
}
