"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getActivationState,
  isActivationDismissed,
  isActivationListingSkipped,
  markActivationDismissed,
  markActivationListingSkipped,
  type ActivationState,
  type ActivationStep,
} from "@/lib/activation";
import { activeCircleCount } from "@/lib/circle-member";
import {
  effectiveInviteStatus,
  rosterWaveComplete,
} from "@/lib/invite";
import { toPersianDigits } from "@/lib/persian";
import { useStore } from "@/lib/store";
import { CheckIcon } from "@/components/Icons";

type Props = {
  /** Open invite sheet (empty-home cold path). */
  onInvite?: () => void;
  /** When false, only the progress list shows (parent owns the primary CTA). */
  showActions?: boolean;
  /** Hide soft skip — e.g. when a stronger CTA already sits below. */
  hideListingSkip?: boolean;
  className?: string;
};

/**
 * Compact 3-step activation strip. Progress is derived from roster + listings.
 */
export default function ActivationPath({
  onInvite,
  showActions = true,
  hideListingSkip = false,
  className = "",
}: Props) {
  const profileCompletedAt = useStore((s) => s.profileCompletedAt);
  const people = useStore((s) => s.people);
  const listings = useStore((s) => s.listings);
  const invites = useStore((s) => s.invites);
  const addedYou = useStore((s) => s.addedYou);
  const circleReady = useStore((s) => s.circleReady);

  const [dismissed, setDismissed] = useState(false);
  const [listingSkipped, setListingSkipped] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDismissed(isActivationDismissed());
    setListingSkipped(isActivationListingSkipped());
  }, []);

  const circleCount = activeCircleCount(people);
  const listingCount = listings.filter(
    (l) => l.sellerId === "me" && l.dealStatus !== "inactive",
  ).length;
  const hasPendingInvite = invites.some(
    (inv) =>
      effectiveInviteStatus(inv) === "pending" && !rosterWaveComplete(inv),
  );

  const state = useMemo(
    () =>
      getActivationState({
        profileDone: Boolean(profileCompletedAt),
        circleCount,
        listingCount,
        hasPendingInvite,
        addedYouCount: addedYou.length,
        dismissed,
        listingSkipped,
      }),
    [
      profileCompletedAt,
      circleCount,
      listingCount,
      hasPendingInvite,
      addedYou.length,
      dismissed,
      listingSkipped,
    ],
  );

  useEffect(() => {
    if (!mounted || !state.complete || dismissed) return;
    if (listingCount > 0 && circleCount > 0) {
      markActivationDismissed();
      setDismissed(true);
    }
  }, [mounted, state.complete, dismissed, listingCount, circleCount]);

  const skipListing = useCallback(() => {
    markActivationListingSkipped();
    setListingSkipped(true);
    setDismissed(true);
  }, []);

  if (!mounted || !circleReady || !state.visible) return null;

  return (
    <section
      className={`rounded-2xl border border-stone-200/80 bg-[color:var(--circle-surface)] px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-900/70 ${className}`}
      aria-label="مسیر راه‌اندازی حلقه"
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[12px] font-bold text-ink dark:text-zinc-100">
          قدم {toPersianDigits(Math.min(state.doneCount + 1, state.total))} از{" "}
          {toPersianDigits(state.total)}
        </p>
        <p className="text-[11px] text-ink-muted dark:text-zinc-500 nums">
          {toPersianDigits(state.doneCount)} انجام‌شده
        </p>
      </div>
      <p className="mt-0.5 text-[12px] text-ink-muted dark:text-zinc-400 leading-snug">
        {state.headline}
      </p>

      <ol className="mt-2.5 space-y-1.5">
        {state.steps.map((step) => (
          <StepRow key={step.id} step={step} />
        ))}
      </ol>

      {showActions ? (
        <StepActions
          state={state}
          onInvite={onInvite}
          hideListingSkip={hideListingSkip}
          onSkipListing={skipListing}
        />
      ) : null}
    </section>
  );
}

function StepRow({ step }: { step: ActivationStep }) {
  const active = step.status === "current" || step.status === "waiting";
  const done = step.status === "done";

  return (
    <li
      className={`flex items-start gap-2.5 rounded-xl px-2 py-1.5 ${
        active
          ? "bg-brand-50/90 dark:bg-brand-500/10"
          : done
            ? "opacity-80"
            : "opacity-55"
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
          done
            ? "bg-brand-600 text-white"
            : active
              ? "border-2 border-brand-600 text-brand-700 dark:text-brand-300"
              : "border border-stone-300 text-ink-faint dark:border-zinc-600"
        }`}
        aria-hidden
      >
        {done ? (
          <CheckIcon className="h-3 w-3" />
        ) : step.status === "waiting" ? (
          "…"
        ) : active ? (
          <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
        ) : null}
      </span>
      <span className="min-w-0 pt-px">
        <span
          className={`block text-[13px] leading-snug ${
            active
              ? "font-bold text-ink dark:text-zinc-50"
              : "font-semibold text-ink dark:text-zinc-200"
          }`}
        >
          {step.title}
        </span>
        <span className="mt-0.5 block text-[11px] text-ink-muted dark:text-zinc-400 leading-snug">
          {step.detail}
        </span>
      </span>
    </li>
  );
}

function StepActions({
  state,
  onInvite,
  hideListingSkip,
  onSkipListing,
}: {
  state: ActivationState;
  onInvite?: () => void;
  hideListingSkip: boolean;
  onSkipListing: () => void;
}) {
  if (state.currentId === "first_member" && state.path === "invitee") {
    return (
      <Link
        href="/circle"
        className="btn-primary mt-3 w-full min-h-10 inline-flex items-center justify-center text-[13px] font-bold"
      >
        جا گذاشتن در حلقه
      </Link>
    );
  }

  if (state.currentId === "first_member" && state.path === "cold") {
    if (state.steps.find((s) => s.id === "first_member")?.status === "waiting") {
      return (
        <div className="mt-3 flex flex-col gap-1.5">
          <Link
            href="/circle"
            className="text-center text-[13px] font-semibold text-brand-700 dark:text-brand-400 py-1"
          >
            دیدن دعوت‌های در انتظار
          </Link>
          {onInvite ? (
            <button
              type="button"
              onClick={onInvite}
              className="text-center text-[12px] font-semibold text-ink-muted dark:text-zinc-400 py-1"
            >
              دعوت یک نفر دیگر
            </button>
          ) : null}
        </div>
      );
    }

    if (onInvite) {
      return (
        <button
          type="button"
          onClick={onInvite}
          className="btn-primary mt-3 w-full min-h-10 text-[13px] font-bold"
        >
          دعوت اولین نفر
        </button>
      );
    }

    return (
      <Link
        href="/?invite=1"
        className="btn-primary mt-3 w-full min-h-10 inline-flex items-center justify-center text-[13px] font-bold"
      >
        دعوت اولین نفر
      </Link>
    );
  }

  if (state.currentId === "first_listing") {
    return (
      <div className="mt-3 flex flex-col gap-1.5">
        <Link
          href="/new"
          className="btn-primary w-full min-h-10 inline-flex items-center justify-center text-[13px] font-bold"
        >
          ثبت اولین آگهی
        </Link>
        {!hideListingSkip ? (
          <button
            type="button"
            onClick={onSkipListing}
            className="text-center text-[12px] font-semibold text-ink-muted dark:text-zinc-400 py-1"
          >
            بعداً
          </button>
        ) : null}
      </div>
    );
  }

  return null;
}
