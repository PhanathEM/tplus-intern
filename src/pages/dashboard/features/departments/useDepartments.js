import { useEffect, useMemo, useState } from "react";
import {
  createDepartment,
  deleteDepartment,
  fetchDepartments,
  updateDepartment,
} from "../../../../services/departmentService";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";
import { exportAllDepartmentsToExcel, exportAllDepartmentsToPdf } from "./departmentExport";

export function useDepartments({ isActive, user }) {
  const [departments, setDepartments] = useState([]);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formTarget, setFormTarget] = useState(null);
  const [formValues, setFormValues] = useState({ department_code: "", department_name: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchDepartments()
      .then((data) => {
        if (!ignore) {
          setDepartments(Array.isArray(data) ? data : []);
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
  }, [isActive, fetchToken]);

  // Departments load in full (no pagination), so search just filters the
  // already-fetched list — the raw `departments` list is left untouched
  // since Employee/Equipment forms also read it for their department dropdown.
  const filteredDepartments = useMemo(() => {
    const term = departmentSearch.trim().toLowerCase();
    if (!term) return departments;
    return departments.filter((department) =>
      `${department.department_code || ""} ${department.department_name || ""}`.toLowerCase().includes(term)
    );
  }, [departments, departmentSearch]);

  function handleDepartmentSearchChange(value) {
    setDepartmentSearch(value);
  }

  function handleRetry() {
    setIsLoading(true);
    setError(null);
    setFetchToken((value) => value + 1);
  }

  function resetForEntry() {
    setIsLoading(true);
    setError(null);
  }

  // Shared lookup used by Employee/Equipment add-edit forms so they don't each
  // inline their own fetchDepartments() call.
  function loadDepartments() {
    return fetchDepartments()
      .then((data) => setDepartments(Array.isArray(data) ? data : []))
      .catch(() => setDepartments([]));
  }

  // Departments load in full already, so unlike Employee's bulk export this
  // needs no extra per-row fetch — it's just the already-loaded list.
  function handleDownloadAllDepartmentsExcel() {
    exportAllDepartmentsToExcel(departments);
  }

  function handleDownloadAllDepartmentsPdf() {
    exportAllDepartmentsToPdf(departments);
  }

  function handleOpenAdd() {
    setFormMode("add");
    setFormTarget(null);
    setFormValues({ department_code: "", department_name: "" });
    setFormError(null);
    setIsFormOpen(true);
  }

  function handleOpenEdit(department) {
    setFormMode("edit");
    setFormTarget(department);
    setFormValues({
      department_code: department.department_code || "",
      department_name: department.department_name || "",
    });
    setFormError(null);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
  }

  function handleFormFieldChange(key, value) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmitForm(event) {
    event.preventDefault();

    if (!formValues.department_code.trim() || !formValues.department_name.trim()) {
      setFormError("Please enter both department code and name.");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const payload = {
      department_code: formValues.department_code.trim(),
      department_name: formValues.department_name.trim(),
    };

    const isEdit = formMode === "edit";
    const request = isEdit ? updateDepartment(formTarget.department_id, payload) : createDepartment(payload);

    request
      .then((data) => {
        logActivity({
          actor: user,
          action: isEdit ? "update" : "create",
          module: ACTIVITY_MODULES.DEPARTMENT,
          entityId: isEdit ? formTarget.department_id : data?.department_id,
          entityLabel: payload.department_name,
          before: isEdit ? formTarget : null,
          after: { ...payload, ...(data && typeof data === "object" ? data : {}) },
        });
        setIsFormOpen(false);
        handleRetry();
      })
      .catch((error) => setFormError(error.message || "Something went wrong."))
      .finally(() => setIsSaving(false));
  }

  function handleOpenDelete(department) {
    setDepartmentToDelete(department);
    setDeleteError(null);
  }

  function handleCloseDelete() {
    setDepartmentToDelete(null);
  }

  function handleConfirmDelete() {
    if (!departmentToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    deleteDepartment(departmentToDelete.department_id)
      .then(() => {
        logActivity({
          actor: user,
          action: "delete",
          module: ACTIVITY_MODULES.DEPARTMENT,
          entityId: departmentToDelete.department_id,
          entityLabel: departmentToDelete.department_name,
          before: departmentToDelete,
        });
        setDepartmentToDelete(null);
        handleRetry();
      })
      .catch((error) => setDeleteError(error.message || "Something went wrong."))
      .finally(() => setIsDeleting(false));
  }

  return {
    departments,
    filteredDepartments,
    departmentSearch,
    handleDepartmentSearchChange,
    setDepartments,
    isLoading,
    error,
    handleRetry,
    resetForEntry,
    loadDepartments,
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
    departmentToDelete,
    isDeleting,
    deleteError,
    handleOpenDelete,
    handleCloseDelete,
    handleConfirmDelete,
    handleDownloadAllDepartmentsExcel,
    handleDownloadAllDepartmentsPdf,
  };
}
