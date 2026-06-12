"use client";

import Link from "next/link";
import type { CircleEvent } from "@/lib/types";
import { useStore } from "@/lib/store";
import {
  eventKindChip,
  eventKindEmoji,
  eventKindLabels,
  privacyEmoji,
  privacyLabels,
} from "@/lib/labels";
import { formatEventDateDisplay, toPersianDigits } from "@/lib/persian";
import { privacyAudience } from "@/lib/trust";
import TrustHighlight from "./TrustHighlight";

export default function EventCard({
  event,
  compactTrust = true,
}: {
  event: CircleEvent;
  compactTrust?: boolean;
}) {
  const { isAttending, people } = useStore();
  const circle = people.filter((p) => p.inMyCircle);
  const going = isAttending(event.id);
  const count = event.attendees.length;

  return (
    <article className="card p-3 active:scale-[0.99] transition-transform">
      <TrustHighlight
        posterId={event.hostId}
        trustPath={event.trustPath}
        endorsements={event.endorsements}
        posterRole="میزبان"
        contentKind="event"
        variant={compactTrust ? "compact" : "default"}
      />

      <Link href={`/event/${event.id}`} className="block">
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-50 to-zinc-100 dark:from-brand-500/10 dark:to-zinc-800 flex items-center justify-center text-3xl shrink-0">
            {event.image}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`chip ${eventKindChip[event.kind]}`}>
                {eventKindEmoji[event.kind]} {eventKindLabels[event.kind]}
              </span>
              {going && (
                <span className="chip bg-green-50 text-levelA dark:bg-green-500/15">
                  ✓ می‌آیم
                </span>
              )}
            </div>
            <h3 className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
              {event.title}
            </h3>
            <p className="text-xs text-brand-700 dark:text-brand-300 font-medium mt-1">
              📅 {formatEventDateDisplay(event.date)}
              {event.time ? ` · ${event.time}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>📍 {event.location}</span>
            <span>
              {toPersianDigits(count)} نفر
              {event.capacity ? ` از ${toPersianDigits(event.capacity)}` : ""}
            </span>
          </div>
          <p
            className="text-[11px] text-zinc-400"
            title={privacyAudience(event.privacy, circle)}
          >
            {privacyEmoji[event.privacy]} {privacyLabels[event.privacy]}
          </p>
        </div>
      </Link>
    </article>
  );
}
