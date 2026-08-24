import { withBasePath } from "@/lib/avatar";
import type { ExportKind } from "@/lib/admin-csv";
import { toPersianDigits } from "@/lib/persian";

export function faAdminDate(iso: string): string {
  return new Date(iso).toLocaleString("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function faAdminRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const sec = Math.round((Date.now() - then) / 1000);
  if (sec < 45) return "همین الان";
  if (sec < 3600) return `${toPersianDigits(Math.max(1, Math.floor(sec / 60)))} دقیقه پیش`;
  if (sec < 86400) return `${toPersianDigits(Math.floor(sec / 3600))} ساعت پیش`;
  if (sec < 86400 * 2) return "دیروز";
  if (sec < 86400 * 7) return `${toPersianDigits(Math.floor(sec / 86400))} روز پیش`;
  return faAdminDate(iso);
}

export function AdminSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div className="admin-panel overflow-hidden" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="admin-skel-row" />
      ))}
    </div>
  );
}

export function AdminPill({
  tone = "muted",
  children,
}: {
  tone?: "warn" | "muted" | "ok";
  children: React.ReactNode;
}) {
  const cls =
    tone === "warn"
      ? "bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-200"
      : tone === "ok"
        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
        : "bg-black/[0.05] text-ink-muted dark:bg-white/[0.08]";
  return <span className={`admin-pill ${cls}`}>{children}</span>;
}

export function AdminCount({
  loading,
  children,
  className = "",
}: {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-[13px] text-ink-faint ${className}`.trim()}>
      {loading ? "در حال خواندن…" : children}
    </p>
  );
}

export function AdminTabs<T extends string>({
  value,
  onChange,
  items,
  label,
  className = "",
}: {
  value: T;
  onChange: (next: T) => void;
  items: readonly { key: T; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.06] ${className}`.trim()}
      role="tablist"
      aria-label={label}
    >
      {items.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={value === tab.key}
          onClick={() => onChange(tab.key)}
          className={`admin-btn shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] ${
            value === tab.key
              ? "bg-[var(--circle-surface)] font-medium shadow-sm"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function AdminSwitch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`admin-switch ${checked ? "is-on" : ""}`}
    />
  );
}

export function mergeById<T extends { id: string }>(current: T[], next: T[]): T[] {
  const seen = new Set(current.map((row) => row.id));
  return [...current, ...next.filter((row) => !seen.has(row.id))];
}

export function AdminLoadMore({
  shown,
  total,
  loading,
  onLoad,
  inset = true,
}: {
  shown: number;
  total: number;
  loading: boolean;
  onLoad: () => void;
  inset?: boolean;
}) {
  if (shown <= 0 || shown >= total) return null;
  const remaining = total - shown;
  const button = (
    <button
      type="button"
      disabled={loading}
      onClick={onLoad}
      className="admin-btn w-full rounded-xl border border-black/10 py-2 text-[12.5px] disabled:opacity-60 dark:border-white/15"
    >
      {loading
        ? "…"
        : `ادامه فهرست · ${toPersianDigits(remaining)} مورد دیگر`}
    </button>
  );
  if (!inset) return <div className="pt-2">{button}</div>;
  return (
    <div className="border-t border-black/5 p-3 dark:border-white/10">{button}</div>
  );
}

export async function downloadAdminCsv(kind: ExportKind): Promise<void> {
  const res = await fetch(withBasePath(`/api/admin/export?kind=${kind}`), {
    credentials: "same-origin",
  });
  if (!res.ok) {
    let message = "خروجی گرفته نشد";
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // keep default
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const header = res.headers.get("Content-Disposition") ?? "";
  const match = header.match(/filename="([^"]+)"/);
  a.href = url;
  a.download = match?.[1] ?? `circle-${kind}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
