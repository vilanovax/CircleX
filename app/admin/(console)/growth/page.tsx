import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { loadAdminAnalytics } from "@/lib/admin-metrics";
import { GrowthClient } from "./GrowthClient";

function parseDays(raw: string | string[] | undefined): 7 | 14 | 30 {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "7") return 7;
  if (value === "30") return 30;
  return 14;
}

export default async function AdminGrowthPage({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const days = parseDays(searchParams.days);
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  try {
    const data = await loadAdminAnalytics(days);
    return <GrowthClient data={data} canExportUsers={admin.role !== "analyst"} />;
  } catch {
    return (
      <p role="alert" className="text-[13px] text-red-600">
        خواندن رشد نشد
      </p>
    );
  }
}
