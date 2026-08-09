import type { Message } from "@/lib/types";

export function threadPreview(
  last: Message | undefined,
  getListing: (id: string) => { title: string } | undefined,
): string {
  if (!last) return "شروع گفتگو…";

  if (last.listingId) {
    const title = getListing(last.listingId)?.title ?? "آگهی";
    return `📷 معرفی آگهی: ${title}`;
  }

  const prefix = last.fromMe ? "شما: " : "";
  const text = last.text.trim();
  return `${prefix}${text.length > 72 ? `${text.slice(0, 72)}…` : text}`;
}
