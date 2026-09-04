import { useEffect, useMemo, useState } from "react";
import { fetchEquipmentByStatus, unassignEquipment } from "../../../../services/equipmentService";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";
import { getEquipmentDisplayName } from "../../dashboard.utils";

const PAGE_SIZE = 20;

// The opposite of Assignation: everything currently held by someone, so it can
// be handed back to stock. There's no "assigned equipment" endpoint, so this
// reads the full list (the same call the Report page makes) and keeps the rows
// that have an owner.
export function useUnassign({ isActive, user, onUnassigned }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [unassignError, setUnassignError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchEquipmentByStatus()
      .then((data) => {
        if (ignore) return;
        const list = Array.isArray(data) ? data : data?.equipment || data?.items || [];
        setItems(list.filter((item) => item.owner_name || item.owner_id));
        setError(null);
      })
      .catch((err) => {
        if (!ignore) setError(err.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isActive, fetchToken]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      `${getEquipmentDisplayName(item)} ${item.owner_name || ""} ${item.asset_code || ""} ${item.category_name || item.category || ""} ${item.owner_department || ""} ${item.location || ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [items, search]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  // Derived rather than reset in an effect: searching can shrink the list below
  // the page you were on, which would otherwise show an empty table.
  const safePage = Math.min(page, pageCount);
  const paginatedItems = filteredItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleRetry() {
    setIsLoading(true);
    setError(null);
    setFetchToken((value) => value + 1);
  }

  function resetForEntry() {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
  }

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  function handleOpenUnassign(item) {
    setTarget(item);
    setUnassignError(null);
  }

  function handleCloseUnassign() {
    setTarget(null);
    setUnassignError(null);
  }

  function handleConfirmUnassign() {
    if (!target?.equipment_id) return;

    setIsUnassigning(true);
    setUnassignError(null);

    const label = getEquipmentDisplayName(target);
    const previousOwner = target.owner_name;

    unassignEquipment(target.equipment_id)
      .then(() => {
        logActivity({
          actor: user,
          action: "unassign",
          module: ACTIVITY_MODULES.EQUIPMENT,
          entityId: target.equipment_id,
          entityLabel: label,
          before: target,
        });
        setTarget(null);
        setSuccessMessage(
          previousOwner ? `${label} was returned to stock from ${previousOwner}.` : `${label} was returned to stock.`
        );
        handleRetry();
        onUnassigned?.();
      })
      .catch((err) => setUnassignError(err.message || "Something went wrong."))
      .finally(() => setIsUnassigning(false));
  }

  return {
    items: paginatedItems,
    totalCount: filteredItems.length,
    isLoading,
    error,
    handleRetry,
    resetForEntry,
    search,
    handleSearchChange,
    page: safePage,
    pageCount,
    setPage,
    target,
    isUnassigning,
    unassignError,
    successMessage,
    handleOpenUnassign,
    handleCloseUnassign,
    handleConfirmUnassign,
  };
}
