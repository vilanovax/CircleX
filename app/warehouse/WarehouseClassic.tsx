"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmptyState from "@/components/EmptyState";
import ListingImage from "@/components/ListingImage";
import SheetShell from "@/components/SheetShell";
import WarehouseEmpty from "@/components/WarehouseEmpty";
import WarehouseTip from "@/components/WarehouseTip";
import { useToast } from "@/components/Toast";
import {
  ArchiveIcon,
  BellIcon,
  CameraIcon,
  CheckIcon,
  CloseIcon,
  NoteIcon,
  PencilIcon,
  PlusIcon,
  TagIcon,
  TrashIcon,
} from "@/components/Icons";
import { isWarehouseTipPending, markWarehouseTipSeen } from "@/lib/home-tip";
import { uploadListingPhoto } from "@/lib/listing-image";
import { toPersianDigits } from "@/lib/persian";
import { useStore } from "@/lib/store";
import {
  addLocalDays,
  folderCoverUrl,
  folderIsDue,
  localDayIso,
  photosInFolder,
  WAREHOUSE_MAX_PHOTOS,
  WAREHOUSE_NAME_MAX,
  WAREHOUSE_NOTE_MAX,
  type WarehouseFolder,
  type WarehousePhoto,
} from "@/lib/warehouse";
import {
  LISTING_HANDOFF_MAX_PHOTOS,
  stashWarehousePhotosForListing,
} from "@/lib/warehouse-handoff";
import { useWarehouse } from "@/lib/use-warehouse";

type View =
  | { kind: "home" }
  | { kind: "folder"; folderId: string }
  | { kind: "unsorted" };

export default function WarehouseClassic() {
  const router = useRouter();
  const { show } = useToast();
  const meId = useStore((s) => s.me.id);
  const {
    ready,
    state,
    stats,
    addFolder,
    rename,
    writeNote,
    writeRemindOn,
    removeFolder,
    ingestUrls,
    relocate,
    discard,
  } = useWarehouse(meId);

  const [view, setView] = useState<View>({ kind: "home" });
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [uploading, setUploading] = useState(false);
  const [folderSheet, setFolderSheet] = useState<
    null | "create" | { rename: string }
  >(null);
  const [noteSheet, setNoteSheet] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [moveSheet, setMoveSheet] = useState(false);
  const [addSheet, setAddSheet] = useState(false);
  const [pickUnsortedSheet, setPickUnsortedSheet] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [folderName, setFolderName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const activeFolder: WarehouseFolder | null = useMemo(() => {
    if (view.kind !== "folder") return null;
    return state.folders.find((f) => f.id === view.folderId) ?? null;
  }, [state.folders, view]);

  const visiblePhotos: WarehousePhoto[] = useMemo(() => {
    if (view.kind === "home") return [];
    if (view.kind === "unsorted") return photosInFolder(state, null);
    return photosInFolder(state, view.folderId);
  }, [state, view]);

  const unsortedPhotos: WarehousePhoto[] = useMemo(
    () => photosInFolder(state, null),
    [state],
  );

  useEffect(() => {
    setSelected(new Set());
    setAddSheet(false);
    setPickUnsortedSheet(false);
    setDeleteConfirm(false);
  }, [view]);

  const uploadTargetFolderId =
    view.kind === "folder" ? view.folderId : null;

  const canImportUnsorted =
    view.kind === "folder" && unsortedPhotos.length > 0;

  const title =
    view.kind === "home"
      ? "انبار"
      : view.kind === "unsorted"
        ? "بدون دسته"
        : (activeFolder?.name ?? "دسته");

  const subtitle =
    view.kind === "home"
      ? stats.photoCount > 0
        ? stats.folderCount > 0
          ? `${toPersianDigits(stats.photoCount)} عکس · ${toPersianDigits(stats.folderCount)} دسته`
          : stats.unsortedCount > 0
            ? `${toPersianDigits(stats.photoCount)} عکس · بدون دسته`
            : `${toPersianDigits(stats.photoCount)} عکس`
        : "عکس بگیر، بعداً آگهی کن"
      : `${toPersianDigits(visiblePhotos.length)} عکس`;

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  async function onFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const room = WAREHOUSE_MAX_PHOTOS - state.photos.length;
    if (room <= 0) {
      show("انبار پر است — بعضی عکس‌ها را حذف کن.");
      return;
    }
    const files = Array.from(fileList).slice(0, room);
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        urls.push(await uploadListingPhoto(file));
      }
      const result = ingestUrls(urls, uploadTargetFolderId);
      if (!result.ok) {
        show(result.error);
        return;
      }
      show(
        urls.length === 1
          ? "عکس بهینه شد و در انبار نشست ✓"
          : `${toPersianDigits(urls.length)} عکس بهینه شد و در انبار نشست ✓`,
      );
      if (view.kind === "home") {
        setView(
          uploadTargetFolderId
            ? { kind: "folder", folderId: uploadTargetFolderId }
            : { kind: "unsorted" },
        );
      }
    } catch (err) {
      show(err instanceof Error ? err.message : "بارگذاری عکس ناموفق بود.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function openCreateFolder() {
    setFolderName("");
    setFolderSheet("create");
  }

  function openRenameFolder(folderId: string, current: string) {
    setFolderName(current);
    setFolderSheet({ rename: folderId });
  }

  function submitFolderSheet() {
    if (folderSheet === "create") {
      const result = addFolder(folderName);
      if (!result.ok) {
        show(result.error);
        return;
      }
      setFolderSheet(null);
      setView({ kind: "folder", folderId: result.folder.id });
      show("دسته ساخته شد ✓");
      return;
    }
    if (folderSheet && "rename" in folderSheet) {
      const result = rename(folderSheet.rename, folderName);
      if (!result.ok) {
        show(result.error);
        return;
      }
      setFolderSheet(null);
      show("اسم دسته عوض شد ✓");
    }
  }

  function onDeleteFolder() {
    if (view.kind !== "folder" || !activeFolder) return;
    const ok = window.confirm(
      `دسته «${activeFolder.name}» حذف شود؟ عکس‌ها به «بدون دسته» می‌روند.`,
    );
    if (!ok) return;
    removeFolder(activeFolder.id, "keep-photos");
    setView({ kind: "home" });
    show("دسته حذف شد");
  }

  function onDeleteSelected() {
    if (selected.size === 0) return;
    setDeleteConfirm(true);
  }

  function confirmDeleteSelected() {
    if (selected.size === 0) {
      setDeleteConfirm(false);
      return;
    }
    const n = selected.size;
    discard(Array.from(selected));
    clearSelection();
    setDeleteConfirm(false);
    show(
      n === 1
        ? "عکس از انبار حذف شد"
        : `${toPersianDigits(n)} عکس از انبار حذف شد`,
    );
  }

  function onMoveSelected(folderId: string | null) {
    const result = relocate(Array.from(selected), folderId);
    if (!result.ok) {
      show(result.error);
      return;
    }
    setMoveSheet(false);
    clearSelection();
    show(folderId ? "به دسته منتقل شد ✓" : "به بدون‌دسته برگشت ✓");
  }

  function onImportUnsorted(photoIds: string[]) {
    if (view.kind !== "folder" || photoIds.length === 0) return;
    const result = relocate(photoIds, view.folderId);
    if (!result.ok) {
      show(result.error);
      return;
    }
    setPickUnsortedSheet(false);
    setAddSheet(false);
    show(
      photoIds.length === 1
        ? "عکس به این دسته آمد ✓"
        : `${toPersianDigits(photoIds.length)} عکس به این دسته آمد ✓`,
    );
  }

  function openAddPhotos() {
    if (canImportUnsorted) {
      setAddSheet(true);
      return;
    }
    fileRef.current?.click();
  }

  function onCreateListing() {
    if (selected.size === 0) return;
    const picked = visiblePhotos.filter((p) => selected.has(p.id));
    const urls = picked.map((p) => p.url);
    const photoIds = picked.map((p) => p.id);
    if (urls.length === 0) return;
    if (urls.length > LISTING_HANDOFF_MAX_PHOTOS) {
      show(
        `حداکثر ${toPersianDigits(LISTING_HANDOFF_MAX_PHOTOS)} عکس برای هر آگهی — اول انتخاب را کم کن.`,
      );
      return;
    }
    stashWarehousePhotosForListing(urls, photoIds);
    router.push("/new");
  }

  function openNoteSheet() {
    if (!activeFolder) return;
    setNoteDraft(activeFolder.note ?? "");
    setNoteSheet(true);
  }

  function submitNote() {
    if (!activeFolder) return;
    const result = writeNote(activeFolder.id, noteDraft);
    if (!result.ok) {
      show(result.error);
      return;
    }
    setNoteSheet(false);
    show(noteDraft.trim() ? "یادداشت ذخیره شد ✓" : "یادداشت پاک شد");
  }

  function setRemind(days: number | null) {
    if (!activeFolder) return;
    const remindOn =
      days == null ? null : addLocalDays(localDayIso(), days);
    const result = writeRemindOn(activeFolder.id, remindOn);
    if (!result.ok) {
      show(result.error);
      return;
    }
    if (days == null) show("یادآور برداشته شد");
    else if (days === 0) show("یادآور برای امروز ✓");
    else if (days === 1) show("یادآور برای فردا ✓");
    else show(`یادآور برای ${toPersianDigits(days)} روز دیگر ✓`);
  }

  function goBack() {
    if (view.kind !== "home") {
      setView({ kind: "home" });
      return;
    }
    router.back();
  }

  return (
    <main className="pb-28 min-h-[100dvh]">
      <Header
        title={title}
        subtitle={subtitle}
        back
        onBack={goBack}
        action={
          <button
            type="button"
            disabled={uploading}
            onClick={
              view.kind === "home"
                ? () => fileRef.current?.click()
                : openAddPhotos
            }
            aria-label="افزودن عکس به انبار"
            className="inline-grid size-9 shrink-0 place-items-center appearance-none rounded-xl bg-brand-600 p-0 leading-none text-white transition-[transform,background-color] duration-150 ease-out active:scale-[0.97] active:bg-brand-700 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
          >
            <CameraIcon className="w-5 h-5" />
          </button>
        }
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => onFiles(e.target.files)}
      />

      <div className="px-4 pt-3 space-y-3">
        {view.kind === "home" ? (
          <HomeView
            ready={ready}
            state={state}
            stats={stats}
            uploading={uploading}
            onUpload={() => fileRef.current?.click()}
            onOpenUnsorted={() => setView({ kind: "unsorted" })}
            onOpenFolder={(id) => setView({ kind: "folder", folderId: id })}
            onCreateFolder={openCreateFolder}
          />
        ) : (
          <AlbumView
            ready={ready}
            photos={visiblePhotos}
            selected={selected}
            uploading={uploading}
            folder={activeFolder}
            unsortedCount={
              view.kind === "folder" ? unsortedPhotos.length : 0
            }
            onToggle={toggleSelect}
            onAdd={openAddPhotos}
            onUpload={() => fileRef.current?.click()}
            onImportUnsorted={
              canImportUnsorted
                ? () => {
                    setAddSheet(false);
                    setPickUnsortedSheet(true);
                  }
                : undefined
            }
            onRename={
              activeFolder
                ? () => openRenameFolder(activeFolder.id, activeFolder.name)
                : undefined
            }
            onDeleteFolder={activeFolder ? onDeleteFolder : undefined}
            onEditNote={activeFolder ? openNoteSheet : undefined}
            onRemind={activeFolder ? setRemind : undefined}
          />
        )}
      </div>

      {selected.size > 0 && !deleteConfirm ? (
        <SelectionBar
          count={selected.size}
          onClear={clearSelection}
          onMove={() => setMoveSheet(true)}
          onDelete={onDeleteSelected}
          onListing={onCreateListing}
        />
      ) : null}

      {folderSheet ? (
        <FolderNameSheet
          mode={folderSheet === "create" ? "create" : "rename"}
          value={folderName}
          onChange={setFolderName}
          onClose={() => setFolderSheet(null)}
          onSubmit={submitFolderSheet}
        />
      ) : null}

      {noteSheet && activeFolder ? (
        <NoteSheet
          value={noteDraft}
          onChange={setNoteDraft}
          onClose={() => setNoteSheet(false)}
          onSubmit={submitNote}
        />
      ) : null}

      {moveSheet ? (
        <MoveSheet
          folders={state.folders}
          currentFolderId={view.kind === "folder" ? view.folderId : null}
          onClose={() => setMoveSheet(false)}
          onPick={onMoveSelected}
        />
      ) : null}

      {addSheet ? (
        <AddPhotosSheet
          unsortedCount={unsortedPhotos.length}
          uploading={uploading}
          onClose={() => setAddSheet(false)}
          onUpload={() => {
            setAddSheet(false);
            fileRef.current?.click();
          }}
          onFromUnsorted={() => {
            setAddSheet(false);
            setPickUnsortedSheet(true);
          }}
        />
      ) : null}

      {pickUnsortedSheet && view.kind === "folder" ? (
        <PickUnsortedSheet
          photos={unsortedPhotos}
          folderName={activeFolder?.name ?? "این دسته"}
          onClose={() => setPickUnsortedSheet(false)}
          onConfirm={onImportUnsorted}
        />
      ) : null}

      {deleteConfirm ? (
        <DeletePhotosSheet
          count={selected.size}
          onClose={() => setDeleteConfirm(false)}
          onConfirm={confirmDeleteSelected}
        />
      ) : null}

      <BottomNav />
    </main>
  );
}

function HomeView({
  ready,
  state,
  stats,
  uploading,
  onUpload,
  onOpenUnsorted,
  onOpenFolder,
  onCreateFolder,
}: {
  ready: boolean;
  state: ReturnType<typeof useWarehouse>["state"];
  stats: ReturnType<typeof useWarehouse>["stats"];
  uploading: boolean;
  onUpload: () => void;
  onOpenUnsorted: () => void;
  onOpenFolder: (id: string) => void;
  onCreateFolder: () => void;
}) {
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    if (!ready || stats.photoCount === 0) {
      setShowTip(false);
      return;
    }
    setShowTip(isWarehouseTipPending());
  }, [ready, stats.photoCount]);

  if (!ready) {
    return (
      <div className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/3] animate-pulse rounded-[1.125rem] bg-stone-100 dark:bg-zinc-800"
          />
        ))}
      </div>
    );
  }

  if (stats.photoCount === 0 && stats.folderCount === 0) {
    return <WarehouseEmpty uploading={uploading} onUpload={onUpload} />;
  }

  const tileCount = state.folders.length + (stats.unsortedCount > 0 ? 1 : 0);

  return (
    <div className="space-y-4">
      {showTip ? (
        <WarehouseTip
          onDismiss={() => {
            markWarehouseTipSeen();
            setShowTip(false);
          }}
        />
      ) : (
        <HomeStatusCard
          stats={stats}
          onOpenUnsorted={
            stats.unsortedCount > 0 ? onOpenUnsorted : undefined
          }
        />
      )}

      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <p className="text-[12px] font-semibold text-ink-muted dark:text-zinc-400">
            {stats.folderCount > 0 || stats.unsortedCount > 0
              ? "عکس‌ها"
              : "دسته‌ها"}
            {stats.folderCount > 0 || stats.unsortedCount > 0 ? (
              <span className="ms-1 nums text-ink-faint">
                {toPersianDigits(tileCount)}
              </span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={onCreateFolder}
            className="inline-flex min-h-8 items-center gap-1 rounded-lg px-1.5 text-[12px] font-semibold text-brand-700 transition-opacity duration-150 active:opacity-70 dark:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <PlusIcon className="h-4 w-4" />
            دستهٔ جدید
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {stats.unsortedCount > 0 ? (
            <FolderTile
              title="بدون دسته"
              count={stats.unsortedCount}
              cover={photosInFolder(state, null)[0]?.url ?? null}
              onClick={onOpenUnsorted}
              inbox
            />
          ) : null}
          {state.folders.map((folder) => (
            <FolderTile
              key={folder.id}
              title={folder.name}
              count={photosInFolder(state, folder.id).length}
              cover={folderCoverUrl(state, folder.id)}
              onClick={() => onOpenFolder(folder.id)}
              note={folder.note}
              due={
                folderIsDue(folder) &&
                photosInFolder(state, folder.id).length > 0
              }
              hasRemind={Boolean(folder.remindOn)}
            />
          ))}
          <button
            type="button"
            onClick={onCreateFolder}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-[1.125rem] border border-dashed border-stone-300/90 bg-[color:var(--circle-surface)] text-ink-faint transition-transform duration-150 active:scale-[0.98] dark:border-zinc-600 dark:bg-zinc-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <PlusIcon className="h-4 w-4" />
            </span>
            <span className="text-[12px] font-semibold text-ink-muted dark:text-zinc-400">
              ساخت دسته
            </span>
            <span className="px-3 text-center text-[11px] text-pretty text-ink-faint dark:text-zinc-500">
              مثلاً اتاق مادر
            </span>
          </button>
        </div>
      </div>

      <button
        type="button"
        disabled={uploading}
        onClick={onUpload}
        className="btn-primary inline-flex w-full items-center justify-center gap-2 !py-3.5 text-[14px] font-bold transition-transform duration-150 active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
      >
        <CameraIcon className="h-5 w-5" />
        {uploading ? "در حال بهینه‌سازی…" : "افزودن عکس"}
      </button>
    </div>
  );
}

function HomeStatusCard({
  stats,
  onOpenUnsorted,
}: {
  stats: ReturnType<typeof useWarehouse>["stats"];
  onOpenUnsorted?: () => void;
}) {
  const folderStacks =
    stats.waitingStacks - (stats.unsortedCount > 0 ? 1 : 0);
  const due = stats.dueReminders > 0;

  let title: string;
  let body: string;
  if (due) {
    title = `${toPersianDigits(stats.dueReminders)} یادآور رسیده`;
    body = "وقت آگهی کردن عکس‌هایی است که یادآورشان رسیده.";
  } else if (folderStacks === 0 && stats.unsortedCount > 0) {
    title = `${toPersianDigits(stats.unsortedCount)} عکس آمادهٔ آگهی`;
    body = "انتخاب کن و آگهی بساز — یا اول در یک دسته بچین.";
  } else if (stats.waitingStacks > 0) {
    title = `${toPersianDigits(stats.waitingStacks)} دسته منتظر آگهی`;
    body = "عکس‌ها آماده‌اند — وقتی خواستی انتخاب کن و آگهی بساز.";
  } else {
    title = "عکس‌ها اینجا می‌مانند تا وقت آگهی برسد";
    body = "بعد از آپلود، سایز و حجم استاندارد می‌شود.";
  }

  const interactive = Boolean(onOpenUnsorted) && !due && folderStacks === 0;

  const inner = (
    <div className="flex items-start gap-3 text-right">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          due
            ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
            : interactive
              ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
              : "bg-stone-100 text-ink-muted dark:bg-zinc-800 dark:text-zinc-400"
        }`}
      >
        {due ? (
          <BellIcon className="h-4 w-4" />
        ) : interactive ? (
          <ArchiveIcon className="h-4 w-4" />
        ) : (
          <TagIcon className="h-4 w-4" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-snug text-ink dark:text-zinc-100">
          {title}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-muted dark:text-zinc-400">
          {body}
        </p>
        {interactive ? (
          <span className="mt-2 inline-flex items-center gap-0.5 text-[11px] font-semibold text-brand-700 dark:text-brand-300">
            باز کردن بدون دسته
            <span aria-hidden>‹</span>
          </span>
        ) : null}
      </div>
    </div>
  );

  const shell = `card px-3.5 py-3 ${
    due ? "ring-1 ring-amber-400/50 bg-amber-50/70 dark:bg-amber-500/10" : ""
  }`;

  if (interactive && onOpenUnsorted) {
    return (
      <button
        type="button"
        onClick={onOpenUnsorted}
        className={`${shell} w-full transition-transform duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2`}
      >
        {inner}
      </button>
    );
  }

  return <div className={shell}>{inner}</div>;
}

function FolderTile({
  title,
  count,
  cover,
  onClick,
  inbox,
  note,
  due,
  hasRemind,
}: {
  title: string;
  count: number;
  cover: string | null;
  onClick: () => void;
  inbox?: boolean;
  note?: string;
  due?: boolean;
  hasRemind?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative aspect-[4/3] overflow-hidden rounded-[1.125rem] text-right transition-transform duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ring-1 ${
        due
          ? "ring-amber-400"
          : inbox
            ? "ring-brand-500/35"
            : "ring-stone-200/80 dark:ring-zinc-700"
      }`}
    >
      {cover ? (
        <ListingImage
          image={cover}
          size="hero"
          frameClassName="absolute inset-0 h-full w-full rounded-none"
        />
      ) : (
        <div
          className={`absolute inset-0 ${
            inbox
              ? "bg-gradient-to-br from-brand-50 to-stone-100 dark:from-brand-500/15 dark:to-zinc-800"
              : "bg-gradient-to-br from-stone-100 to-stone-200/80 dark:from-zinc-800 dark:to-zinc-900"
          }`}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent" />
      {(inbox || note || hasRemind || due) && (
        <div className="absolute top-1.5 start-1.5 flex items-center gap-1">
          {inbox ? (
            <span className="rounded-md bg-white/95 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700 shadow-sm">
              صندوق
            </span>
          ) : null}
          {due ? (
            <span className="rounded-md bg-amber-400 px-1.5 py-0.5 text-[11px] font-semibold text-ink">
              یادآور
            </span>
          ) : hasRemind ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink/45 text-white">
              <BellIcon className="h-3.5 w-3.5" />
            </span>
          ) : null}
          {note ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink/45 text-white">
              <NoteIcon className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <p className="truncate text-[13px] font-semibold text-white">{title}</p>
        <p className="mt-0.5 truncate text-[11px] text-white/85 nums">
          {count === 0
            ? "خالی"
            : `${toPersianDigits(count)} عکس`}
          {note && count > 0 ? ` · ${note}` : ""}
        </p>
      </div>
    </button>
  );
}

function AlbumView({
  ready,
  photos,
  selected,
  uploading,
  folder,
  unsortedCount,
  onToggle,
  onAdd,
  onUpload,
  onImportUnsorted,
  onRename,
  onDeleteFolder,
  onEditNote,
  onRemind,
}: {
  ready: boolean;
  photos: WarehousePhoto[];
  selected: Set<string>;
  uploading: boolean;
  folder: WarehouseFolder | null;
  unsortedCount: number;
  onToggle: (id: string) => void;
  onAdd: () => void;
  onUpload: () => void;
  onImportUnsorted?: () => void;
  onRename?: () => void;
  onDeleteFolder?: () => void;
  onEditNote?: () => void;
  onRemind?: (days: number | null) => void;
}) {
  if (!ready) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-stone-100 dark:bg-zinc-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const due = folder ? folderIsDue(folder) : false;
  const today = localDayIso();
  const remindToday = folder?.remindOn === today;
  const remindTomorrow = folder?.remindOn === addLocalDays(today, 1);
  const remindWeek = folder?.remindOn === addLocalDays(today, 7);

  return (
    <div className="space-y-3">
      {folder ? (
        <>
          <div className="flex flex-wrap items-center gap-1">
            {onEditNote ? (
              <button
                type="button"
                onClick={onEditNote}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[12px] font-semibold text-ink-muted dark:text-zinc-400 transition-colors duration-150 active:bg-stone-100 dark:active:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                <NoteIcon className="h-3.5 w-3.5" />
                {folder.note ? "ویرایش یادداشت" : "یادداشت"}
              </button>
            ) : null}
            {onRename ? (
              <button
                type="button"
                onClick={onRename}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[12px] font-semibold text-ink-muted dark:text-zinc-400 transition-colors duration-150 active:bg-stone-100 dark:active:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                <PencilIcon className="h-3.5 w-3.5" />
                تغییر اسم
              </button>
            ) : null}
            {onDeleteFolder ? (
              <button
                type="button"
                onClick={onDeleteFolder}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[12px] font-semibold text-red-600/90 dark:text-red-400 transition-colors duration-150 active:bg-red-50 dark:active:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                حذف دسته
              </button>
            ) : null}
          </div>

          {folder.note ? (
            <div className="card px-3.5 py-3">
              <p className="mb-1 text-[11px] font-semibold text-ink-muted dark:text-zinc-400">
                یادداشت
              </p>
              <p className="text-[13px] leading-relaxed text-ink dark:text-zinc-100">
                {folder.note}
              </p>
            </div>
          ) : null}

          {onRemind ? (
            <div
              className={`card px-3.5 py-3 ${
                due
                  ? "ring-1 ring-amber-400/50 bg-amber-50/60 dark:bg-amber-500/10"
                  : ""
              }`}
            >
              <div className="mb-2.5 flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-ink-muted dark:bg-zinc-800 dark:text-zinc-400">
                  <BellIcon className="h-3.5 w-3.5" />
                </span>
                <p className="text-[12.5px] font-semibold text-ink dark:text-zinc-100">
                  {due
                    ? "یادآور رسیده — وقت آگهی است"
                    : folder.remindOn
                      ? `یادآور: ${toPersianDigits(folder.remindOn)}`
                      : "یادآور آگهی"}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { label: "امروز", days: 0 as const, on: remindToday },
                    { label: "فردا", days: 1 as const, on: remindTomorrow },
                    {
                      label: "هفتهٔ بعد",
                      days: 7 as const,
                      on: remindWeek,
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => onRemind(opt.days)}
                    className={`chip min-h-8 !px-2.5 !text-[11px] border transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.97] ${
                      opt.on
                        ? "border-brand-200 bg-brand-50 font-semibold text-brand-800 dark:border-brand-500/40 dark:bg-brand-500/20 dark:text-brand-200"
                        : "border-stone-200/80 bg-[color:var(--circle-surface)] text-ink-muted dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                {folder.remindOn ? (
                  <button
                    type="button"
                    onClick={() => onRemind(null)}
                    className="chip min-h-8 !px-2.5 !text-[11px] border border-stone-200/80 text-ink-faint transition-transform duration-150 active:scale-[0.97] dark:border-zinc-700"
                  >
                    برداشتن
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="card flex items-start gap-3 px-3.5 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            <ArchiveIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1 text-start">
            <p className="text-[12.5px] font-semibold text-ink dark:text-zinc-100">
              صندوق بدون دسته
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted dark:text-zinc-400">
              هنوز دسته‌بندی نشده‌اند. انتخاب کن و آگهی بساز، یا از نوار پایین به
              یک دسته منتقل کن.
            </p>
          </div>
        </div>
      )}

      {photos.length === 0 ? (
        <EmptyState
          icon={<CameraIcon className="h-7 w-7 text-ink-muted" />}
          title={
            folder ? "عکسی در این بخش نیست" : "عکسی بدون دسته نیست"
          }
          description={
            folder && unsortedCount > 0
              ? `از دوربین اضافه کن، یا ${toPersianDigits(unsortedCount)} عکس بدون‌دسته را به اینجا بیاور.`
              : folder
                ? "از دوربین یا گالری اضافه کن؛ بعد از آپلود خودکار بهینه می‌شود."
                : "عکس جدید اینجا می‌نشیند تا دسته‌بندی‌اش کنی یا آگهی بسازی."
          }
          actionLabel={uploading ? "در حال بهینه‌سازی…" : "افزودن عکس"}
          onAction={uploading ? undefined : onUpload}
          secondaryActionLabel={
            onImportUnsorted && unsortedCount > 0
              ? `از بدون‌دسته (${toPersianDigits(unsortedCount)})`
              : undefined
          }
          onSecondaryAction={onImportUnsorted}
        />
      ) : (
        <>
          <div className="flex items-start justify-between gap-2 px-0.5">
            <p className="text-[11px] leading-relaxed text-ink-muted dark:text-zinc-400">
              برای آگهی، تا {toPersianDigits(LISTING_HANDOFF_MAX_PHOTOS)} عکس را
              انتخاب کن.
            </p>
            {onImportUnsorted && unsortedCount > 0 ? (
              <button
                type="button"
                onClick={onImportUnsorted}
                className="shrink-0 text-[11px] font-semibold text-brand-700 dark:text-brand-300 active:opacity-70"
              >
                از بدون‌دسته
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={onAdd}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-stone-300/90 bg-[color:var(--circle-surface)] text-ink-faint transition-transform duration-150 active:scale-[0.97] disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                <PlusIcon className="h-4 w-4" />
              </span>
              <span className="text-[11px] font-semibold text-ink-muted dark:text-zinc-400">
                {uploading ? "…" : "افزودن"}
              </span>
            </button>
            {photos.map((photo) => {
              const on = selected.has(photo.id);
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => onToggle(photo.id)}
                  aria-pressed={on}
                  aria-label={on ? "برداشتن از انتخاب" : "انتخاب عکس"}
                  className={`relative aspect-square overflow-hidden rounded-xl transition-[transform,box-shadow] duration-150 active:scale-[0.97] ${
                    on
                      ? "ring-2 ring-brand-500 ring-offset-1 ring-offset-[color:var(--circle-canvas)] dark:ring-offset-zinc-900"
                      : "ring-1 ring-stone-200/80 dark:ring-zinc-700"
                  }`}
                >
                  <ListingImage
                    image={photo.url}
                    size="sm"
                    frameClassName="absolute inset-0 h-full w-full rounded-none"
                  />
                  <span
                    className={`absolute top-1.5 start-1.5 flex h-5 w-5 items-center justify-center rounded-full transition-colors duration-150 ${
                      on
                        ? "bg-brand-600 text-white"
                        : "bg-black/25 text-transparent ring-1 ring-white/70"
                    }`}
                    aria-hidden
                  >
                    {on ? <CheckIcon className="h-3 w-3 text-white" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SelectionBar({
  count,
  onClear,
  onMove,
  onDelete,
  onListing,
}: {
  count: number;
  onClear: () => void;
  onMove: () => void;
  onDelete: () => void;
  onListing: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-3">
      <div className="pointer-events-auto flex w-full max-w-[480px] items-center gap-2 rounded-2xl bg-ink px-3 py-2.5 text-white shadow-lg shadow-ink/20 dark:bg-zinc-100 dark:text-zinc-900">
        <button
          type="button"
          onClick={onClear}
          aria-label="لغو انتخاب"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-150 active:bg-white/10 dark:active:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
        <p className="flex-1 text-[12px] font-semibold nums">
          {toPersianDigits(count)} انتخاب
        </p>
        <button
          type="button"
          onClick={onMove}
          className="shrink-0 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors duration-150 active:bg-white/10 dark:active:bg-black/5"
        >
          دسته
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-red-300 transition-colors duration-150 active:bg-white/10 dark:text-red-700 dark:active:bg-black/5"
        >
          حذف
        </button>
        <button
          type="button"
          onClick={onListing}
          className="shrink-0 rounded-xl bg-brand-500 px-3 py-1.5 text-[12px] font-bold text-white transition-transform duration-150 active:scale-[0.97] dark:bg-brand-600"
        >
          آگهی کن
        </button>
      </div>
    </div>
  );
}

function FolderNameSheet({
  mode,
  value,
  onChange,
  onClose,
  onSubmit,
}: {
  mode: "create" | "rename";
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <SheetShell
      onClose={onClose}
      labelledBy="warehouse-folder-title"
      hugContent
      zClass="z-50"
      footer={
        <button
          type="button"
          onClick={onSubmit}
          className="btn-primary w-full !py-3 text-[14px] font-bold"
        >
          {mode === "create" ? "ساخت دسته" : "ذخیره"}
        </button>
      }
    >
      <h2
        id="warehouse-folder-title"
        className="font-extrabold text-[18px] text-ink dark:text-zinc-50"
      >
        {mode === "create" ? "دستهٔ جدید" : "تغییر اسم دسته"}
      </h2>
      <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed">
        مثلاً «اتاق خواب مادر» یا «انبار زیرزمین».
      </p>
      <input
        autoFocus
        value={value}
        maxLength={WAREHOUSE_NAME_MAX}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
        }}
        placeholder="اسم دسته"
        className="field mt-4 !text-[14px]"
      />
    </SheetShell>
  );
}

function NoteSheet({
  value,
  onChange,
  onClose,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <SheetShell
      onClose={onClose}
      labelledBy="warehouse-note-title"
      hugContent
      zClass="z-50"
      footer={
        <button
          type="button"
          onClick={onSubmit}
          className="btn-primary w-full !py-3 text-[14px] font-bold"
        >
          ذخیره یادداشت
        </button>
      }
    >
      <h2
        id="warehouse-note-title"
        className="font-extrabold text-[18px] text-ink dark:text-zinc-50"
      >
        یادداشت دسته
      </h2>
      <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed">
        فقط برای خودت — مثلاً «هنوز قیمت نداریم» یا «باید تمیز بشه».
      </p>
      <textarea
        autoFocus
        value={value}
        maxLength={WAREHOUSE_NOTE_MAX}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="یادداشت کوتاه…"
        className="field mt-4 !text-[14px] min-h-[5.5rem] resize-y"
      />
      <p className="text-[11px] text-ink-faint mt-1.5 nums text-left">
        {toPersianDigits(value.length)}/{toPersianDigits(WAREHOUSE_NOTE_MAX)}
      </p>
    </SheetShell>
  );
}

function MoveSheet({
  folders,
  currentFolderId,
  onClose,
  onPick,
}: {
  folders: WarehouseFolder[];
  currentFolderId: string | null;
  onClose: () => void;
  onPick: (folderId: string | null) => void;
}) {
  return (
    <SheetShell
      onClose={onClose}
      labelledBy="warehouse-move-title"
      hugContent
      zClass="z-50"
    >
      <h2
        id="warehouse-move-title"
        className="font-extrabold text-[18px] text-ink dark:text-zinc-50 mb-3"
      >
        انتقال به دسته
      </h2>
      <div className="rounded-2xl border border-stone-200/80 dark:border-zinc-700 overflow-hidden divide-y divide-stone-100 dark:divide-zinc-800">
        {currentFolderId !== null ? (
          <button
            type="button"
            onClick={() => onPick(null)}
            className="w-full flex items-center gap-3 px-3.5 py-3 text-right active:bg-stone-50 dark:active:bg-zinc-800/70"
          >
            <ArchiveIcon className="w-5 h-5 text-ink-muted shrink-0" />
            <span className="text-[13px] font-bold text-ink dark:text-zinc-100">
              بدون دسته
            </span>
          </button>
        ) : null}
        {folders
          .filter((f) => f.id !== currentFolderId)
          .map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => onPick(folder.id)}
              className="w-full flex items-center gap-3 px-3.5 py-3 text-right active:bg-stone-50 dark:active:bg-zinc-800/70"
            >
              <TagIcon className="w-5 h-5 text-ink-muted shrink-0" />
              <span className="text-[13px] font-bold text-ink dark:text-zinc-100 truncate">
                {folder.name}
              </span>
            </button>
          ))}
        {folders.filter((f) => f.id !== currentFolderId).length === 0 &&
        currentFolderId === null ? (
          <p className="px-3.5 py-4 text-[12px] text-ink-muted">
            هنوز دسته‌ای نساخته‌ای. اول از صفحهٔ انبار یک دسته بساز.
          </p>
        ) : null}
      </div>
    </SheetShell>
  );
}

function AddPhotosSheet({
  unsortedCount,
  uploading,
  onClose,
  onUpload,
  onFromUnsorted,
}: {
  unsortedCount: number;
  uploading: boolean;
  onClose: () => void;
  onUpload: () => void;
  onFromUnsorted: () => void;
}) {
  return (
    <SheetShell
      onClose={onClose}
      labelledBy="warehouse-add-title"
      hugContent
      zClass="z-50"
    >
      <h2
        id="warehouse-add-title"
        className="text-[18px] font-extrabold text-ink dark:text-zinc-50"
      >
        افزودن عکس
      </h2>
      <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted dark:text-zinc-400">
        از دوربین بگیر، یا عکس‌های بدون‌دسته را به این دسته بیاور.
      </p>
      <div className="mt-4 overflow-hidden divide-y divide-stone-100 rounded-2xl border border-stone-200/80 dark:divide-zinc-800 dark:border-zinc-700">
        <button
          type="button"
          disabled={uploading}
          onClick={onUpload}
          className="flex w-full items-center gap-3 px-3.5 py-3.5 text-right transition-colors active:bg-stone-50 disabled:opacity-60 dark:active:bg-zinc-800/70"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            <CameraIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1 text-start">
            <span className="block text-[13px] font-semibold text-ink dark:text-zinc-100">
              دوربین یا گالری
            </span>
            <span className="mt-0.5 block text-[11px] text-ink-muted">
              بعد از آپلود خودکار بهینه می‌شود
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onFromUnsorted}
          className="flex w-full items-center gap-3 px-3.5 py-3.5 text-right transition-colors active:bg-stone-50 dark:active:bg-zinc-800/70"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-ink-muted dark:bg-zinc-800 dark:text-zinc-300">
            <ArchiveIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1 text-start">
            <span className="block text-[13px] font-semibold text-ink dark:text-zinc-100">
              از بدون‌دسته
            </span>
            <span className="mt-0.5 block text-[11px] text-ink-muted nums">
              {toPersianDigits(unsortedCount)} عکس آمادهٔ جابه‌جایی
            </span>
          </span>
          <span className="text-ink-faint" aria-hidden>
            ‹
          </span>
        </button>
      </div>
    </SheetShell>
  );
}

function PickUnsortedSheet({
  photos,
  folderName,
  onClose,
  onConfirm,
}: {
  photos: WarehousePhoto[];
  folderName: string;
  onClose: () => void;
  onConfirm: (photoIds: string[]) => void;
}) {
  const [picked, setPicked] = useState<Set<string>>(() => new Set());

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setPicked(new Set(photos.map((p) => p.id)));
  }

  if (photos.length === 0) {
    return (
      <SheetShell
        onClose={onClose}
        labelledBy="warehouse-pick-unsorted-title"
        hugContent
        zClass="z-[55]"
      >
        <h2
          id="warehouse-pick-unsorted-title"
          className="text-[18px] font-extrabold text-ink dark:text-zinc-50"
        >
          بدون‌دسته خالی است
        </h2>
        <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">
          اول عکس به انبار اضافه کن، بعد اینجا به دسته منتقل کن.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="btn-primary mt-4 w-full !py-3 text-[14px] font-bold"
        >
          متوجه شدم
        </button>
      </SheetShell>
    );
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="warehouse-pick-unsorted-title"
      maxHeight="78dvh"
      zClass="z-[55]"
      footer={
        <button
          type="button"
          disabled={picked.size === 0}
          onClick={() => onConfirm(Array.from(picked))}
          className="btn-primary w-full !py-3 text-[14px] font-bold disabled:opacity-50"
        >
          {picked.size === 0
            ? "عکس‌ها را انتخاب کن"
            : `افزودن ${toPersianDigits(picked.size)} عکس به «${folderName}»`}
        </button>
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="warehouse-pick-unsorted-title"
            className="text-[18px] font-extrabold text-ink dark:text-zinc-50"
          >
            از بدون‌دسته
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-muted dark:text-zinc-400">
            عکس‌هایی را که می‌خواهی به «{folderName}» بیایند انتخاب کن.
          </p>
        </div>
        <button
          type="button"
          onClick={
            picked.size === photos.length
              ? () => setPicked(new Set())
              : selectAll
          }
          className="shrink-0 text-[12px] font-semibold text-brand-700 dark:text-brand-300 active:opacity-70"
        >
          {picked.size === photos.length ? "لغو همه" : "همه"}
        </button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {photos.map((photo) => {
          const on = picked.has(photo.id);
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => toggle(photo.id)}
              aria-pressed={on}
              className={`relative aspect-square overflow-hidden rounded-xl transition-[transform,box-shadow] duration-150 active:scale-[0.97] ${
                on
                  ? "ring-2 ring-brand-500"
                  : "ring-1 ring-stone-200/80 dark:ring-zinc-700"
              }`}
            >
              <ListingImage
                image={photo.url}
                size="sm"
                frameClassName="absolute inset-0 h-full w-full rounded-none"
              />
              <span
                className={`absolute top-1.5 start-1.5 flex h-5 w-5 items-center justify-center rounded-full ${
                  on
                    ? "bg-brand-600 text-white"
                    : "bg-black/25 ring-1 ring-white/70"
                }`}
                aria-hidden
              >
                {on ? <CheckIcon className="h-3 w-3" /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </SheetShell>
  );
}

function DeletePhotosSheet({
  count,
  onClose,
  onConfirm,
}: {
  count: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <SheetShell
      onClose={onClose}
      labelledBy="warehouse-delete-photos-title"
      hugContent
      zClass="z-[70]"
      footer={
        <div className="flex gap-2 pb-0.5">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 py-3.5 text-[15px] font-bold text-white transition-transform duration-150 active:scale-[0.98] active:bg-red-700"
          >
            {count === 1 ? "حذف عکس" : `حذف ${toPersianDigits(count)} عکس`}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost flex-1 !py-3.5 active:scale-[0.98]"
          >
            انصراف
          </button>
        </div>
      }
    >
      <div className="pb-1">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400">
          <TrashIcon className="h-5 w-5" />
        </div>
        <h2
          id="warehouse-delete-photos-title"
          className="text-[20px] font-semibold tracking-tight text-ink dark:text-zinc-50"
        >
          {count === 1 ? "این عکس حذف شود؟" : "این عکس‌ها حذف شوند؟"}
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted dark:text-zinc-400">
          از انبار پاک می‌شوند و برنمی‌گردند. اگر فقط جایشان اشتباه است، به‌جای
          حذف به دستهٔ دیگر منتقل کن.
        </p>
        {count > 1 ? (
          <p className="mt-3 rounded-2xl bg-stone-100/80 px-3 py-2.5 text-[13px] font-bold leading-snug text-ink nums dark:bg-zinc-800/80 dark:text-zinc-100">
            {toPersianDigits(count)} عکس انتخاب‌شده
          </p>
        ) : null}
      </div>
    </SheetShell>
  );
}
