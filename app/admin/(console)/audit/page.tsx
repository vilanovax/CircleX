import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminSkeleton } from "@/components/admin/AdminBits";
import { ADMIN_ROLES, getAdminSession } from "@/lib/admin-auth";
import {
  loadAdminAuditPage,
  parseAuditGroup,
} from "@/lib/admin-audit-list";
import { AuditClient } from "./AuditClient";

async function AuditLoaded({
  searchParams,
}: {
  searchParams: { group?: string; q?: string };
}) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  if (!(ADMIN_ROLES.auditRead as readonly string[]).includes(admin.role)) {
    return (
      <div>
        <div className="admin-page-head">
          <div>
            <h1 className="text-[20px] font-semibold">لاگ عملیات</h1>
            <p className="mt-1 text-[13px] text-ink-muted">
              این بخش برای ناظر و مدیر کل است. دلیل مسدود و جزئیات اپراتور اینجا
              دیده می‌شود.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const group = parseAuditGroup(searchParams.group);
  const q = (searchParams.q ?? "").trim();
  try {
    const data = await loadAdminAuditPage(group, q);
    return (
      <AuditClient
        key={group}
        group={group}
        initialQ={q}
        initialItems={data.items}
        initialTotal={data.total}
      />
    );
  } catch {
    return (
      <p role="alert" className="text-[13px] text-red-600">
        خواندن لاگ نشد
      </p>
    );
  }
}

export default function AdminAuditPage({
  searchParams,
}: {
  searchParams: { group?: string; q?: string };
}) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AuditLoaded searchParams={searchParams} />
    </Suspense>
  );
}
