"use client";

import Link from "next/link";
import type { CircleEvent } from "@/lib/types";
import { activeCircle } from "@/lib/circle-member";
import { useStore } from "@/lib/store";
import {
  eventKindChip,
  eventKindLabels,
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
  const circle = activeCircle(people);
  const going = isAttending(event.id);
  const count = event.attendees.length;

  return (
    <article className="card overflow-hidden active:scale-[0.99] transition-transform">
      <TrustHighlight
        posterId={event.hostId}
        trustPath={event.trustPath}
        endorsements={event.endorsements}
        posterRole="میزبان"
        contentKind="event"
        variant={compactTrust ? "compact" : "default"}
      />

      <Link href={`/event/${event.id}`} className="block px-3.5 py-3">
        <div className="flex gap-3">
          <div className="w-14 h-14 rounded-xl bg-stone-50 dark:bg-zinc-800/80 ring-1 ring-stone-100 dark:ring-zinc-700/60 flex items-center justify-center text-2xl shrink-0">
            {event.image}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className={`chip ${eventKindChip[event.kind]}`}>
                {eventKindLabels[event.kind]}
              </span>
              {going && (
                <span className="chip bg-levelA/10 text-levelA">
                  ✓ می‌آیم
                </span>
              )}
            </div>
            <h3 className="font-bold text-[14px] text-ink dark:text-zinc-100 leading-snug line-clamp-2">
              {event.title}
            </h3>
            <p className="text-[12px] text-ink font-medium mt-1 nums">
              {formatEventDateDisplay(event.date)}
              {event.time ? ` · ${event.time}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-stone-100 dark:border-zinc-800 space-y-1">
          <div className="flex items-center justify-between gap-2 text-[11px] text-ink-muted dark:text-zinc-400">
            <span className="truncate">{event.location}</span>
            <span className="nums shrink-0">
              {toPersianDigits(count)} نفر
              {event.capacity ? ` از ${toPersianDigits(event.capacity)}` : ""}
            </span>
          </div>
          <p
            className="text-[11px] text-ink-faint"
            title={privacyAudience(event.privacy, circle)}
          >
            {privacyLabels[event.privacy]}
          </p>
        </div>
      </Link>
    </article>
  );
}
