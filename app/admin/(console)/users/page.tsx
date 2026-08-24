import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminSkeleton } from "@/components/admin/AdminBits";
import { ADMIN_ROLES, canSeeFullPhone, getAdminSession } from "@/lib/admin-auth";
import { loadAdminUsersPage } from "@/lib/admin-users";
import { UsersClient } from "./UsersClient";

function parseFlag(raw: string | string[] | undefined, yes: string): boolean {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === yes;
}

function parseQ(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? "").trim();
}

async function UsersLoaded({
  searchParams,
}: {
  searchParams: { q?: string; profile?: string; banned?: string };
}) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  if (!(ADMIN_ROLES.usersRead as readonly string[]).includes(admin.role)) {
    redirect("/admin");
  }

  const q = parseQ(searchParams.q);
  const incomplete = parseFlag(searchParams.profile, "incomplete");
  const banned = parseFlag(searchParams.banned, "1");

  try {
    const data = await loadAdminUsersPage(
      q,
      incomplete,
      banned,
      canSeeFullPhone(admin.role),
    );
    return (
      <UsersClient
        key={`${incomplete ? 1 : 0}-${banned ? 1 : 0}-${q}`}
        initialItems={data.items}
        initialTotal={data.total}
        initialQ={q}
        incomplete={incomplete}
        banned={banned}
      />
    );
  } catch {
    return (
      <p role="alert" className="text-[13px] text-red-600">
        فهرست کاربران خوانده نشد
      </p>
    );
  }
}

export default function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; profile?: string; banned?: string };
}) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <UsersLoaded searchParams={searchParams} />
    </Suspense>
  );
}
