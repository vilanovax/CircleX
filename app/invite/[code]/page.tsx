"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import LoginGate from "@/components/LoginGate";
import PlaceInviterSheet from "@/components/PlaceInviterSheet";
import { api, ApiError } from "@/lib/api";
import {
  PHONE_PRIVACY_LINE,
  clearPendingInviteCode,
  copyText,
  inviteUrl,
  peekPendingInviteCode,
  resolvePublicInviteView,
  stashPendingInviteCode,
  type InviteViewKind,
} from "@/lib/invite";
import { useStore } from "@/lib/store";
import type { Person, PublicInvite } from "@/lib/types";

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
    sessionPhone,
    profileCompletedAt,
    hydrated,
    acceptInvite,
    completeOnboarding,
    placePersonInMyCircle,
  } = useStore();

  const [publicInvite, setPublicInvite] = useState<PublicInvite | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [placeTarget, setPlaceTarget] = useState<Person | null>(null);
  const [acceptKind, setAcceptKind] = useState<InviteViewKind | null>(null);
  const acceptedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!code) {
        setLoaded(true);
        return;
      }
      try {
        const pub = await api<PublicInvite>(
          `/api/invites/${encodeURIComponent(code)}`,
        );
        if (cancelled) return;
        setPublicInvite(pub);
      } catch {
        if (cancelled) return;
        setPublicInvite(null);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const resumeAccept =
    peekPendingInviteCode()?.toLowerCase() === code.toLowerCase();

  const kind =
    acceptKind ??
    resolvePublicInviteView(publicInvite, {
      loggedIn: Boolean(sessionPhone),
      resumeAccept,
    });

  useEffect(() => {
    if (
      publicInvite &&
      publicInvite.status === "pending" &&
      !publicInvite.isOwn &&
      !sessionPhone
    ) {
      stashPendingInviteCode(code, publicInvite.inviter.name);
    }
  }, [publicInvite, sessionPhone, code]);

  useEffect(() => {
    if (!hydrated || !loaded || !sessionPhone || !profileCompletedAt) return;
    if (kind !== "pending" || !publicInvite) return;
    if (acceptedOnce.current) return;
    acceptedOnce.current = true;
    void (async () => {
      try {
        const result = await acceptInvite(code);
        clearPendingInviteCode();
        completeOnboarding();
        if (!result) {
          setAcceptKind("own");
          return;
        }
        setPlaceTarget(result.inviter);
      } catch (err) {
        clearPendingInviteCode();
        const codeName = err instanceof ApiError ? err.code : undefined;
        if (codeName === "own") setAcceptKind("own");
        else if (codeName === "expired") setAcceptKind("expired");
        else if (codeName === "revoked") setAcceptKind("revoked");
        else if (codeName === "accepted") setAcceptKind("accepted");
        else if (codeName === "already") setAcceptKind("already");
        else setAcceptKind("invalid");
      }
    })();
  }, [
    hydrated,
    loaded,
    sessionPhone,
    profileCompletedAt,
    kind,
    publicInvite,
    code,
    acceptInvite,
    completeOnboarding,
  ]);

  if (!hydrated || !loaded) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-[12px] text-ink-faint">در حال آماده‌سازی…</p>
      </main>
    );
  }

  if (!sessionPhone && showLogin) {
    return (
      <LoginGate
        inviteFrom={
          publicInvite ? { name: publicInvite.inviter.name } : null
        }
      />
    );
  }

  if (kind === "own" && publicInvite) {
    return (
      <InviteFrame>
        <Avatar
          name={publicInvite.inviter.name}
          src={publicInvite.inviter.avatar}
          size="lg"
          showLevel={false}
        />
        <h1 className="mt-4 text-lg font-extrabold text-ink dark:text-zinc-50">
          این لینک دعوت خودت است
        </h1>
        <p
          dir="ltr"
          className="mt-3 w-full rounded-xl bg-stone-50 dark:bg-zinc-800 px-3 py-2.5 text-[12px] break-all text-left"
        >
          {inviteUrl(publicInvite.code)}
        </p>
        <button
          type="button"
          className="btn-primary w-full mt-4"
          onClick={async () => {
            const ok = await copyText(inviteUrl(publicInvite.code));
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

  const inviterName = publicInvite?.inviter.name ?? "یک آشنا";
  const inviterAvatar = publicInvite?.inviter.avatar;

  return (
    <>
      <InviteFrame>
        <Avatar
          name={inviterName}
          src={inviterAvatar}
          size="lg"
          showLevel={false}
        />
        <h1 className="mt-4 text-lg font-extrabold text-ink dark:text-zinc-50 leading-snug">
          {inviterName} دعوتت کرده به حلقه‌اش بپیوندی.
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
              if (publicInvite) {
                stashPendingInviteCode(code, publicInvite.inviter.name);
              }
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
            void placePersonInMyCircle(placeTarget.id, input).then(() => {
              setPlaceTarget(null);
              router.replace("/circle");
            });
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
