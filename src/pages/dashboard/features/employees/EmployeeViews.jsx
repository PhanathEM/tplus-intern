import { useEffect } from "react";
import {
  FiAlertTriangle as AlertTriangle,
  FiBox as Box,
  FiEdit2 as Edit2,
  FiFileText as FileText,
  FiGrid as Grid,
  FiPlusCircle as PlusCircle,
  FiRefreshCw as RefreshCw,
  FiSearch as Search,
  FiTrash2 as Trash2,
  FiUser as UserIcon,
  FiUsers as Users,
  FiX as X,
} from "react-icons/fi";
import {
  formatFieldValue,
  getEmployeeDepartmentCode,
} from "../../dashboard.utils";
import { EmptyState, FormField, formInputClass, RadioSelect, RowActionsMenu } from "../../components/SharedControls";
import {
  exportEmployeeDetailToExcel,
  exportEmployeeDetailToPdf,
  exportEmployeeToExcel,
  exportEmployeeToPdf,
} from "./employeeExport";

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
            <h3 className="text-[15px] font-semibold text-slate-600">
              {isEdit ? "Edit Employee" : "Add New Employee"}
            </h3>
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
                <RadioSelect
                  id="employee-department"
                  options={departments.map((dept) => ({ value: dept.department_code, label: dept.department_name }))}
                  value={values.department}
                  onSelect={(value) => onChange("department", value)}
                  placeholder="Select department..."
                  disabled={isSubmitting}
                />
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
                <RadioSelect
                  id="employee-sex"
                  options={[
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                  ]}
                  value={values.sex}
                  onSelect={(value) => onChange("sex", value)}
                  placeholder="Select sex..."
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
              {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Create"}
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
  isLoading,
  error,
  onRetry,
  page,
  pageCount,
  onPageChange,
  pageSize,
  search = "",
  onSearchChange,
  onViewDetail,
  onAddNew,
  onEdit,
  onDelete,
  canManage = true,
  canCreate = true,
}) {
  const columns = [
    { key: "full_name", label: "Full Name" },
    { key: "position", label: "Position" },
    { key: "department_code", label: "Department" },
    { key: "sex", label: "Sex" },
    { key: "staff_code", label: "Staff Code" },
    { key: "phone", label: "Phone" },
    { key: "location", label: "Location" },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-950">Employee</h2>
          {!isLoading && !error && (
            <p className="mt-0.5 text-[13px] text-slate-500">{totalCount} employees</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onSearchChange && (
            <div className="relative w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                id="employee-directory-search"
                type="text"
                autoComplete="off"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search Employee"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-8 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-400"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          {canCreate && (
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <PlusCircle size={15} />
              New Employee
            </button>
          )}
        </div>
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
        <EmptyState
          icon={Users}
          title="No employees found"
          description={search ? `No employee matches "${search}".` : "The employee directory is empty."}
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[13px]">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="px-5 py-3 font-semibold uppercase tracking-wide">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees.map((employee) => (
                  <tr
                    key={employee.employee_id}
                    onClick={() => onViewDetail(employee)}
                    className="cursor-pointer transition hover:bg-slate-50/70"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-950">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400">
                          <UserIcon size={15} />
                        </div>
                        {employee.full_name || "—"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{employee.position || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                      {getEmployeeDepartmentCode(employee) || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{employee.sex || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{employee.staff_code || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{employee.phone || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{employee.location || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end">
                        {canManage && (
                          <RowActionsMenu
                            items={[
                              { icon: FileText, label: "Download PDF", onClick: () => exportEmployeeToPdf(employee) },
                              { icon: Grid, label: "Download Excel", onClick: () => exportEmployeeToExcel(employee) },
                              { divider: true },
                              { icon: Edit2, label: "Edit", onClick: () => onEdit(employee) },
                              { icon: Trash2, label: "Delete", onClick: () => onDelete(employee), destructive: true },
                            ]}
                          />
                        )}
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

export function EmployeeDetailModal({
  employee,
  devices,
  isLoading,
  error,
  onRetry,
  onClose,
  onUnassign,
  canManage = true,
}) {
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
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-slate-950">{employee.full_name || "Employee"}</h2>
              {employee.is_active === false && (
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
                  Inactive
                </span>
              )}
              {employee.left_date && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  Left {formatFieldValue(employee.left_date)}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!isLoading && !error && (
              <>
                <button
                  type="button"
                  onClick={() => exportEmployeeDetailToPdf(employee, devices)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400"
                  aria-label="Download PDF"
                  title="Download PDF"
                >
                  <FileText size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => exportEmployeeDetailToExcel(employee, devices)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400"
                  aria-label="Download Excel"
                  title="Download Excel"
                >
                  <Grid size={16} />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/40 px-6 py-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
            {[
              ["Position", employee.position],
              ["Department", getEmployeeDepartmentCode(employee)],
              ["Location", employee.location],
              ["Staff Code", employee.staff_code],
              ["Phone", employee.phone],
              ["Sex", employee.sex],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
                <dd className="mt-0.5 truncate text-[13px] text-slate-800">{formatFieldValue(value)}</dd>
              </div>
            ))}
          </dl>
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
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
                    <p className="text-[13px] font-semibold text-slate-800">
                      Device {idx + 1}
                    </p>
                    {canManage && onUnassign && device.equipment_id && (
                      <button
                        type="button"
                        onClick={() => onUnassign({ equipment_id: device.equipment_id, category: device.category, ...device.item })}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      >
                        Unassign
                      </button>
                    )}
                  </div>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2.5 p-4 sm:grid-cols-2">
                    {(device.columns || []).map(({ field, header }) => (
                      <div key={field} className="min-w-0">
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{header}</dt>
                        <dd
                          className="mt-0.5 truncate text-[13px] text-slate-800"
                          title={formatFieldValue(device.item?.[field])}
                        >
                          {formatFieldValue(device.item?.[field])}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {device.licenses?.length > 0 && (
                    <div className="border-t border-slate-100 p-4">
                      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">Licenses</p>
                      <div className="space-y-2">
                        {device.licenses.map((license, licenseIdx) => (
                          <div
                            key={license.license_id ?? licenseIdx}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-[13px]"
                          >
                            <span className="font-medium text-slate-800">
                              {license.product_name || "—"}
                              {license.license_type ? ` · ${license.license_type}` : ""}
                            </span>
                            <span className="text-xs text-slate-500">
                              {license.status || "—"}
                              {license.date_expire ? ` · Expires ${formatFieldValue(license.date_expire)}` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}