"use client";

import { useState } from "react";
import SheetShell from "@/components/SheetShell";
import { useToast } from "@/components/Toast";
import { levelHint, levelLabels, relationLabels } from "@/lib/labels";
import {
  GROUP_PRIVATE_LINE,
  WAVE_MAX_USES,
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
  const { me, createInvite, createInvitesBatch } = useStore();
  const { show } = useToast();
  const [mode, setMode] = useState<"personal" | "wave">("personal");
  const [relation, setRelation] = useState<RelationType>("friend");
  const [waveRelation, setWaveRelation] = useState<RelationType>("family");
  const [level, setLevel] = useState<TrustLevel>("B");
  const [phoneInput, setPhoneInput] = useState("");
  const [created, setCreated] = useState<Invite | null>(null);
  const [batch, setBatch] = useState<Invite[] | null>(null);
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
    setCreating(true);
    try {
      const invite = await createInvite({
        relationType: waveRelation,
        kind: "wave",
      });
      setCreated(invite);
    } catch {
      show("ساخت لینک ممکن نشد");
    } finally {
      setCreating(false);
    }
  }

  async function onCreateBatch() {
    const parsed = parseInviteLines(pasteText);
    if (parsed.valid.length === 0 || creating) return;
    setCreating(true);
    try {
      const invites = await createInvitesBatch({
        relationType: waveRelation,
        people: parsed.valid,
      });
      setBatch(invites);
    } catch {
      show("ساخت دعوت‌ها ممکن نشد");
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

  if (batch && batch.length > 0) {
    return (
      <BatchSharePanel
        invites={batch}
        inviterName={me.name}
        onClose={onClose}
      />
    );
  }

  if (mode === "wave") {
    const parsed = parseInviteLines(pasteText);
    return (
      <SheetShell
        onClose={onClose}
        labelledBy="wave-invite-title"
        zClass="z-50"
        footer={
          <div className="flex flex-col gap-1 pb-1">
            {pasteOpen ? (
              <button
                type="button"
                disabled={creating || parsed.valid.length === 0}
                onClick={() => void onCreateBatch()}
                className="btn-primary w-full min-h-12 shadow-md shadow-brand-600/20 active:scale-[0.98] transition-transform duration-150"
              >
                {creating
                  ? "در حال ساخت…"
                  : parsed.valid.length > 0
                    ? `ساخت ${toPersianDigits(parsed.valid.length)} دعوت`
                    : "حداقل یک شماره معتبر"}
              </button>
            ) : (
              <button
                type="button"
                disabled={creating}
                onClick={() => void onCreateWave()}
                className="btn-primary w-full min-h-12 shadow-md shadow-brand-600/20 active:scale-[0.98] transition-transform duration-150"
              >
                {creating ? "در حال ساخت…" : "ساخت لینک گروهی"}
              </button>
            )}
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
          چند نفر با یک لینک
        </h2>
        <p className="text-[13px] text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed">
          لینک را در گروه بفرست. تا {toPersianDigits(WAVE_MAX_USES)} نفر
          می‌توانند بپیوندند. جایگاه را بعداً عوض می‌کنی.
        </p>

        <p className="text-[13px] font-bold mt-5 mb-2 text-ink dark:text-zinc-200">
          این لینک برای کیست؟
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label="نسبت موج"
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
          پیش‌فرض جایگاه: افراد مورد اعتماد — فقط خودت می‌بینی.
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
                ? `${toPersianDigits(parsed.valid.length)} شماره آماده`
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
            یا چند شماره جدا وارد کن
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
            {creating ? "در حال ساخت…" : "ساخت لینک دعوت"}
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
      <button
        type="button"
        onClick={() => setMode("wave")}
        className="mt-4 w-full text-right px-3.5 py-3 rounded-xl bg-brand-50 dark:bg-brand-500/15 active:scale-[0.99] transition-transform duration-150"
      >
        <span className="block text-[13px] font-bold text-brand-700 dark:text-brand-400">
          چند نفر با یک لینک
        </span>
        <span className="block text-[11px] text-ink-muted mt-0.5 leading-snug">
          گروه واتساپ، یا چند شماره یک‌جا
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
  const url = inviteUrl(invite.code);
  const text = inviteShareText(inviterName, url);
  const isWave = invite.kind === "wave";

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
        {isWave
          ? "این لینک را در گروه بفرست. تا وقتی نپیوندند در حلقه دیده نمی‌شوند."
          : "این لینک را برایش بفرست. تا وقتی نپیوندد در حلقه دیده نمی‌شود."}
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

function batchPersonLabel(invite: Invite): { name: string; phone?: string } {
  const phone = invite.invitedPhone;
  const raw = invite.invitedName?.trim() ?? "";
  const stripped = raw
    .replace(/[0-9۰-۹+]/g, "")
    .replace(/[،,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    name: stripped || "بدون نام",
    phone: phone || undefined,
  };
}

function BatchSharePanel({
  invites,
  inviterName,
  onClose,
}: {
  invites: Invite[];
  inviterName: string;
  onClose: () => void;
}) {
  const { show } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="batch-share-title"
      zClass="z-50"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-12 rounded-xl font-bold text-[15px] text-ink dark:text-zinc-100 bg-stone-100 dark:bg-zinc-800 active:scale-[0.99] transition-transform duration-150"
        >
          تمام
        </button>
      }
    >
      <div className="flex items-center gap-2">
        <h2
          id="batch-share-title"
          className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50"
        >
          دعوت‌ها آماده شد
        </h2>
        <span className="inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/15 text-[11px] font-bold text-brand-700 dark:text-brand-400 nums">
          {toPersianDigits(invites.length)}
        </span>
      </div>
      <p className="text-[13px] text-ink-muted mt-1.5 leading-relaxed">
        هر لینک را جدا برای همان نفر بفرست. تا نپیوندد عضو نیست.
      </p>
      <ul className="mt-4 space-y-2.5">
        {invites.map((invite) => {
          const url = inviteUrl(invite.code);
          const text = inviteShareText(inviterName, url);
          const { name, phone } = batchPersonLabel(invite);
          const copied = copiedId === invite.id;
          return (
            <li
              key={invite.id}
              className="rounded-2xl border border-stone-200/80 dark:border-zinc-700 px-3 py-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-400 font-extrabold text-[15px] flex items-center justify-center shrink-0"
                  aria-hidden
                >
                  {name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[14px] text-ink dark:text-zinc-100 truncate leading-snug">
                    {name}
                  </p>
                  {phone && (
                    <p
                      dir="ltr"
                      className="text-[12px] text-ink-muted mt-0.5 nums tracking-wide"
                    >
                      {formatPhoneDisplay(phone)}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <a
                  href={whatsappShareHref(text, phone)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary !py-2.5 text-[13px] text-center font-bold active:scale-[0.98] transition-transform duration-150"
                >
                  واتساپ
                </a>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyText(url);
                    if (ok) setCopiedId(invite.id);
                    show(ok ? "لینک کپی شد" : "کپی ممکن نشد");
                  }}
                  className="min-h-11 rounded-xl text-[13px] font-bold bg-stone-100 dark:bg-zinc-800 text-ink dark:text-zinc-100 active:scale-[0.98] transition-transform duration-150"
                >
                  {copied ? "کپی شد" : "کپی لینک"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </SheetShell>
  );
}
