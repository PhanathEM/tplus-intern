import { useEffect, useMemo } from "react";
import {
  FiAlertTriangle as AlertTriangle,
  FiBox as Box,
  FiChevronDown as ChevronDown,
  FiChevronUp as ChevronUp,
  FiPlusCircle as PlusCircle,
  FiRefreshCw as RefreshCw,
  FiSearch as Search,
  FiUser as UserIcon,
  FiUsers as Users,
  FiX as X,
} from "react-icons/fi";
import {
  formatFieldValue,
  getEmployeeDepartmentCode,
  groupEmployeeSearchResults,
  humanizeFieldKey,
} from "../../dashboard.utils";
import { EmptyState, FormField, formInputClass } from "../../components/SharedControls";

export function EmployeeSearchPanel({
  term,
  onTermChange,
  onSubmit,
  results,
  isLoading,
  error,
  hasSearched,
  onViewDetail,
}) {
  const employeeGroups = useMemo(() => groupEmployeeSearchResults(results), [results]);

return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-950">Employee lookup</h2>
          <p className="mt-0.5 text-[13px] text-slate-500">Search by name to see assigned equipment</p>
        </div>
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="search"
              value={term}
              onChange={(e) => onTermChange(e.target.value)}
              placeholder="Search employee name"
              className="h-9 w-56 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !term.trim()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Search
          </button>
        </form>
      </div>

{!hasSearched ? (
        <EmptyState
          icon={Search}
          title="Search for an employee"
          description="Results show the equipment assigned to them."
        />
      ) : isLoading ? (
        <div className="px-5 py-10 text-center text-[13px] text-slate-500">Searching...</div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500">
            <AlertTriangle size={18} />
          </div>
          <p className="text-[13px] font-semibold text-slate-700">Search failed</p>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      ) : employeeGroups.length === 0 ? (
        <EmptyState icon={UserIcon} title="No matches" description="No employee matches that name." />
      ) : (
        <div className="divide-y divide-slate-100">
          {employeeGroups.map((group) => (
            <div key={group.employee_id ?? group.owner_name} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                    <UserIcon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{group.owner_name || "Unknown"}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {[group.employee_position, group.employee_department, group.employee_location]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {group.devices.length} device{group.devices.length === 1 ? "" : "s"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onViewDetail(group)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    View Detail
                  </button>
                </div>
              </div>

<div className="mt-3 space-y-2 pl-12">
                {group.devices.map((device, idx) => (
                  <div
                    key={device.equipment_id ?? idx}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-slate-800">
                        {[device.category, device.device_type].filter(Boolean).join(" · ") || "—"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {device.computer_name ||
                          [device.manufacturer, device.device_model].filter(Boolean).join(" ") ||
                          device.asset_code ||
                          device.service_tag ||
                          "—"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${device.device_status === "Operational"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                        }`}
                    >
                      {device.device_status || "Unknown"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EmployeeFormModal({
  isOpen,
  mode,
  values,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
  departments,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

if (!isOpen) return null;

 const isEdit = mode === "edit";

return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">
              {isEdit ? "Edit employee" : "Add new employee"}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {isEdit ? "Update this employee's details." : "Add a new employee to the directory."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

<form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                {error}
              </div>
            )}

<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField label="Full Name *" htmlFor="employee-full_name">
                  <input
                    id="employee-full_name"
                    type="text"
                    required
                    autoComplete="off"
                    value={values.full_name}
                    onChange={(e) => onChange("full_name", e.target.value)}
                    className={formInputClass}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

<FormField label="Position" htmlFor="employee-position">
                <input
                  id="employee-position"
                  type="text"
                  autoComplete="off"
                  value={values.position}
                  onChange={(e) => onChange("position", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

<FormField label="Department" htmlFor="employee-department">
                <select
                  id="employee-department"
                  autoComplete="off"
                  value={values.department}
                  onChange={(e) => onChange("department", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                >
                  <option value="">—</option>
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_code}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </FormField>

<FormField label="Location" htmlFor="employee-location">
                <input
                  id="employee-location"
                  type="text"
                  autoComplete="off"
                  value={values.location}
                  onChange={(e) => onChange("location", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

<FormField label="Staff Code" htmlFor="employee-staff_code">
                <input
                  id="employee-staff_code"
                  type="text"
                  autoComplete="off"
                  value={values.staff_code}
                  onChange={(e) => onChange("staff_code", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

<FormField label="Phone" htmlFor="employee-phone">
                <input
                  id="employee-phone"
                  type="text"
                  autoComplete="off"
                  value={values.phone}
                  onChange={(e) => onChange("phone", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

<FormField label="Sex" htmlFor="employee-sex">
                <input
                  id="employee-sex"
                  type="text"
                  autoComplete="off"
                  value={values.sex}
                  onChange={(e) => onChange("sex", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>
          </div>

<div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EmployeeDirectoryTable({
  employees,
  totalCount,
  sort,
  onSort,
  isLoading,
  error,
  onRetry,
  page,
  pageCount,
  onPageChange,
  pageSize,
  onViewDetail,
  onAddNew,
  onEdit,
  onDelete,
}) {
  const columns = [
    { key: "full_name", label: "Name" },
    { key: "position", label: "Position" },
    { key: "department_code", label: "Department" },
    { key: "location", label: "Location" },
  ];

return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-950">Employee directory</h2>
          {!isLoading && !error && (
            <p className="mt-0.5 text-[13px] text-slate-500">{totalCount} employees</p>
          )}
        </div>
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <PlusCircle size={15} />
          Add New Employee
        </button>
      </div>

{isLoading ? (
        <div className="px-5 py-10 text-center text-[13px] text-slate-500">Loading employees...</div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500">
            <AlertTriangle size={18} />
          </div>
          <p className="text-[13px] font-semibold text-slate-700">Couldn&apos;t load employees</p>
          <p className="text-xs text-slate-500">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      ) : employees.length === 0 ? (
        <EmptyState icon={Users} title="No employees found" description="The employee directory is empty." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[13px]">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  {columns.map((column) => {
                    const isActive = sort.key === column.key;
                    const SortIcon = isActive && sort.direction === "desc" ? ChevronDown : ChevronUp;
                    return (
                      <th key={column.key} className="px-5 py-3 font-semibold">
                        <button
                          type="button"
                          onClick={() => onSort(column.key)}
                          className="inline-flex items-center gap-1 rounded outline-none transition hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                        >
                          {column.label}
                          <SortIcon size={12} className={isActive ? "text-slate-700" : "text-slate-300"} />
                        </button>
                      </th>
                    );
                  })}
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees.map((employee) => (
                  <tr key={employee.employee_id} className="transition hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-950">
                      {employee.full_name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{employee.position || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                      {getEmployeeDepartmentCode(employee) || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{employee.location || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onViewDetail(employee)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                          View Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(employee)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(employee)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 outline-none transition hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

{totalCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-[13px] text-slate-500">
              <span>
                Showing {(page - 1) * pageSize + 1}
                {"–"}
                {Math.min(page * pageSize, totalCount)} of {totalCount}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-transparent"
                >
                  Previous
                </button>
                <span className="tabular-nums text-slate-400">
                  {page} / {pageCount}
                </span>
                <button
                  type="button"
                  disabled={page === pageCount}
                  onClick={() => onPageChange(Math.min(pageCount, page + 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-transparent"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function EmployeeDetailModal({ employee, devices, isLoading, error, onRetry, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

if (!employee) return null;

return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label="Close detail"
      />
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">{employee.full_name || "Employee"}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {[employee.position, getEmployeeDepartmentCode(employee), employee.location].filter(Boolean).join(" · ") ||
                "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

<div className="overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="py-10 text-center text-[13px] text-slate-500">Loading details...</div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500">
                <AlertTriangle size={18} />
              </div>
              <p className="text-[13px] font-semibold text-slate-700">Couldn&apos;t load details</p>
              <p className="text-xs text-slate-500">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <RefreshCw size={13} />
                Retry
              </button>
            </div>
          ) : devices.length === 0 ? (
            <EmptyState
              icon={Box}
              title="No equipment records"
              description="This employee has no equipment assigned."
            />
          ) : (
            <div className="space-y-5">
              {devices.map((device, idx) => (
                <div key={device.equipment_id ?? idx} className="rounded-xl border border-slate-100">
                  <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
                    <p className="text-[13px] font-semibold text-slate-800">
                      {[device.category, device.device_type].filter(Boolean).join(" · ") || `Equipment ${idx + 1}`}
                    </p>
                  </div>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2.5 p-4 sm:grid-cols-2">
                    {Object.entries(device).map(([key, value]) => (
                      <div key={key} className="min-w-0">
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          {humanizeFieldKey(key)}
                        </dt>
                        <dd className="mt-0.5 truncate text-[13px] text-slate-800" title={formatFieldValue(value)}>
                          {formatFieldValue(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------
