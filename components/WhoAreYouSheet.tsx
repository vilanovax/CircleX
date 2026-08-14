"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import SheetShell from "@/components/SheetShell";
import {
  PICKER_AVATARS,
  pickPickerAvatar,
  withBasePath,
} from "@/lib/avatar";
import { peekPendingInviteCode } from "@/lib/invite";
import { useStore } from "@/lib/store";

/**
 * First identity sheet after OTP. Cannot be dismissed. If a pending invite
 * code is stashed, resume that invite instead of dumping to home.
 */
export default function WhoAreYouSheet() {
  const router = useRouter();
  const me = useStore((s) => s.me);
  const completeProfile = useStore((s) => s.completeProfile);
  const nameId = useId();
  const avatarGroupId = useId();

  const [name, setName] = useState(() => me.name.trim());
  const [avatar, setAvatar] = useState(
    () => pickPickerAvatar(me.phoneNormalized || me.phone || "circle"),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [nameEl, setNameEl] = useState<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !nameEl) return;
    const frame = requestAnimationFrame(() => nameEl.focus());
    return () => cancelAnimationFrame(frame);
  }, [mounted, nameEl]);

  const ready = name.trim().length >= 2;
  const pendingInvite = Boolean(peekPendingInviteCode());

  async function finish() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("نام را حداقل با دو حرف بنویس");
      nameEl?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await completeProfile({
        name: trimmed,
        avatar,
      });
      const code = peekPendingInviteCode();
      if (code) router.replace(`/invite/${code}`);
    } catch {
      setError("ذخیره نام ممکن نشد. دوباره امتحان کن.");
      nameEl?.focus();
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void finish();
  }

  if (!mounted) return null;

  return createPortal(
    <SheetShell
      onClose={() => {}}
      closeOnBackdrop={false}
      labelledBy="who-are-you-title"
      zClass="z-[60]"
      backdropClassName="bg-ink/55 backdrop-blur-[6px]"
      onEscape={() => true}
      autoFocus={false}
      showHandle={false}
      footer={
        <button
          type="submit"
          form="who-are-you-form"
          disabled={!ready || busy}
          className="btn-primary w-full min-h-12 !py-3.5 text-base active:scale-[0.98]"
        >
          {busy ? "در حال ذخیره…" : pendingInvite ? "ادامه و پیوستن" : "ادامه"}
        </button>
      }
    >
      <form id="who-are-you-form" onSubmit={onSubmit} className="pt-2 pb-1">
        <h2
          id="who-are-you-title"
          className="text-[1.35rem] font-extrabold text-ink dark:text-zinc-50 leading-snug"
        >
          خودت را معرفی کن
        </h2>
        <p className="text-[13px] text-ink-muted dark:text-zinc-400 leading-relaxed mt-1.5">
          این نام را حلقه‌ات می‌بیند — نه غریبه‌ها.
        </p>

        <label
          htmlFor={nameId}
          className="block text-start text-[13px] font-semibold mt-6 mb-1.5 text-ink dark:text-zinc-200"
        >
          نام
        </label>
        <input
          id={nameId}
          ref={setNameEl}
          value={name}
          onChange={(e) => {
            setError(null);
            setName(e.target.value);
          }}
          placeholder="مثلاً سارا"
          autoComplete="name"
          autoCapitalize="words"
          spellCheck={false}
          enterKeyHint="done"
          name="given-name"
          disabled={busy}
          className="field text-start text-[1.05rem] min-h-12 font-semibold"
          aria-invalid={!!error}
          aria-describedby={error ? "who-are-you-error" : undefined}
        />
        {error && (
          <p
            id="who-are-you-error"
            role="alert"
            className="text-[12px] text-red-600 mt-2 text-start"
          >
            {error}
          </p>
        )}

        <p
          id={avatarGroupId}
          className="text-start text-[13px] font-semibold mt-6 mb-1 text-ink dark:text-zinc-200"
        >
          تصویر
        </p>
        <p className="text-start text-[11px] text-ink-muted mb-3 leading-snug">
          یکی را بزن — یکی از قبل برایت انتخاب شده
        </p>
        <div
          role="radiogroup"
          aria-labelledby={avatarGroupId}
          className="grid grid-cols-5 gap-2.5"
        >
          {PICKER_AVATARS.map((src, i) => {
            const selected = avatar === src;
            return (
              <button
                key={src}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`تصویر ${i + 1}`}
                disabled={busy}
                onClick={() => setAvatar(src)}
                className={`relative aspect-square rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 transition-transform active:scale-95 ${
                  selected
                    ? "ring-[2.5px] ring-brand-600 ring-offset-2 ring-offset-[color:var(--circle-surface)] dark:ring-offset-zinc-900"
                    : "ring-1 ring-black/10 dark:ring-white/10"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={withBasePath(src)}
                  alt=""
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </button>
            );
          })}
        </div>
      </form>
    </SheetShell>,
    document.body,
  );
}
