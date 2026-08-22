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
          className="font-extrabold text-[1.1rem] text-ink dark:text-zinc-50"
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
        className="font-extrabold text-[1.1rem] text-ink dark:text-zinc-50"
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

  async function onCopy() {
    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      show("لینک کپی شد");
    } else {
      show("کپی ممکن نشد");
    }
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="invite-more-title"
      zClass="z-50"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="btn-primary w-full min-h-12 shadow-md shadow-brand-600/20 active:scale-[0.98] transition-transform duration-150"
        >
          باشه
        </button>
      }
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          id="invite-more-title"
          className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50 truncate min-w-0"
        >
          {title}
        </h2>
        <span className="shrink-0 inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 px-2.5 py-1 text-[11px] font-bold">
          در انتظار
        </span>
      </div>

      <p className="text-[13px] text-ink-muted mt-2.5 leading-relaxed">
        {isWave
          ? roster.length > 0
            ? "یک لینک برای همه. وقتی با همان شماره وارد شوند، اینجا تیک می‌خورند."
            : "لینک گروهی آماده است. صبر کن تا کسی از آن وارد شود."
          : "دعوت آماده است. صبر کن تا بپیوندد."}
      </p>
      {sub ? (
        <p
          dir={isWave ? undefined : "ltr"}
          className="mt-1 text-[12px] text-ink-faint nums tracking-wide"
        >
          {sub}
        </p>
      ) : null}

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

      <div className="mt-4 rounded-2xl border border-stone-200/80 dark:border-zinc-700 bg-stone-50/70 dark:bg-zinc-800/40 px-3.5 py-3">
        <p className="text-[11px] font-bold text-ink-muted mb-1.5">
          {isWave ? "لینک گروهی" : "لینک"}
        </p>
        <p
          dir="ltr"
          className="text-[12px] font-medium text-ink dark:text-zinc-200 break-all text-left leading-snug"
        >
          {url}
        </p>
        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={() => void onCopy()}
            className="text-[13px] font-semibold text-brand-700 dark:text-brand-400"
          >
            {copied ? "کپی شد" : "کپی"}
          </button>
          <a
            href={whatsappShareHref(text, waPhone)}
            target="_blank"
            rel="noreferrer"
            className="text-[13px] font-semibold text-brand-700 dark:text-brand-400"
          >
            واتساپ
          </a>
          <a
            href={smsShareHref(text, smsPhones)}
            className="text-[13px] font-semibold text-brand-700 dark:text-brand-400"
          >
            پیامک
          </a>
        </div>
      </div>

      <button
        type="button"
        onClick={onRevoke}
        className="w-full mt-4 min-h-10 text-[12px] font-semibold text-ink-faint"
      >
        لغو دعوت
      </button>
    </SheetShell>
  );
}
