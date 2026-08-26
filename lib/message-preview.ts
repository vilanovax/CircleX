import type { Message } from "@/lib/types";

export function threadPreview(
  last: Message | undefined,
  getListing: (id: string) => { title: string } | undefined,
): string {
  if (!last) return "شروع گفتگو…";

  const text = last.text.trim();
  const isThreadTopic =
    last.threadListingId && last.listingId === last.threadListingId;
  if (last.listingId && !isThreadTopic) {
    if (text) {
      const prefix = last.fromMe ? "شما: " : "";
      return `${prefix}${text.length > 72 ? `${text.slice(0, 72)}…` : text}`;
    }
    if (last.imageUrl) {
      const prefix = last.fromMe ? "شما: " : "";
      return `${prefix}عکس`;
    }
    const title = getListing(last.listingId)?.title ?? "آگهی";
    return `معرفی آگهی: ${title}`;
  }

  const prefix = last.fromMe ? "شما: " : "";
  if (!text && last.imageUrl) return `${prefix}عکس`;
  if (!text) return `${prefix}پیام`;
  return `${prefix}${text.length > 72 ? `${text.slice(0, 72)}…` : text}`;
}
