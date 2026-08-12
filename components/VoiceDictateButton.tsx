"use client";

import { useEffect, useRef, useState } from "react";
import { MicIcon } from "@/components/Icons";

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getSpeechRecognition(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function VoiceDictateButton({
  onTranscript,
  onError,
  disabled,
}: {
  onTranscript: (chunk: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<SpeechRec | null>(null);

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()));
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  function toggle() {
    if (disabled) return;
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      onError?.("مرورگر شما دیکته صوتی را پشتیبانی نمی‌کند.");
      return;
    }

    if (listening && recRef.current) {
      recRef.current.stop();
      setListening(false);
      return;
    }

    const rec = new Ctor();
    rec.lang = "fa-IR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (ev) => {
      const results = Array.from(ev.results as ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>);
      const last = results[results.length - 1];
      if (!last) return;
      onTranscript(last[0].transcript, last.isFinal);
    };
    rec.onerror = (ev) => {
      setListening(false);
      if (ev.error === "not-allowed") {
        onError?.("دسترسی میکروفون داده نشد.");
      } else if (ev.error !== "aborted") {
        onError?.("دیکته صوتی متوقف شد.");
      }
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      onError?.("شروع دیکته ممکن نشد.");
      setListening(false);
    }
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? "توقف دیکته" : "دیکته صوتی"}
      className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-bold border transition-colors ${
        listening
          ? "bg-rose-600 text-white border-rose-600 animate-pulse"
          : "bg-[color:var(--circle-surface)] text-ink-muted border-stone-200/80 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300"
      }`}
    >
      <MicIcon className="w-3.5 h-3.5" />
      {listening ? "در حال شنیدن…" : "بگو"}
    </button>
  );
}
