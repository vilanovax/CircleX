"use client";

import { memo, useMemo, useState } from "react";
import * as jalaali from "jalaali-js";
import { CalendarIcon } from "@/components/Icons";
import { toPersianDigits } from "@/lib/persian";

const { jalaaliMonthLength, toGregorian, toJalaali } = jalaali;

const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

function isoFromJalaali(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  const mm = String(gm).padStart(2, "0");
  const dd = String(gd).padStart(2, "0");
  return `${gy}-${mm}-${dd}`;
}

function jalaaliFromIso(iso: string): { jy: number; jm: number; jd: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [gy, gm, gd] = iso.split("-").map(Number);
  return toJalaali(gy, gm, gd);
}

function formatJalaliLabel(iso: string): string {
  const j = jalaaliFromIso(iso);
  if (!j) return "";
  const g = new Date(`${iso}T12:00:00`);
  const weekday = new Intl.DateTimeFormat("fa-IR", { weekday: "long" }).format(g);
  return `${weekday} ${toPersianDigits(j.jd)} ${MONTHS[j.jm - 1]} ${toPersianDigits(j.jy)}`;
}

/** Compact Jalali (Shamsi) date picker — stores Gregorian ISO `YYYY-MM-DD`. */
function JalaliDateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  const today = useMemo(() => {
    const n = new Date();
    return toJalaali(n.getFullYear(), n.getMonth() + 1, n.getDate());
  }, []);

  const selected = value ? jalaaliFromIso(value) : null;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() =>
    selected
      ? { jy: selected.jy, jm: selected.jm }
      : { jy: today.jy, jm: today.jm },
  );

  const daysInMonth = jalaaliMonthLength(view.jy, view.jm);
  // Saturday-first week: JS getDay() Sun=0 → shift so Sat=0
  const firstG = toGregorian(view.jy, view.jm, 1);
  const firstDow = new Date(firstG.gy, firstG.gm - 1, firstG.gd).getDay();
  const startOffset = (firstDow + 1) % 7;

  function prevMonth() {
    setView((v) =>
      v.jm === 1 ? { jy: v.jy - 1, jm: 12 } : { jy: v.jy, jm: v.jm - 1 },
    );
  }

  function nextMonth() {
    setView((v) =>
      v.jm === 12 ? { jy: v.jy + 1, jm: 1 } : { jy: v.jy, jm: v.jm + 1 },
    );
  }

  function pick(jd: number) {
    onChange(isoFromJalaali(view.jy, view.jm, jd));
    setOpen(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (selected) setView({ jy: selected.jy, jm: selected.jm });
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        className={`field !flex items-center gap-2 text-right ${
          value ? "text-ink dark:text-zinc-100" : "text-ink-faint"
        }`}
      >
        <CalendarIcon className="w-4 h-4 text-brand-600 shrink-0" />
        <span className="flex-1 truncate nums">
          {value ? formatJalaliLabel(value) : "انتخاب تاریخ شمسی"}
        </span>
      </button>

      {open && (
        <div className="mt-2 rounded-2xl border border-stone-200/80 dark:border-zinc-700 bg-[color:var(--circle-surface)] dark:bg-zinc-900 p-3 shadow-sm animate-fade-up">
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg text-ink-muted hover:bg-stone-100 dark:hover:bg-zinc-800 font-bold"
              aria-label="ماه بعد"
            >
              ‹
            </button>
            <p className="text-[13px] font-bold text-ink dark:text-zinc-100 nums">
              {MONTHS[view.jm - 1]} {toPersianDigits(view.jy)}
            </p>
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg text-ink-muted hover:bg-stone-100 dark:hover:bg-zinc-800 font-bold"
              aria-label="ماه قبل"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[11px] font-bold text-ink-faint py-1"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const jd = i + 1;
              const iso = isoFromJalaali(view.jy, view.jm, jd);
              const isSelected = value === iso;
              const isToday =
                view.jy === today.jy &&
                view.jm === today.jm &&
                jd === today.jd;
              return (
                <button
                  key={jd}
                  type="button"
                  onClick={() => pick(jd)}
                  className={`h-9 rounded-lg text-[12px] font-bold nums transition-colors active:scale-95 ${
                    isSelected
                      ? "bg-brand-600 text-white"
                      : isToday
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                        : "text-ink dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {toPersianDigits(jd)}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              onChange(isoFromJalaali(today.jy, today.jm, today.jd));
              setView({ jy: today.jy, jm: today.jm });
              setOpen(false);
            }}
            className="mt-2.5 w-full text-[12px] font-semibold text-brand-600 dark:text-brand-400 py-1.5"
          >
            امروز
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(JalaliDateField);
