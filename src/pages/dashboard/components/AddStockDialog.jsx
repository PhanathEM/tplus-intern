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
import { getDynamicPartFields } from "../dashboard.utils";
import { FormField, formInputClass } from "./SharedControls";

// Shared between the Part Stock page's "Add to stock" action and Device
// Replacement's "add to stock" shortcut (shown inline when fitting a part
// that has nothing available on the shelf).
export function AddStockDialog({ isOpen, values, partTypes, lockedPartTypeId, onChange, onSubmit, onClose, isSubmitting, error }) {
  if (!isOpen) return null;

  const selectedPartType = partTypes.find((item) => String(item.part_type_id) === String(values.part_type_id));
  const isPartLocked = Boolean(lockedPartTypeId);
  const normalizedName = selectedPartType?.part_name?.trim().toLowerCase();
  const isRam = normalizedName === "ram";
  const isHardDisk = normalizedName === "hard disk";
  const isBag = normalizedName === "bag";
  const isMouse = normalizedName === "mouse";
  const isKeyboard = normalizedName === "keyboard";
  const isCpu = normalizedName === "cpu";
  const needsModelName = isCpu || isBag || isMouse || isKeyboard;
  const needsModelNumber = isBag || isMouse || isKeyboard;
  const needsValue = Boolean(selectedPartType?.tracks_value);
  const capacityOptions = isRam ? RAM_CAPACITY_OPTIONS : isHardDisk ? HD_CAPACITY_OPTIONS : null;
  // Fields an admin attached to this part type via "+ Add field" — anything
  // beyond RAM/Model/Disk, which already have dedicated inputs above.
  const dynamicFields = getDynamicPartFields(selectedPartType);

  const canSubmit = Boolean(
    values.part_type_id &&
      values.quantity &&
      (!needsValue || values.part_value?.trim()) &&
      (!isRam || values.ram_type?.trim()) &&
      (!needsModelName || values.model_name?.trim()) &&
      (!needsModelNumber || values.model_number?.trim()) &&
      (!isHardDisk || (values.disk_type?.trim() && values.disk_interface?.trim()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-label="Close" />

      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">
              {isPartLocked && selectedPartType ? `Add New ${selectedPartType.part_name}` : "Add to stock"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">Add a new part to stock.</p>
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

        <form onSubmit={onSubmit} autoComplete="off">
          <div className="flex flex-col gap-4 px-6 py-5">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">{error}</div>
            )}

            <FormField label="Part Name" htmlFor="add-stock-part">
              {isPartLocked ? (
                <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                  {selectedPartType?.part_name || "—"}
                </div>
              ) : (
                <select
                  id="add-stock-part"
                  value={values.part_type_id || ""}
                  onChange={(e) => onChange("part_type_id", e.target.value)}
                  className={formInputClass}
                >
                  <option value="">Select a part...</option>
                  {partTypes.map((partType) => (
                    <option key={partType.part_type_id} value={partType.part_type_id}>
                      {partType.part_name}
                    </option>
                  ))}
                </select>
              )}
            </FormField>

            {needsModelName && (
              <FormField label="Model Name" htmlFor="add-stock-model-name">
                <input
                  id="add-stock-model-name"
                  type="text"
                  autoComplete="off"
                  value={values.model_name || ""}
                  onChange={(e) => onChange("model_name", e.target.value)}
                  placeholder={MODEL_NAME_PLACEHOLDER_BY_PART[normalizedName] || "e.g. Model name..."}
                  className={formInputClass}
                />
              </FormField>
            )}

            {needsModelNumber && (
              <FormField label="Model Number" htmlFor="add-stock-model-number">
                <input
                  id="add-stock-model-number"
                  type="text"
                  autoComplete="off"
                  value={values.model_number || ""}
                  onChange={(e) => onChange("model_number", e.target.value)}
                  placeholder={MODEL_NUMBER_PLACEHOLDER_BY_PART[normalizedName] || "e.g. Model number..."}
                  className={formInputClass}
                />
              </FormField>
            )}

            {isHardDisk && (
              <>
                <FormField label="Disk Type" htmlFor="add-stock-disk-type">
                  <select
                    id="add-stock-disk-type"
                    value={values.disk_type || ""}
                    onChange={(e) => onChange("disk_type", e.target.value)}
                    className={formInputClass}
                  >
                    <option value="">Select disk type...</option>
                    {DISK_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Disk Interface" htmlFor="add-stock-disk-interface">
                  <select
                    id="add-stock-disk-interface"
                    value={values.disk_interface || ""}
                    onChange={(e) => onChange("disk_interface", e.target.value)}
                    className={formInputClass}
                  >
                    <option value="">Select disk interface...</option>
                    {DISK_INTERFACE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </FormField>
              </>
            )}

            {isRam && (
              <FormField label="RAM Type" htmlFor="add-stock-ram-type">
                <select
                  id="add-stock-ram-type"
                  value={values.ram_type || ""}
                  onChange={(e) => onChange("ram_type", e.target.value)}
                  className={formInputClass}
                >
                  <option value="">Select RAM type...</option>
                  {RAM_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            {needsValue && (
              <FormField label="Value" htmlFor="add-stock-value">
                {capacityOptions ? (
                  <select
                    id="add-stock-value"
                    value={values.part_value || ""}
                    onChange={(e) => onChange("part_value", e.target.value)}
                    className={formInputClass}
                  >
                    <option value="">Select capacity...</option>
                    {capacityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="add-stock-value"
                    type="text"
                    autoComplete="off"
                    value={values.part_value || ""}
                    onChange={(e) => onChange("part_value", e.target.value)}
                    placeholder="e.g. 16 GB"
                    className={formInputClass}
                  />
                )}
              </FormField>
            )}

            {dynamicFields.map((field) =>
              field.field_type === "boolean" ? (
                <label
                  key={field.field_key}
                  className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(values[field.field_key])}
                    onChange={(e) => onChange(field.field_key, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
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

            <FormField label="Quantity" htmlFor="add-stock-quantity">
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

            <FormField label="Remark" htmlFor="add-stock-remark">
              <textarea
                id="add-stock-remark"
                rows={3}
                value={values.remark || ""}
                onChange={(e) => onChange("remark", e.target.value)}
                placeholder="Enter remark..."
                className={`${formInputClass} min-h-20 resize-none py-2`}
              />
            </FormField>
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
              disabled={!canSubmit || isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : isRam ? "Add RAM" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
