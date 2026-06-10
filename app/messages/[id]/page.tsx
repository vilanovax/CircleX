"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import Avatar from "@/components/Avatar";
import { BackIcon } from "@/components/Icons";
import { relationLabels, levelShort } from "@/lib/labels";

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const peerId = String(params.id);
  const { getPerson, getThread, addMessage, markThreadRead } = useStore();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const peer = getPerson(peerId);
  const thread = getThread(peerId);

  // Mark incoming messages as read when the thread is opened.
  useEffect(() => {
    markThreadRead(peerId);
  }, [peerId, markThreadRead]);

  // Keep the latest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length]);

  if (!peer) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-sm text-zinc-400">کاربر پیدا نشد.</p>
      </main>
    );
  }

  function send() {
    const t = text.trim();
    if (!t) return;
    addMessage(peerId, t);
    setText("");
  }

  return (
    <main className="flex flex-col h-[100dvh]">
      {/* Conversation header */}
      <header className="shrink-0 bg-white/90 backdrop-blur border-b border-zinc-100">
        <div className="flex items-center gap-2 px-3 h-14">
          <button
            onClick={() => router.back()}
            aria-label="بازگشت"
            className="w-9 h-9 flex items-center justify-center text-zinc-600 active:text-zinc-900"
          >
            <BackIcon className="w-6 h-6" />
          </button>
          <Avatar emoji={peer.avatar} level={peer.level} size="sm" />
          <div className="min-w-0">
            <p className="font-bold text-zinc-900 leading-tight truncate">
              {peer.name}
            </p>
            <p className="text-[11px] text-zinc-400">
              {relationLabels[peer.relation]} · {levelShort[peer.level]}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-[#f4f4f7]">
        {thread.length === 0 ? (
          <div className="text-center text-zinc-400 text-sm pt-20">
            گفتگو را با {peer.name} شروع کنید.
          </div>
        ) : (
          thread.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.fromMe
                    ? "bg-brand-600 text-white rounded-bl-md"
                    : "bg-white text-zinc-800 shadow-card rounded-br-md"
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                <span
                  className={`block text-[10px] mt-1 ${
                    msg.fromMe ? "text-brand-100" : "text-zinc-400"
                  }`}
                >
                  {msg.postedAt}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 bg-white border-t border-zinc-100 p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="پیام بنویس…"
            className="field !py-2.5 resize-none max-h-28 flex-1"
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            aria-label="ارسال"
            className="shrink-0 w-11 h-11 rounded-full bg-brand-600 text-white flex items-center justify-center active:bg-brand-700 disabled:opacity-40"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </main>
  );
}

function SendIcon({ className }: { className?: string }) {
  // Arrow pointing right→ flipped for RTL send direction (points left).
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 4 3 11l6 2 2 6 9-15Z" />
      <path d="M9 13l4-4" />
    </svg>
  );
}
