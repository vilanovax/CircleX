"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ADMIN_ROLE_LABELS } from "@/lib/admin-labels";
import { toPersianDigits } from "@/lib/persian";
import {
  AdminCount,
  AdminPill,
  AdminSkeleton,
  faAdminDate,
} from "@/components/admin/AdminBits";
import { useToast } from "@/components/Toast";

type Role = "superadmin" | "moderator" | "support" | "analyst";

type Operator = {
  id: string;
  email: string;
  name: string;
  role: Role;
  lastLoginAt: string | null;
  disabled: boolean;
  createdAt: string;
  sessions: number;
};

const ROLE_OPTIONS: Role[] = ["superadmin", "moderator", "support", "analyst"];

export default function AdminOperatorsPage() {
  const { show } = useToast();
  const [items, setItems] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Operator | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("support");
  const [password, setPassword] = useState("");

  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<Role>("support");
  const [editPassword, setEditPassword] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, me] = await Promise.all([
        api<{ items: Operator[] }>("/api/admin/operators"),
        api<{ admin: { id: string } }>("/api/admin/auth/me"),
      ]);
      setItems(list.items);
      setSelfId(me.admin.id);
      setSelected((cur) =>
        cur
          ? list.items.find((row) => row.id === cur.id) ?? list.items[0] ?? null
          : list.items[0] ?? null,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "اپراتورها خوانده نشد");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    setEditName(selected.name);
    setEditRole(selected.role);
    setEditPassword("");
  }, [selected?.id, selected?.name, selected?.role]);

  async function create() {
    setSaving(true);
    try {
      await api("/api/admin/operators", {
        method: "POST",
        body: JSON.stringify({ name, email, role, password }),
      });
      show("اپراتور ساخته شد");
      setName("");
      setEmail("");
      setPassword("");
      setRole("support");
      await load();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ساخته نشد");
    } finally {
      setSaving(false);
    }
  }

  async function saveSelected() {
    if (!selected) return;
    setSaving(true);
    try {
      await api(`/api/admin/operators/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName,
          role: editRole,
          ...(editPassword.trim() ? { password: editPassword } : {}),
        }),
      });
      show("ذخیره شد");
      setEditPassword("");
      await load();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ذخیره نشد");
    } finally {
      setSaving(false);
    }
  }

  async function setDisabled(next: boolean) {
    if (!selected) return;
    setSaving(true);
    try {
      await api(`/api/admin/operators/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ disabled: next }),
      });
      show(next ? "حساب غیرفعال شد" : "حساب فعال شد");
      await load();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ذخیره نشد");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="text-[20px] font-semibold">اپراتورها</h1>
          <AdminCount loading={loading}>
            {toPersianDigits(items.length)} نفر · فقط مدیر کل می‌سازد و نقش می‌دهد
          </AdminCount>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mb-3 text-[13px] text-red-600">
          {error}
        </p>
      ) : null}

      {loading && !items.length ? (
        <AdminSkeleton />
      ) : (
        <div className="admin-split">
          <div className="space-y-4">
            <div className="admin-panel admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>نام</th>
                    <th>نقش</th>
                    <th>ورود</th>
                    <th>وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => {
                    const active = selected?.id === row.id;
                    return (
                      <tr
                        key={row.id}
                        tabIndex={0}
                        aria-selected={active}
                        className={`cursor-pointer ${
                          active ? "bg-brand-50/80 dark:bg-brand-500/10" : ""
                        }`}
                        onClick={() => setSelected(row)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelected(row);
                          }
                        }}
                      >
                        <td>
                          <p className="font-medium">
                            {row.name}
                            {row.id === selfId ? " · تو" : ""}
                          </p>
                          <p className="text-[11px] text-ink-faint" dir="ltr">
                            {row.email}
                          </p>
                        </td>
                        <td>{ADMIN_ROLE_LABELS[row.role] ?? row.role}</td>
                        <td className="text-ink-faint">
                          {row.lastLoginAt ? faAdminDate(row.lastLoginAt) : "—"}
                        </td>
                        <td>
                          {row.disabled ? (
                            <AdminPill tone="warn">غیرفعال</AdminPill>
                          ) : (
                            <AdminPill tone="ok">فعال</AdminPill>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <form
              className="admin-panel space-y-3 p-4"
              onSubmit={(e) => {
                e.preventDefault();
                void create();
              }}
            >
              <h2 className="text-[14px] font-medium">اپراتور جدید</h2>
              <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[12.5px] font-medium">نام</span>
                <input
                  className="admin-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12.5px] font-medium">ایمیل</span>
                <input
                  className="admin-input"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12.5px] font-medium">نقش</span>
                <select
                  className="admin-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  {ROLE_OPTIONS.map((key) => (
                    <option key={key} value={key}>
                      {ADMIN_ROLE_LABELS[key]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[12.5px] font-medium">
                  رمز (حداقل ۸)
                </span>
                <input
                  className="admin-input"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </label>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="admin-btn w-full rounded-xl bg-brand-600 py-2 text-[13.5px] font-medium text-white hover:bg-brand-700 disabled:opacity-60 sm:w-auto sm:px-5"
              >
                {saving ? "در حال ذخیره…" : "ساختن اپراتور"}
              </button>
            </form>
          </div>

          <aside className="admin-panel h-fit p-4 lg:sticky lg:top-5">
            {!selected ? (
              <p className="text-[13px] text-ink-faint">یک اپراتور را انتخاب کن</p>
            ) : (
              <div className="space-y-3 text-[13px]">
                <h2 className="text-[15px] font-semibold">{selected.name}</h2>
                <p className="text-ink-faint" dir="ltr">
                  {selected.email}
                </p>
                <p className="text-ink-muted">
                  سشن زنده: {toPersianDigits(selected.sessions)}
                </p>
                <label className="block">
                  <span className="mb-1 block text-[12.5px] font-medium">نام</span>
                  <input
                    className="admin-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12.5px] font-medium">نقش</span>
                  <select
                    className="admin-input"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as Role)}
                  >
                    {ROLE_OPTIONS.map((key) => (
                      <option key={key} value={key}>
                        {ADMIN_ROLE_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12.5px] font-medium">
                    رمز تازه (اختیاری)
                  </span>
                  <input
                    className="admin-input"
                    type="password"
                    autoComplete="new-password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    minLength={8}
                    placeholder="خالی بماند اگر عوض نشود"
                  />
                </label>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveSelected()}
                  className="admin-btn w-full rounded-xl bg-brand-600 py-2 text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  ذخیره تغییرات
                </button>
                {selected.id !== selfId ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void setDisabled(!selected.disabled)}
                    className="admin-btn w-full rounded-xl border border-black/10 py-2 disabled:opacity-60 dark:border-white/15"
                  >
                    {selected.disabled ? "فعال کردن" : "غیرفعال کردن"}
                  </button>
                ) : (
                  <p className="text-[12px] text-ink-faint">
                    حساب خودت را از اینجا نمی‌شود بست.
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
