/**
 * Notify platform admin about a listing report.
 * - Always logs (dev / audit trail).
 * - If ADMIN_WEBHOOK_URL is set, POSTs JSON there (Slack/Discord/custom inbox).
 */

export type ListingReportNotifyPayload = {
  reportId: string;
  reason: string;
  note: string | null;
  listing: {
    id: string;
    title: string;
    sellerId: string;
    sellerName: string;
    sellerPhone: string;
  };
  reporter: {
    id: string;
    name: string;
    phone: string;
  };
  createdAt: string;
};

export async function notifyAdminOfListingReport(
  payload: ListingReportNotifyPayload,
): Promise<void> {
  const line = `[listing-report] ${payload.reason} · listing=${payload.listing.id} "${payload.listing.title}" · reporter=${payload.reporter.phone} · report=${payload.reportId}`;
  console.info(line);

  const webhook = process.env.ADMIN_WEBHOOK_URL?.trim();
  if (!webhook) return;

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `گزارش آگهی: ${payload.listing.title} (${payload.reason})`,
        ...payload,
      }),
    });
    if (!res.ok) {
      console.warn(
        `[listing-report] webhook ${res.status} ${await res.text().catch(() => "")}`,
      );
    }
  } catch (err) {
    console.warn("[listing-report] webhook failed", err);
  }
}
