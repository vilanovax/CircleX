"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { ApiError } from "@/lib/api";
import {
  CIRCLE_MEMBER_NAME,
  privateListingAvatar,
} from "@/lib/listing-privacy";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import Avatar from "@/components/Avatar";

export default function ListingThreadEntry() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = String(params.listingId);
  const ensureListing = useStore((s) => s.ensureListing);
  const getListing = useStore((s) => s.getListing);
  const addMessage = useStore((s) => s.addMessage);
  const messages = useStore((s) => s.messages);
  const { show } = useToast();
  const [text, setText] = useState(searchParams.get("draft") ?? "");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void ensureListing(listingId);
  }, [ensureListing, listingId]);

  const listing = getListing(listingId);
  const existing = messages.find((msg) => msg.threadListingId === listingId);

  useEffect(() => {
    if (!existing) return;
    router.replace(
      `/messages/${encodeURIComponent(existing.peerId)}?listing=${encodeURIComponent(listingId)}&scoped=1`,
    );
  }, [existing, listingId, router]);

  async function send() {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      const msg = await addMessage("", t, listingId, true);
      if (msg?.peerId) {
        router.replace(
          `/messages/${encodeURIComponent(msg.peerId)}?listing=${encodeURIComponent(listingId)}&scoped=1`,
        );
      }
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ارسال نشد");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] flex-col">
      <Header back fallbackHref={`/listing/${listingId}`}>
        <div className="flex min-h-9 min-w-0 items-center gap-2.5">
          <Avatar
            name={CIRCLE_MEMBER_NAME}
            src={privateListingAvatar(listingId)}
            size="sm"
            showLevel={false}
          />
          <div className="min-w-0">
            <p className="m-0 truncate text-[14px] font-extrabold text-ink dark:text-zinc-100">
              {listing?.title ?? "آگهی"}
            </p>
            <p className="m-0 mt-1 truncate text-[11px] text-ink-muted">
              گفتگو با یکی از اعضای سیرکل
            </p>
          </div>
        </div>
      </Header>
      <div className="flex-1 px-4 pt-6">
        <p className="text-[13px] text-ink-muted leading-relaxed">
          هویت آگهی‌دهنده برای تو پنهان است. اگر پیام بفرستی، او تو را با نام
          واقعی می‌بیند.
        </p>
      </div>
      <div className="border-t border-stone-200/70 dark:border-zinc-800 px-3 pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            className="field min-h-[2.75rem] flex-1 resize-none"
            placeholder="پیام…"
          />
          <button
            type="button"
            disabled={!text.trim() || sending}
            onClick={() => void send()}
            className="btn-primary !px-4 !py-2.5 disabled:opacity-50"
          >
            بفرست
          </button>
        </div>
      </div>
    </main>
  );
}
