"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import Avatar from "@/components/Avatar";
import TrustPath from "@/components/TrustPath";
import { ShieldCheckIcon } from "@/components/Icons";
import { useToast } from "@/components/Toast";
import LockedAccess from "@/components/LockedAccess";
import { canView } from "@/lib/trust";
import { formatEventDateDisplay, toPersianDigits } from "@/lib/persian";
import {
  eventKindChip,
  eventKindLabels,
  privacyLabels,
  relationLabels,
} from "@/lib/labels";

export default function EventClassic(_props: { params: { id: string } }) {
  const params = useParams();
  const id = String(params.id);
  const { getEvent, getPerson, toggleRsvp, isAttending } = useStore();
  const { show } = useToast();

  const event = getEvent(id);
  if (!event) {
    return (
      <main className="min-h-[100dvh]">
        <Header title="رویداد" back />
        <p className="text-center text-ink-faint py-20 text-sm">رویداد پیدا نشد.</p>
      </main>
    );
  }

  const host = getPerson(event.hostId);
  const isMine = event.hostId === "me";

  if (!isMine && !canView(event, getPerson)) {
    return (
      <main className="min-h-[100dvh]">
        <Header title="جزئیات رویداد" back />
        <LockedAccess
          itemTitle={event.title}
          itemKind="event"
          privacy={event.privacy}
        />
      </main>
    );
  }

  const going = isAttending(id);
  const count = event.attendees.length;
  const spotsLeft = event.capacity != null ? event.capacity - count : null;
  const full = spotsLeft != null && spotsLeft <= 0 && !going;

  return (
    <main className="pb-28 min-h-[100dvh]">
      <Header title="جزئیات رویداد" back />

      <div className="mx-4 mt-3 h-40 rounded-2xl bg-stone-50 dark:bg-zinc-800/80 ring-1 ring-stone-100 dark:ring-zinc-700/60 flex items-center justify-center text-6xl">
        {event.image}
      </div>

      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`chip ${eventKindChip[event.kind]}`}>
            {eventKindLabels[event.kind]}
          </span>
          <span className="text-[11px] text-ink-faint">
            {privacyLabels[event.privacy]}
          </span>
        </div>

        <h1 className="text-[1.35rem] font-extrabold text-ink dark:text-zinc-50 leading-snug">
          {event.title}
        </h1>

        <div className="mt-3 space-y-1.5 text-[13px]">
          <p className="text-ink dark:text-zinc-100 font-medium nums">
            {formatEventDateDisplay(event.date)}
            {event.time ? ` · ساعت ${event.time}` : ""}
          </p>
          <p className="text-ink-muted dark:text-zinc-400">{event.location}</p>
        </div>

        <p className="text-[13px] text-ink-muted dark:text-zinc-300 leading-relaxed mt-3 whitespace-pre-line">
          {event.description}
        </p>
      </div>

      <section className="px-4 pt-4">
        <div className="card p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheckIcon className="w-[18px] h-[18px] text-levelA" />
            <h2 className="font-bold text-[13px] text-ink dark:text-zinc-100">
              میزبان و مسیر اعتماد
            </h2>
          </div>
          <TrustPath
            posterId={event.hostId}
            trustPath={event.trustPath}
            variant="full"
            posterRole="میزبان"
            viewerRole="شما"
          />
        </div>
      </section>

      {host && !isMine && (
        <section className="px-4 pt-2.5">
          <Link
            href={`/person/${event.hostId}`}
            className="card px-3.5 py-3 flex items-center gap-3 active:scale-[0.99] transition-transform"
          >
            <Avatar name={host.name} level={host.level} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[14px] text-ink dark:text-zinc-100">
                {host.name}
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                میزبان · {relationLabels[host.relation]}
              </p>
            </div>
            <span className="text-ink-faint text-lg" aria-hidden>
              ‹
            </span>
          </Link>
        </section>
      )}

      <section className="px-4 pt-2.5 pb-2">
        <div className="card p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-bold text-[13px] text-ink dark:text-zinc-100">
              شرکت‌کننده‌ها
            </h2>
            <span className="text-[11px] font-semibold text-ink-faint nums">
              {toPersianDigits(count)}
              {event.capacity ? ` / ${toPersianDigits(event.capacity)}` : ""}
            </span>
            {spotsLeft != null && spotsLeft > 0 && (
              <span className="text-[11px] text-ink-faint ms-auto">
                {toPersianDigits(spotsLeft)} جای خالی
              </span>
            )}
          </div>
          {count === 0 ? (
            <p className="text-[13px] text-ink-faint">
              هنوز کسی ثبت‌نام نکرده. اولین نفر باش!
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {event.attendees.map((aid) => {
                const p = getPerson(aid);
                const me = aid === "me";
                return (
                  <div key={aid} className="flex flex-col items-center w-14">
                    {p || me ? (
                      <Avatar
                        name={me ? "شما" : p!.name}
                        level={me ? undefined : p!.level}
                        size="sm"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-stone-100 dark:bg-zinc-800" />
                    )}
                    <span className="text-[11px] text-ink-muted mt-1 truncate w-full text-center">
                      {me ? "شما" : p?.name ?? "؟"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {!isMine && (
        <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
          <div className="app-shell !min-h-0 !shadow-none bg-transparent">
            <div className="pointer-events-auto bg-[color:var(--circle-surface)]/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-stone-200/70 dark:border-zinc-800 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {going ? (
                <div className="flex gap-2">
                  <span className="btn-ghost flex-1 text-center !text-levelA">
                    ✓ حضور شما ثبت شد
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      toggleRsvp(id);
                      show("حضور لغو شد");
                    }}
                    className="bg-stone-100 dark:bg-zinc-800 text-ink-muted font-medium rounded-xl px-4 active:bg-stone-200 dark:active:bg-zinc-700"
                  >
                    لغو
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (full) return;
                    toggleRsvp(id);
                    show("حضور شما ثبت شد ✓ منتظرت هستیم!");
                  }}
                  disabled={full}
                  className="btn-primary w-full !py-3.5 text-base"
                >
                  {full ? "ظرفیت تکمیل است" : "من می‌آیم"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
