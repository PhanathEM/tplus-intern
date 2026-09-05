import { useEffect, useState } from "react";
import { createStatus, deleteStatus, fetchStatuses, updateStatus } from "../../../../services/statusService";
import { fetchEquipmentByStatus } from "../../../../services/equipmentService";
import { exportAllEquipmentToExcel, exportAllEquipmentToPdf } from "../equipment/equipmentExport";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";

// A deliberately generic column set — equipment records mixed across
// categories (Laptop, CCTV, Server...) don't share most fields, so this
// sticks to the ones nearly every category has instead of a sparse table.
const STATUS_EQUIPMENT_EXPORT_COLUMNS = [
  { key: "_row_number", label: "No." },
  { key: "asset_code", label: "Asset Code" },
  { key: "computer_name", label: "Computer Name" },
  { key: "category_name", label: "Category" },
  { key: "device_model", label: "Device Model" },
  { key: "owner_name", label: "Owner Name" },
  { key: "department_name", label: "Department" },
  { key: "location", label: "Location" },
  { key: "remark", label: "Remark" },
];

const STATUS_FORM_INITIAL_VALUES = {
  status_name: "",
  description: "",
  sort_order: "",
  has_owner: false,
  is_assignable: false,
  is_borrowable: false,
  is_active: true,
};

// Both fields on the status form are required. Which ones are blank is all
// this hook decides - the modal owns the wording and where it shows.
const REQUIRED_FORM_FIELDS = ["status_name", "description"];

export function useStatuses({ isActive, user }) {
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formTarget, setFormTarget] = useState(null);
  const [formValues, setFormValues] = useState(STATUS_FORM_INITIAL_VALUES);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  // The blank required fields as of the last submit attempt.
  const [missingFields, setMissingFields] = useState([]);
  const [statusToDelete, setStatusToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);
  const [downloadingExcelId, setDownloadingExcelId] = useState(null);
  const [isDownloadingAllPdf, setIsDownloadingAllPdf] = useState(false);
  const [isDownloadingAllExcel, setIsDownloadingAllExcel] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchStatuses()
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
  }, [isActive, fetchToken]);

  function handleRetry() {
    setIsLoading(true);
    setError(null);
    setFetchToken((value) => value + 1);
  }

  function resetForEntry() {
    setIsLoading(true);
    setError(null);
  }

  function handleOpenAdd() {
    setFormMode("add");
    setFormTarget(null);
    setFormValues(STATUS_FORM_INITIAL_VALUES);
    setFormError(null);
    setMissingFields([]);
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
    setMissingFields([]);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setFormError(null);
  }

  function handleFormFieldChange(key, value) {
    setFormValues((current) => ({ ...current, [key]: value }));
    // Filling a flagged field clears its message as you type.
    setMissingFields((current) => (current.includes(key) ? current.filter((item) => item !== key) : current));
  }

  function handleSubmitForm(event) {
    event.preventDefault();

    const missing = REQUIRED_FORM_FIELDS.filter((key) => !String(formValues[key] ?? "").trim());
    setMissingFields(missing);
    if (missing.length > 0) return;

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

  function handleDownloadStatusPdf(status) {
    setDownloadingPdfId(status.status_id);
    setDownloadError(null);

    fetchEquipmentByStatus(status.status_name)
      .then((data) => {
        const items = Array.isArray(data) ? data : [];
        exportAllEquipmentToPdf(
          [{ category: status.status_name, columns: STATUS_EQUIPMENT_EXPORT_COLUMNS, items }],
          status.status_name
        );
      })
      .catch((error) => setDownloadError(error.message || "Could not download this status's equipment as PDF."))
      .finally(() => setDownloadingPdfId(null));
  }

  function handleDownloadStatusExcel(status) {
    setDownloadingExcelId(status.status_id);
    setDownloadError(null);

    fetchEquipmentByStatus(status.status_name)
      .then((data) => {
        const items = Array.isArray(data) ? data : [];
        exportAllEquipmentToExcel(
          [{ category: status.status_name, columns: STATUS_EQUIPMENT_EXPORT_COLUMNS, items }],
          status.status_name
        );
      })
      .catch((error) => setDownloadError(error.message || "Could not download this status's equipment as Excel."))
      .finally(() => setDownloadingExcelId(null));
  }

  // One fetch of every equipment record, then grouped by status_name
  // client-side — cheaper than one request per status.
  function buildAllStatusEntries() {
    return fetchEquipmentByStatus().then((data) => {
      const items = Array.isArray(data) ? data : [];
      return statuses
        .map((status) => ({
          category: status.status_name,
          columns: STATUS_EQUIPMENT_EXPORT_COLUMNS,
          items: items.filter((item) => (item.status_name || item.status) === status.status_name),
        }))
        .filter((entry) => entry.items.length > 0);
    });
  }

  function handleDownloadAllPdf() {
    setIsDownloadingAllPdf(true);
    setDownloadError(null);

    buildAllStatusEntries()
      .then((entries) => exportAllEquipmentToPdf(entries, "equipment-by-status"))
      .catch((error) => setDownloadError(error.message || "Could not download equipment as PDF."))
      .finally(() => setIsDownloadingAllPdf(false));
  }

  function handleDownloadAllExcel() {
    setIsDownloadingAllExcel(true);
    setDownloadError(null);

    buildAllStatusEntries()
      .then((entries) => exportAllEquipmentToExcel(entries, "equipment-by-status"))
      .catch((error) => setDownloadError(error.message || "Could not download equipment as Excel."))
      .finally(() => setIsDownloadingAllExcel(false));
  }

  return {
    statuses,
    isLoading,
    error,
    handleRetry,
    resetForEntry,
    isFormOpen,
    formMode,
    formValues,
    isSaving,
    formError,
    missingFields,
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
    downloadingPdfId,
    downloadingExcelId,
    isDownloadingAllPdf,
    isDownloadingAllExcel,
    downloadError,
    handleDownloadStatusPdf,
    handleDownloadStatusExcel,
    handleDownloadAllPdf,
    handleDownloadAllExcel,
  };
}
