"use client";

import Link from "next/link";
import type { CircleEvent } from "@/lib/types";
import { useStore } from "@/lib/store";
import { eventKindChip, eventKindEmoji, eventKindLabels } from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";
import TrustHighlight from "./TrustHighlight";

export default function EventCard({ event }: { event: CircleEvent }) {
  const { isAttending } = useStore();
  const going = isAttending(event.id);
  const count = event.attendees.length; // includes me when going

  return (
    <Link
      href={`/event/${event.id}`}
      className="card block p-3 active:scale-[0.99] transition-transform"
    >
      <TrustHighlight
        posterId={event.hostId}
        trustPath={event.trustPath}
        posterRole="میزبان"
      />

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
              <span className="chip bg-green-50 text-levelA">✓ می‌آیم</span>
            )}
          </div>
          <h3 className="font-semibold text-[15px] text-zinc-900 leading-snug line-clamp-2">
            {event.title}
          </h3>
          <p className="text-xs text-brand-700 dark:text-brand-300 font-medium mt-1">
            📅 {event.date}
            {event.time ? ` · ${event.time}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-2.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
          <span>📍 {event.location}</span>
          <span>
            {toPersianDigits(count)} نفر
            {event.capacity ? ` از ${toPersianDigits(event.capacity)}` : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}
