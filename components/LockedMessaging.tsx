"use client";

import Link from "next/link";
import { useState } from "react";
import { lazyUi } from "@/lib/lazy-ui";
import Avatar from "./Avatar";
import type { Person } from "@/lib/types";
import { relationLabels } from "@/lib/labels";

const IntroRequestSheet = lazyUi(() => import("./IntroRequestSheet"));

export default function LockedMessaging({ peer }: { peer: Person }) {
  const [showIntro, setShowIntro] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center text-center px-8 py-16">
        <Avatar name={peer.name} level={peer.level} size="lg" />
        <p className="font-bold text-ink dark:text-zinc-100 mt-4">{peer.name}</p>
        <p className="text-xs text-ink-faint mt-1">{relationLabels[peer.relation]}</p>

        <div className="w-14 h-14 rounded-2xl bg-stone-100/80 dark:bg-zinc-800 flex items-center justify-center text-2xl mt-6 mb-3 text-ink-muted">
          🔒
        </div>
        <p className="text-sm text-ink dark:text-zinc-200 leading-relaxed max-w-xs">
          پیام مستقیم فقط با اعضای حلقه‌ی شما ممکن است. {peer.name} هنوز در حلقه‌ات نیست.
        </p>
        <p className="text-xs text-ink-faint mt-3 leading-relaxed max-w-xs">
          از کسی در حلقه بخواه تو را به {peer.name} معرفی کند.
        </p>

        <button type="button" onClick={() => setShowIntro(true)} className="btn-primary mt-6 px-8">
          درخواست معرفی
        </button>
        <Link href="/circle" className="text-xs text-brand-600 font-medium mt-4">
          مدیریت حلقه‌ی من ›
        </Link>
      </div>

      {showIntro && (
        <IntroRequestSheet
          itemTitle={peer.name}
          itemKind="person"
          onClose={() => setShowIntro(false)}
        />
      )}
    </>
  );
}
