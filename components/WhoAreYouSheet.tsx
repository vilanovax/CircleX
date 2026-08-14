"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import SheetShell from "@/components/SheetShell";
import Avatar from "@/components/Avatar";
import { CameraIcon } from "@/components/Icons";
import { AVATAR_IMAGES } from "@/lib/avatar";
import { peekPendingInviteCode } from "@/lib/invite";
import { processListingPhoto } from "@/lib/listing-image";
import { useStore } from "@/lib/store";

function poolAvatar(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % AVATAR_IMAGES.length;
  }
  return AVATAR_IMAGES[hash] ?? AVATAR_IMAGES[0];
}

/**
 * First identity sheet after OTP. Cannot be dismissed. If a pending invite
 * code is stashed, resume that invite instead of dumping to home.
 */
export default function WhoAreYouSheet() {
  const router = useRouter();
  const { me, completeProfile } = useStore();
  const [name, setName] = useState(me.name === "من" ? "" : me.name);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const ready = name.trim().length >= 2;

  function finish(nextAvatar?: string) {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("نام را حداقل با دو حرف بنویس");
      return;
    }
    completeProfile({
      name: trimmed,
      avatar: nextAvatar ?? avatar ?? poolAvatar(trimmed),
    });
    const code = peekPendingInviteCode();
    if (code) router.replace(`/invite/${code}`);
  }

  async function onPickFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await processListingPhoto(file);
      setAvatar(dataUrl);
    } catch {
      setError("خواندن عکس ممکن نشد.");
    } finally {
      setBusy(false);
    }
  }

  const previewName = name.trim() || "تو";
  const previewSrc = avatar ?? undefined;

  if (!mounted) return null;

  return createPortal(
    <SheetShell
      onClose={() => {}}
      closeOnBackdrop={false}
      labelledBy="who-are-you-title"
      zClass="z-[60]"
      backdropClassName="bg-ink/55 backdrop-blur-[6px]"
      onEscape={() => true}
      footer={
        <div className="flex flex-col gap-2 pb-1">
          <button
            type="button"
            disabled={!ready || busy}
            onClick={() => finish()}
            className="btn-primary w-full min-h-12 !py-3.5 text-base"
          >
            ادامه
          </button>
          <button
            type="button"
            disabled={!ready || busy}
            onClick={() => finish(poolAvatar(name.trim()))}
            className="min-h-11 text-sm font-semibold text-ink-muted dark:text-zinc-400"
          >
            فعلاً بدون عکس ادامه می‌دهم
          </button>
        </div>
      }
    >
      <div className="pt-1 pb-2 text-center">
        <h2
          id="who-are-you-title"
          className="text-[1.25rem] font-extrabold text-ink dark:text-zinc-50"
        >
          خودت را معرفی کن
        </h2>
        <p className="text-sm text-ink-muted dark:text-zinc-300 leading-relaxed mt-2 px-1">
          این نام را افرادی که با تو ارتباط دارند می‌بینند.
        </p>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="relative mx-auto mt-5 block"
          aria-label="انتخاب عکس"
        >
          <Avatar name={previewName} src={previewSrc} size="lg" showLevel={false} />
          <span className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center ring-2 ring-[color:var(--circle-surface)]">
            <CameraIcon className="w-4 h-4" />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            void onPickFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <p className="text-[12px] text-ink-faint mt-2">عکس اختیاری است</p>

        <label className="block text-start text-sm font-medium mt-5 mb-1 text-ink dark:text-zinc-200">
          نام
        </label>
        <input
          value={name}
          onChange={(e) => {
            setError(null);
            setName(e.target.value);
          }}
          placeholder="مثلاً آرش"
          autoComplete="name"
          className="field text-start"
          aria-invalid={!!error}
        />
        {error && (
          <p role="alert" className="text-[12px] text-red-600 mt-2 text-start">
            {error}
          </p>
        )}
      </div>
    </SheetShell>,
    document.body,
  );
}
