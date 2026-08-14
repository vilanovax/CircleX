"use client";

import { useState } from "react";
import SheetShell from "@/components/SheetShell";
import { useToast } from "@/components/Toast";
import { levelHint, levelLabels, relationLabels } from "@/lib/labels";
import {
  GROUP_PRIVATE_LINE,
  copyText,
  inviteShareText,
  inviteUrl,
  nativeShare,
  smsShareHref,
  whatsappShareHref,
} from "@/lib/invite";
import {
  formatPhoneDisplay,
  isValidIranMobile,
  normalizePhone,
} from "@/lib/phone";
import { useStore } from "@/lib/store";
import type { Invite, RelationType, TrustLevel } from "@/lib/types";

const RELATIONS: RelationType[] = [
  "family",
  "friend",
  "colleague",
  "neighbor",
  "acquaintance",
];

const LEVELS: TrustLevel[] = ["A", "B", "C"];

function CheckMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
    </svg>
  );
}

export default function InviteSheet({ onClose }: { onClose: () => void }) {
  const { me, createInvite } = useStore();
  const [relation, setRelation] = useState<RelationType>("friend");
  const [level, setLevel] = useState<TrustLevel>("B");
  const [phoneInput, setPhoneInput] = useState("");
  const [created, setCreated] = useState<Invite | null>(null);

  const phone = phoneInput ? normalizePhone(phoneInput) : "";
  const phoneOk = !phone || isValidIranMobile(phone);

  function onCreate() {
    if (!phoneOk) return;
    const invite = createInvite({
      relationType: relation,
      trustGroup: level,
      invitedPhone: phone || undefined,
    });
    setCreated(invite);
  }

  if (created) {
    return (
      <InviteSharePanel
        invite={created}
        inviterName={me.name}
        onClose={onClose}
      />
    );
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="invite-sheet-title"
      zClass="z-50"
      footer={
        <div className="flex flex-col gap-1 pb-1">
          <button
            type="button"
            disabled={!phoneOk}
            onClick={onCreate}
            className="btn-primary w-full min-h-12"
          >
            ساخت لینک دعوت
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 text-sm font-semibold text-ink-muted dark:text-zinc-400"
          >
            انصراف
          </button>
        </div>
      }
    >
      <h2
        id="invite-sheet-title"
        className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50"
      >
        دعوت به حلقه
      </h2>
      <p className="text-[13px] text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed">
        لینک می‌سازی. تا نپیوندد در حلقه دیده نمی‌شود.
      </p>

      <p className="text-sm font-medium mt-4 mb-2 text-ink dark:text-zinc-200">
        چه نسبتی با او داری؟
      </p>
      <div
        className="flex flex-wrap gap-2 mb-4"
        role="group"
        aria-label="نسبت"
      >
        {RELATIONS.map((r) => {
          const selected = relation === r;
          return (
            <button
              key={r}
              type="button"
              aria-pressed={selected}
              onClick={() => setRelation(r)}
              className={`chip !px-3 !py-1.5 min-h-10 border ${
                selected
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-[color:var(--circle-surface)] text-ink-muted border-stone-200 dark:border-zinc-700"
              }`}
            >
              {relationLabels[r]}
            </button>
          );
        })}
      </div>

      <p className="text-sm font-medium mb-2 text-ink dark:text-zinc-200">
        در کدام گروه قرار بگیرد؟
      </p>
      <div
        className="flex flex-col gap-2 mb-2"
        role="radiogroup"
        aria-label="گروه حلقه"
      >
        {LEVELS.map((lvl) => {
          const active = level === lvl;
          return (
            <button
              key={lvl}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setLevel(lvl)}
              className={`w-full flex items-start gap-3 rounded-xl py-3 px-3.5 text-right border transition-colors ${
                active
                  ? "border-brand-600 bg-brand-50 dark:bg-brand-500/10"
                  : "border-stone-200/80 dark:border-zinc-700 bg-[color:var(--circle-surface)] dark:bg-zinc-900"
              }`}
            >
              <span
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  active
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-stone-300 dark:border-zinc-600"
                }`}
                aria-hidden
              >
                {active ? <CheckMark className="w-3 h-3" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold text-ink dark:text-zinc-100">
                  {levelLabels[lvl]}
                </span>
                <span className="block text-[12px] mt-0.5 leading-relaxed text-ink-muted">
                  {levelHint[lvl]}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[12px] text-ink-faint leading-relaxed mb-4">
        {GROUP_PRIVATE_LINE}
      </p>

      <label
        htmlFor="invite-phone"
        className="block text-[12px] font-medium mb-1 text-ink-muted"
      >
        شماره — اختیاری
      </label>
      <input
        id="invite-phone"
        type="tel"
        inputMode="numeric"
        dir="ltr"
        value={phone ? formatPhoneDisplay(phone) : ""}
        onChange={(e) => setPhoneInput(normalizePhone(e.target.value))}
        placeholder="۰۹۱۲ ۱۲۳ ۴۵۶۷"
        className="field !py-2 !text-[13px] mb-1"
      />
      <p className="text-[11px] text-ink-faint leading-relaxed">
        فقط برای متن پیام و برچسب دعوت — ارسال نمی‌شود.
      </p>
      {phone && !phoneOk && (
        <p role="alert" className="text-[12px] text-red-600 mt-1">
          ۱۱ رقم با ۰۹، یا خالی بگذار
        </p>
      )}
    </SheetShell>
  );
}

export function InviteSharePanel({
  invite,
  inviterName,
  onClose,
}: {
  invite: Invite;
  inviterName: string;
  onClose: () => void;
}) {
  const { show } = useToast();
  const url = inviteUrl(invite.code);
  const text = inviteShareText(inviterName, url);

  async function onCopy() {
    const ok = await copyText(url);
    show(ok ? "لینک کپی شد" : "کپی ممکن نشد");
  }

  async function onShare() {
    const shared = await nativeShare({
      title: "دعوت به حلقه",
      text,
      url,
    });
    if (!shared) await onCopy();
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="invite-share-title"
      zClass="z-50"
      footer={
        <button type="button" onClick={onClose} className="btn-ghost w-full">
          بستن
        </button>
      }
    >
      <h2
        id="invite-share-title"
        className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50"
      >
        لینک دعوت آماده است
      </h2>
      <p className="text-sm text-ink-muted mt-1.5 leading-relaxed">
        این لینک را برایش بفرست. تا وقتی نپیوندد در حلقه دیده نمی‌شود.
      </p>
      <p
        dir="ltr"
        className="mt-3 rounded-xl bg-stone-50 dark:bg-zinc-800 px-3 py-2.5 text-[12px] font-medium text-ink break-all text-left"
      >
        {url}
      </p>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button type="button" onClick={() => void onShare()} className="btn-primary">
          اشتراک‌گذاری
        </button>
        <a
          href={whatsappShareHref(text, invite.invitedPhone)}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost text-center"
        >
          واتساپ
        </a>
        <a
          href={smsShareHref(text, invite.invitedPhone)}
          className="btn-ghost text-center"
        >
          پیامک
        </a>
        <button type="button" onClick={() => void onCopy()} className="btn-ghost">
          کپی لینک
        </button>
      </div>
    </SheetShell>
  );
}
