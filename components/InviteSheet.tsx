"use client";

import { useState } from "react";
import SheetShell from "@/components/SheetShell";
import { useToast } from "@/components/Toast";
import { levelHint, levelLabels, relationLabels } from "@/lib/labels";
import {
  GROUP_PRIVATE_LINE,
  WAVE_MAX_USES,
  WAVE_ROSTER_LIMIT,
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
import { parseInviteLines } from "@/lib/invite-paste";
import { toPersianDigits } from "@/lib/persian";
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
  const { show } = useToast();
  const [mode, setMode] = useState<"personal" | "wave">("personal");
  const [relation, setRelation] = useState<RelationType>("friend");
  const [waveRelation, setWaveRelation] = useState<RelationType>("family");
  const [level, setLevel] = useState<TrustLevel>("B");
  const [phoneInput, setPhoneInput] = useState("");
  const [created, setCreated] = useState<Invite | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [creating, setCreating] = useState(false);

  const phone = phoneInput ? normalizePhone(phoneInput) : "";
  const phoneOk = !phone || isValidIranMobile(phone);

  async function onCreate() {
    if (!phoneOk || creating) return;
    setCreating(true);
    try {
      const invite = await createInvite({
        relationType: relation,
        trustGroup: level,
        invitedPhone: phone || undefined,
      });
      setCreated(invite);
    } catch {
      show("ساخت لینک ممکن نشد");
    } finally {
      setCreating(false);
    }
  }

  async function onCreateWave() {
    if (creating) return;
    const parsed = parseInviteLines(pasteText);
    if (pasteOpen && parsed.valid.length === 0) return;
    if (parsed.valid.length > WAVE_ROSTER_LIMIT) {
      show(`حداکثر ${toPersianDigits(WAVE_ROSTER_LIMIT)} نفر`);
      return;
    }
    setCreating(true);
    try {
      const invite = await createInvite({
        relationType: waveRelation,
        kind: "wave",
        people: parsed.valid.length > 0 ? parsed.valid : undefined,
      });
      setCreated(invite);
    } catch {
      show("ساخت لینک ممکن نشد");
    } finally {
      setCreating(false);
    }
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

  if (mode === "wave") {
    const parsed = parseInviteLines(pasteText);
    const pasteBlocked = pasteOpen && parsed.valid.length === 0;
    return (
      <SheetShell
        onClose={onClose}
        labelledBy="wave-invite-title"
        zClass="z-50"
        footer={
          <div className="flex flex-col gap-1 pb-1">
            <button
              type="button"
              disabled={creating || pasteBlocked}
              onClick={() => void onCreateWave()}
              className="btn-primary w-full min-h-12 shadow-md shadow-brand-600/20 active:scale-[0.98] transition-transform duration-150"
            >
              {creating
                ? "در حال ساخت…"
                : parsed.valid.length > 0
                  ? `ساخت لینک برای ${toPersianDigits(parsed.valid.length)} نفر`
                  : "ساخت لینک گروهی"}
            </button>
            <button
              type="button"
              onClick={() => setMode("personal")}
              className="min-h-11 text-sm font-semibold text-ink-muted dark:text-zinc-400 active:opacity-70"
            >
              بازگشت
            </button>
          </div>
        }
      >
        <h2
          id="wave-invite-title"
          className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50"
        >
          دعوت یک گروه
        </h2>
        <p className="text-[13px] text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed">
          یک لینک می‌سازی و همان را می‌فرستی. وقتی با شمارهٔ خودشان وارد
          شوند، در حلقه دیده می‌شوند. تا {toPersianDigits(WAVE_MAX_USES)} نفر.
        </p>

        <p className="text-[13px] font-bold mt-5 mb-2 text-ink dark:text-zinc-200">
          چه کسانی را دعوت می‌کنی؟
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label="نسبت دعوت‌شدگان"
        >
          {RELATIONS.map((r) => {
            const selected = waveRelation === r;
            return (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setWaveRelation(r)}
                className={`chip !px-3.5 !py-1.5 min-h-10 border active:scale-[0.98] transition-transform duration-150 ${
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
        <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-2.5 leading-relaxed">
          جایگاهشان را بعد از پیوستن مشخص می‌کنی — تا آن وقت بین افراد مورد اعتمادند.
        </p>

        {pasteOpen ? (
          <div className="mt-4 rounded-2xl border border-stone-200/80 dark:border-zinc-700 bg-stone-50/60 dark:bg-zinc-800/40 px-3.5 py-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-[13px] font-bold text-ink dark:text-zinc-100">
                چند شماره
              </p>
              <button
                type="button"
                onClick={() => setPasteOpen(false)}
                className="text-[12px] font-semibold text-ink-muted"
              >
                انصراف
              </button>
            </div>
            <label htmlFor="invite-paste" className="sr-only">
              هر سطر یک نفر — نام اختیاری است
            </label>
            <textarea
              id="invite-paste"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={5}
              placeholder={"سارا، 09121234567\nرضا، 09351234567"}
              className="field !py-2.5 !text-[13px] min-h-[7.5rem] resize-y !bg-[color:var(--circle-surface)]"
            />
            <p className="text-[11px] text-ink-muted mt-2 leading-relaxed nums">
              {parsed.valid.length > 0
                ? `${toPersianDigits(parsed.valid.length)} نفر روی همین لینک`
                : "هر سطر یک نفر — نام اختیاری است"}
              {parsed.invalid.length > 0
                ? ` · ${toPersianDigits(parsed.invalid.length)} نامعتبر`
                : ""}
              {parsed.duplicates.length > 0
                ? ` · ${toPersianDigits(parsed.duplicates.length)} تکراری`
                : ""}
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPasteOpen(true)}
            className="mt-4 w-full text-[13px] font-semibold text-brand-700 dark:text-brand-400 py-2.5 rounded-xl active:bg-brand-50/80 dark:active:bg-brand-500/10"
          >
            یا شماره‌ها را همین‌جا بچسبان
          </button>
        )}
      </SheetShell>
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
            disabled={!phoneOk || creating}
            onClick={() => void onCreate()}
            className="btn-primary w-full min-h-12"
          >
            {creating ? "در حال ساخت…" : "ساخت لینک"}
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
        دعوت به حلقه‌ات
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
        جایگاهش کجا باشد؟
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
      <button
        type="button"
        onClick={() => setMode("wave")}
        className="mt-4 w-full text-right px-3.5 py-3 rounded-xl bg-brand-50 dark:bg-brand-500/15 active:scale-[0.99] transition-transform duration-150"
      >
        <span className="block text-[13px] font-bold text-brand-700 dark:text-brand-400">
          دعوت یک گروه
        </span>
        <span className="block text-[11px] text-ink-muted mt-0.5 leading-snug">
          یک لینک برای گروه یا چند شماره
        </span>
      </button>
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
  const [copied, setCopied] = useState(false);
  const url = inviteUrl(invite.code);
  const text = inviteShareText(inviterName, url);
  const isWave = invite.kind === "wave";
  const roster = invite.expected ?? [];
  const pendingPhones = roster.filter((row) => !row.joined).map((row) => row.phone);
  const waPhone = isWave ? undefined : invite.invitedPhone;
  const smsPhones = isWave
    ? pendingPhones.length > 0
      ? pendingPhones
      : undefined
    : invite.invitedPhone;
  const visibleRoster = roster.slice(0, 6);
  const extraRoster = roster.length - visibleRoster.length;

  async function onCopy() {
    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      show("لینک کپی شد");
    } else {
      show("کپی ممکن نشد");
    }
  }

  async function onShare() {
    const shared = await nativeShare({
      title: "دعوت به حلقه‌ات",
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
        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-11 text-[13px] font-semibold text-ink-muted dark:text-zinc-400 active:opacity-70"
        >
          بعداً می‌فرستم
        </button>
      }
    >
      <div className="flex flex-col items-center text-center pt-0.5">
        <span
          className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-600/20"
          aria-hidden
        >
          <svg
            className="w-[18px] h-[18px]"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
          </svg>
        </span>
        <h2
          id="invite-share-title"
          className="mt-2.5 font-extrabold text-[1.15rem] text-ink dark:text-zinc-50 tracking-tight"
        >
          لینک آماده است
        </h2>
        <p className="text-[13px] text-ink-muted mt-1 leading-relaxed max-w-[19rem]">
          {isWave
            ? roster.length > 0
              ? `یک لینک برای ${toPersianDigits(roster.length)} نفر. همان را بفرست.`
              : "این لینک را در گروه بفرست. تا نپیوندند عضو نیستند."
            : "این لینک را برایش بفرست. تا نپیوندد عضو نیست."}
        </p>
      </div>

      {roster.length > 0 && (
        <ul className="mt-4 rounded-2xl border border-stone-200/80 dark:border-zinc-700 divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden">
          {visibleRoster.map((row) => {
            const name = row.name?.trim();
            return (
              <li key={row.id} className="flex items-center gap-2.5 px-3 py-2">
                <span
                  className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 font-extrabold text-[13px] flex items-center justify-center shrink-0"
                  aria-hidden
                >
                  {(name || "؟").charAt(0)}
                </span>
                <span className="min-w-0 flex-1 text-right">
                  <span className="block text-[13px] font-bold text-ink dark:text-zinc-100 truncate">
                    {name || formatPhoneDisplay(row.phone)}
                  </span>
                  {name ? (
                    <span
                      dir="ltr"
                      className="block text-[11px] text-ink-muted nums tracking-wide mt-0.5"
                    >
                      {formatPhoneDisplay(row.phone)}
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
          {extraRoster > 0 && (
            <li className="px-3 py-2 text-[12px] font-semibold text-ink-muted nums">
              و {toPersianDigits(extraRoster)} نفر دیگر
            </li>
          )}
        </ul>
      )}

      <div className="mt-3 rounded-2xl bg-stone-50 dark:bg-zinc-800/70 px-3 py-2 flex items-center gap-2">
        <div className="min-w-0 flex-1 text-right">
          <p className="text-[11px] font-bold text-ink-muted">
            {isWave ? "لینک گروهی" : "لینک"}
          </p>
          <p
            dir="ltr"
            className="text-[12px] font-medium text-ink dark:text-zinc-200 truncate text-left mt-0.5"
          >
            {url.replace(/^https?:\/\//, "")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onCopy()}
          className="shrink-0 min-h-9 px-2.5 rounded-lg text-[12px] font-bold text-brand-700 dark:text-brand-400 bg-[color:var(--circle-surface)] dark:bg-zinc-900 ring-1 ring-stone-200/80 dark:ring-zinc-700 active:scale-[0.98] transition-transform duration-150"
        >
          {copied ? "کپی شد" : "کپی"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <a
          href={whatsappShareHref(text, waPhone)}
          target="_blank"
          rel="noreferrer"
          className="btn-primary min-h-12 text-center shadow-md shadow-brand-600/20 active:scale-[0.98] transition-transform duration-150"
        >
          واتساپ
        </a>
        <a
          href={smsShareHref(text, smsPhones)}
          className="btn-ghost min-h-12 text-center active:scale-[0.98] transition-transform duration-150"
        >
          پیامک
        </a>
      </div>
      <button
        type="button"
        onClick={() => void onShare()}
        className="w-full mt-1 min-h-9 text-[12px] font-semibold text-ink-faint active:opacity-70"
      >
        اشتراک دیگر
      </button>
    </SheetShell>
  );
}
