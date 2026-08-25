"use client";

import { useEffect, useRef, useState } from "react";
import { CameraIcon } from "@/components/Icons";
import { uploadUserPhoto } from "@/lib/media-image";
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
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const pendingFileRef = useRef<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
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
    const file = pendingFileRef.current;
    if ((!t && !file) || sending) return;
    setSending(true);
    try {
      const imageUrl = file ? await uploadUserPhoto(file) : undefined;
      const msg = await addMessage("", t, listingId, true, imageUrl);
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

  function clearPendingPhoto() {
    if (pendingPhoto) URL.revokeObjectURL(pendingPhoto);
    pendingFileRef.current = null;
    setPendingPhoto(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  function onPickPhoto(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (pendingPhoto) URL.revokeObjectURL(pendingPhoto);
    pendingFileRef.current = file;
    setPendingPhoto(URL.createObjectURL(file));
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
        {pendingPhoto ? (
          <div className="mb-2 flex items-center gap-2">
            <img
              src={pendingPhoto}
              alt=""
              className="h-16 w-16 rounded-xl object-cover"
            />
            <button
              type="button"
              onClick={clearPendingPhoto}
              className="text-[12px] font-bold text-ink-muted"
            >
              حذف عکس
            </button>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickPhoto(e.target.files)}
          />
          <button
            type="button"
            disabled={sending}
            onClick={() => photoInputRef.current?.click()}
            aria-label="افزودن عکس"
            className="shrink-0 flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 text-ink-muted dark:border-zinc-700"
          >
            <CameraIcon className="h-5 w-5" />
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            className="field min-h-[2.75rem] flex-1 resize-none"
            placeholder="پیام…"
          />
          <button
            type="button"
            disabled={(!text.trim() && !pendingPhoto) || sending}
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
