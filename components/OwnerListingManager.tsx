"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MoreIcon } from "@/components/Icons";
import { lazyUi } from "@/lib/lazy-ui";
import { ApiError } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { listingThreadPeers } from "@/lib/thread-listing";
import type { Listing } from "@/lib/types";
import OwnerListingMenuSheet from "@/components/OwnerListingMenuSheet";

const EditListingSheet = lazyUi(() => import("@/components/EditListingSheet"));
const DeactivateListingSheet = lazyUi(
  () => import("@/components/DeactivateListingSheet"),
);
const DeleteListingSheet = lazyUi(() => import("@/components/DeleteListingSheet"));
const ListingStatsSheet = lazyUi(() => import("@/components/ListingStatsSheet"));

type Panel = "menu" | "edit" | "deactivate" | "stats" | "delete";

export function useOwnerListingFlow(
  listing: Listing,
  opts?: { onDeleted?: () => void },
) {
  const router = useRouter();
  const { show } = useToast();
  const messages = useStore((s) => s.messages);
  const ensureListing = useStore((s) => s.ensureListing);
  const setListingDealStatus = useStore((s) => s.setListingDealStatus);
  const deleteListing = useStore((s) => s.deleteListing);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [deleting, setDeleting] = useState(false);

  const peers = useMemo(
    () => listingThreadPeers(messages, listing.id),
    [messages, listing.id],
  );
  const conversationCount = peers.length;

  function close() {
    if (deleting) return;
    setPanel(null);
  }

  function openMenu() {
    setPanel("menu");
  }

  function openEdit() {
    if (listing.feedPreview) {
      void ensureListing(listing.id).then((found) => {
        if (found) setPanel("edit");
      });
      return;
    }
    setPanel("edit");
  }

  async function confirmDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteListing(listing.id);
      show("آگهی حذف شد");
      setPanel(null);
      opts?.onDeleted?.();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "آگهی حذف نشد");
    } finally {
      setDeleting(false);
    }
  }

  const sheets: ReactNode = (
    <>
      {panel === "menu" ? (
        <OwnerListingMenuSheet
          listing={listing}
          conversationCount={conversationCount}
          onClose={close}
          onEdit={openEdit}
          onStats={() => setPanel("stats")}
          onMessages={() => {
            if (peers.length === 1) {
              setPanel(null);
              router.push(
                `/messages/${encodeURIComponent(peers[0]!)}?listing=${encodeURIComponent(listing.id)}`,
              );
              return;
            }
            setPanel("stats");
          }}
          onDeactivate={() => setPanel("deactivate")}
          onReactivate={() => {
            void setListingDealStatus(listing.id, "available");
            setPanel(null);
            show("آگهی دوباره در حلقه دیده می‌شود");
          }}
          onDelete={() => setPanel("delete")}
        />
      ) : null}
      {panel === "edit" ? (
        <EditListingSheet listing={listing} onClose={close} />
      ) : null}
      {panel === "deactivate" ? (
        <DeactivateListingSheet
          title={listing.title}
          onClose={close}
          onConfirm={() => {
            void setListingDealStatus(listing.id, "inactive");
            setPanel(null);
            show("آگهی غیرفعال شد");
          }}
        />
      ) : null}
      {panel === "stats" ? (
        <ListingStatsSheet listing={listing} onClose={close} />
      ) : null}
      {panel === "delete" ? (
        <DeleteListingSheet
          title={listing.title}
          busy={deleting}
          onClose={close}
          onConfirm={() => {
            void confirmDelete();
          }}
        />
      ) : null}
    </>
  );

  return {
    menuOpen: panel === "menu",
    openMenu,
    openEdit,
    sheets,
  };
}

export default function OwnerListingManager({
  listing,
  onDeleted,
  className,
}: {
  listing: Listing;
  onDeleted?: () => void;
  className?: string;
}) {
  const { menuOpen, openMenu, sheets } = useOwnerListingFlow(listing, {
    onDeleted,
  });

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openMenu();
        }}
        className={
          className ??
          "inline-grid size-10 shrink-0 place-items-center appearance-none rounded-xl p-0 leading-none text-ink-faint hover:bg-stone-200/50 dark:hover:bg-zinc-800 transition-colors"
        }
        aria-label="گزینه‌های آگهی"
        aria-haspopup="dialog"
        aria-expanded={menuOpen}
        title="گزینه‌های آگهی"
      >
        <MoreIcon className="w-5 h-5" />
      </button>
      {sheets}
    </>
  );
}
