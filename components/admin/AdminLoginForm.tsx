"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { CircleUsersIcon } from "@/components/Icons";

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      await api("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ورود انجام نشد");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 100% 0%, rgba(74, 58, 143, 0.1), transparent 55%), radial-gradient(ellipse 60% 40% at 0% 100%, rgba(31, 107, 66, 0.08), transparent 50%)",
        }}
      />
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="relative w-full max-w-sm rounded-2xl border border-black/5 bg-[var(--circle-surface)] p-6 shadow-card"
      >
        <div className="mb-5 flex items-center gap-2.5">
          <span className="admin-mark" aria-hidden>
            <CircleUsersIcon className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h1 className="text-[17px] font-semibold">ورود اپراتور</h1>
            <p className="text-[12px] text-ink-faint">پنل عملیات سیرکل</p>
          </div>
        </div>
        <label className="mb-3 block text-[13px]">
          ایمیل
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="admin-input mt-1"
          />
        </label>
        <label className="mb-4 block text-[13px]">
          رمز عبور
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="admin-input mt-1"
          />
        </label>
        {error ? (
          <p role="alert" className="mb-3 text-[12.5px] text-red-600">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={sending}
          className="admin-btn w-full rounded-xl bg-brand-600 py-2.5 text-[14px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {sending ? "در حال ورود…" : "ورود"}
        </button>
      </form>
    </div>
  );
}
