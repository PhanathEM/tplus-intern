import {
  FiAlertTriangle as AlertTriangle,
  FiCheckCircle as CheckCircle,
  FiSearch as Search,
  FiUserPlus as UserPlus,
  FiX as X,
} from "react-icons/fi";
import { FormField, formInputClass } from "../../components/SharedControls";

function SectionCard({ step, title, description, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
          {step}
        </div>
        <div>
          <h3 className="text-[14px] font-semibold text-slate-950 dark:text-white">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function DeviceResultRow({ device, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(device)}
      className="relative flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left outline-none transition hover:z-10 hover:bg-white hover:shadow-[0_1px_2px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.12)] focus-visible:ring-2 focus-visible:ring-orange-400 dark:hover:bg-slate-800 dark:hover:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.35)]"
    >
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-slate-900 dark:text-slate-100">
          {device.display_name || device.asset_code || "—"}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
          {[device.category_name, device.asset_code, device.location].filter(Boolean).join(" · ") || "—"}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {device.status || "—"}
      </span>
    </button>
  );
}

function EmployeeResultRow({ employee, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(employee)}
      className={`relative flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${isSelected
        ? "bg-orange-50 dark:bg-orange-500/10"
        : "hover:z-10 hover:bg-white hover:shadow-[0_1px_2px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.12)] dark:hover:bg-slate-800 dark:hover:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.35)]"
        }`}
    >
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-slate-900 dark:text-slate-100">{employee.full_name}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
          {[employee.department_name || employee.department_code, employee.location].filter(Boolean).join(" · ") ||
            "—"}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {employee.current_equipment_count ?? 0} device{employee.current_equipment_count === 1 ? "" : "s"}
      </span>
    </button>
  );
}

export function AssignEquipmentView({
  isFormDataLoading,
  formDataError,
  onRetryFormData,
  categories = [],
  statuses = [],

  deviceQuery,
  onDeviceQueryChange,
  deviceCategory,
  onDeviceCategoryChange,
  deviceOptions = [],
  isDeviceLoading,
  deviceError,
  selectedDevice,
  onSelectDevice,
  onClearDevice,

  employeeQuery,
  onEmployeeQueryChange,
  employeeOptions = [],
  isEmployeeLoading,
  employeeError,
  selectedEmployee,
  onSelectEmployee,
  onClearEmployee,

  status,
  onStatusChange,
  assignedDate,
  onAssignedDateChange,

  onSubmit,
  isSubmitting,
  submitError,
  submitSuccess,

  conflict,
  onResolveConflict,
  isResolvingConflict,
}) {
  const canSubmit = Boolean(selectedDevice && selectedEmployee);

  if (isFormDataLoading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-[13px] text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Loading assign form...
        </div>
      </div>
    );
  }

  if (formDataError) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertTriangle size={18} />
          </div>
          <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Couldn&apos;t load the assign form</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formDataError}</p>
          <button
            type="button"
            onClick={onRetryFormData}
            className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <form onSubmit={onSubmit} className="mx-auto flex max-w-3xl flex-col gap-4" autoComplete="off">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">Assign equipment</h2>
          <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
            Give a device in stock to an employee. Pick a device, then narrow down to the employee.
          </p>
        </div>

        {submitSuccess && (
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle size={16} className="mt-0.5 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
        )}

        {conflict && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <p className="font-semibold">This device already belongs to someone.</p>
            <p className="mt-0.5">
              Currently assigned to{" "}
              <span className="font-semibold">{conflict.current_owner || "another employee"}</span>.
            </p>
            <button
              type="button"
              onClick={onResolveConflict}
              disabled={isResolvingConflict}
              className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-600 px-3 text-xs font-semibold text-white outline-none transition hover:bg-amber-700 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"
            >
              {isResolvingConflict ? "Unassigning..." : "Unassign it, then retry"}
            </button>
          </div>
        )}

        {submitError && !conflict && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            {submitError}
          </div>
        )}

        <SectionCard step={1} title="Pick a device">
          {selectedDevice ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50 px-3.5 py-2.5 dark:border-orange-800/60 dark:bg-orange-500/10">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">{selectedDevice.display_name}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                  {[selectedDevice.category_name, selectedDevice.asset_code, selectedDevice.status]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <button
                type="button"
                onClick={onClearDevice}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
              >
                <X size={13} />
                Change
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                    size={15}
                  />
                  <input
                    type="text"
                    autoComplete="off"
                    value={deviceQuery}
                    onChange={(e) => onDeviceQueryChange(e.target.value)}
                    placeholder="Search device name, asset code, service tag..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:bg-slate-800 dark:focus:ring-slate-700"
                  />
                </div>
                <select
                  value={deviceCategory}
                  onChange={(e) => onDeviceCategoryChange(e.target.value)}
                  className={`${formInputClass} sm:w-52`}
                >
                  <option value="All">All categories</option>
                  {categories.map((category) => (
                    <option key={category.category_id} value={category.category_name}>
                      {category.category_name} ({category.available_count})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-800">
                {isDeviceLoading ? (
                  <p className="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500">Searching...</p>
                ) : deviceError ? (
                  <p className="px-3 py-6 text-center text-xs text-rose-500 dark:text-rose-400">{deviceError}</p>
                ) : deviceOptions.length === 0 ? (
                  <p className="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    No assignable devices found. Try a different search or category.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-50 p-1 dark:divide-slate-800">
                    {deviceOptions.map((device, index) => (
                      <DeviceResultRow key={device.equipment_id ?? index} device={device} onSelect={onSelectDevice} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard step={2} title="Pick an employee">
          {selectedEmployee ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50 px-3.5 py-2.5 dark:border-orange-800/60 dark:bg-orange-500/10">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                  {selectedEmployee.full_name}
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                  {[
                    selectedEmployee.staff_code,
                    selectedEmployee.department_name ||
                    selectedEmployee.department_code,
                    selectedEmployee.location,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>

              <button
                type="button"
                onClick={onClearEmployee}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
              >
                <X size={13} />
                Change
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  size={15}
                />

                <input
                  type="text"
                  autoComplete="off"
                  value={employeeQuery}
                  onChange={(e) => onEmployeeQueryChange(e.target.value)}
                  placeholder="Search employee name or staff code..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:bg-slate-800 dark:focus:ring-slate-700"
                />
              </div>

              <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-800">
                {isEmployeeLoading ? (
                  <p className="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    Searching...
                  </p>
                ) : employeeError ? (
                  <p className="px-3 py-6 text-center text-xs text-rose-500 dark:text-rose-400">
                    {employeeError}
                  </p>
                ) : employeeOptions.length === 0 ? (
                  <p className="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    No employees found.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-50 p-1 dark:divide-slate-800">
                    {employeeOptions.map((employee) => (
                      <EmployeeResultRow
                        key={employee.employee_id}
                        employee={employee}
                        isSelected={
                          selectedEmployee?.employee_id === employee.employee_id
                        }
                        onSelect={onSelectEmployee}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard step={3} title="Status &amp; date">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Status" htmlFor="assign-page-status">
              <select
                id="assign-page-status"
                value={status}
                onChange={(e) => onStatusChange(e.target.value)}
                className={formInputClass}
              >
                {statuses.map((item) => (
                  <option key={item.status_id} value={item.status_name}>
                    {item.status_name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Assigned Date" htmlFor="assign-page-date">
              <input
                id="assign-page-date"
                type="date"
                value={assignedDate}
                onChange={(e) => onAssignedDateChange(e.target.value)}
                className={formInputClass}
              />
            </FormField>
          </div>
        </SectionCard>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-slate-950 px-5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-offset-slate-900"
          >
            <UserPlus size={15} />
            {isSubmitting ? "Assigning..." : "Assign equipment"}
          </button>
        </div>
      </form>
    </div>
  );
}
