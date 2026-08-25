"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { activeCircle } from "@/lib/circle-member";
import Avatar from "@/components/Avatar";
import SheetShell from "@/components/SheetShell";
import { TagIcon, TrashIcon } from "@/components/Icons";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  WATCH_KIND,
  WATCH_PERSON_CAP,
  WATCH_PHRASE_CAP,
  WATCH_PHRASE_MAX,
} from "@/lib/watch-match";

export type ClientWatch = {
  id: string;
  kind: string;
  phrase: string | null;
  enabled: boolean;
  adminLocked?: boolean;
  createdAt: string;
  target: { id: string; name: string; avatar: string } | null;
};

export default function WatchSheet({ onClose }: { onClose: () => void }) {
  const people = useStore((s) => s.people);
  const circle = useMemo(() => activeCircle(people), [people]);
  const { show } = useToast();
  const [watches, setWatches] = useState<ClientWatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [phrase, setPhrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);

  const load = useCallback(async () => {
    const data = await api<{ watches: ClientWatch[] }>("/api/watches");
    setWatches(data.watches);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void load()
      .catch((err) => {
        if (!cancelled) {
          show(err instanceof ApiError ? err.message : "بار نشد");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load, show]);

  const phrases = useMemo(
    () => watches.filter((w) => w.kind === WATCH_KIND.phrase),
    [watches],
  );
  const persons = useMemo(
    () => watches.filter((w) => w.kind === WATCH_KIND.person),
    [watches],
  );
  const addablePeople = useMemo(() => {
    const watchedIds = new Set(
      persons
        .map((w) => w.target?.id)
        .filter((id): id is string => Boolean(id)),
    );
    return circle.filter((p) => !watchedIds.has(p.id));
  }, [circle, persons]);

  async function addPhrase() {
    if (busy) return;
    setBusy(true);
    try {
      const data = await api<{ watch: ClientWatch }>("/api/watches", {
        method: "POST",
        body: JSON.stringify({ kind: WATCH_KIND.phrase, phrase }),
      });
      setWatches((prev) => [...prev, data.watch]);
      setPhrase("");
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ثبت نشد");
    } finally {
      setBusy(false);
    }
  }

  async function addPerson(personId: string) {
    if (busy) return;
    setBusy(true);
    try {
      const data = await api<{ watch: ClientWatch }>("/api/watches", {
        method: "POST",
        body: JSON.stringify({ kind: WATCH_KIND.person, personId }),
      });
      setWatches((prev) => [...prev, data.watch]);
      setPicking(false);
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ثبت نشد");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(watch: ClientWatch) {
    if (watch.adminLocked) {
      show("این گوش‌به‌زنگ توسط تیم سیرکل خاموش شده");
      return;
    }
    try {
      const data = await api<{ watch: ClientWatch }>(`/api/watches/${watch.id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !watch.enabled }),
      });
      setWatches((prev) =>
        prev.map((w) => (w.id === watch.id ? data.watch : w)),
      );
    } catch (err) {
      show(err instanceof ApiError ? err.message : "عوض نشد");
    }
  }

  async function remove(watch: ClientWatch) {
    try {
      await api(`/api/watches/${watch.id}`, { method: "DELETE" });
      setWatches((prev) => prev.filter((w) => w.id !== watch.id));
    } catch (err) {
      show(err instanceof ApiError ? err.message : "حذف نشد");
    }
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="watch-sheet-title"
      zClass="z-50"
      hugContent
      footer={
        <button type="button" onClick={onClose} className="btn-ghost w-full !py-3.5">
          بستن
        </button>
      }
    >
      <h2
        id="watch-sheet-title"
        className="text-[20px] font-semibold text-ink dark:text-zinc-50 leading-tight"
      >
        گوش‌به‌زنگ‌ها
      </h2>
      <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">
        اگر آگهی تازه‌ای با این عبارت آمد، یا این نفر آگهی گذاشت — و حق دیدنش را
        داشتی — سیرکلو خبر می‌دهد.
      </p>

      {loading ? (
        <p className="text-[13px] text-ink-faint mt-5">در حال بارگذاری…</p>
      ) : (
        <div className="mt-4 space-y-5">
          <section>
            <div className="mb-2">
              <p className="text-[12px] font-bold text-ink dark:text-zinc-100">
                کالا و خدمات
              </p>
              <p className="text-[11px] text-ink-faint nums mt-0.5">
                {phrases.length} از {WATCH_PHRASE_CAP}
              </p>
            </div>
            <div className="flex items-stretch gap-2">
              <input
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                maxLength={WATCH_PHRASE_MAX}
                placeholder="مثلاً دوچرخه بچگانه"
                className="field min-w-0 flex-1 !rounded-xl !px-3 !py-2.5 !text-[13px]"
                disabled={phrases.length >= WATCH_PHRASE_CAP}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void addPhrase();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => void addPhrase()}
                disabled={busy || phrases.length >= WATCH_PHRASE_CAP}
                className="btn-primary shrink-0 self-stretch !px-3.5 !py-0 !text-[13px] font-bold disabled:opacity-40 active:scale-[0.97] transition-transform duration-150 ease-out"
              >
                افزودن
              </button>
            </div>
            <ul className="mt-2.5 space-y-1.5">
              {phrases.length === 0 ? (
                <li className="text-[12px] text-ink-faint px-0.5 py-1">
                  هنوز عبارتی نداری.
                </li>
              ) : (
                phrases.map((w) => (
                  <WatchRow
                    key={w.id}
                    title={w.phrase || "عبارت"}
                    enabled={w.enabled}
                    locked={w.adminLocked}
                    onToggle={() => void toggle(w)}
                    onRemove={() => void remove(w)}
                  />
                ))
              )}
            </ul>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-ink dark:text-zinc-100">
                  اشخاص حلقه
                </p>
                <p className="text-[11px] text-ink-faint nums mt-0.5">
                  {persons.length} از {WATCH_PERSON_CAP}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPicking((v) => !v)}
                disabled={
                  persons.length >= WATCH_PERSON_CAP || addablePeople.length === 0
                }
                className="text-[12px] font-bold text-brand-600 dark:text-brand-400 disabled:opacity-40 active:scale-[0.97] transition-transform duration-150 ease-out shrink-0"
              >
                {picking ? "بستن فهرست" : "افزودن نفر"}
              </button>
            </div>
            {picking ? (
              <ul className="mb-2.5 rounded-2xl border border-stone-200/80 dark:border-zinc-800 divide-y divide-stone-100 dark:divide-zinc-800 max-h-48 overflow-y-auto">
                {addablePeople.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => void addPerson(p.id)}
                      disabled={busy}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-right active:bg-stone-50 dark:active:bg-zinc-800/80 active:scale-[0.99] transition-transform duration-150 ease-out"
                    >
                      <Avatar
                        name={p.name}
                        src={p.avatar}
                        size="sm"
                        showLevel={false}
                      />
                      <span className="text-[13px] font-bold text-ink dark:text-zinc-100 truncate">
                        {p.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <ul className="space-y-1.5">
              {persons.length === 0 ? (
                <li className="text-[12px] text-ink-faint px-0.5 py-1">
                  هنوز کسی را نگذاشته‌ای.
                </li>
              ) : (
                persons.map((w) => (
                  <WatchRow
                    key={w.id}
                    title={w.target?.name || "عضو حلقه"}
                    avatar={w.target?.avatar}
                    enabled={w.enabled}
                    locked={w.adminLocked}
                    onToggle={() => void toggle(w)}
                    onRemove={() => void remove(w)}
                  />
                ))
              )}
            </ul>
          </section>
        </div>
      )}
    </SheetShell>
  );
}

function WatchRow({
  title,
  avatar,
  enabled,
  locked,
  onToggle,
  onRemove,
}: {
  title: string;
  avatar?: string;
  enabled: boolean;
  locked?: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <li
      className={`flex items-center gap-2.5 rounded-2xl border px-2.5 py-2 ${
        enabled
          ? "border-stone-200/80 dark:border-zinc-800 bg-[color:var(--circle-surface)]"
          : "border-stone-200/60 dark:border-zinc-800/80 bg-stone-50/70 dark:bg-zinc-800/40"
      }`}
    >
      {avatar !== undefined ? (
        <Avatar name={title} src={avatar} size="sm" showLevel={false} />
      ) : (
        <span
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            enabled
              ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
              : "bg-stone-100 text-stone-400 dark:bg-zinc-800 dark:text-zinc-500"
          }`}
          aria-hidden
        >
          <TagIcon className="w-[18px] h-[18px]" />
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span
          className={`block text-[13px] font-bold truncate ${
            enabled ? "text-ink dark:text-zinc-100" : "text-ink-faint"
          }`}
        >
          {title}
        </span>
        <span
          className={`block text-[11px] mt-0.5 ${
            enabled
              ? "text-brand-700 dark:text-brand-300"
              : "text-ink-faint"
          }`}
        >
          {locked ? "خاموش · تیم سیرکل" : enabled ? "روشن" : "خاموش"}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-disabled={locked}
        disabled={locked}
        aria-label={enabled ? `${title}، روشن` : `${title}، خاموش`}
        onClick={onToggle}
        className={`relative w-11 h-[26px] rounded-full shrink-0 transition-[background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 ${
          enabled
            ? "bg-brand-600"
            : "bg-stone-300 dark:bg-zinc-600"
        }`}
      >
        <span
          className={`pointer-events-none absolute top-[3px] size-5 rounded-full bg-white shadow-sm transition-[inset-inline-start] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            enabled ? "start-[calc(100%-23px)]" : "start-[3px]"
          }`}
        />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="حذف"
        className="w-8 h-8 rounded-lg text-ink-muted flex items-center justify-center shrink-0 active:scale-[0.97] active:bg-stone-100 dark:active:bg-zinc-800 transition-[transform,background-color] duration-150 ease-out"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </li>
  );
}
