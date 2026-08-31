"use client";

import { useState } from "react";
import SheetShell from "@/components/SheetShell";
import { useToast } from "@/components/Toast";
import {
  copyText,
  inviteRowCopy,
  inviteShareText,
  inviteUrl,
  smsShareHref,
  whatsappShareHref,
} from "@/lib/invite";
import { levelHint, levelLabels } from "@/lib/labels";
import { formatPhoneDisplay } from "@/lib/phone";
import type { Invite, Person, TrustLevel } from "@/lib/types";

const LEVELS: TrustLevel[] = ["A", "B", "C"];

export function GroupSheet({
  person,
  onClose,
  onPick,
}: {
  person: Person;
  onClose: () => void;
  onPick: (level: TrustLevel) => void;
}) {
  return (
    <SheetShell onClose={onClose} labelledBy="group-sheet-title" zClass="z-50">
      <div className="pb-3">
        <h2
          id="group-sheet-title"
          className="font-extrabold text-[20px] text-ink dark:text-zinc-50 leading-snug"
        >
          جایگاه {person.name} کجا باشد؟
        </h2>
        <p className="text-[12px] text-ink-muted mt-1 mb-3">
          این انتخاب فقط برای خودت است.
        </p>
        <div className="space-y-2">
          {LEVELS.map((lvl) => {
            const active = person.level === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => onPick(lvl)}
                className={`w-full text-right rounded-xl border px-3.5 py-3 transition-colors ${
                  active
                    ? "bg-brand-600 text-white border-brand-600"
                    : "border-stone-200/80 dark:border-zinc-700 bg-[color:var(--circle-surface)] dark:bg-zinc-900"
                }`}
              >
                <span
                  className={`block text-[14px] font-bold ${
                    active ? "text-white" : "text-ink dark:text-zinc-100"
                  }`}
                >
                  {levelLabels[lvl]}
                </span>
                <span
                  className={`block text-[12px] mt-0.5 leading-relaxed ${
                    active ? "text-white/80" : "text-ink-muted"
                  }`}
                >
                  {levelHint[lvl]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </SheetShell>
  );
}

export function PlaceTrustSheet({
  people,
  onClose,
  onPick,
}: {
  people: Person[];
  onClose: () => void;
  onPick: (person: Person, level: TrustLevel) => void;
}) {
  return (
    <SheetShell onClose={onClose} labelledBy="place-trust-title" zClass="z-50">
      <h2
        id="place-trust-title"
        className="font-extrabold text-[20px] text-ink dark:text-zinc-50 leading-snug"
      >
        جایگاه تازه‌واردها
      </h2>
      <p className="text-[12px] text-ink-muted mt-1 mb-3 leading-relaxed">
        پیش‌فرض «افراد مورد اعتماد» است. این انتخاب فقط برای خودت است.
      </p>
      <ul className="space-y-3">
        {people.map((person) => (
          <li key={person.id}>
            <p className="font-bold text-[13px] text-ink dark:text-zinc-100 mb-1.5">
              {person.name}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((lvl) => {
                const active = person.level === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onPick(person, lvl)}
                    className={`chip !px-3 !py-1.5 min-h-10 border ${
                      active
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-[color:var(--circle-surface)] text-ink-muted border-stone-200 dark:border-zinc-700"
                    }`}
                  >
                    {levelLabels[lvl]}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </SheetShell>
  );
}

export function InviteMoreSheet({
  invite,
  inviterName,
  onClose,
  onRevoke,
}: {
  invite: Invite;
  inviterName: string;
  onClose: () => void;
  onRevoke: () => void;
}) {
  const { show } = useToast();
  const [copied, setCopied] = useState(false);
  const { title, sub, isWave } = inviteRowCopy(invite);
  const url = inviteUrl(invite.code);
  const text = inviteShareText(inviterName, url);
  const roster = invite.expected ?? [];
  const pendingPhones = roster
    .filter((row) => !row.joined)
    .map((row) => row.phone);
  const waPhone = isWave ? undefined : invite.invitedPhone;
  const smsPhones = isWave
    ? pendingPhones.length > 0
      ? pendingPhones
      : undefined
    : invite.invitedPhone;
  const heading = isWave ? title : `دعوت ${title}`;

  async function onCopy() {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      show("متن دعوت کپی شد");
    } else {
      show("کپی ممکن نشد");
    }
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="invite-more-title"
      zClass="z-50"
      hugContent
      footer={
        <div className="flex flex-col gap-1.5">
          <a
            href={whatsappShareHref(text, waPhone)}
            target="_blank"
            rel="noreferrer"
            className="btn-primary w-full min-h-12 text-center shadow-md shadow-brand-600/20 active:scale-[0.98] transition-transform duration-150 inline-flex items-center justify-center"
          >
            ارسال با واتساپ
          </a>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={smsShareHref(text, smsPhones)}
              className="btn-ghost min-h-12 text-center inline-flex items-center justify-center active:scale-[0.98] transition-transform duration-150"
            >
              پیامک
            </a>
            <button
              type="button"
              onClick={() => void onCopy()}
              className="btn-ghost min-h-12 active:scale-[0.98] transition-transform duration-150"
            >
              {copied ? "کپی شد" : "کپی متن"}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-10 text-[13px] font-semibold text-ink-muted dark:text-zinc-400 active:opacity-70"
          >
            بستن
          </button>
        </div>
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="invite-more-title"
            className="font-extrabold text-[20px] text-ink dark:text-zinc-50 truncate leading-snug"
          >
            {heading}
          </h2>
          <p className="mt-1 text-[13px] text-ink-muted dark:text-zinc-400 leading-relaxed">
            {isWave
              ? roster.length > 0
                ? "لینک را دوباره بفرست. وقتی با همان شماره وارد شوند، اینجا تیک می‌خورند."
                : "لینک گروهی آماده است — دوباره بفرست تا کسی وارد شود."
              : "لینک آماده است. دوباره بفرست تا بپیوندد — تا آن وقت عضو حلقه نیست."}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 px-2.5 py-1 text-[11px] font-bold">
          در انتظار
        </span>
      </div>

      {sub && sub !== "هنوز نپیوسته" ? (
        <p
          dir={isWave ? undefined : "ltr"}
          className="mt-2 text-[12px] text-ink-faint nums tracking-wide"
        >
          {sub}
        </p>
      ) : (
        <p className="mt-2 text-[12px] font-medium text-amber-800/90 dark:text-amber-200/90">
          هنوز نپیوسته
        </p>
      )}

      {roster.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {roster.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-2 text-[12px]"
            >
              <span className="font-bold text-ink dark:text-zinc-100 truncate">
                {row.name?.trim() || formatPhoneDisplay(row.phone)}
              </span>
              <span className="shrink-0 text-ink-muted">
                {row.joined ? "پیوست" : "در انتظار"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3.5 rounded-2xl border border-stone-200/80 dark:border-zinc-700 bg-stone-50/70 dark:bg-zinc-800/40 px-3.5 py-3">
        <p className="text-[11px] font-bold text-ink-muted mb-1">
          {isWave ? "لینک گروهی" : "لینک دعوت"}
        </p>
        <p
          dir="ltr"
          className="text-[12px] font-medium text-ink dark:text-zinc-200 break-all text-left leading-snug select-all"
        >
          {url}
        </p>
      </div>

      <button
        type="button"
        onClick={onRevoke}
        className="w-full mt-3 min-h-10 text-[12px] font-semibold text-red-600/80 dark:text-red-400/90 active:opacity-70"
      >
        لغو دعوت
      </button>
    </SheetShell>
  );
}
