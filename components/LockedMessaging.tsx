"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { lazyUi } from "@/lib/lazy-ui";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import Avatar from "./Avatar";
import {
  ChatIcon,
  ShieldCheckIcon,
  UserPlusIcon,
} from "./Icons";
import type { Person } from "@/lib/types";
import { toPersianDigits } from "@/lib/persian";
import { chatPeerSubtitle } from "@/lib/trust";

const IntroRequestSheet = lazyUi(() => import("./IntroRequestSheet"));
const AddToCircleSheet = lazyUi(() => import("./AddToCircleSheet"));

export default function LockedMessaging({ peer }: { peer: Person }) {
  const { addToCircle } = useStore();
  const { show } = useToast();
  const [showIntro, setShowIntro] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <>
      <div className="px-4 pt-4 pb-8 listing-detail-rise">
        {/* Peer identity */}
        <Link
          href={`/person/${peer.id}`}
          className="card flex items-center gap-3 p-3.5 active:bg-stone-50/80 dark:active:bg-zinc-800/60 transition-colors"
        >
          <Avatar name={peer.name} src={peer.avatar} size="lg" showLevel={false} />
          <div className="flex-1 min-w-0 text-right">
            <p className="font-extrabold text-[16px] text-ink dark:text-zinc-50 truncate">
              {peer.name}
            </p>
            <p className="text-[12px] text-ink-muted mt-1">
              {chatPeerSubtitle(peer)}
            </p>
            <p className="text-[11px] text-ink-faint mt-1 nums">
              {[
                peer.city,
                peer.deals > 0
                  ? `${toPersianDigits(peer.deals)} معامله`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ") || "پروفایل"}
            </p>
          </div>
          <span className="text-ink-faint text-sm shrink-0" aria-hidden>
            ‹
          </span>
        </Link>

        {/* Why locked */}
        <div className="card mt-3 overflow-hidden">
          <div className="px-3.5 pt-3.5 pb-3 flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <LockIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0 text-right">
              <p className="text-[13px] font-bold text-ink dark:text-zinc-100">
                پیام خصوصی قفل است
              </p>
              <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed">
                فقط با حلقه‌ات چت می‌کنی.{" "}
                <span className="font-semibold text-ink dark:text-zinc-200">
                  {peer.name}
                </span>{" "}
                هنوز توی حلقه‌ات نیست.
              </p>
            </div>
          </div>
          <div className="px-3.5 pb-3.5">
            <div className="rounded-xl bg-levelA/8 dark:bg-levelA/10 px-3 py-2.5 flex items-start gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-levelA shrink-0 mt-0.5" />
              <p className="text-[11px] text-levelA leading-relaxed text-right">
                بدون پیام از غریبه‌ها — اول باید مسیر ارتباط باز شود.
              </p>
            </div>
          </div>
        </div>

        {/* Paths to unlock */}
        <div className="mt-3">
          <p className="text-[12px] font-bold text-ink dark:text-zinc-200 mb-2 px-0.5">
            چطور پیام باز شود؟
          </p>
          <div className="space-y-2">
            <PathCard
              step="۱"
              title="درخواست معرفی"
              body={`از کسی در حلقه بخواه تو را به ${peer.name} وصل کند.`}
              icon={<ChatIcon className="w-4 h-4" />}
            />
            <PathCard
              step="۲"
              title="به حلقه‌ات اضافه کن"
              body="اگر خودت می‌شناسی‌اش، مستقیم به حلقه‌ات اضافه کن تا چت باز شود."
              icon={<UserPlusIcon className="w-4 h-4" />}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowIntro(true)}
            className="btn-primary w-full !py-3.5 shadow-lg shadow-brand-600/20"
          >
            درخواست معرفی
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="btn-ghost w-full !py-3.5"
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              <UserPlusIcon className="w-4 h-4" />
              به حلقه‌ات اضافه کن
            </span>
          </button>
          <div className="flex items-center justify-center gap-4 pt-1">
            <Link
              href={`/person/${peer.id}`}
              className="text-[12px] font-semibold text-brand-600 dark:text-brand-400"
            >
              پروفایل {peer.name}
            </Link>
            <span className="text-stone-300 dark:text-zinc-600" aria-hidden>
              ·
            </span>
            <Link
              href="/circle"
              className="text-[12px] font-semibold text-ink-muted dark:text-zinc-400"
            >
              حلقه‌ی من
            </Link>
          </div>
        </div>
      </div>

      {showIntro && (
        <IntroRequestSheet
          itemTitle={peer.name}
          itemKind="person"
          onClose={() => setShowIntro(false)}
        />
      )}

      {showAdd && (
        <AddToCircleSheet
          person={peer}
          onClose={() => setShowAdd(false)}
          onAdd={(input) => {
            addToCircle(peer.id, input);
            setShowAdd(false);
            show(`${peer.name} به حلقه‌ات اضافه شد ✓`);
          }}
        />
      )}
    </>
  );
}

function PathCard({
  step,
  title,
  body,
  icon,
}: {
  step: string;
  title: string;
  body: string;
  icon: ReactNode;
}) {
  return (
    <div className="card p-3 flex items-start gap-2.5">
      <span className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-zinc-800 text-[11px] font-extrabold text-ink-muted flex items-center justify-center shrink-0 nums">
        {step}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-ink dark:text-zinc-100 flex items-center gap-1.5">
          <span className="text-brand-600 shrink-0">{icon}</span>
          {title}
        </p>
        <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">
          {body}
        </p>
      </div>
    </div>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
