"use client";

import { useState } from "react";
import { EyeOffIcon } from "@/components/Icons";
import { useToast } from "@/components/Toast";
import { lazyUi } from "@/lib/lazy-ui";
import { ApiError } from "@/lib/api";
import {
  hideConfirmPerson,
  hideListingCopy,
  hidePersonCopy,
} from "@/lib/hide-from-feed";
import { useStore } from "@/lib/store";

const HideFromFeedSheet = lazyUi(() => import("@/components/HideFromFeedSheet"));

export default function PersonHideFromFeedControl({
  personId,
  name,
  hidden,
}: {
  personId: string;
  name: string;
  hidden: boolean;
}) {
  const toggleHiddenPerson = useStore((s) => s.toggleHiddenPerson);
  const { show } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const copy = hidePersonCopy(name);
  const confirm = hideConfirmPerson(name);

  function apply(nextHidden: boolean) {
    return toggleHiddenPerson(personId)
      .then(() => show(nextHidden ? copy.toastOn : copy.toastOff))
      .catch((err) => {
        show(err instanceof ApiError ? err.message : hideListingCopy.fail);
        throw err;
      });
  }

  return (
    <>
      {hidden ? (
        <p className="mb-2 rounded-2xl bg-stone-100/80 px-3.5 py-2.5 text-[12px] leading-relaxed text-ink-muted dark:bg-zinc-800/70 dark:text-zinc-300">
          {copy.banner}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => {
          if (hidden) {
            void apply(false);
            return;
          }
          setConfirmOpen(true);
        }}
        onPointerEnter={() => {
          if (!hidden) void import("@/components/HideFromFeedSheet");
        }}
        className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-start transition-opacity active:opacity-80"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-ink-muted dark:bg-zinc-800 dark:text-zinc-400">
          <EyeOffIcon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold text-ink dark:text-zinc-100">
            {hidden ? copy.titleHidden : copy.title}
          </span>
          <span className="mt-0.5 block text-[11px] text-ink-muted">
            {hidden ? copy.hintHidden : copy.hint}
          </span>
        </span>
      </button>
      {confirmOpen ? (
        <HideFromFeedSheet
          kind="person"
          subject={name}
          title={confirm.title}
          body={confirm.body}
          confirmLabel={confirm.confirm}
          onClose={() => setConfirmOpen(false)}
          onConfirm={async () => {
            await apply(true);
            setConfirmOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
