import { newUuid } from "./invite";

export const WAREHOUSE_MAX_PHOTOS = 60;
export const WAREHOUSE_MAX_FOLDERS = 30;
export const WAREHOUSE_NAME_MAX = 40;
export const WAREHOUSE_NOTE_MAX = 120;

const STORAGE_PREFIX = "circle.warehouse.v1.";

export type WarehousePhoto = {
  id: string;
  url: string;
  createdAt: string;
  /** null = unsorted inbox */
  folderId: string | null;
};

export type WarehouseFolder = {
  id: string;
  name: string;
  /** Optional private note — never shown in the feed. */
  note?: string;
  /** Local calendar day (YYYY-MM-DD) to nudge; null/omitted = no reminder. */
  remindOn?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WarehouseState = {
  folders: WarehouseFolder[];
  photos: WarehousePhoto[];
};

export const EMPTY_WAREHOUSE: WarehouseState = {
  folders: [],
  photos: [],
};

function storageKey(viewerId: string): string {
  return `${STORAGE_PREFIX}${viewerId || "me"}`;
}

function normalizeName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, WAREHOUSE_NAME_MAX);
}

export function normalizeFolderNote(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, WAREHOUSE_NOTE_MAX);
}

/** Local YYYY-MM-DD for reminder comparisons. */
export function localDayIso(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addLocalDays(from: string, days: number): string {
  const [y, m, d] = from.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  return localDayIso(dt);
}

function isRemindDay(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function isPhoto(v: unknown): v is WarehousePhoto {
  if (!v || typeof v !== "object") return false;
  const p = v as WarehousePhoto;
  return (
    typeof p.id === "string" &&
    typeof p.url === "string" &&
    typeof p.createdAt === "string" &&
    (p.folderId === null || typeof p.folderId === "string")
  );
}

function isFolder(v: unknown): v is WarehouseFolder {
  if (!v || typeof v !== "object") return false;
  const f = v as WarehouseFolder;
  if (
    typeof f.id !== "string" ||
    typeof f.name !== "string" ||
    typeof f.createdAt !== "string" ||
    typeof f.updatedAt !== "string"
  ) {
    return false;
  }
  if (f.note !== undefined && typeof f.note !== "string") return false;
  if (
    f.remindOn !== undefined &&
    f.remindOn !== null &&
    !isRemindDay(f.remindOn)
  ) {
    return false;
  }
  return true;
}

export function loadWarehouse(viewerId: string): WarehouseState {
  if (typeof window === "undefined") return EMPTY_WAREHOUSE;
  try {
    const raw = localStorage.getItem(storageKey(viewerId));
    if (!raw) return EMPTY_WAREHOUSE;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY_WAREHOUSE;
    const obj = parsed as { folders?: unknown; photos?: unknown };
    const folders = Array.isArray(obj.folders)
      ? obj.folders
          .filter(isFolder)
          .map((f) => ({
            ...f,
            note: f.note ? normalizeFolderNote(f.note) : undefined,
            remindOn: f.remindOn ?? null,
          }))
          .slice(0, WAREHOUSE_MAX_FOLDERS)
      : [];
    const folderIds = new Set(folders.map((f) => f.id));
    const photos = Array.isArray(obj.photos)
      ? obj.photos
          .filter(isPhoto)
          .map((p) =>
            p.folderId && !folderIds.has(p.folderId)
              ? { ...p, folderId: null }
              : p,
          )
          .slice(0, WAREHOUSE_MAX_PHOTOS)
      : [];
    return { folders, photos };
  } catch {
    return EMPTY_WAREHOUSE;
  }
}

export function saveWarehouse(viewerId: string, state: WarehouseState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(viewerId), JSON.stringify(state));
  } catch {
    /* private mode / quota */
  }
}

export function createFolder(
  state: WarehouseState,
  name: string,
): { ok: true; state: WarehouseState; folder: WarehouseFolder } | { ok: false; error: string } {
  const cleaned = normalizeName(name);
  if (cleaned.length < 1) {
    return { ok: false, error: "برای دسته یک اسم بگذار." };
  }
  if (state.folders.length >= WAREHOUSE_MAX_FOLDERS) {
    return { ok: false, error: "تعداد دسته‌ها به سقف رسیده." };
  }
  const now = new Date().toISOString();
  const folder: WarehouseFolder = {
    id: newUuid(),
    name: cleaned,
    createdAt: now,
    updatedAt: now,
  };
  return {
    ok: true,
    folder,
    state: {
      ...state,
      folders: [folder, ...state.folders],
    },
  };
}

export function renameFolder(
  state: WarehouseState,
  folderId: string,
  name: string,
): { ok: true; state: WarehouseState } | { ok: false; error: string } {
  const cleaned = normalizeName(name);
  if (cleaned.length < 1) {
    return { ok: false, error: "برای دسته یک اسم بگذار." };
  }
  const now = new Date().toISOString();
  let found = false;
  const folders = state.folders.map((f) => {
    if (f.id !== folderId) return f;
    found = true;
    return { ...f, name: cleaned, updatedAt: now };
  });
  if (!found) return { ok: false, error: "دسته پیدا نشد." };
  return { ok: true, state: { ...state, folders } };
}

export function setFolderNote(
  state: WarehouseState,
  folderId: string,
  note: string,
): { ok: true; state: WarehouseState } | { ok: false; error: string } {
  const cleaned = normalizeFolderNote(note);
  const now = new Date().toISOString();
  let found = false;
  const folders = state.folders.map((f) => {
    if (f.id !== folderId) return f;
    found = true;
    return {
      ...f,
      note: cleaned || undefined,
      updatedAt: now,
    };
  });
  if (!found) return { ok: false, error: "دسته پیدا نشد." };
  return { ok: true, state: { ...state, folders } };
}

export function setFolderRemindOn(
  state: WarehouseState,
  folderId: string,
  remindOn: string | null,
): { ok: true; state: WarehouseState } | { ok: false; error: string } {
  if (remindOn !== null && !isRemindDay(remindOn)) {
    return { ok: false, error: "تاریخ یادآور نامعتبر است." };
  }
  const now = new Date().toISOString();
  let found = false;
  const folders = state.folders.map((f) => {
    if (f.id !== folderId) return f;
    found = true;
    return { ...f, remindOn, updatedAt: now };
  });
  if (!found) return { ok: false, error: "دسته پیدا نشد." };
  return { ok: true, state: { ...state, folders } };
}

export function deleteFolder(
  state: WarehouseState,
  folderId: string,
  mode: "keep-photos" | "delete-photos",
): WarehouseState {
  const folders = state.folders.filter((f) => f.id !== folderId);
  if (mode === "delete-photos") {
    return {
      folders,
      photos: state.photos.filter((p) => p.folderId !== folderId),
    };
  }
  return {
    folders,
    photos: state.photos.map((p) =>
      p.folderId === folderId ? { ...p, folderId: null } : p,
    ),
  };
}

export function addPhotos(
  state: WarehouseState,
  urls: string[],
  folderId: string | null,
): { ok: true; state: WarehouseState; added: WarehousePhoto[] } | { ok: false; error: string } {
  const cleanUrls = urls.map((u) => u.trim()).filter(Boolean);
  if (cleanUrls.length === 0) {
    return { ok: false, error: "عکسی برای افزودن نیست." };
  }
  const room = WAREHOUSE_MAX_PHOTOS - state.photos.length;
  if (room <= 0) {
    return { ok: false, error: "انبار پر است — بعضی عکس‌ها را حذف کن." };
  }
  if (folderId && !state.folders.some((f) => f.id === folderId)) {
    return { ok: false, error: "دسته پیدا نشد." };
  }
  const now = new Date().toISOString();
  const added: WarehousePhoto[] = cleanUrls.slice(0, room).map((url) => ({
    id: newUuid(),
    url,
    createdAt: now,
    folderId,
  }));
  const folders =
    folderId == null
      ? state.folders
      : state.folders.map((f) =>
          f.id === folderId ? { ...f, updatedAt: now } : f,
        );
  return {
    ok: true,
    added,
    state: {
      folders,
      photos: [...added, ...state.photos],
    },
  };
}

export function movePhotos(
  state: WarehouseState,
  photoIds: string[],
  folderId: string | null,
): { ok: true; state: WarehouseState } | { ok: false; error: string } {
  if (folderId && !state.folders.some((f) => f.id === folderId)) {
    return { ok: false, error: "دسته پیدا نشد." };
  }
  const idSet = new Set(photoIds);
  const now = new Date().toISOString();
  const photos = state.photos.map((p) =>
    idSet.has(p.id) ? { ...p, folderId } : p,
  );
  const folders =
    folderId == null
      ? state.folders
      : state.folders.map((f) =>
          f.id === folderId ? { ...f, updatedAt: now } : f,
        );
  return { ok: true, state: { folders, photos } };
}

export function removePhotos(
  state: WarehouseState,
  photoIds: string[],
): WarehouseState {
  const idSet = new Set(photoIds);
  return {
    ...state,
    photos: state.photos.filter((p) => !idSet.has(p.id)),
  };
}

export function removePhotosByUrls(
  state: WarehouseState,
  urls: string[],
): WarehouseState {
  const urlSet = new Set(urls.map((u) => u.trim()).filter(Boolean));
  if (urlSet.size === 0) return state;
  return {
    ...state,
    photos: state.photos.filter((p) => !urlSet.has(p.url)),
  };
}

export function photosInFolder(
  state: WarehouseState,
  folderId: string | null,
): WarehousePhoto[] {
  return state.photos.filter((p) => p.folderId === folderId);
}

export function folderCoverUrl(
  state: WarehouseState,
  folderId: string,
): string | null {
  return (
    state.photos.find((p) => p.folderId === folderId)?.url ?? null
  );
}

export function folderIsDue(
  folder: WarehouseFolder,
  today = localDayIso(),
): boolean {
  return Boolean(folder.remindOn && folder.remindOn <= today);
}

export function warehouseStats(state: WarehouseState): {
  photoCount: number;
  folderCount: number;
  unsortedCount: number;
  /** Folders (or unsorted) that still hold photos — ready to list. */
  waitingStacks: number;
  /** Folders whose remindOn day has arrived and still have photos. */
  dueReminders: number;
} {
  let unsortedCount = 0;
  const counts = new Map<string, number>();
  for (const p of state.photos) {
    if (p.folderId == null) {
      unsortedCount += 1;
      continue;
    }
    counts.set(p.folderId, (counts.get(p.folderId) ?? 0) + 1);
  }
  let waitingStacks = unsortedCount > 0 ? 1 : 0;
  let dueReminders = 0;
  const today = localDayIso();
  for (const folder of state.folders) {
    const n = counts.get(folder.id) ?? 0;
    if (n > 0) {
      waitingStacks += 1;
      if (folderIsDue(folder, today)) dueReminders += 1;
    }
  }
  return {
    photoCount: state.photos.length,
    folderCount: state.folders.length,
    unsortedCount,
    waitingStacks,
    dueReminders,
  };
}
