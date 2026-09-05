import { useEffect, useState } from "react";
import { createLicense, deleteLicense, fetchLicenses, updateLicense } from "../../../../services/licenseService";
import { normalizeRecordList } from "../../dashboard.utils";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";

function toDateInputValue(value) {
  if (typeof value !== "string") return "";
  const isoMatch = value.match(/^\d{4}-\d{2}-\d{2}/);
  return isoMatch ? isoMatch[0] : "";
}

const LICENSE_FORM_INITIAL_VALUES = {
  product_name: "",
  product_type: "",
  license_type: "Annual Subscription",
  date_start: "",
  date_expire: "",
  remark: "",
};

// Every field on the license form is required, except that only an annual
// subscription can expire - the others have no expiry date to give. Which
// fields are blank is all this hook decides; the modal owns the wording.
function requiredLicenseFields(values) {
  return [
    "product_name",
    "product_type",
    "license_type",
    "date_start",
    ...(values.license_type === "Annual Subscription" ? ["date_expire"] : []),
    "remark",
  ];
}

export function useLicenses({ isActive, user, onLicensesLoaded }) {
  const [licenses, setLicenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formTarget, setFormTarget] = useState(null);
  const [formValues, setFormValues] = useState(LICENSE_FORM_INITIAL_VALUES);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  // The blank required fields as of the last submit attempt.
  const [missingFields, setMissingFields] = useState([]);
  const [licenseToDelete, setLicenseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchLicenses()
      .then((data) => {
        const records = normalizeRecordList(data).sort((a, b) => (a.license_id ?? 0) - (b.license_id ?? 0));
        if (!ignore) {
          setLicenses(records);
          onLicensesLoaded?.(records);
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
  }, [isActive, fetchToken, onLicensesLoaded]);

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
    setFormValues(LICENSE_FORM_INITIAL_VALUES);
    setFormError(null);
    setMissingFields([]);
    setIsFormOpen(true);
  }

  function handleOpenEdit(license) {
    setFormMode("edit");
    setFormTarget(license);
    setFormValues({
      product_name: license.product_name || "",
      product_type: license.product_type || "",
      license_type: license.license_type || "Annual Subscription",
      date_start: toDateInputValue(license.date_start),
      date_expire: toDateInputValue(license.date_expire),
      remark: license.remark || "",
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

    const requiresExpiry = formValues.license_type === "Annual Subscription";
    const missing = requiredLicenseFields(formValues).filter((key) => !String(formValues[key] ?? "").trim());
    setMissingFields(missing);
    if (missing.length > 0) return;

    setIsSaving(true);
    setFormError(null);

    const valuesToSave = requiresExpiry ? formValues : { ...formValues, date_expire: "" };

    const payload = Object.fromEntries(
      Object.entries(valuesToSave).filter(([, value]) => value.trim() !== "")
    );

    const isEdit = formMode === "edit";
    const request = isEdit ? updateLicense(formTarget.license_id, payload) : createLicense(payload);

    request
      .then((data) => {
        logActivity({
          actor: user,
          action: isEdit ? "update" : "create",
          module: ACTIVITY_MODULES.LICENSE,
          entityId: isEdit ? formTarget.license_id : data?.license_id,
          entityLabel: payload.product_name,
          before: isEdit ? formTarget : null,
          after: { ...payload, ...(data && typeof data === "object" ? data : {}) },
        });
        setIsFormOpen(false);
        setFormValues(LICENSE_FORM_INITIAL_VALUES);
        handleRetry();
      })
      .catch((error) => setFormError(error.message || "Could not save license."))
      .finally(() => setIsSaving(false));
  }

  function handleOpenDelete(license) {
    setLicenseToDelete(license);
    setDeleteError(null);
  }

  function handleCloseDelete() {
    setLicenseToDelete(null);
  }

  function handleConfirmDelete() {
    if (!licenseToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    deleteLicense(licenseToDelete.license_id)
      .then(() => {
        logActivity({
          actor: user,
          action: "delete",
          module: ACTIVITY_MODULES.LICENSE,
          entityId: licenseToDelete.license_id,
          entityLabel: licenseToDelete.product_name,
          before: licenseToDelete,
        });
        setLicenseToDelete(null);
        handleRetry();
      })
      .catch((error) => setDeleteError(error.message || "Something went wrong."))
      .finally(() => setIsDeleting(false));
  }

  return {
    licenses,
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
    licenseToDelete,
    isDeleting,
    deleteError,
    handleOpenDelete,
    handleCloseDelete,
    handleConfirmDelete,
  };
}
