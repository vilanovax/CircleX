import type { Metadata } from "next";
import { getAdminSession } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ادمین سیرکل",
};

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  return <AdminShell admin={admin}>{children}</AdminShell>;
}
