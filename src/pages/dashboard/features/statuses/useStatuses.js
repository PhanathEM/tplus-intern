import { useEffect, useState } from "react";
import { createStatus, deleteStatus, fetchStatuses, updateStatus } from "../../../../services/statusService";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";

const STATUS_FORM_INITIAL_VALUES = {
  status_name: "",
  description: "",
  sort_order: "",
  has_owner: false,
  is_assignable: false,
  is_borrowable: false,
  is_active: true,
};

export function useStatuses({ isActive, user }) {
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);
  const [showInactive, setShowInactive] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formTarget, setFormTarget] = useState(null);
  const [formValues, setFormValues] = useState(STATUS_FORM_INITIAL_VALUES);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [statusToDelete, setStatusToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteBlocked, setDeleteBlocked] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchStatuses(showInactive)
      .then((data) => {
        if (ignore) return;
        const list = Array.isArray(data) ? data : data?.statuses;
        setStatuses(Array.isArray(list) ? list : []);
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
  }, [isActive, fetchToken, showInactive]);

  function handleRetry() {
    setIsLoading(true);
    setError(null);
    setFetchToken((value) => value + 1);
  }

  function resetForEntry() {
    setIsLoading(true);
    setError(null);
  }

  function handleToggleShowInactive(checked) {
    setIsLoading(true);
    setShowInactive(checked);
  }

  function handleOpenAdd() {
    setFormMode("add");
    setFormTarget(null);
    setFormValues(STATUS_FORM_INITIAL_VALUES);
    setFormError(null);
    setIsFormOpen(true);
  }

  function handleOpenEdit(status) {
    setFormMode("edit");
    setFormTarget(status);
    setFormValues({
      status_name: status.status_name || "",
      description: status.description || "",
      sort_order: status.sort_order != null ? String(status.sort_order) : "",
      has_owner: Boolean(status.has_owner),
      is_assignable: Boolean(status.is_assignable),
      is_borrowable: Boolean(status.is_borrowable),
      is_active: status.is_active !== false,
    });
    setFormError(null);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setFormError(null);
  }

  function handleFormFieldChange(key, value) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmitForm(event) {
    event.preventDefault();

    if (!formValues.status_name.trim()) {
      setFormError("Please enter a status name.");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const payload = {
      status_name: formValues.status_name.trim(),
      has_owner: formValues.has_owner,
      is_assignable: formValues.is_assignable,
      is_borrowable: formValues.is_borrowable,
      is_active: formValues.is_active,
    };
    if (formValues.description.trim()) payload.description = formValues.description.trim();
    if (formValues.sort_order !== "") payload.sort_order = Number(formValues.sort_order);

    const isEdit = formMode === "edit";
    const request = isEdit ? updateStatus(formTarget.status_id, payload) : createStatus(payload);

    request
      .then((data) => {
        logActivity({
          actor: user,
          action: isEdit ? "update" : "create",
          module: ACTIVITY_MODULES.STATUS,
          entityId: isEdit ? formTarget.status_id : data?.status_id,
          entityLabel: payload.status_name,
          before: isEdit ? formTarget : null,
          after: { ...payload, ...(data && typeof data === "object" ? data : {}) },
        });
        setIsFormOpen(false);
        setFormValues(STATUS_FORM_INITIAL_VALUES);
        handleRetry();
      })
      .catch((error) => setFormError(error.response?.data?.error || error.message || "Could not save status."))
      .finally(() => setIsSaving(false));
  }

  function handleOpenDelete(status) {
    setStatusToDelete(status);
    setDeleteError(null);
    setDeleteBlocked(false);
  }

  function handleCloseDelete() {
    setStatusToDelete(null);
    setDeleteError(null);
    setDeleteBlocked(false);
  }

  function handleHideInstead() {
    if (!statusToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    updateStatus(statusToDelete.status_id, { is_active: false })
      .then(() => {
        logActivity({
          actor: user,
          action: "update",
          module: ACTIVITY_MODULES.STATUS,
          entityId: statusToDelete.status_id,
          entityLabel: statusToDelete.status_name,
          before: statusToDelete,
          after: { ...statusToDelete, is_active: false },
        });
        setStatusToDelete(null);
        setDeleteBlocked(false);
        handleRetry();
      })
      .catch((error) => setDeleteError(error.message || "Could not hide status."))
      .finally(() => setIsDeleting(false));
  }

  function handleConfirmDelete() {
    if (!statusToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);
    setDeleteBlocked(false);

    deleteStatus(statusToDelete.status_id)
      .then(() => {
        logActivity({
          actor: user,
          action: "delete",
          module: ACTIVITY_MODULES.STATUS,
          entityId: statusToDelete.status_id,
          entityLabel: statusToDelete.status_name,
          before: statusToDelete,
        });
        setStatusToDelete(null);
        handleRetry();
      })
      .catch((error) => {
        const data = error.response?.data;
        const equipmentCount = data?.equipment_count ?? 0;
        setDeleteBlocked(equipmentCount > 0);
        setDeleteError(
          equipmentCount > 0
            ? `${data?.error || `Cannot delete "${statusToDelete.status_name}"`} Hide it instead to keep it out of dropdowns without breaking existing records.`
            : data?.error || error.message || "Could not delete status."
        );
      })
      .finally(() => setIsDeleting(false));
  }

  return {
    statuses,
    isLoading,
    error,
    handleRetry,
    resetForEntry,
    showInactive,
    handleToggleShowInactive,
    isFormOpen,
    formMode,
    formValues,
    isSaving,
    formError,
    handleOpenAdd,
    handleOpenEdit,
    handleCloseForm,
    handleFormFieldChange,
    handleSubmitForm,
    statusToDelete,
    isDeleting,
    deleteError,
    deleteBlocked,
    handleOpenDelete,
    handleCloseDelete,
    handleHideInstead,
    handleConfirmDelete,
  };
}
