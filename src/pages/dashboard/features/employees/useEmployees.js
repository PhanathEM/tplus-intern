import { useEffect, useMemo, useState } from "react";
import { createEmployee, deleteEmployee, fetchEmployees, searchEmployees, updateEmployee } from "../../../../services/employeeService";
import { getEmployeeDepartmentCode } from "../../dashboard.utils";
import { EMPLOYEE_FORM_INITIAL_VALUES, EMPLOYEES_PAGE_SIZE } from "../../dashboard.config";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";

export function useEmployees({ isActive, user, loadDepartments }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);
  const [sort, setSort] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(1);
  const [detailTarget, setDetailTarget] = useState(null);
  const [detailDevices, setDetailDevices] = useState([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formTarget, setFormTarget] = useState(null);
  const [formValues, setFormValues] = useState(EMPLOYEE_FORM_INITIAL_VALUES);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteBlocked, setDeleteBlocked] = useState(false);

  const sortedEmployees = useMemo(() => {
    if (!sort.key) return employees;
    const sorted = [...employees].sort((a, b) => String(a[sort.key] ?? "").localeCompare(String(b[sort.key] ?? "")));
    return sort.direction === "asc" ? sorted : sorted.reverse();
  }, [employees, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedEmployees.length / EMPLOYEES_PAGE_SIZE));
  const paginatedEmployees = sortedEmployees.slice((page - 1) * EMPLOYEES_PAGE_SIZE, page * EMPLOYEES_PAGE_SIZE);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchEmployees()
      .then((data) => {
        if (!ignore) {
          setEmployees(Array.isArray(data) ? data : []);
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

  function runSearch(term) {
    setIsSearchLoading(true);
    setSearchError(null);
    setHasSearched(true);

    searchEmployees(term)
      .then((data) => setSearchResults(Array.isArray(data) ? data : []))
      .catch((error) => setSearchError(error.message || "Something went wrong."))
      .finally(() => setIsSearchLoading(false));
  }

  useEffect(() => {
    if (!isActive) return;
    const term = searchTerm.trim();
    if (!term) return;

    const timeoutId = window.setTimeout(() => runSearch(term), 400);
    return () => window.clearTimeout(timeoutId);
  }, [searchTerm, isActive]);

  function handleSort(key) {
    setSort((current) => (current.key === key ? { key, direction: current.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" }));
    setPage(1);
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

  function handleOpenAdd() {
    setFormMode("add");
    setFormTarget(null);
    setFormValues(EMPLOYEE_FORM_INITIAL_VALUES);
    setFormError(null);
    setIsFormOpen(true);

    loadDepartments();
  }

  function handleOpenEdit(employee) {
    setFormMode("edit");
    setFormTarget(employee);
    setFormValues({
      full_name: employee.full_name || "",
      position: employee.position || "",
      department: getEmployeeDepartmentCode(employee) || "",
      location: employee.location || "",
      staff_code: employee.staff_code || "",
      phone: employee.phone || "",
      sex: employee.sex || "",
    });
    setFormError(null);
    setIsFormOpen(true);

    loadDepartments();
  }

  function handleCloseForm() {
    setIsFormOpen(false);
  }

  function handleFormFieldChange(key, value) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmitForm(event) {
    event.preventDefault();

    if (!formValues.full_name.trim()) {
      setFormError("Please enter a full name.");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const payload = Object.fromEntries(Object.entries(formValues).filter(([, value]) => value.trim() !== ""));

    const isEdit = formMode === "edit";
    const request = isEdit ? updateEmployee(formTarget.employee_id, payload) : createEmployee(payload);

    request
      .then((data) => {
        logActivity({
          actor: user,
          action: isEdit ? "update" : "create",
          module: ACTIVITY_MODULES.EMPLOYEE,
          entityId: isEdit ? formTarget.employee_id : data?.employee_id,
          entityLabel: payload.full_name || formTarget?.full_name,
          before: isEdit ? formTarget : null,
          after: { ...payload, ...(data && typeof data === "object" ? data : {}) },
        });
        setIsFormOpen(false);
        handleRetry();
      })
      .catch((error) => setFormError(error.message || "Something went wrong."))
      .finally(() => setIsSaving(false));
  }

  function handleOpenDelete(employee) {
    setEmployeeToDelete(employee);
    setDeleteError(null);
    setDeleteBlocked(false);
  }

  function handleCloseDelete() {
    setEmployeeToDelete(null);
    setDeleteError(null);
    setDeleteBlocked(false);
  }

  function handleViewAssignedDevicesFromDelete() {
    if (!employeeToDelete) return;
    const employee = employeeToDelete;
    handleCloseDelete();
    handleViewDetail(employee);
  }

  function handleConfirmDelete() {
    if (!employeeToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);
    setDeleteBlocked(false);

    deleteEmployee(employeeToDelete.employee_id)
      .then(() => {
        logActivity({
          actor: user,
          action: "delete",
          module: ACTIVITY_MODULES.EMPLOYEE,
          entityId: employeeToDelete.employee_id,
          entityLabel: employeeToDelete.full_name,
          before: employeeToDelete,
        });
        setEmployeeToDelete(null);
        handleRetry();
        const term = searchTerm.trim();
        if (hasSearched && term) runSearch(term);
      })
      .catch((error) => {
        // NOTE: this assumes the HTTP layer attaches the parsed error body to
        // `error.data` (fetch-style), matching every other catch block in this
        // codebase, which reads `error.message` / `error.status` directly.
        const data = error.data;
        const ownedEquipment = data?.references?.owned_equipment || 0;

        setDeleteBlocked(ownedEquipment > 0);
        setDeleteError(ownedEquipment > 0 ? `This employee has ${ownedEquipment} assigned device${ownedEquipment === 1 ? "" : "s"}. Unassign ${ownedEquipment === 1 ? "it" : "them"} first.` : data?.error || error.message || "Could not delete employee.");
      })
      .finally(() => setIsDeleting(false));
  }

  function handleViewDetail(employee) {
    setDetailTarget(employee);
    setIsDetailLoading(true);
    setDetailError(null);
    setDetailDevices([]);

    searchEmployees(employee.full_name)
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        setDetailDevices(rows.filter((row) => row.employee_id === employee.employee_id));
      })
      .catch((error) => setDetailError(error.message || "Something went wrong."))
      .finally(() => setIsDetailLoading(false));
  }

  function handleRetryDetail() {
    if (detailTarget) handleViewDetail(detailTarget);
  }

  function handleCloseDetail() {
    setDetailTarget(null);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const term = searchTerm.trim();
    if (term) runSearch(term);
  }

  function handleSearchTermChange(value) {
    setSearchTerm(value);
    if (!value.trim()) {
      setHasSearched(false);
      setSearchResults([]);
      setSearchError(null);
    }
  }

  function handleViewSearchDetail(group) {
    setDetailTarget({
      employee_id: group.employee_id,
      full_name: group.owner_name,
      position: group.employee_position,
      department: group.employee_department,
      location: group.employee_location,
    });
    setDetailDevices(group.devices);
    setIsDetailLoading(false);
    setDetailError(null);
  }

  function getRecordFromSearchGroup(group) {
    const firstDevice = group.devices?.[0] || {};
    const employeeId = group.employee_id ?? firstDevice.employee_id;
    const fullName = group.owner_name ?? firstDevice.owner_name ?? firstDevice.full_name ?? "";
    const directoryRecord = employees.find((employee) => (employeeId !== undefined && String(employee.employee_id) === String(employeeId)) || (fullName && employee.full_name === fullName));

    if (directoryRecord) return directoryRecord;

    return {
      employee_id: employeeId,
      full_name: fullName,
      position: group.employee_position ?? firstDevice.employee_position ?? firstDevice.position ?? "",
      department: group.employee_department ?? firstDevice.employee_department ?? firstDevice.department ?? firstDevice.department_code ?? "",
      department_code: group.employee_department ?? firstDevice.department_code ?? firstDevice.department ?? "",
      location: group.employee_location ?? firstDevice.employee_location ?? firstDevice.location ?? "",
      staff_code: firstDevice.staff_code ?? "",
      phone: firstDevice.phone ?? "",
      sex: firstDevice.sex ?? "",
    };
  }

  // DI target for Equipment's unassign handler — refreshes whatever employee
  // search/detail view happens to be open, without Equipment needing to know
  // about Employee's internal state.
  function refreshAfterExternalEquipmentChange() {
    const term = searchTerm.trim();
    if (hasSearched && term) runSearch(term);
    if (detailTarget) handleRetryDetail();
  }

  return {
    searchTerm,
    searchResults,
    isSearchLoading,
    searchError,
    hasSearched,
    handleSearchSubmit,
    handleSearchTermChange,
    handleViewSearchDetail,
    getRecordFromSearchGroup,
    employees: paginatedEmployees,
    totalCount: sortedEmployees.length,
    sort,
    handleSort,
    isLoading,
    error,
    handleRetry,
    resetForEntry,
    page,
    pageCount,
    setPage,
    handleViewDetail,
    handleOpenAdd,
    handleOpenEdit,
    handleCloseForm,
    isFormOpen,
    formMode,
    formValues,
    isSaving,
    formError,
    handleFormFieldChange,
    handleSubmitForm,
    employeeToDelete,
    isDeleting,
    deleteError,
    deleteBlocked,
    handleOpenDelete,
    handleCloseDelete,
    handleConfirmDelete,
    handleViewAssignedDevicesFromDelete,
    detailTarget,
    detailDevices,
    isDetailLoading,
    detailError,
    handleRetryDetail,
    handleCloseDetail,
    refreshAfterExternalEquipmentChange,
  };
}
