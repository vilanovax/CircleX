"use client";

import { useId, useMemo, useState } from "react";
import Avatar from "@/components/Avatar";
import { CameraIcon } from "@/components/Icons";
import SheetShell from "@/components/SheetShell";
import {
  isAvatarImage,
  PICKER_AVATARS,
  withBasePath,
} from "@/lib/avatar";

function editAvatarChoices(current?: string): string[] {
  const list: string[] = [...PICKER_AVATARS];
  if (
    current &&
    isAvatarImage(current) &&
    !current.startsWith("data:") &&
    !list.includes(current)
  ) {
    list.unshift(current);
  }
  return list;
}

export default function EditProfileSheet({
  name: initialName,
  city: initialCity,
  avatar: initialAvatar,
  onClose,
  onSave,
}: {
  name: string;
  city: string;
  avatar?: string;
  onClose: () => void;
  onSave: (input: {
    name: string;
    city: string;
    avatar: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [city, setCity] = useState(initialCity);
  const [avatar, setAvatar] = useState(() =>
    initialAvatar && isAvatarImage(initialAvatar)
      ? initialAvatar
      : PICKER_AVATARS[0],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarGroupId = useId();
  const choices = useMemo(
    () => editAvatarChoices(initialAvatar),
    [initialAvatar],
  );
  const canSave = name.trim().length >= 2 && !busy;

  async function save() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("نام را حداقل با دو حرف بنویس");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave({ name: trimmed, city: city.trim(), avatar });
    } catch {
      setError("ذخیره نشد. دوباره امتحان کن.");
      setBusy(false);
    }
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="edit-profile-title"
      zClass="z-50"
      maxHeight="92dvh"
      footer={
        <div className="flex gap-2 pb-0.5">
          <button
            type="button"
            disabled={!canSave}
            onClick={() => void save()}
            className="btn-primary flex-1 !py-3.5 !font-bold active:scale-[0.98] disabled:opacity-40"
          >
            {busy ? "در حال ذخیره…" : "ذخیره"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="btn-ghost flex-1 !py-3.5 active:scale-[0.98]"
          >
            انصراف
          </button>
        </div>
      }
    >
      <h2
        id="edit-profile-title"
        className="font-extrabold text-[1.2rem] text-ink dark:text-zinc-50 tracking-tight"
      >
        ویرایش پروفایل
      </h2>
      <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed">
        نام و تصویر را حلقه‌ات می‌بیند — نه غریبه‌ها.
      </p>

      <div className="flex flex-col items-center mt-5 mb-1">
        <div className="relative">
          <div className="rounded-full ring-[3px] ring-brand-100 dark:ring-brand-500/30 shadow-md shadow-brand-600/10">
            <Avatar
              name={name.trim() || initialName}
              src={avatar}
              size="lg"
              showLevel={false}
            />
          </div>
          <span
            className="absolute -bottom-0.5 -start-0.5 w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-sm ring-2 ring-[color:var(--circle-surface)] dark:ring-zinc-900 pointer-events-none"
            aria-hidden
          >
            <CameraIcon className="w-4 h-4" />
          </span>
        </div>
      </div>

      <p
        id={avatarGroupId}
        className="text-[12px] font-bold text-ink dark:text-zinc-200 mt-4 mb-1"
      >
        تصویر
      </p>
      <p className="text-[11px] text-ink-muted mb-2.5 leading-snug">
        یکی را بزن تا عوض شود
      </p>
      <div
        role="radiogroup"
        aria-labelledby={avatarGroupId}
        className="grid grid-cols-5 gap-2.5"
      >
        {choices.map((src, i) => {
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
                loading="lazy"
                decoding="async"
              />
            </button>
          );
        })}
      </div>

      <label className="block text-[12px] font-bold mt-5 mb-1.5 text-ink dark:text-zinc-200">
        نام
      </label>
      <input
        value={name}
        onChange={(e) => {
          setError(null);
          setName(e.target.value);
        }}
        placeholder="نام تو"
        autoComplete="name"
        spellCheck={false}
        disabled={busy}
        className="field !min-h-12 !font-semibold"
        aria-invalid={!!error}
        aria-describedby={error ? "edit-profile-error" : undefined}
      />

      <label className="block text-[12px] font-bold mt-4 mb-1.5 text-ink dark:text-zinc-200">
        شهر
      </label>
      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="مثلاً تهران"
        autoComplete="address-level2"
        spellCheck={false}
        disabled={busy}
        className="field !min-h-12"
      />
      {error ? (
        <p
          id="edit-profile-error"
          role="alert"
          className="text-[12px] text-red-600 mt-2.5"
        >
          {error}
        </p>
      ) : null}
    </SheetShell>
  );
}
