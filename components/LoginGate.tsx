"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useStore } from "@/lib/store";
import { toEnglishDigits, toPersianDigits } from "@/lib/persian";

/** Demo OTP — always accepted in this mock gate. */
export const SAMPLE_OTP = "12345";

const RESEND_SECONDS = 45;
const OTP_LEN = 5;

function normalizePhone(raw: string): string {
  let digits = toEnglishDigits(raw).replace(/\D/g, "");
  if (digits.startsWith("98") && digits.length === 12) {
    digits = `0${digits.slice(2)}`;
  }
  if (digits.startsWith("9") && digits.length === 10) {
    digits = `0${digits}`;
  }
  return digits.slice(0, 11);
}

function isValidIranMobile(phone: string): boolean {
  return /^09\d{9}$/.test(phone);
}

function formatPhoneDisplay(phone: string): string {
  const d = phone.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 4) return toPersianDigits(d);
  if (d.length <= 7) {
    return toPersianDigits(`${d.slice(0, 4)} ${d.slice(4)}`);
  }
  return toPersianDigits(`${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`);
}

function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <span
      className={`${className} login-gate-spinner shrink-0`}
      aria-hidden
    />
  );
}

/**
 * Phone → OTP gate. Sample code is always ۱۲۳۴۵.
 * Visual world: courtyard plaster + moss trust, concentric arcs as product metaphor.
 */
export default function LoginGate() {
  const { completeLogin } = useStore();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(() =>
    Array.from({ length: OTP_LEN }, () => ""),
  );
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [shake, setShake] = useState(false);
  const [fieldFocused, setFieldFocused] = useState(false);
  const phoneFieldId = useId();
  const otpGroupId = useId();
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const verifyLock = useRef(false);

  const otp = otpDigits.join("");
  const phoneReady = isValidIranMobile(normalizePhone(phoneInput));

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (step !== "otp") return;
    const frame = requestAnimationFrame(() => otpRefs.current[0]?.focus());
    return () => cancelAnimationFrame(frame);
  }, [step]);

  function flashError(message: string) {
    setError(message);
    setShake(true);
    window.setTimeout(() => setShake(false), 420);
  }

  function requestCode(nextPhone: string) {
    setSending(true);
    setError(null);
    window.setTimeout(() => {
      setPhone(nextPhone);
      setStep("otp");
      setOtpDigits(Array.from({ length: OTP_LEN }, () => ""));
      setResendIn(RESEND_SECONDS);
      setSending(false);
      verifyLock.current = false;
    }, 450);
  }

  function onSubmitPhone(e: FormEvent) {
    e.preventDefault();
    const normalized = normalizePhone(phoneInput);
    if (!isValidIranMobile(normalized)) {
      flashError("شماره را با ۰۹ شروع کن — ۱۱ رقم");
      return;
    }
    setPhoneInput(normalized);
    requestCode(normalized);
  }

  function verifyCode(code: string) {
    if (verifyLock.current) return;
    if (code.length !== OTP_LEN) {
      flashError("کد ۵ رقمی را کامل وارد کن");
      return;
    }
    verifyLock.current = true;
    setVerifying(true);
    setError(null);
    window.setTimeout(() => {
      if (code !== SAMPLE_OTP) {
        flashError(
          `کد نادرست است. برای دمو ${toPersianDigits(SAMPLE_OTP)} را بزن`,
        );
        setVerifying(false);
        verifyLock.current = false;
        setOtpDigits(Array.from({ length: OTP_LEN }, () => ""));
        requestAnimationFrame(() => otpRefs.current[0]?.focus());
        return;
      }
      completeLogin(phone);
      setVerifying(false);
    }, 400);
  }

  function onSubmitOtp(e: FormEvent) {
    e.preventDefault();
    verifyCode(toEnglishDigits(otp).replace(/\D/g, ""));
  }

  function setDigitAt(index: number, raw: string) {
    const digit = toEnglishDigits(raw).replace(/\D/g, "").slice(-1);
    setError(null);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      const joined = next.join("");
      if (joined.length === OTP_LEN && next.every(Boolean)) {
        window.setTimeout(() => verifyCode(joined), 40);
      }
      return next;
    });
    if (digit && index < OTP_LEN - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function onOtpKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (otpDigits[index]) {
        setOtpDigits((prev) => {
          const next = [...prev];
          next[index] = "";
          return next;
        });
        return;
      }
      if (index > 0) {
        e.preventDefault();
        setOtpDigits((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
        otpRefs.current[index - 1]?.focus();
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < OTP_LEN - 1) {
      e.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  }

  function onOtpPaste(raw: string) {
    const digits = toEnglishDigits(raw).replace(/\D/g, "").slice(0, OTP_LEN);
    if (!digits) return;
    const next = Array.from({ length: OTP_LEN }, (_, i) => digits[i] ?? "");
    setOtpDigits(next);
    setError(null);
    const focusAt = Math.min(digits.length, OTP_LEN - 1);
    otpRefs.current[focusAt]?.focus();
    if (digits.length === OTP_LEN) {
      window.setTimeout(() => verifyCode(digits), 40);
    }
  }

  return (
    <main
      className={`login-gate relative min-h-[100dvh] flex flex-col overflow-hidden ${
        step === "otp" ? "login-gate--otp" : ""
      } ${phoneReady ? "login-gate--ready" : ""}`}
    >
      <div className="login-gate-atmosphere" aria-hidden />

      <CircleSignature step={step} ready={phoneReady && step === "phone"} />

      <div className="relative z-10 flex flex-1 flex-col w-full max-w-[26rem] mx-auto px-5 sm:px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <header className="login-gate-brand text-center pb-1">
          <p className="login-gate-kicker">شبکه‌ی اعتمادمحور</p>
          <h1 className="login-gate-title">سیرکل</h1>
          <p className="login-gate-tagline">
            فقط حلقه‌ی خودت — نه غریبه، نه دیوار عمومی.
          </p>
        </header>

        <div
          key={step}
          className={`login-gate-panel flex-1 flex flex-col mt-5 ${
            shake ? "login-shake" : ""
          }`}
        >
          {step === "phone" ? (
            <form
              onSubmit={onSubmitPhone}
              className="flex flex-col flex-1 gap-6"
              noValidate
            >
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="login-gate-heading">
                    شماره موبایلت را وارد کن
                  </h2>
                  <p className="login-gate-sub">
                    کد یک‌بارمصرف می‌فرستیم — بدون رمز عبور.
                  </p>
                </div>

                <div>
                  <label htmlFor={phoneFieldId} className="login-gate-label">
                    شماره موبایل
                  </label>
                  <div
                    dir="ltr"
                    className={`login-gate-phone ${
                      error
                        ? "login-gate-phone--error"
                        : fieldFocused
                          ? "login-gate-phone--focus"
                          : ""
                    } ${phoneReady ? "login-gate-phone--ready" : ""}`}
                  >
                    <span className="login-gate-cc" aria-hidden>
                      +۹۸
                    </span>
                    <input
                      id={phoneFieldId}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      autoFocus
                      dir="ltr"
                      placeholder={toPersianDigits("0912 345 6789")}
                      value={
                        phoneInput
                          ? formatPhoneDisplay(normalizePhone(phoneInput))
                          : ""
                      }
                      onChange={(e) => {
                        setError(null);
                        setPhoneInput(normalizePhone(e.target.value));
                      }}
                      onFocus={() => setFieldFocused(true)}
                      onBlur={() => setFieldFocused(false)}
                      className="login-gate-phone-input"
                      aria-invalid={!!error}
                      aria-describedby={
                        error ? "login-error" : "login-phone-hint"
                      }
                    />
                    {phoneReady && (
                      <span className="login-gate-check" aria-hidden>
                        <svg
                          viewBox="0 0 16 16"
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p id="login-phone-hint" className="login-gate-hint">
                    مثال{" "}
                    <span className="nums font-medium" dir="ltr">
                      {toPersianDigits("0912 123 4567")}
                    </span>
                  </p>
                </div>

                {error && (
                  <p id="login-error" role="alert" className="login-gate-error">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending || !phoneReady}
                  aria-busy={sending}
                  className={`login-gate-cta ${phoneReady ? "login-gate-cta--live" : ""}`}
                >
                  {sending ? (
                    <>
                      <Spinner />
                      در حال ارسال…
                    </>
                  ) : (
                    "دریافت کد"
                  )}
                </button>
              </div>

              <ul className="login-gate-trust" aria-label="ویژگی‌های سیرکل">
                <li>فقط حلقه — نه غریبه</li>
                <li>مسیر اعتماد — سه سطح</li>
                <li>بدون دیوار عمومی</li>
              </ul>

              <p className="login-gate-foot mt-auto">
                ورود فقط با حلقه‌ای که خودت می‌سازی.
              </p>
            </form>
          ) : (
            <form
              onSubmit={onSubmitOtp}
              className="flex flex-col flex-1 gap-6"
              noValidate
            >
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="login-gate-heading">کد تأیید را وارد کن</h2>
                  <p className="login-gate-sub">
                    برای{" "}
                    <span className="login-gate-phone-emph nums" dir="ltr">
                      {formatPhoneDisplay(phone)}
                    </span>{" "}
                    فرستاده شد.
                  </p>
                </div>

                <p className="login-gate-demo">
                  دمو — کد ثابت:{" "}
                  <span className="nums tracking-[0.22em] font-extrabold" dir="ltr">
                    {toPersianDigits(SAMPLE_OTP)}
                  </span>
                </p>

                <div>
                  <label id={otpGroupId} className="login-gate-label text-center">
                    کد ۵ رقمی
                  </label>
                  <div
                    className="login-gate-otp"
                    dir="ltr"
                    role="group"
                    aria-labelledby={otpGroupId}
                    aria-describedby={error ? "login-error" : undefined}
                  >
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          otpRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete={i === 0 ? "one-time-code" : "off"}
                        maxLength={1}
                        value={digit ? toPersianDigits(digit) : ""}
                        disabled={verifying}
                        onChange={(e) => setDigitAt(i, e.target.value)}
                        onKeyDown={(e) => onOtpKeyDown(i, e)}
                        onPaste={(e) => {
                          e.preventDefault();
                          onOtpPaste(e.clipboardData.getData("text"));
                        }}
                        aria-label={`رقم ${toPersianDigits(i + 1)} از ${toPersianDigits(OTP_LEN)}`}
                        aria-invalid={!!error}
                        className={`login-gate-otp-cell ${
                          error
                            ? "login-gate-otp-cell--error"
                            : digit
                              ? "login-gate-otp-cell--filled"
                              : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {error && (
                  <p id="login-error" role="alert" className="login-gate-error">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={verifying || otp.length < OTP_LEN}
                  aria-busy={verifying}
                  className={`login-gate-cta ${
                    otp.length === OTP_LEN ? "login-gate-cta--live" : ""
                  }`}
                >
                  {verifying ? (
                    <>
                      <Spinner />
                      در حال بررسی…
                    </>
                  ) : (
                    "ورود به سیرکل"
                  )}
                </button>
              </div>

              <div className="login-gate-actions mt-auto">
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtpDigits(Array.from({ length: OTP_LEN }, () => ""));
                    setError(null);
                    verifyLock.current = false;
                  }}
                  className="login-gate-link"
                >
                  تغییر شماره
                </button>
                <button
                  type="button"
                  disabled={resendIn > 0 || sending}
                  aria-busy={sending}
                  onClick={() => requestCode(phone)}
                  className="login-gate-link login-gate-link--accent"
                >
                  {resendIn > 0
                    ? `ارسال دوباره (${toPersianDigits(resendIn)})`
                    : "ارسال دوباره کد"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

function CircleSignature({
  step,
  ready,
}: {
  step: "phone" | "otp";
  ready: boolean;
}) {
  return (
    <div
      className={`login-gate-rings pointer-events-none absolute inset-x-0 top-0 h-[52%] ${
        ready ? "login-gate-rings--ready" : ""
      }`}
      aria-hidden
    >
      <svg
        className="login-gate-rings-svg"
        viewBox="0 0 400 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="login-gate-ring login-gate-ring--a"
          cx="200"
          cy="150"
          r="138"
          pathLength="1"
        />
        <circle
          className={`login-gate-ring login-gate-ring--b ${
            step === "otp" ? "login-gate-ring--active" : ""
          }`}
          cx="200"
          cy="150"
          r="92"
          pathLength="1"
        />
        <circle className="login-gate-ring-dot" cx="200" cy="12" r="4" />
      </svg>
    </div>
  );
}
