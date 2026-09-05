import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiPlusCircle as PlusCircle, FiX as X } from "react-icons/fi";
import { EmployeeSelectDropdown, FieldError, FormField, formInputClass, formInvalidClass, RadioSelect, RollingText } from "../../components/SharedControls";
import { OWNER_DERIVED_FIELDS } from "../../dashboard.utils";
import { EQUIPMENT_FIELD_PLACEHOLDERS, getEquipmentFieldPlaceholder } from "../../dashboard.config";
import { isEquipmentFieldRequired } from "./useEquipment";

function EquipmentDynamicField({ field, values, onChange, isSubmitting, departments, employees, onRemove, error }) {
  const { t } = useTranslation();
  const id = `add-equipment-${field.key}`;
  const value = values[field.key] || "";
  // Fields come from the API's per-category column config, so the example
  // value is looked up by key instead of written at each input.
  const placeholder = getEquipmentFieldPlaceholder(field.key, field.label);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState(null);

  function handleRemove() {
    setIsRemoving(true);
    setRemoveError(null);
    onRemove(field)
      .catch((error) => setRemoveError(error.message || "Could not remove field."))
      .finally(() => setIsRemoving(false));
  }

  const canRemove = Boolean(onRemove);
  const inputClass = error ? `${formInputClass} ${formInvalidClass}` : formInputClass;

  const label = (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor={id}>
        {isEquipmentFieldRequired(field) ? `${field.label} *` : field.label}
      </label>
      {canRemove && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={isSubmitting || isRemoving}
          title={t("Remove field")}
          className="text-slate-400 outline-none transition hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-500 dark:hover:text-rose-400"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );

  let input;
  if (field.type === "department-select") {
    input = (
      <RadioSelect
        id={id}
        value={value}
        onSelect={(value) => onChange(field.key, value)}
        options={[
          { value: "", label: t("select_field", { label: field.label }) },
          ...departments.map((dept) => ({ value: dept.department_code, label: dept.department_name })),
        ]}
        placeholder={t("select_field", { label: field.label })}
        disabled={isSubmitting}
        invalid={Boolean(error)}
      />
    );
  } else if (field.type === "employee-select") {
    input = (
      <EmployeeSelectDropdown
        employees={employees || []}
        selectedId={value}
        onSelect={(employee) => {
          onChange(field.key, String(employee.employee_id));
          // Sex/Department/Position/Location/Staff Code (if configured as
          // columns) are read-only, derived from whichever employee is
          // picked here — keep them in sync with the new pick.
          Object.entries(OWNER_DERIVED_FIELDS).forEach(([derivedKey, employeeProp]) => {
            onChange(derivedKey, employee[employeeProp] != null ? String(employee[employeeProp]) : "");
          });
        }}
        disabled={isSubmitting}
        placeholder={t("Select employee")}
      />
    );
  } else if (field.type === "owner-derived") {
    // No such field exists on equipment itself — it's a value the backend
    // derives from whichever employee is the owner, so it's never typed in
    // here: plain read-only text, not an input.
    input = (
      <div
        id={id}
        title={t("Set automatically from the selected owner")}
        className="flex h-10 w-full items-center rounded-lg bg-slate-50 px-3 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400"
      >
        {value || "—"}
      </div>
    );
  } else if (field.type === "server-type-select") {
    input = (
      <RadioSelect
        id={id}
        value={value}
        onSelect={(value) => onChange(field.key, value)}
        options={[
          { value: "", label: t("select_field", { label: field.label }) },
          { value: "Cloud", label: t("Cloud") },
          { value: "Physical", label: t("Physical") },
        ]}
        placeholder={t("select_field", { label: field.label })}
        disabled={isSubmitting}
        invalid={Boolean(error)}
      />
    );
  } else if (field.type === "yes-no-select") {
    input = (
      <RadioSelect
        id={id}
        value={value}
        onSelect={(value) => onChange(field.key, value)}
        options={[
          { value: "", label: t("select_field", { label: field.label }) },
          { value: "Yes", label: t("Yes") },
          { value: "No", label: t("No") },
        ]}
        placeholder={t("select_field", { label: field.label })}
        disabled={isSubmitting}
        invalid={Boolean(error)}
      />
    );
  } else if (field.type === "date") {
    input = (
      <input
        id={id}
        type="date"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        className={inputClass}
        disabled={isSubmitting}
      />
    );
  } else if (field.type === "number") {
    input = (
      <input
        id={id}
        type="number"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={placeholder}
        className={inputClass}
        disabled={isSubmitting}
      />
    );
  } else {
    input = (
      <input
        id={id}
        type="text"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={placeholder}
        className={inputClass}
        disabled={isSubmitting}
      />
    );
  }

  return (
    <div>
      {label}
      {input}
      <FieldError id={`${id}-error`}>{error}</FieldError>
      {removeError && <p className="mt-1 text-[11px] font-medium text-rose-600">{removeError}</p>}
    </div>
  );
}

const FALLBACK_CUSTOM_FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Yes/No" },
];

export function AddCustomFieldControl({ onAdd, disabled, types }) {
  const { t } = useTranslation();
  const typeOptions = types && types.length > 0 ? types : FALLBACK_CUSTOM_FIELD_TYPES;
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [type, setType] = useState(typeOptions[0].value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-[13px] font-semibold text-slate-600 outline-none transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-white"
      >
        <PlusCircle size={15} />
        {t("Add field")}
      </button>
    );
  }

  function handleAdd() {
    if (!label.trim()) {
      setError("Enter a field name.");
      return;
    }
    setIsSaving(true);
    setError(null);
    onAdd(label.trim(), type)
      .then(() => {
        setIsOpen(false);
        setLabel("");
        setType(typeOptions[0].value);
      })
      .catch((err) => setError(err.message || "Could not add field."))
      .finally(() => setIsSaving(false));
  }

  return (
    <div className="col-span-full rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
      {error && <p className="mb-2 text-[12px] font-medium text-rose-600">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          autoComplete="off"
          placeholder={t("Field name")}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className={`${formInputClass} max-w-56`}
          disabled={isSaving}
        />
        <div className="w-36">
          <RadioSelect
            value={type}
            onSelect={(value) => setType(value)}
            options={typeOptions}
            disabled={isSaving}
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={isSaving}
          className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518]"
        >
          <RollingText text={isSaving ? t("Adding...") : t("Add")} />
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setError(null);
          }}
          disabled={isSaving}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 outline-none transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {t("Cancel")}
        </button>
      </div>
    </div>
  );
}

function CustomFieldCheckboxItem({ field, onRemove, onError }) {
  const { t } = useTranslation();
  const [isRemoving, setIsRemoving] = useState(false);

  function handleChange() {
    setIsRemoving(true);
    onError(null);
    onRemove(field)
      .catch((err) => onError(err.message || "Could not remove field."))
      .finally(() => setIsRemoving(false));
  }

  return (
    <label
      title={t("Custom field — uncheck to remove it from this category")}
      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
    >
      <input
        type="checkbox"
        checked
        disabled={isRemoving}
        onChange={handleChange}
        className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-orange-400 dark:border-slate-600 dark:bg-slate-700"
      />
      {field.label}
    </label>
  );
}

function ReusableFieldCheckboxItem({ field, onReuse, onError }) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);

  function handleChange() {
    setIsSaving(true);
    onError(null);
    onReuse(field)
      .catch((err) => onError(err.message || "Could not add field."))
      .finally(() => setIsSaving(false));
  }

  return (
    <label
      title={t("Existing custom field from another category — check to reuse it here")}
      className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-[13px] font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-700 dark:border-slate-600 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-200"
    >
      <input
        type="checkbox"
        checked={false}
        disabled={isSaving}
        onChange={handleChange}
        className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-orange-400 dark:border-slate-600 dark:bg-slate-700"
      />
      {field.label}
    </label>
  );
}

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
  employees,
  statuses,
  categoryOptions,
  categoryLocked = false,
  fields = [],
  onRemoveField,
  onOpenColumnsPicker,
  licenseOptions = [],
  selectedLicenseIds = [],
  onToggleLicense,
  isLicensesLoading = false,
  licensesError = null,
  missingFields = [],
}) {
  const { t } = useTranslation();
  // Our own "required" message, in place of the browser's bubble - the form
  // is noValidate below so only this one ever shows.
  const fieldError = (key) => (missingFields.includes(key) ? t("This field is required.") : null);

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
        aria-label={t("Close")}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">
              {isEdit ? t("Edit equipment") : t("Add new equipment")}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {isEdit ? t("Update this item's details.") : t("New items start unassigned in stock.")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-slate-200 leading-none text-slate-500 outline-none transition hover:border-slate-300 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            aria-label={t("Close")}
          >
            <X size={15} className="block" />
          </button>
        </div>

<form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off" noValidate>
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}

<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label={`${t("Category")} *`} htmlFor="add-equipment-category" error={fieldError("category")}>
                <RadioSelect
                  id="add-equipment-category"
                  value={values.category}
                  onSelect={(value) => onChange("category", value)}
                  options={categoryOptions.map((option) => ({ value: option, label: option }))}
                  placeholder={t("Select category")}
                  disabled={isSubmitting || categoryLocked}
                  invalid={missingFields.includes("category")}
                />
              </FormField>

{fields.map((field) => (
                <EquipmentDynamicField
                  key={field.key}
                  field={field}
                  values={values}
                  onChange={onChange}
                  isSubmitting={isSubmitting}
                  departments={departments}
                  employees={employees}
                  onRemove={onRemoveField}
                  error={fieldError(field.key)}
                />
              ))}

              <FormField label={`${t("Status")} *`} htmlFor="add-equipment-status" error={fieldError("status")}>
                <RadioSelect
                  id="add-equipment-status"
                  value={values.status}
                  onSelect={(value) => onChange("status", value)}
                  options={[
                    { value: "", label: t("Select Status") },
                    ...statuses.map((status) => ({ value: status.status_name, label: status.status_name })),
                  ]}
                  placeholder={t("Select Status")}
                  disabled={isSubmitting}
                  invalid={missingFields.includes("status")}
                />
              </FormField>
            </div>

<div className="mt-4">
              <FormField label={`${t("Remark")} *`} htmlFor="add-equipment-remark" error={fieldError("remark")}>
                <textarea
                  id="add-equipment-remark"
                  rows={3}
                  autoComplete="off"
                  value={values.remark}
                  onChange={(e) => onChange("remark", e.target.value)}
                  placeholder={EQUIPMENT_FIELD_PLACEHOLDERS.remark}
                  className={`${formInputClass} h-auto resize-none py-2 ${missingFields.includes("remark") ? formInvalidClass : ""}`}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>

<div className="mt-4">
              <FormField label={t("Software License")}>
                {isLicensesLoading ? (
                  <p className="text-[13px] text-slate-500 dark:text-slate-400">{t("Loading licenses...")}</p>
                ) : licensesError ? (
                  <p className="text-[13px] text-rose-600 dark:text-rose-400">{licensesError}</p>
                ) : licenseOptions.length === 0 ? (
                  <p className="text-[13px] text-slate-500 dark:text-slate-400">
                    {t("No licenses found. Add one from the License page first.")}
                  </p>
                ) : (
                  <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                    {licenseOptions.map((license) => {
                      const isChecked = selectedLicenseIds.some(
                        (id) => String(id) === String(license.license_id)
                      );
                      return (
                        <label
                          key={license.license_id}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onToggleLicense(license.license_id)}
                            disabled={isSubmitting}
                            className="h-4 w-4 shrink-0 rounded border-slate-300 text-slate-950 focus:ring-orange-400 dark:border-slate-600 dark:bg-slate-800"
                          />
                          <span className="truncate">{license.product_name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </FormField>
            </div>
          </div>

<div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              {t("Cancel")}
            </button>
            {onOpenColumnsPicker && (
              <button
                type="button"
                onClick={onOpenColumnsPicker}
                disabled={isSubmitting || !values.category}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
              >
                {t("Add More Columns")}
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
            >
              <RollingText text={isSubmitting ? t("Saving...") : isEdit ? t("Save changes") : t("Add equipment")} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ColumnsPickerModal({
  isOpen,
  categoryLabel,
  fields,
  selectedKeys,
  onToggle,
  customFields = [],
  reusableFields = [],
  fieldTypes,
  onAddField,
  onRemoveField,
  onReuseField,
  onSave,
  onClose,
  isLoading,
  isSaving,
  error,
  onError,
}) {
  const { t } = useTranslation();

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label={t("Close")}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Configure columns")}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {t("Choose which fields appear for", { category: categoryLabel || t("this category") })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-slate-200 leading-none text-slate-500 outline-none transition hover:border-slate-300 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            aria-label={t("Close")}
          >
            <X size={15} className="block" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="py-8 text-center text-[13px] text-slate-500 dark:text-slate-400">{t("Loading fields...")}</div>
          ) : fields.length === 0 && customFields.length === 0 && reusableFields.length === 0 && !onAddField ? (
            <div className="py-8 text-center text-[13px] text-slate-500 dark:text-slate-400">{t("No fields available.")}</div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {fields.map((field) => (
                <label
                  key={field.key}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
                >
                  <input
                    type="checkbox"
                    checked={selectedKeys.includes(field.key)}
                    onChange={() => onToggle(field.key)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-orange-400 dark:border-slate-600 dark:bg-slate-800"
                  />
                  {field.label}
                </label>
              ))}

              {customFields.map((field) => (
                <CustomFieldCheckboxItem key={field.key} field={field} onRemove={onRemoveField} onError={onError} />
              ))}

              {onReuseField &&
                reusableFields.map((field) => (
                  <ReusableFieldCheckboxItem key={field.key} field={field} onReuse={onReuseField} onError={onError} />
                ))}

              {onAddField && <AddCustomFieldControl onAdd={onAddField} types={fieldTypes} />}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <p className="text-[12px] text-amber-600">
            {!isLoading && selectedKeys.length === 0
              ? t("Tick at least one field above (any one) to save.")
              : ""}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              {t("Cancel")}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || isLoading || selectedKeys.length === 0}
              title={selectedKeys.length === 0 ? t("Tick at least one field above to save") : undefined}
              className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
            >
              <RollingText text={isSaving ? t("Saving...") : t("Save columns")} />
            </button>
          </div>
        </div>
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
  const { t } = useTranslation();

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
        aria-label={t("Close")}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Borrow equipment")}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {[equipment.category, equipment.device_type, equipment.device_model].filter(Boolean).join(" · ") ||
                t("equipment_id_fallback", { id: equipment.equipment_id })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-slate-200 leading-none text-slate-500 outline-none transition hover:border-slate-300 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            aria-label={t("Close")}
          >
            <X size={15} className="block" />
          </button>
        </div>

<form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}

<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField label={t("Employee *")} htmlFor="borrow-employee_id">
                  <EmployeeSelectDropdown
                    employees={employees}
                    selectedId={values.employee_id}
                    onSelect={onSelectEmployee}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

<FormField label={t("Expected Return Date *")} htmlFor="borrow-expected_return_date">
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

<FormField label={t("Condition on Borrow")} htmlFor="borrow-condition_on_borrow">
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
                <FormField label={t("Purpose")} htmlFor="borrow-purpose">
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
                <FormField label={t("Remark")} htmlFor="borrow-remark">
                  <textarea
                    id="borrow-remark"
                    rows={3}
                    autoComplete="off"
                    value={values.remark}
                    onChange={(e) => onChange("remark", e.target.value)}
                    placeholder={EQUIPMENT_FIELD_PLACEHOLDERS.remark}
                    className={`${formInputClass} h-auto resize-none py-2`}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>
            </div>
          </div>

<div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
            >
              <RollingText text={isSubmitting ? t("Borrowing...") : t("Borrow equipment")} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ReturnEquipmentModal({ isOpen, loan, values, onChange, onSubmit, onClose, isSubmitting, error }) {
  const { t } = useTranslation();

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
        aria-label={t("Close")}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Return equipment")}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {[loan.category_name, loan.device_model, loan.computer_name].filter(Boolean).join(" · ") ||
                t("equipment_id_fallback", { id: loan.equipment_id })}{" "}
              · {t("borrowed_by", { name: loan.borrower_name || `#${loan.borrower_id}` })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-slate-200 leading-none text-slate-500 outline-none transition hover:border-slate-300 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            aria-label={t("Close")}
          >
            <X size={15} className="block" />
          </button>
        </div>

<form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}

<div className="grid grid-cols-1 gap-4">
              <FormField label={t("Return Date *")} htmlFor="return-return_date">
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

<FormField label={t("Condition on Return")} htmlFor="return-condition_on_return">
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

<div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
            >
              <RollingText text={isSubmitting ? t("Returning...") : t("Mark as returned")} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
