import { useEffect, useMemo, useState } from "react";
import {
  deleteRecycleBinItem,
  fetchRecycleBin,
  purgeRecycleBin,
  restoreRecycleBinItem,
} from "../../../../services/recycleBinService";

export function useRecycleBin({ isActive, onRestore }) {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);
  const [typeFilter, setTypeFilter] = useState("All");
  const [restoringId, setRestoringId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isPurging, setIsPurging] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isPurgeOpen, setIsPurgeOpen] = useState(false);

  const typeOptions = useMemo(() => {
    const types = new Set(
      entries.map((entry) => entry?.entity_type ?? entry?.entityType ?? entry?.type).filter(Boolean)
    );
    return [...types].sort();
  }, [entries]);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchRecycleBin(typeFilter === "All" ? undefined : typeFilter)
      .then((data) => {
        if (ignore) return;
        const list = Array.isArray(data) ? data : data?.items ?? data?.data;
        setEntries(Array.isArray(list) ? list : []);
        setError(null);
      })
      .catch((error) => {
        if (!ignore) setError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isActive, fetchToken, typeFilter]);

  function handleRetry() {
    setIsLoading(true);
    setError(null);
    setFetchToken((value) => value + 1);
  }

  function resetForEntry() {
    setIsLoading(true);
    setError(null);
  }

  function handleFilterChange(value) {
    setTypeFilter(value);
    setIsLoading(true);
    setError(null);
  }

  function handleRestore(entry) {
    const id = entry?.id ?? entry?.recycle_bin_id ?? entry?.bin_id;
    if (id === undefined || id === null) return;

    setRestoringId(id);
    setActionError(null);

    restoreRecycleBinItem(id)
      .then(() => {
        handleRetry();
        onRestore?.();
      })
      .catch((error) => setActionError(error.message || "Could not restore this item."))
      .finally(() => setRestoringId(null));
  }

  function handleOpenDelete(entry) {
    setItemToDelete(entry);
    setActionError(null);
  }

  function handleCloseDelete() {
    setItemToDelete(null);
  }

  function handleConfirmDelete() {
    const id = itemToDelete?.id ?? itemToDelete?.recycle_bin_id ?? itemToDelete?.bin_id;
    if (id === undefined || id === null) return;

    setDeletingId(id);
    setActionError(null);

    deleteRecycleBinItem(id)
      .then(() => {
        setItemToDelete(null);
        handleRetry();
      })
      .catch((error) => setActionError(error.message || "Could not permanently delete this item."))
      .finally(() => setDeletingId(null));
  }

  function handleOpenPurge() {
    setIsPurgeOpen(true);
    setActionError(null);
  }

  function handleClosePurge() {
    setIsPurgeOpen(false);
  }

  function handleConfirmPurge() {
    setIsPurging(true);
    setActionError(null);

    purgeRecycleBin()
      .then(() => {
        setIsPurgeOpen(false);
        handleRetry();
      })
      .catch((error) => setActionError(error.message || "Could not purge the recycle bin."))
      .finally(() => setIsPurging(false));
  }

  return {
    entries,
    isLoading,
    error,
    handleRetry,
    resetForEntry,
    typeFilter,
    handleFilterChange,
    typeOptions,
    restoringId,
    deletingId,
    isPurging,
    actionError,
    handleRestore,
    itemToDelete,
    handleOpenDelete,
    handleCloseDelete,
    handleConfirmDelete,
    isPurgeOpen,
    handleOpenPurge,
    handleClosePurge,
    handleConfirmPurge,
  };
}
