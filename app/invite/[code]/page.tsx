"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import LoginGate from "@/components/LoginGate";
import PlaceInviterSheet from "@/components/PlaceInviterSheet";
import { isActiveCircleMember } from "@/lib/circle-member";
import {
  PHONE_PRIVACY_LINE,
  clearPendingInviteCode,
  copyText,
  inviteUrl,
  peekPendingInviteCode,
  resolveInviteView,
  stashPendingInviteCode,
  type InviteViewKind,
} from "@/lib/invite";
import { useStore } from "@/lib/store";
import type { Person } from "@/lib/types";

const ERROR_COPY: Record<
  Exclude<InviteViewKind, "pending" | "own">,
  { title: string; body: string }
> = {
  invalid: {
    title: "این دعوت معتبر نیست",
    body: "لینک را دوباره از دعوت‌کننده بگیر.",
  },
  expired: {
    title: "این دعوت منقضی شده",
    body: "از دعوت‌کننده بخواه لینک تازه‌ای بسازد.",
  },
  revoked: {
    title: "این دعوت لغو شده",
    body: "دعوت‌کننده این لینک را باطل کرده است.",
  },
  accepted: {
    title: "این دعوت قبلاً استفاده شده",
    body: "با همین لینک نمی‌شود دوباره پیوست.",
  },
  already: {
    title: "تو از قبل در این حلقه هستی",
    body: "نیازی به پذیرش دوباره نیست.",
  },
};

export default function InviteLandingPage() {
  const params = useParams();
  const code = String(params.code ?? "");
  const router = useRouter();
  const {
    me,
    people,
    sessionPhone,
    profileCompletedAt,
    hydrated,
    getInvite,
    acceptInvite,
    completeOnboarding,
    placePersonInMyCircle,
    getPerson,
  } = useStore();

  const [showLogin, setShowLogin] = useState(false);
  const [placeTarget, setPlaceTarget] = useState<Person | null>(null);
  const acceptedOnce = useRef(false);

  const invite = getInvite(code);
  const resumeAccept =
    peekPendingInviteCode()?.toLowerCase() === code.toLowerCase();

  const alreadyInCircle = useMemo(() => {
    if (!invite?.invitedPhone) return false;
    return people.some(
      (p) =>
        isActiveCircleMember(p) &&
        p.phoneNormalized === invite.invitedPhone &&
        p.id !== invite.personId,
    );
  }, [invite, people]);

  const kind = resolveInviteView(invite, {
    loggedIn: Boolean(sessionPhone),
    isInviter: invite?.inviterUserId === "me",
    resumeAccept,
    alreadyInCircle,
  });

  useEffect(() => {
    if (kind === "pending" && !sessionPhone) {
      stashPendingInviteCode(code);
    }
  }, [kind, sessionPhone, code]);

  useEffect(() => {
    if (!hydrated || !sessionPhone || !profileCompletedAt) return;
    if (kind !== "pending" || !invite) return;
    if (acceptedOnce.current) return;
    acceptedOnce.current = true;
    const result = acceptInvite(code);
    clearPendingInviteCode();
    completeOnboarding();
    if (!result || result.inviterUserId === "me") {
      router.replace("/circle");
      return;
    }
    const inviter = getPerson(result.inviterUserId);
    if (inviter) setPlaceTarget(inviter);
    else router.replace("/circle");
  }, [
    hydrated,
    sessionPhone,
    profileCompletedAt,
    kind,
    invite,
    code,
    acceptInvite,
    completeOnboarding,
    getPerson,
    router,
  ]);

  if (!hydrated) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-[12px] text-ink-faint">در حال آماده‌سازی…</p>
      </main>
    );
  }

  if (!sessionPhone && showLogin) {
    return <LoginGate inviteFrom={{ name: me.name }} />;
  }

  if (kind === "own" && invite) {
    return (
      <InviteFrame>
        <Avatar name={me.name} src={me.avatar} size="lg" showLevel={false} />
        <h1 className="mt-4 text-lg font-extrabold text-ink dark:text-zinc-50">
          این لینک دعوت خودت است
        </h1>
        <p
          dir="ltr"
          className="mt-3 w-full rounded-xl bg-stone-50 dark:bg-zinc-800 px-3 py-2.5 text-[12px] break-all text-left"
        >
          {inviteUrl(invite.code)}
        </p>
        <button
          type="button"
          className="btn-primary w-full mt-4"
          onClick={async () => {
            const ok = await copyText(inviteUrl(invite.code));
            if (!ok) return;
          }}
        >
          کپی لینک
        </button>
        <button
          type="button"
          className="btn-ghost w-full mt-2"
          onClick={() => router.push("/circle")}
        >
          رفتن به حلقه
        </button>
      </InviteFrame>
    );
  }

  if (kind !== "pending") {
    const copy =
      kind === "own"
        ? ERROR_COPY.invalid
        : (ERROR_COPY[kind] ?? ERROR_COPY.invalid);
    return (
      <InviteFrame>
        <h1 className="text-lg font-extrabold text-ink dark:text-zinc-50">
          {copy.title}
        </h1>
        <p className="text-sm text-ink-muted mt-2 leading-relaxed">{copy.body}</p>
        <button
          type="button"
          className="btn-primary w-full mt-5"
          onClick={() =>
            sessionPhone ? router.push("/") : setShowLogin(true)
          }
        >
          {sessionPhone ? "خانه" : "ورود"}
        </button>
      </InviteFrame>
    );
  }

  return (
    <>
      <InviteFrame>
        <Avatar name={me.name} src={me.avatar} size="lg" showLevel={false} />
        <h1 className="mt-4 text-lg font-extrabold text-ink dark:text-zinc-50 leading-snug">
          {me.name} دعوتت کرده به حلقه‌اش بپیوندی.
        </h1>
        <p className="text-sm text-ink-muted mt-2.5 leading-relaxed">
          اینجا فقط کسانی را می‌بینی که از مسیر آدم‌های مورد اعتمادت به تو
          می‌رسند.
        </p>
        {!sessionPhone ? (
          <button
            type="button"
            className="btn-primary w-full mt-5"
            onClick={() => {
              stashPendingInviteCode(code);
              setShowLogin(true);
            }}
          >
            ادامه با شماره موبایل
          </button>
        ) : !profileCompletedAt ? (
          <p className="text-sm text-ink-muted mt-5">اول خودت را معرفی کن…</p>
        ) : (
          <p className="text-sm text-ink-muted mt-5">در حال پیوستن…</p>
        )}
        <p className="text-[12px] text-ink-faint mt-4 leading-relaxed">
          {PHONE_PRIVACY_LINE}
        </p>
      </InviteFrame>
      {placeTarget && (
        <PlaceInviterSheet
          person={placeTarget}
          onClose={() => {
            setPlaceTarget(null);
            router.replace("/circle");
          }}
          onPlace={(input) => {
            placePersonInMyCircle(placeTarget.id, input);
            setPlaceTarget(null);
            router.replace("/circle");
          }}
        />
      )}
    </>
  );
}

function InviteFrame({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-[26rem] card p-6 text-center">{children}</div>
    </main>
  );
}
