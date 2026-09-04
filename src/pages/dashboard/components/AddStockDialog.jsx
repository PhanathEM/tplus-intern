import { useTranslation } from "react-i18next";
import { FiX as X } from "react-icons/fi";
import {
  DISK_INTERFACE_OPTIONS,
  DISK_TYPE_OPTIONS,
  HD_CAPACITY_OPTIONS,
  MODEL_NAME_PLACEHOLDER_BY_PART,
  MODEL_NUMBER_PLACEHOLDER_BY_PART,
  RAM_CAPACITY_OPTIONS,
  RAM_TYPE_OPTIONS,
} from "../dashboard.config";
import { getExtraStockColumns, hasStockColumn } from "../dashboard.utils";
import { FormField, formInputClass, RadioSelect, RollingText } from "./SharedControls";

// Shared between the Part Stock page's "Add to stock" action and Device
// Replacement's "add to stock" shortcut (shown inline when fitting a part
// that has nothing available on the shelf).
export function AddStockDialog({
  isOpen,
  values,
  partTypes,
  customFieldCatalog,
  lockedPartTypeId,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
}) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const selectedPartType = partTypes.find((item) => String(item.part_type_id) === String(values.part_type_id));
  const isPartLocked = Boolean(lockedPartTypeId);
  const normalizedName = selectedPartType?.part_name?.trim().toLowerCase();
  const isRam = normalizedName === "ram";
  const isHardDisk = normalizedName === "hard disk";
  // Which fields this part type is configured to show — set via the Part
  // Type form's "Stock columns" picker, not hardcoded by part name.
  const needsModelName = hasStockColumn(selectedPartType, "model_name");
  const needsModelNumber = hasStockColumn(selectedPartType, "model_number");
  const needsDiskType = hasStockColumn(selectedPartType, "disk_type");
  const needsDiskInterface = hasStockColumn(selectedPartType, "disk_interface");
  const needsRamType = hasStockColumn(selectedPartType, "ram_type");
  const needsValue = hasStockColumn(selectedPartType, "part_value");
  const capacityOptions = isRam ? RAM_CAPACITY_OPTIONS : isHardDisk ? HD_CAPACITY_OPTIONS : null;
  // Custom fields beyond the ones with a dedicated widget above.
  const extraColumns = getExtraStockColumns(selectedPartType, customFieldCatalog);
  const missingRequiredExtra = extraColumns.some(
    (field) => field.field_type !== "boolean" && !String(values[field.field_key] || "").trim()
  );

  const canSubmit = Boolean(
    values.part_type_id &&
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
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">
              {isPartLocked && selectedPartType
                ? t("add_new_part_title", { name: selectedPartType.part_name })
                : t("Add to stock")}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t("Add a new part to stock.")}</p>
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
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>
            )}

            <FormField label={t("Part Name")} htmlFor="add-stock-part">
              {isPartLocked ? (
                <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {selectedPartType?.part_name || "—"}
                </div>
              ) : (
                <RadioSelect
                  id="add-stock-part"
                  value={values.part_type_id || ""}
                  onSelect={(value) => onChange("part_type_id", value)}
                  options={partTypes.map((partType) => ({ value: partType.part_type_id, label: partType.part_name }))}
                  placeholder={t("Select a part...")}
                />
              )}
            </FormField>

            {needsModelName && (
              <FormField label={t("Model Name")} htmlFor="add-stock-model-name">
                <input
                  id="add-stock-model-name"
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
              <FormField label={t("Model Number")} htmlFor="add-stock-model-number">
                <input
                  id="add-stock-model-number"
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
              <FormField label={t("Disk Type")} htmlFor="add-stock-disk-type">
                <RadioSelect
                  id="add-stock-disk-type"
                  value={values.disk_type || ""}
                  onSelect={(value) => onChange("disk_type", value)}
                  options={DISK_TYPE_OPTIONS.map((type) => ({ value: type, label: type }))}
                  placeholder={t("Select disk type...")}
                />
              </FormField>
            )}

            {needsDiskInterface && (
              <FormField label={t("Disk Interface")} htmlFor="add-stock-disk-interface">
                <RadioSelect
                  id="add-stock-disk-interface"
                  value={values.disk_interface || ""}
                  onSelect={(value) => onChange("disk_interface", value)}
                  options={DISK_INTERFACE_OPTIONS.map((type) => ({ value: type, label: type }))}
                  placeholder={t("Select disk interface...")}
                />
              </FormField>
            )}

            {needsRamType && (
              <FormField label={t("RAM Type")} htmlFor="add-stock-ram-type">
                <RadioSelect
                  id="add-stock-ram-type"
                  value={values.ram_type || ""}
                  onSelect={(value) => onChange("ram_type", value)}
                  options={RAM_TYPE_OPTIONS.map((type) => ({ value: type, label: type }))}
                  placeholder={t("Select RAM type...")}
                />
              </FormField>
            )}

            {needsValue && (
              <FormField label={t("Value")} htmlFor="add-stock-value">
                {capacityOptions ? (
                  <RadioSelect
                    id="add-stock-value"
                    value={values.part_value || ""}
                    onSelect={(value) => onChange("part_value", value)}
                    options={capacityOptions.map((option) => ({ value: option, label: option }))}
                    placeholder={t("Select capacity...")}
                  />
                ) : (
                  <input
                    id="add-stock-value"
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
                <FormField key={field.field_key} label={field.field_label} htmlFor={`add-stock-${field.field_key}`}>
                  <input
                    id={`add-stock-${field.field_key}`}
                    type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"}
                    autoComplete="off"
                    value={values[field.field_key] || ""}
                    onChange={(e) => onChange(field.field_key, e.target.value)}
                    className={formInputClass}
                  />
                </FormField>
              )
            )}

            <FormField label={t("Quantity")} htmlFor="add-stock-quantity">
              <input
                id="add-stock-quantity"
                type="number"
                min="1"
                step="1"
                value={values.quantity || ""}
                onChange={(e) => onChange("quantity", e.target.value)}
                className={formInputClass}
              />
            </FormField>

            <FormField label={t("Remark")} htmlFor="add-stock-remark">
              <textarea
                id="add-stock-remark"
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
              className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
            >
              <RollingText text={isSubmitting ? t("Adding...") : isRam ? t("Add RAM") : t("Add")} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
