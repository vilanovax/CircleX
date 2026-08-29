"use client";

import {
  PointerEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { activeCircleCount } from "@/lib/circle-member";
import { withBasePath } from "@/lib/avatar";
import {
  HOW_QUERY,
  isFirstRunExplainPending,
  markConceptTipSeen,
  markFirstRunExplainSeen,
} from "@/lib/home-tip";
import { toPersianDigits } from "@/lib/persian";
import { useStore } from "@/lib/store";
import "@/app/first-run-explain.css";

const STEPS = [
  {
    title: "خرید و فروش بین آشنایان",
    body: "آگهی، درخواست و کمک از آدم‌هایی که می‌شناسی. غریبه اینجا نیست.",
    mark: "people" as const,
  },
  {
    title: "همه‌چیز از مسیر اعتماد می‌آید",
    body: "می‌بینی از چه کسی به فروشنده می‌رسی. بدون مسیر، آگهی دیده نمی‌شود.",
    mark: "path" as const,
  },
  {
    title: "حلقه با دعوت ساخته می‌شود",
    body: "لینک را برای نزدیکت بفرست. تا نپیوندد، عضو حلقه نیست.",
    mark: "invite" as const,
  },
];

/**
 * One-shot overlay after first login (empty circle). Replay via ?how=1.
 * Invite-link joiners never see it. Dismiss lands on the empty home, not the invite sheet.
 */
export default function FirstRunExplainHost() {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useStore((s) => s.hydrated);
  const circleReady = useStore((s) => s.circleReady);
  const circleCount = useStore((s) => activeCircleCount(s.people));
  const [mounted, setMounted] = useState(false);
  const [replay, setReplay] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPending(isFirstRunExplainPending());
    setReplay(
      new URLSearchParams(window.location.search).get(HOW_QUERY) === "1",
    );
  }, [pathname, hydrated]);

  const onInviteLanding = pathname.startsWith("/invite/");
  const emptyCircle = circleReady && circleCount === 0;
  const show =
    mounted &&
    hydrated &&
    circleReady &&
    !onInviteLanding &&
    (replay || (pending && emptyCircle));

  useEffect(() => {
    if (!circleReady || replay || emptyCircle) return;
    if (circleCount > 0 && pending) markFirstRunExplainSeen();
  }, [circleReady, circleCount, emptyCircle, pending, replay]);

  const finish = useCallback(() => {
    markFirstRunExplainSeen();
    markConceptTipSeen();
    setPending(false);
    setReplay(false);
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get(HOW_QUERY) !== "1") {
      return;
    }
    router.replace(pathname || "/");
  }, [pathname, router]);

  if (!show) return null;

  return <FirstRunExplain onDone={finish} onSkip={finish} />;
}

function FirstRunExplain({
  onDone,
  onSkip,
}: {
  onDone: () => void;
  onSkip: () => void;
}) {
  const titleId = useId();
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;
  const current = STEPS[step];
  const startX = useRef<number | null>(null);

  const goNext = useCallback(() => {
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }, []);
  const goPrev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const shell = document.querySelector(".app-shell");
    shell?.setAttribute("aria-hidden", "true");
    return () => {
      document.body.style.overflow = prev;
      shell?.removeAttribute("aria-hidden");
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onSkip();
        return;
      }
      if (e.key === "ArrowLeft") goNext();
      if (e.key === "ArrowRight") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onSkip]);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    startX.current = e.clientX;
  }
  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) < 48) return;
    // RTL: finger moves right → next; left → previous
    if (dx > 0) goNext();
    else goPrev();
  }

  return createPortal(
    <div
      className="first-run fixed inset-0 z-[70] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="first-run-atmosphere" aria-hidden />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col w-full max-w-[26rem] mx-auto px-5 sm:px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.85rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between min-h-11">
          <p className="text-[15px] font-extrabold text-[color:var(--fr-ink)] tracking-tight">
            سیرکل
          </p>
          <button
            type="button"
            onClick={onSkip}
            className="min-h-11 px-1 text-[13px] font-semibold text-[color:var(--fr-soft)] active:opacity-70"
          >
            رد کردن
          </button>
        </div>

        <div
          key={step}
          className="first-run-step flex min-h-0 flex-1 flex-col justify-center pt-2 pb-4"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          <StepMark kind={current.mark} />
          <p className="first-run-meta">
            {toPersianDigits(step + 1)} از {toPersianDigits(STEPS.length)}
          </p>
          <div className="first-run-copy">
            <h2 id={titleId} className="first-run-title">
              {current.title}
            </h2>
            <p className="first-run-body">{current.body}</p>
          </div>
        </div>

        <div className="first-run-footer">
          <div className="first-run-dots" role="tablist" aria-label="ورق‌ها">
            {STEPS.map((s, i) => (
              <button
                key={s.mark}
                type="button"
                role="tab"
                aria-selected={i === step}
                aria-label={`ورق ${toPersianDigits(i + 1)} از ${toPersianDigits(STEPS.length)}`}
                onClick={() => setStep(i)}
                className="first-run-dot"
              >
                <span className="first-run-dot-pip" />
              </button>
            ))}
          </div>
          <p className="sr-only" aria-live="polite">
            ورق {toPersianDigits(step + 1)} از {toPersianDigits(STEPS.length)}
          </p>
          <div className="first-run-nav">
            <button
              type="button"
              onClick={() => {
                if (last) onDone();
                else goNext();
              }}
              className="btn-primary w-full min-h-12 !py-3.5 text-base shadow-md shadow-brand-600/20 active:scale-[0.98] transition-transform duration-150"
            >
              {last ? "ورود به خانه" : "بعدی"}
            </button>
            {step > 0 ? (
              <button
                type="button"
                onClick={goPrev}
                className="min-h-10 text-[13px] font-semibold text-[color:var(--fr-soft)]"
              >
                قبلی
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Face({
  src,
  name,
  you = false,
}: {
  src: string;
  name: string;
  you?: boolean;
}) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={withBasePath(src)}
        alt=""
        width={56}
        height={56}
        draggable={false}
        className={you ? "first-run-you-photo" : undefined}
      />
      <span className="first-run-face-name">{name}</span>
    </>
  );
}

function StepMark({ kind }: { kind: "people" | "path" | "invite" }) {
  if (kind === "people") {
    return (
      <div className="first-run-stage first-run-people" aria-hidden>
        <span className="first-run-orbit" />
        <span className="first-run-orbit first-run-orbit--inner" />
        <div className="first-run-face first-run-face--a">
          <Face src="/avatars/04.webp" name="مینا" />
        </div>
        <div className="first-run-face first-run-face--you">
          <Face src="/avatars/01.webp" name="تو" you />
        </div>
        <div className="first-run-face first-run-face--b">
          <Face src="/avatars/11.webp" name="رضا" />
        </div>
        <div className="first-run-face first-run-face--c">
          <Face src="/avatars/07.webp" name="سارا" />
        </div>
      </div>
    );
  }

  if (kind === "path") {
    return (
      <div className="first-run-stage" aria-hidden>
        <div className="first-run-path">
          <div className="first-run-path-node first-run-path-node--you">
            <Face src="/avatars/01.webp" name="تو" you />
          </div>
          <span className="first-run-path-thread" />
          <div className="first-run-path-node">
            <Face src="/avatars/04.webp" name="مینا" />
          </div>
          <span className="first-run-path-thread" />
          <div className="first-run-path-node">
            <Face src="/avatars/08.webp" name="فروشنده" />
          </div>
        </div>
        <p className="first-run-ghost">بدون مسیر، مخفی است</p>
      </div>
    );
  }

  return (
    <div className="first-run-stage" aria-hidden>
      <div className="first-run-invite">
        <div className="flex flex-col items-center gap-1">
          <Face src="/avatars/01.webp" name="تو" you />
        </div>
        <span className="first-run-path-thread" />
        <div className="flex flex-col items-center gap-1">
          <span className="first-run-seat" aria-hidden>
            +
          </span>
          <span className="first-run-face-name">نفر بعد</span>
        </div>
      </div>
      <p className="first-run-linkchip">
        بفرست با واتساپ · <strong>لینک دعوت</strong>
      </p>
    </div>
  );
}
