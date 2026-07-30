import { useEffect } from "react";
import { FiX as X } from "react-icons/fi";
import { ADD_EQUIPMENT_TEXT_FIELDS } from "../../dashboard.config";
import {
  EmployeeSelectDropdown,
  FormField,
  formInputClass,
} from "../../components/SharedControls";

export function EquipmentFormModal({
  isOpen,
  mode,
  values,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
  departments,
  statuses,
  categoryOptions,
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
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">
              {isEdit ? "Edit equipment" : "Add new equipment"}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {isEdit ? "Update this item's details." : "New items start unassigned in stock."}
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
              <FormField label="Category *" htmlFor="add-equipment-category">
                <select
                  id="add-equipment-category"
                  required
                  autoComplete="off"
                  value={values.category}
                  onChange={(e) => onChange("category", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

{ADD_EQUIPMENT_TEXT_FIELDS.map((field) => (
                <FormField key={field.key} label={field.label} htmlFor={`add-equipment-${field.key}`}>
                  <input
                    id={`add-equipment-${field.key}`}
                    type="text"
                    autoComplete="off"
                    value={values[field.key]}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    className={formInputClass}
                    disabled={isSubmitting}
                  />
                </FormField>
              ))}

<FormField label="Department" htmlFor="add-equipment-department">
                <select
                  id="add-equipment-department"
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

<FormField label="Status" htmlFor="add-equipment-status">
                <select
                  id="add-equipment-status"
                  autoComplete="off"
                  value={values.status}
                  onChange={(e) => onChange("status", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                >
                  <option value="">—</option>
                  {statuses.map((status) => (
                    <option key={status.status_id} value={status.status_name}>
                      {status.status_name}
                    </option>
                  ))}
                </select>
              </FormField>

<FormField label="Windows License" htmlFor="add-equipment-windows_license">
                <select
                  id="add-equipment-windows_license"
                  autoComplete="off"
                  value={values.windows_license}
                  onChange={(e) => onChange("windows_license", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                >
                  <option value="">—</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </FormField>

<FormField label="AV License" htmlFor="add-equipment-av_license">
                <select
                  id="add-equipment-av_license"
                  autoComplete="off"
                  value={values.av_license}
                  onChange={(e) => onChange("av_license", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                >
                  <option value="">—</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </FormField>

<FormField label="Purchase Date" htmlFor="add-equipment-purchase_date">
                <input
                  id="add-equipment-purchase_date"
                  type="date"
                  autoComplete="off"
                  value={values.purchase_date}
                  onChange={(e) => onChange("purchase_date", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

<FormField label="Received Date" htmlFor="add-equipment-received_date">
                <input
                  id="add-equipment-received_date"
                  type="date"
                  autoComplete="off"
                  value={values.received_date}
                  onChange={(e) => onChange("received_date", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>

<div className="mt-4">
              <FormField label="Remark" htmlFor="add-equipment-remark">
                <textarea
                  id="add-equipment-remark"
                  rows={3}
                  autoComplete="off"
                  value={values.remark}
                  onChange={(e) => onChange("remark", e.target.value)}
                  className={`${formInputClass} h-auto resize-none py-2`}
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
              {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add equipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AssignEquipmentModal({
  isOpen,
  equipment,
  values,
  onChange,
  onSelectEmployee,
  onSubmit,
  onClose,
  isSubmitting,
  error,
  employees,
  departments,
  statuses,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

if (!isOpen || !equipment) return null;

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
            <h2 className="text-[15px] font-semibold text-slate-950">Assign equipment</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {[equipment.category, equipment.device_type, equipment.device_model].filter(Boolean).join(" · ") ||
                `Equipment ${equipment.equipment_id}`}
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
                <FormField label="Employee *" htmlFor="assign-employee_id">
                  <EmployeeSelectDropdown
                    employees={employees}
                    selectedId={values.employee_id}
                    onSelect={onSelectEmployee}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

<FormField label="Assigned Date" htmlFor="assign-assigned_date">
                <input
                  id="assign-assigned_date"
                  type="date"
                  autoComplete="off"
                  value={values.assigned_date}
                  onChange={(e) => onChange("assigned_date", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

<FormField label="Computer Name" htmlFor="assign-computer_name">
                <input
                  id="assign-computer_name"
                  type="text"
                  autoComplete="off"
                  value={values.computer_name}
                  onChange={(e) => onChange("computer_name", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

<FormField label="IP Address" htmlFor="assign-ip_address">
                <input
                  id="assign-ip_address"
                  type="text"
                  autoComplete="off"
                  value={values.ip_address}
                  onChange={(e) => onChange("ip_address", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

<FormField label="Location" htmlFor="assign-location">
                <input
                  id="assign-location"
                  type="text"
                  autoComplete="off"
                  value={values.location}
                  onChange={(e) => onChange("location", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

<FormField label="Department" htmlFor="assign-department">
                <select
                  id="assign-department"
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

<FormField label="Status" htmlFor="assign-status">
                <select
                  id="assign-status"
                  autoComplete="off"
                  value={values.status}
                  onChange={(e) => onChange("status", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                >
                  <option value="">Keep current status</option>
                  {statuses.map((status) => (
                    <option key={status.status_id} value={status.status_name}>
                      {status.status_name}
                    </option>
                  ))}
                </select>
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
              {isSubmitting ? "Assigning..." : "Assign equipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function BorrowEquipmentModal({
  isOpen,
  equipment,
  values,
  onChange,
  onSelectEmployee,
  onSubmit,
  onClose,
  isSubmitting,
  error,
  employees,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

if (!isOpen || !equipment) return null;

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
            <h2 className="text-[15px] font-semibold text-slate-950">Borrow equipment</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {[equipment.category, equipment.device_type, equipment.device_model].filter(Boolean).join(" · ") ||
                `Equipment ${equipment.equipment_id}`}
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
                <FormField label="Employee *" htmlFor="borrow-employee_id">
                  <EmployeeSelectDropdown
                    employees={employees}
                    selectedId={values.employee_id}
                    onSelect={onSelectEmployee}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

<FormField label="Expected Return Date *" htmlFor="borrow-expected_return_date">
                <input
                  id="borrow-expected_return_date"
                  type="date"
                  required
                  autoComplete="off"
                  value={values.expected_return_date}
                  onChange={(e) => onChange("expected_return_date", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

<FormField label="Condition on Borrow" htmlFor="borrow-condition_on_borrow">
                <input
                  id="borrow-condition_on_borrow"
                  type="text"
                  autoComplete="off"
                  value={values.condition_on_borrow}
                  onChange={(e) => onChange("condition_on_borrow", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

<div className="sm:col-span-2">
                <FormField label="Purpose" htmlFor="borrow-purpose">
                  <input
                    id="borrow-purpose"
                    type="text"
                    autoComplete="off"
                    value={values.purpose}
                    onChange={(e) => onChange("purpose", e.target.value)}
                    className={formInputClass}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

<div className="sm:col-span-2">
                <FormField label="Remark" htmlFor="borrow-remark">
                  <textarea
                    id="borrow-remark"
                    rows={3}
                    autoComplete="off"
                    value={values.remark}
                    onChange={(e) => onChange("remark", e.target.value)}
                    className={`${formInputClass} h-auto resize-none py-2`}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>
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
              {isSubmitting ? "Borrowing..." : "Borrow equipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ReturnEquipmentModal({ isOpen, loan, values, onChange, onSubmit, onClose, isSubmitting, error }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

if (!isOpen || !loan) return null;

return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">Return equipment</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {[loan.category_name, loan.device_model, loan.computer_name].filter(Boolean).join(" · ") ||
                `Equipment ${loan.equipment_id}`}{" "}
              · borrowed by {loan.borrower_name || `#${loan.borrower_id}`}
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

<div className="grid grid-cols-1 gap-4">
              <FormField label="Return Date *" htmlFor="return-return_date">
                <input
                  id="return-return_date"
                  type="date"
                  required
                  autoComplete="off"
                  value={values.return_date}
                  onChange={(e) => onChange("return_date", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

<FormField label="Condition on Return" htmlFor="return-condition_on_return">
                <input
                  id="return-condition_on_return"
                  type="text"
                  autoComplete="off"
                  value={values.condition_on_return}
                  onChange={(e) => onChange("condition_on_return", e.target.value)}
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
              {isSubmitting ? "Returning..." : "Mark as returned"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
