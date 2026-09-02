"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addPhotos,
  createFolder,
  deleteFolder,
  EMPTY_WAREHOUSE,
  loadWarehouse,
  movePhotos,
  removePhotos,
  removePhotosByUrls,
  renameFolder,
  saveWarehouse,
  setFolderNote,
  setFolderRemindOn,
  type WarehouseFolder,
  type WarehousePhoto,
  type WarehouseState,
  warehouseStats,
} from "./warehouse";

export function useWarehouse(viewerId: string | undefined) {
  const id = viewerId?.trim() || "me";
  const [state, setState] = useState<WarehouseState>(EMPTY_WAREHOUSE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadWarehouse(id));
    setReady(true);
  }, [id]);

  const commit = useCallback(
    (next: WarehouseState) => {
      setState(next);
      saveWarehouse(id, next);
    },
    [id],
  );

  const reload = useCallback(() => {
    setState(loadWarehouse(id));
  }, [id]);

  const stats = useMemo(() => warehouseStats(state), [state]);

  const addFolder = useCallback(
    (name: string) => {
      const result = createFolder(state, name);
      if (!result.ok) return result;
      commit(result.state);
      return result;
    },
    [commit, state],
  );

  const rename = useCallback(
    (folderId: string, name: string) => {
      const result = renameFolder(state, folderId, name);
      if (!result.ok) return result;
      commit(result.state);
      return result;
    },
    [commit, state],
  );

  const writeNote = useCallback(
    (folderId: string, note: string) => {
      const result = setFolderNote(state, folderId, note);
      if (!result.ok) return result;
      commit(result.state);
      return result;
    },
    [commit, state],
  );

  const writeRemindOn = useCallback(
    (folderId: string, remindOn: string | null) => {
      const result = setFolderRemindOn(state, folderId, remindOn);
      if (!result.ok) return result;
      commit(result.state);
      return result;
    },
    [commit, state],
  );

  const removeFolder = useCallback(
    (folderId: string, mode: "keep-photos" | "delete-photos") => {
      commit(deleteFolder(state, folderId, mode));
    },
    [commit, state],
  );

  const ingestUrls = useCallback(
    (urls: string[], folderId: string | null) => {
      const result = addPhotos(state, urls, folderId);
      if (!result.ok) return result;
      commit(result.state);
      return result;
    },
    [commit, state],
  );

  const relocate = useCallback(
    (photoIds: string[], folderId: string | null) => {
      const result = movePhotos(state, photoIds, folderId);
      if (!result.ok) return result;
      commit(result.state);
      return result;
    },
    [commit, state],
  );

  const discard = useCallback(
    (photoIds: string[]) => {
      commit(removePhotos(state, photoIds));
    },
    [commit, state],
  );

  const discardByUrls = useCallback(
    (urls: string[]) => {
      commit(removePhotosByUrls(state, urls));
    },
    [commit, state],
  );

  const applyCleanup = useCallback(
    (photoIds: string[], urls: string[]) => {
      let next = state;
      if (photoIds.length > 0) next = removePhotos(next, photoIds);
      if (urls.length > 0) next = removePhotosByUrls(next, urls);
      commit(next);
    },
    [commit, state],
  );

  return {
    ready,
    state,
    stats,
    folders: state.folders as WarehouseFolder[],
    photos: state.photos as WarehousePhoto[],
    reload,
    addFolder,
    rename,
    writeNote,
    writeRemindOn,
    removeFolder,
    ingestUrls,
    relocate,
    discard,
    discardByUrls,
    applyCleanup,
  };
}
