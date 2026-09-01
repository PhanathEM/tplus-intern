import { useEffect, useState } from "react";
import { fetchServerUsage, updateServerUsageRow } from "../../../../services/serverUsageService";
import { normalizeRecordList } from "../../dashboard.utils";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";

const EDIT_FORM_INITIAL_VALUES = {
  cpu_usage_pct: "",
  memory_usage_pct: "",
  hdd_usage_gb: "",
};

const DATE_RANGE_INITIAL_FILTERS = { from: "", to: "" };

export function useServerUsage({ isActive, user }) {
  const [serverUsage, setServerUsage] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);
  const [dateRange, setDateRange] = useState(DATE_RANGE_INITIAL_FILTERS);

  const [editTarget, setEditTarget] = useState(null);
  const [editValues, setEditValues] = useState(EDIT_FORM_INITIAL_VALUES);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchServerUsage(dateRange)
      .then((data) => {
        if (!ignore) {
          setServerUsage(normalizeRecordList(data));
          setError(null);
        }
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
  }, [isActive, fetchToken, dateRange]);

  function handleRetry() {
    setIsLoading(true);
    setError(null);
    setFetchToken((value) => value + 1);
  }

  function resetForEntry() {
    setIsLoading(true);
    setError(null);
  }

  function handleDateRangeChange(key, value) {
    setIsLoading(true);
    setDateRange((current) => ({ ...current, [key]: value }));
  }

  function handleClearDateRange() {
    setIsLoading(true);
    setDateRange(DATE_RANGE_INITIAL_FILTERS);
  }

  function handleOpenEdit(record) {
    setEditTarget(record);
    setEditValues({
      cpu_usage_pct: record.cpu_usage_pct ?? "",
      memory_usage_pct: record.memory_usage_pct ?? "",
      hdd_usage_gb: record.hdd_usage_gb ?? "",
    });
    setEditError(null);
  }

  function handleCloseEdit() {
    setEditTarget(null);
    setEditError(null);
  }

  function handleEditFieldChange(key, value) {
    setEditValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmitEdit(event) {
    event.preventDefault();
    if (!editTarget) return;

    setIsSavingEdit(true);
    setEditError(null);

    updateServerUsageRow(editTarget.equipment_id, editValues)
      .then((data) => {
        const updated = data?.usage;
        if (updated) {
          setServerUsage((current) =>
            current.map((row) => (row.equipment_id === updated.equipment_id ? { ...row, ...updated } : row))
          );
        }
        logActivity({
          actor: user,
          action: "update",
          module: ACTIVITY_MODULES.SERVICE_USAGE,
          entityId: editTarget.usage_id,
          entityLabel: editTarget.device_name || `#${editTarget.usage_id}`,
          before: editTarget,
          after: updated || { ...editTarget, ...editValues },
        });
        setEditTarget(null);
      })
      .catch((error) => setEditError(error.message || "Could not update usage."))
      .finally(() => setIsSavingEdit(false));
  }

  return {
    serverUsage,
    isLoading,
    error,
    handleRetry,
    resetForEntry,
    dateRange,
    handleDateRangeChange,
    handleClearDateRange,
    editTarget,
    editValues,
    isSavingEdit,
    editError,
    handleOpenEdit,
    handleCloseEdit,
    handleEditFieldChange,
    handleSubmitEdit,
  };
}
