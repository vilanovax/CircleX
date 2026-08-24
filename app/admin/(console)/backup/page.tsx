import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import BackupClient from "./BackupClient";

export const dynamic = "force-dynamic";

export default async function AdminBackupPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  if (admin.role !== "superadmin") redirect("/admin");
  return <BackupClient />;
}
