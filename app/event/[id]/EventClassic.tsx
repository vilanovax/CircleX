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
  eventKindEmoji,
  eventKindLabels,
  privacyEmoji,
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
        <p className="text-center text-zinc-400 py-20 text-sm">رویداد پیدا نشد.</p>
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

      <div className="mx-4 mt-4 h-40 rounded-2xl bg-gradient-to-br from-brand-50 to-zinc-100 dark:from-brand-500/10 dark:to-zinc-800 flex items-center justify-center text-7xl">
        {event.image}
      </div>

      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`chip ${eventKindChip[event.kind]}`}>
            {eventKindEmoji[event.kind]} {eventKindLabels[event.kind]}
          </span>
          <span className="text-[11px] text-zinc-400" title={privacyLabels[event.privacy]}>
            {privacyEmoji[event.privacy]} {privacyLabels[event.privacy]}
          </span>
        </div>

        <h1 className="text-xl font-bold text-zinc-900 leading-snug">{event.title}</h1>

        {/* Date / location */}
        <div className="mt-3 space-y-1.5 text-sm">
          <p className="flex items-center gap-2 text-zinc-700">
            <span>📅</span>
            <span className="font-medium">
              {formatEventDateDisplay(event.date)}
              {event.time ? ` · ساعت ${event.time}` : ""}
            </span>
          </p>
          <p className="flex items-center gap-2 text-zinc-700">
            <span>📍</span>
            <span>{event.location}</span>
          </p>
        </div>

        <p className="text-sm text-zinc-600 leading-relaxed mt-3 whitespace-pre-line">
          {event.description}
        </p>
      </div>

      {/* Trust path */}
      <section className="px-4 pt-5">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheckIcon className="w-5 h-5 text-brand-600" />
            <h2 className="font-bold text-sm text-zinc-800">میزبان و مسیر اعتماد</h2>
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

      {/* Host */}
      {host && !isMine && (
        <section className="px-4 pt-3">
          <Link
            href={`/person/${event.hostId}`}
            className="card p-4 flex items-center gap-3 active:scale-[0.99] transition-transform"
          >
            <Avatar name={host.name} level={host.level} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-zinc-900">{host.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                میزبان · {relationLabels[host.relation]}
              </p>
            </div>
            <span className="text-zinc-300 text-lg">‹</span>
          </Link>
        </section>
      )}

      {/* Attendees */}
      <section className="px-4 pt-3">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-zinc-800">شرکت‌کننده‌ها</h2>
            <span className="text-xs text-zinc-400">
              {toPersianDigits(count)} نفر
              {event.capacity ? ` از ${toPersianDigits(event.capacity)}` : ""}
              {spotsLeft != null && spotsLeft > 0
                ? ` · ${toPersianDigits(spotsLeft)} جای خالی`
                : ""}
            </span>
          </div>
          {count === 0 ? (
            <p className="text-sm text-zinc-400">هنوز کسی ثبت‌نام نکرده. اولین نفر باش!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {event.attendees.map((aid) => {
                const p = getPerson(aid);
                const me = aid === "me";
                return (
                  <div key={aid} className="flex flex-col items-center w-14">
                    {p || me ? (
                      <Avatar name={me ? "شما" : p!.name} level={me ? undefined : p!.level} size="sm" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-zinc-100" />
                    )}
                    <span className="text-[11px] text-zinc-500 mt-1 truncate w-full text-center">
                      {me ? "شما" : p?.name ?? "؟"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Sticky RSVP */}
      {!isMine && (
        <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
          <div className="app-shell !min-h-0 !shadow-none bg-transparent">
            <div className="pointer-events-auto bg-white/95 backdrop-blur border-t border-zinc-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {going ? (
                <div className="flex gap-2">
                  <span className="btn-ghost flex-1 text-center !text-levelA">
                    ✓ حضور شما ثبت شد
                  </span>
                  <button
                    onClick={() => {
                      toggleRsvp(id);
                      show("حضور لغو شد");
                    }}
                    className="bg-zinc-100 text-zinc-600 font-medium rounded-xl px-4 active:bg-zinc-200"
                  >
                    لغو
                  </button>
                </div>
              ) : (
                <button
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
