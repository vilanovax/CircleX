export function faAdminDate(iso: string): string {
  return new Date(iso).toLocaleString("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
      className={`flex gap-1 overflow-x-auto rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.06] ${className}`.trim()}
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
              : "text-ink-muted"
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
