import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FiAlertTriangle as AlertTriangle,
  FiEdit2 as Edit2,
  FiPackage as Package,
  FiPlusCircle as PlusCircle,
  FiRefreshCw as RefreshCw,
  FiTrash2 as Trash2,
  FiX as X,
} from "react-icons/fi";

import {
  DISK_INTERFACE_OPTIONS,
  DISK_TYPE_OPTIONS,
  HD_CAPACITY_OPTIONS,
  MODEL_NAME_PLACEHOLDER_BY_PART,
  MODEL_NUMBER_PLACEHOLDER_BY_PART,
  PART_STOCK_COLUMNS,
  RAM_CAPACITY_OPTIONS,
  RAM_TYPE_OPTIONS,
} from "../../dashboard.config";
import { getExtraStockColumns, getStockColumns, hasStockColumn } from "../../dashboard.utils";

import { RecordsTableView } from "../../components/RecordsTableView";
import { CategoryTabs } from "../../components/CategoryTabs";

import {
  EmptyState,
  FormField,
  formInputClass,
  RadioSelect,
  RowActionsMenu,
} from "../../components/SharedControls";

import { AddStockDialog } from "../../components/AddStockDialog";
import { AddCustomFieldControl } from "../equipment/EquipmentModals";

const HIDDEN_STOCK_FIELDS = [
  "location",
  "part_type_id",
  "is_countable",
  "tracks_value",
  "is_active",
];

// The "All part stock" view (no part card selected) mixes rows from every
// part type, each with its own extra fields (RAM Type, Model Name/Number,
// Disk Type/Interface...). Rather than showing a column per field — mostly
// N/A for any given row — fold whichever of those fields a row actually has
// into one human-readable "Details" string.
function buildStockDetails(item) {
  const parts = [
    item.ram_type,
    item.model_name,
    item.model_number,
    item.disk_type,
    item.disk_interface,
  ].filter((value) => value && String(value).trim());

  return parts.length ? parts.join(" · ") : null;
}

// Which fields show up when adding/editing stock for this part — built-in
// part_stock fields (Model Name, RAM Type, Location...) plus reusable
// custom fields, ticked in one combined list and saved as a whole via
// PUT /api/part-types/:id/stock-columns on submit.
function PartTypeStockColumnsSection({
  builtInOptions,
  customFieldOptions,
  customFieldTypes,
  selectedColumns,
  isLoading,
  error,
  onToggle,
  onAddField,
}) {
  const { t } = useTranslation();
  const isSelected = (field) => selectedColumns.some((column) => column.field === field);

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-[12px] font-medium text-rose-600">{error}</p>}
      {isLoading ? (
        <p className="text-[13px] text-slate-500 dark:text-slate-400">{t("Loading fields...")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {builtInOptions.map((option) => (
            <label
              key={option.field}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
            >
              <input
                type="checkbox"
                checked={isSelected(option.field)}
                onChange={() => onToggle(option.field, option.suggested_header)}
                className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-orange-400 dark:border-slate-600 dark:bg-slate-800"
              />
              {option.suggested_header}
            </label>
          ))}
          {customFieldOptions.map((option) => (
            <label
              key={option.field_key}
              className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-[13px] font-medium text-slate-600 transition hover:border-slate-400 dark:border-slate-600 dark:text-slate-400 dark:hover:border-slate-500"
            >
              <input
                type="checkbox"
                checked={isSelected(option.field_key)}
                onChange={() => onToggle(option.field_key, option.field_label)}
                className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-orange-400 dark:border-slate-600 dark:bg-slate-800"
              />
              {option.field_label}
            </label>
          ))}
          <AddCustomFieldControl onAdd={onAddField} types={customFieldTypes} />
        </div>
      )}
    </div>
  );
}

export function PartTypeFormModal({
  isOpen,
  mode,
  values,
  categories,
  isLoadingCategories,
  stockColumnBuiltInOptions,
  stockColumnCustomFieldOptions,
  customFieldTypes,
  selectedStockColumns,
  isLoadingStockColumns,
  stockColumnsError,
  onChange,
  onToggleCategory,
  onToggleStockColumn,
  onAddCustomField,
  onSubmit,
  onClose,
  isSubmitting,
  error,
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

  const isEdit = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-label={t("Close")} />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{isEdit ? t("Edit part") : t("Add new part")}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {isEdit ? t("Update this part's details.") : t("Add a new replaceable part to the catalog.")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label={t("Close")}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <FormField label={t("Part Name *")} htmlFor="part-type-name">
                <input
                  id="part-type-name"
                  type="text"
                  required
                  autoComplete="off"
                  value={values.part_name}
                  onChange={(e) => onChange("part_name", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label={t("Description")} htmlFor="part-type-description">
                <input
                  id="part-type-description"
                  type="text"
                  autoComplete="off"
                  value={values.description}
                  onChange={(e) => onChange("description", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={values.tracks_value}
                    onChange={(e) => onChange("tracks_value", e.target.checked)}
                    disabled={isSubmitting}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800"
                  />
                  {t("Tracks a value (e.g. capacity)")}
                </label>
                <label className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={values.is_countable}
                    onChange={(e) => onChange("is_countable", e.target.checked)}
                    disabled={isSubmitting}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800"
                  />
                  {t("Countable in stock")}
                </label>
              </div>

              <FormField label={t("Stock columns")}>
                <PartTypeStockColumnsSection
                  builtInOptions={stockColumnBuiltInOptions}
                  customFieldOptions={stockColumnCustomFieldOptions}
                  customFieldTypes={customFieldTypes}
                  selectedColumns={selectedStockColumns}
                  isLoading={isLoadingStockColumns}
                  error={stockColumnsError}
                  onToggle={onToggleStockColumn}
                  onAddField={onAddCustomField}
                />
              </FormField>

              <FormField label={t("Applies to categories")}>
                {isLoadingCategories ? (
                  <p className="text-[13px] text-slate-500 dark:text-slate-400">{t("Loading categories...")}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-3 dark:border-slate-700">
                    {categories.map((category) => (
                      <label
                        key={category.category_id}
                        className="inline-flex items-center gap-2 text-[13px] text-slate-700 dark:text-slate-300"
                      >
                        <input
                          type="checkbox"
                          checked={values.category_ids.includes(category.category_id)}
                          onChange={() => onToggleCategory(category.category_id)}
                          disabled={isSubmitting}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800"
                        />
                        {category.category_name}
                      </label>
                    ))}
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
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-offset-slate-900"
            >
              {isSubmitting ? t("Saving...") : isEdit ? t("Save changes") : t("Add Part")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditStockDialog({ target, values, partTypes, partStatuses = [], customFieldCatalog, onChange, onSubmit, onClose, isSubmitting, error }) {
  const { t } = useTranslation();

  if (!target || !values) return null;

  const partType = partTypes.find((item) => String(item.part_type_id) === String(target.part_type_id));
  const normalizedName = partType?.part_name?.trim().toLowerCase();
  const isRam = normalizedName === "ram";
  const isHardDisk = normalizedName === "hard disk";
  // Which fields this part type is configured to show — set via the Part
  // Type form's "Stock columns" picker, not hardcoded by part name.
  const needsModelName = hasStockColumn(partType, "model_name");
  const needsModelNumber = hasStockColumn(partType, "model_number");
  const needsDiskType = hasStockColumn(partType, "disk_type");
  const needsDiskInterface = hasStockColumn(partType, "disk_interface");
  const needsRamType = hasStockColumn(partType, "ram_type");
  const needsValue = hasStockColumn(partType, "part_value");
  const capacityOptions = isRam ? RAM_CAPACITY_OPTIONS : isHardDisk ? HD_CAPACITY_OPTIONS : null;
  const extraColumns = getExtraStockColumns(partType, customFieldCatalog);
  const missingRequiredExtra = extraColumns.some(
    (field) => field.field_type !== "boolean" && !String(values[field.field_key] || "").trim()
  );
  const canSubmit = Boolean(
    values.quantity &&
    (!needsValue || values.part_value?.trim()) &&
    (!needsRamType || values.ram_type?.trim()) &&
    (!needsModelName || values.model_name?.trim()) &&
    (!needsModelNumber || values.model_number?.trim()) &&
    (!needsDiskType || values.disk_type?.trim()) &&
    (!needsDiskInterface || values.disk_interface?.trim()) &&
    !missingRequiredExtra
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-label={t("Close")} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Edit")} {target.part_name}</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t("Update this stock line.")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label={t("Close")}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} autoComplete="off">
          <div className="flex flex-col gap-4 px-6 py-5">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}

            <FormField label={t("Part Name")} htmlFor="edit-stock-part">
              <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {target.part_name}
              </div>
            </FormField>

            {needsModelName && (
              <FormField label={t("Model Name")} htmlFor="edit-stock-model-name">
                <input
                  id="edit-stock-model-name"
                  type="text"
                  autoComplete="off"
                  value={values.model_name || ""}
                  onChange={(e) => onChange("model_name", e.target.value)}
                  placeholder={MODEL_NAME_PLACEHOLDER_BY_PART[normalizedName] || t("e.g. Model name...")}
                  className={formInputClass}
                />
              </FormField>
            )}

            {needsModelNumber && (
              <FormField label={t("Model Number")} htmlFor="edit-stock-model-number">
                <input
                  id="edit-stock-model-number"
                  type="text"
                  autoComplete="off"
                  value={values.model_number || ""}
                  onChange={(e) => onChange("model_number", e.target.value)}
                  placeholder={MODEL_NUMBER_PLACEHOLDER_BY_PART[normalizedName] || t("e.g. Model number...")}
                  className={formInputClass}
                />
              </FormField>
            )}

            {needsDiskType && (
              <FormField label={t("Disk Type")} htmlFor="edit-stock-disk-type">
                <select
                  id="edit-stock-disk-type"
                  value={values.disk_type || ""}
                  onChange={(e) => onChange("disk_type", e.target.value)}
                  className={formInputClass}
                >
                  <option value="">{t("Select disk type...")}</option>
                  {DISK_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            {needsDiskInterface && (
              <FormField label={t("Disk Interface")} htmlFor="edit-stock-disk-interface">
                <select
                  id="edit-stock-disk-interface"
                  value={values.disk_interface || ""}
                  onChange={(e) => onChange("disk_interface", e.target.value)}
                  className={formInputClass}
                >
                  <option value="">{t("Select disk interface...")}</option>
                  {DISK_INTERFACE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            {needsRamType && (
              <FormField label={t("RAM Type")} htmlFor="edit-stock-ram-type">
                <select
                  id="edit-stock-ram-type"
                  value={values.ram_type || ""}
                  onChange={(e) => onChange("ram_type", e.target.value)}
                  className={formInputClass}
                >
                  <option value="">{t("Select RAM type...")}</option>
                  {RAM_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            {needsValue && (
              <FormField label={t("Value")} htmlFor="edit-stock-value">
                {capacityOptions ? (
                  <select
                    id="edit-stock-value"
                    value={values.part_value || ""}
                    onChange={(e) => onChange("part_value", e.target.value)}
                    className={formInputClass}
                  >
                    <option value="">{t("Select capacity...")}</option>
                    {capacityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="edit-stock-value"
                    type="text"
                    autoComplete="off"
                    value={values.part_value || ""}
                    onChange={(e) => onChange("part_value", e.target.value)}
                    placeholder={t("e.g. 16 GB")}
                    className={formInputClass}
                  />
                )}
              </FormField>
            )}

            {extraColumns.map((field) =>
              field.field_type === "boolean" ? (
                <label
                  key={field.field_key}
                  className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-700 dark:text-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(values[field.field_key])}
                    onChange={(e) => onChange(field.field_key, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800"
                  />
                  {field.field_label}
                </label>
              ) : (
                <FormField key={field.field_key} label={field.field_label} htmlFor={`edit-stock-${field.field_key}`}>
                  <input
                    id={`edit-stock-${field.field_key}`}
                    type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"}
                    autoComplete="off"
                    value={values[field.field_key] || ""}
                    onChange={(e) => onChange(field.field_key, e.target.value)}
                    className={formInputClass}
                  />
                </FormField>
              )
            )}

            <FormField label={t("Status")} htmlFor="edit-stock-status">
              <RadioSelect
                id="edit-stock-status"
                options={[...partStatuses]
                  .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                  .map((status) => ({ value: status.status_name, label: t(status.status_name) }))}
                value={values.status}
                onSelect={(value) => onChange("status", value)}
                placeholder={t("Select a status...")}
              />
            </FormField>

            <FormField label={t("Quantity")} htmlFor="edit-stock-quantity">
              <input
                id="edit-stock-quantity"
                type="number"
                min="0"
                step="1"
                value={values.quantity || ""}
                onChange={(e) => onChange("quantity", e.target.value)}
                className={formInputClass}
              />
            </FormField>

            <FormField label={t("Remark")} htmlFor="edit-stock-remark">
              <textarea
                id="edit-stock-remark"
                rows={3}
                value={values.remark || ""}
                onChange={(e) => onChange("remark", e.target.value)}
                placeholder={t("Enter remark...")}
                className={`${formInputClass} min-h-20 resize-none py-2`}
              />
            </FormField>
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
              disabled={!canSubmit || isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-offset-slate-900"
            >
              {isSubmitting ? t("Saving...") : t("Save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PartStockView({
  stock,
  isLoading,
  error,
  onRetry,
  partTypes,
  selectedPartTypeId,
  onSelectPart,

  stockColumnCustomFieldOptions,
  partStatuses,

  isAddDialogOpen,
  addFormValues,
  isSubmittingAdd,
  addError,
  onOpenAddDialog,
  onCloseAddDialog,
  onAddFormChange,
  onSubmitAdd,

  editStockTarget,
  editFormValues,
  isSubmittingEdit,
  editError,
  onOpenEditDialog,
  onCloseEditDialog,
  onEditFormChange,
  onSubmitEdit,

  deletingStockId,
  onDeleteStock,
}) {
  const { t } = useTranslation();
  const selectedPartType = partTypes.find(
    (item) =>
      String(item.part_type_id) ===
      String(selectedPartTypeId)
  );

  // A part's fields can land in either of two separate lists — stock_columns
  // (built-ins, set via the Stock columns picker) and custom_fields (custom
  // fields actually attached server-side) — both get shown here, de-duped.
  const partStockColumns = getStockColumns(selectedPartType);
  const knownFieldNames = new Set(partStockColumns.map((column) => column.field_name));
  const currentColumns = selectedPartType
    ? [
        { key: "part_name", label: "Part Name" },
        ...partStockColumns.map((column) => ({ key: column.field_name, label: column.header_text })),
        ...(selectedPartType.custom_fields || [])
          .filter((field) => !knownFieldNames.has(field.field_key))
          .map((field) => ({ key: field.field_key, label: field.field_label })),
        { key: "quantity", label: "Quantity" },
        { key: "status", label: "Status" },
        { key: "remark", label: "Remark" },
        { key: "updated_at", label: "Last Updated" },
      ]
    : PART_STOCK_COLUMNS.default;

  const filteredStock = stock
    .filter(
      (item) =>
        String(item.part_type_id) ===
        String(selectedPartTypeId)
    )
    .map((item) => {
      const rest = { ...item, details: buildStockDetails(item) };

      HIDDEN_STOCK_FIELDS.forEach(
        (key) => delete rest[key]
      );

      return rest;
    });

  return (
    <>
      {/* Part type tabs */}
      <div className="px-4 pt-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              {t("Click a part to see its stock.")}
            </p>
          </div>

          <CategoryTabs
            options={partTypes.map((partType) => ({ value: partType.part_type_id, label: partType.part_name }))}
            selected={selectedPartTypeId}
            onSelect={onSelectPart}
          />
        </div>
      </div>

      {/* Stock table — only once a part is picked; no more mixed "All part stock" listing */}
      {selectedPartType ? (
        <RecordsTableView
          records={filteredStock}
          columnsConfig={currentColumns}
          title={t("part_stock_title", { name: selectedPartType.part_name })}
          recordLabel="entry"
          loadingText={t("Loading part stock...")}
          errorTitle={t("Couldn't load part stock")}
          emptyIcon={Package}
          emptyTitle={t("No parts in stock")}
          emptyDescription={t("no_part_in_stock", { name: selectedPartType.part_name })}
          rowKey={(item, index) =>
            item.stock_id ?? index
          }
          isLoading={isLoading}
          error={error}
          onRetry={onRetry}
          hideRefresh
          headerActions={
            <button
              type="button"
              onClick={() =>
                onOpenAddDialog(
                  selectedPartTypeId
                )
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-offset-slate-900"
            >
              <PlusCircle size={15} />
              {t("new_part_button", { name: selectedPartType.part_name })}
            </button>
          }
          renderRowActions={(record) => (
            <div className="flex items-center justify-end">
              <RowActionsMenu
                items={[
                  { icon: Edit2, label: t("Edit"), onClick: () => onOpenEditDialog(record) },
                  {
                    icon: Trash2,
                    label: deletingStockId === record.stock_id ? t("Deleting...") : t("Delete"),
                    onClick: () => onDeleteStock(record),
                    destructive: true,
                  },
                ]}
              />
            </div>
          )}
        />
      ) : null}

      {/* Add stock dialog */}
      <AddStockDialog
        isOpen={isAddDialogOpen}
        values={addFormValues}
        partTypes={partTypes}
        customFieldCatalog={stockColumnCustomFieldOptions}
        lockedPartTypeId={
          selectedPartTypeId
        }
        onChange={onAddFormChange}
        onSubmit={onSubmitAdd}
        onClose={onCloseAddDialog}
        isSubmitting={isSubmittingAdd}
        error={addError}
      />

      {/* Edit stock dialog */}
      <EditStockDialog
        target={editStockTarget}
        values={editFormValues}
        partTypes={partTypes}
        partStatuses={partStatuses}
        customFieldCatalog={stockColumnCustomFieldOptions}
        onChange={onEditFormChange}
        onSubmit={onSubmitEdit}
        onClose={onCloseEditDialog}
        isSubmitting={isSubmittingEdit}
        error={editError}
      />
    </>
  );
}

// Standalone part-type management page (Managements > Part Types) — the
// same part catalog, Add/Edit/Delete handlers, and PartTypeFormModal the
// Stock of Replace a Part page's tab kebab menu used to expose inline, just
// given a proper table + its own place in the nav instead.
export function PartTypeManagementView({
  partTypes,
  isLoading,
  error,
  onRetry,
  onAddPartType,
  onEditPartType,
  onDeletePartType,
  canManage = true,
}) {
  const { t } = useTranslation();

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Part Types")}</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                {t("part_type_count", { count: partTypes.length })}
              </p>
            )}
          </div>
          {canManage && (
            <button
              type="button"
              onClick={onAddPartType}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-offset-slate-900"
            >
              <PlusCircle size={15} />
              {t("New Part")}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">{t("Loading part types...")}</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t("Couldn't load part types")}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              <RefreshCw size={13} />
              {t("Retry")}
            </button>
          </div>
        ) : partTypes.length === 0 ? (
          <EmptyState icon={Package} title={t("No part types found")} description={t("Part types will appear here.")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[13px] dark:divide-slate-800">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">{t("Part Name")}</th>
                  <th className="px-5 py-3 font-semibold">{t("Description")}</th>
                  <th className="px-5 py-3 font-semibold">{t("Tracks Value")}</th>
                  <th className="px-5 py-3 text-right font-semibold">{t("Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {partTypes.map((partType) => (
                  <tr
                    key={partType.part_type_id}
                    className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-950 dark:text-white">
                      {partType.part_name}
                    </td>
                    <td className="max-w-72 truncate px-5 py-3.5 text-slate-600 dark:text-slate-300" title={partType.description || ""}>
                      {partType.description || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {partType.tracks_value ? t("Yes") : t("No")}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      {canManage && (
                        <div className="flex items-center justify-end">
                          <RowActionsMenu
                            items={[
                              { icon: Edit2, label: t("Edit"), onClick: () => onEditPartType(partType) },
                              { icon: Trash2, label: t("Delete"), onClick: () => onDeletePartType(partType), destructive: true },
                            ]}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}