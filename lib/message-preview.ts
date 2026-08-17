import type { Message } from "@/lib/types";

export function threadPreview(
  last: Message | undefined,
  getListing: (id: string) => { title: string } | undefined,
): string {
  if (!last) return "شروع گفتگو…";

  const text = last.text.trim();
  if (last.listingId) {
    if (text) {
      const prefix = last.fromMe ? "شما: " : "";
      return `${prefix}${text.length > 72 ? `${text.slice(0, 72)}…` : text}`;
    }
    const title = getListing(last.listingId)?.title ?? "آگهی";
    return `معرفی آگهی: ${title}`;
  }

  const prefix = last.fromMe ? "شما: " : "";
  return `${prefix}${text.length > 72 ? `${text.slice(0, 72)}…` : text}`;
}
