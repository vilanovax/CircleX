"use client";

import { useEffect, useRef, useState } from "react";
import { MicIcon } from "@/components/Icons";

type SpeechResultList = {
  length: number;
  [index: number]: { 0: { transcript: string }; isFinal: boolean };
};

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: { resultIndex: number; results: SpeechResultList }) => void) | null;
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
  onFinal,
  onInterim,
  onListeningChange,
  onError,
  disabled,
}: {
  /** Appended when a phrase is finalized. */
  onFinal: (phrase: string) => void;
  /** Live partial text while speaking (empty when cleared). */
  onInterim?: (partial: string) => void;
  onListeningChange?: (listening: boolean) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<SpeechRec | null>(null);
  const wantListenRef = useRef(false);

  function setListen(v: boolean) {
    setListening(v);
    onListeningChange?.(v);
  }

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()));
    return () => {
      wantListenRef.current = false;
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  function stop() {
    wantListenRef.current = false;
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    recRef.current = null;
    onInterim?.("");
    setListen(false);
  }

  function start() {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      onError?.("مرورگرت دیکته صوتی را پشتیبانی نمی‌کند.");
      return;
    }

    const rec = new Ctor();
    rec.lang = "fa-IR";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (ev) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const row = ev.results[i];
        const piece = row[0]?.transcript?.trim() ?? "";
        if (!piece) continue;
        if (row.isFinal) {
          onFinal(piece);
          interim = "";
        } else {
          interim += (interim ? " " : "") + piece;
        }
      }
      onInterim?.(interim);
    };

    rec.onerror = (ev) => {
      if (ev.error === "not-allowed") {
        onError?.("دسترسی میکروفون داده نشد.");
        wantListenRef.current = false;
        setListen(false);
        onInterim?.("");
        return;
      }
      if (ev.error === "no-speech") {
        // keep listening; browser may end session
        return;
      }
      if (ev.error !== "aborted") {
        onError?.("دیکته قطع شد — دوباره بزنید.");
      }
    };

    rec.onend = () => {
      // Chrome often ends continuous sessions; auto-resume while user wants listen.
      if (wantListenRef.current) {
        try {
          rec.start();
          return;
        } catch {
          wantListenRef.current = false;
        }
      }
      recRef.current = null;
      onInterim?.("");
      setListen(false);
    };

    recRef.current = rec;
    wantListenRef.current = true;
    try {
      rec.start();
      setListen(true);
    } catch {
      onError?.("شروع دیکته ممکن نشد.");
      wantListenRef.current = false;
      setListen(false);
    }
  }

  function toggle() {
    if (disabled) return;
    if (listening) stop();
    else start();
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? "توقف دیکته" : "با صدا بگویید"}
      className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-bold border transition-colors ${
        listening
          ? "bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/30"
          : "bg-[color:var(--circle-surface)] text-ink-muted border-stone-200/80 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300"
      }`}
    >
      <MicIcon className={`w-3.5 h-3.5 ${listening ? "animate-pulse" : ""}`} />
      {listening ? "توقف" : "با صدا بگویید"}
    </button>
  );
}
