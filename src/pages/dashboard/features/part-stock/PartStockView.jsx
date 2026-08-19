import {
  FiCpu as Cpu,
  FiEdit2 as Edit2,
  FiHardDrive as HardDrive,
  FiMousePointer as MousePointer,
  FiPackage as Package,
  FiPlusCircle as PlusCircle,
  FiServer as Server,
  FiShoppingBag as ShoppingBag,
  FiTrash2 as Trash2,
  FiType as Type,
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

import { RecordsTableView } from "../../components/RecordsTableView";

import {
  ConfirmDialog,
  FormField,
  formInputClass,
  RowActionsMenu,
} from "../../components/SharedControls";

import { AddStockDialog } from "../../components/AddStockDialog";

const HIDDEN_STOCK_FIELDS = [
  "location",
  "part_type_id",
  "is_countable",
  "tracks_value",
  "is_active",
];

const PART_ICON_BY_NAME = {
  ram: Server,
  cpu: Cpu,
  "hard disk": HardDrive,
  bag: ShoppingBag,
  mouse: MousePointer,
  keyboard: Type,
};

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

function PartTypeCard({
  partType,
  isSelected,
  quantity,
  onSelect,
}) {
  const normalizedName =
    partType.part_name?.trim().toLowerCase();

  const Icon =
    PART_ICON_BY_NAME[normalizedName] || Package;

  return (
    <button
      type="button"
      onClick={() =>
        onSelect(partType.part_type_id)
      }
      className={`flex flex-col overflow-hidden rounded-xl border text-left outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${isSelected
        ? "border-slate-300 ring-2 ring-slate-100"
        : "border-slate-200 hover:border-slate-300"
        }`}
    >
      <div
        className={`grid h-24 place-items-center ${isSelected
          ? "bg-slate-100"
          : "bg-slate-50"
          }`}
      >
        <Icon
          size={32}
          className={
            isSelected
              ? "text-slate-900"
              : "text-slate-400"
          }
        />
      </div>

      <div className="flex items-center justify-between gap-2 px-3.5 py-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-slate-900">
            {partType.part_name}
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            {quantity} in stock
            {partType.is_countable === false
              ? " · Not countable"
              : ""}
          </p>
        </div>

        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm font-semibold leading-none ${isSelected
            ? "bg-slate-950 text-white"
            : "bg-slate-100 text-slate-400"
            }`}
        >
          +
        </span>
      </div>
    </button>
  );
}

function EditStockDialog({ target, values, partTypes, onChange, onSubmit, onClose, isSubmitting, error }) {
  if (!target || !values) return null;

  const partType = partTypes.find((item) => String(item.part_type_id) === String(target.part_type_id));
  const isRam = partType?.part_name?.trim().toLowerCase() === "ram";
  const isCpu = partType?.part_name?.trim().toLowerCase() === "cpu";
  const isHardDisk = partType?.part_name?.trim().toLowerCase() === "hard disk";
  const isBag = partType?.part_name?.trim().toLowerCase() === "bag";
  const isMouse = partType?.part_name?.trim().toLowerCase() === "mouse";
  const isKeyboard = partType?.part_name?.trim().toLowerCase() === "keyboard";
  const needsModelName = isCpu || isBag || isMouse || isKeyboard;
  const needsModelNumber = isBag || isMouse || isKeyboard;
  const needsValue = Boolean(partType?.tracks_value);
  const normalizedName = partType?.part_name?.trim().toLowerCase();
  const capacityOptions =
    normalizedName === "ram" ? RAM_CAPACITY_OPTIONS : normalizedName === "hard disk" ? HD_CAPACITY_OPTIONS : null;
  const canSubmit = Boolean(
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
            <h2 className="text-[15px] font-semibold text-slate-950">Edit {target.part_name}</h2>
            <p className="mt-0.5 text-xs text-slate-500">Update this stock line.</p>
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
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                {error}
              </div>
            )}

            <FormField label="Part Name" htmlFor="edit-stock-part">
              <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                {target.part_name}
              </div>
            </FormField>

            {needsModelName && (
              <FormField label="Model Name" htmlFor="edit-stock-model-name">
                <input
                  id="edit-stock-model-name"
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
              <FormField label="Model Number" htmlFor="edit-stock-model-number">
                <input
                  id="edit-stock-model-number"
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
                <FormField label="Disk Type" htmlFor="edit-stock-disk-type">
                  <select
                    id="edit-stock-disk-type"
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

                <FormField label="Disk Interface" htmlFor="edit-stock-disk-interface">
                  <select
                    id="edit-stock-disk-interface"
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
              <FormField label="RAM Type" htmlFor="edit-stock-ram-type">
                <select
                  id="edit-stock-ram-type"
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
              <FormField label="Value" htmlFor="edit-stock-value">
                {capacityOptions ? (
                  <select
                    id="edit-stock-value"
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
                    id="edit-stock-value"
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

            <FormField label="Quantity" htmlFor="edit-stock-quantity">
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

            <FormField label="Remark" htmlFor="edit-stock-remark">
              <textarea
                id="edit-stock-remark"
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
              {isSubmitting ? "Saving..." : "Save"}
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

  stockToDelete,
  isDeletingStock,
  deleteStockError,
  deleteStockBlocked,
  onOpenDeleteStock,
  onCloseDeleteStock,
  onConfirmDeleteStock,
  onDeleteStockAnyway,
}) {
  const selectedPartType = partTypes.find(
    (item) =>
      String(item.part_type_id) ===
      String(selectedPartTypeId)
  );

  const normalizedPartName =
    selectedPartType?.part_name
      ?.trim()
      .toLowerCase();

  const currentColumns =
    PART_STOCK_COLUMNS[normalizedPartName] || PART_STOCK_COLUMNS.default;

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
      {/* Part type cards */}
      <div className="px-4 pt-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-[13px] text-slate-500">
              Click a part to see its stock.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 px-5 py-5 sm:grid-cols-3 lg:grid-cols-6">
            {partTypes.map((partType) => {
              const quantity = stock
                .filter(
                  (item) =>
                    String(
                      item.part_type_id
                    ) ===
                    String(
                      partType.part_type_id
                    )
                )
                .reduce(
                  (sum, item) =>
                    sum +
                    (Number(item.quantity) || 0),
                  0
                );

              return (
                <PartTypeCard
                  key={
                    partType.part_type_id
                  }
                  partType={partType}
                  isSelected={
                    String(
                      partType.part_type_id
                    ) ===
                    String(
                      selectedPartTypeId
                    )
                  }
                  quantity={quantity}
                  onSelect={onSelectPart}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Stock table — only once a part card is picked; no more mixed "All part stock" listing */}
      {selectedPartType ? (
        <RecordsTableView
          records={filteredStock}
          columnsConfig={currentColumns}
          title={`${selectedPartType.part_name} stock`}
          recordLabel="entry"
          loadingText="Loading part stock..."
          errorTitle="Couldn't load part stock"
          emptyIcon={Package}
          emptyTitle="No parts in stock"
          emptyDescription={`No ${selectedPartType.part_name} in stock right now.`}
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
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <PlusCircle size={15} />
              {`Add New ${selectedPartType.part_name}`}
            </button>
          }
          renderRowActions={(record) => (
            <div className="flex items-center justify-end">
              <RowActionsMenu
                items={[
                  { icon: Edit2, label: "Edit", onClick: () => onOpenEditDialog(record) },
                  { icon: Trash2, label: "Delete", onClick: () => onOpenDeleteStock(record), destructive: true },
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
        onChange={onEditFormChange}
        onSubmit={onSubmitEdit}
        onClose={onCloseEditDialog}
        isSubmitting={isSubmittingEdit}
        error={editError}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={Boolean(
          stockToDelete
        )}
        title="Delete stock line?"
        message={
          stockToDelete
            ? `Remove ${stockToDelete.part_name
            }${stockToDelete.part_value
              ? ` (${stockToDelete.part_value})`
              : ""
            } from stock. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        confirmingLabel="Deleting..."
        onConfirm={
          onConfirmDeleteStock
        }
        onCancel={
          onCloseDeleteStock
        }
        isConfirming={
          isDeletingStock
        }
        error={deleteStockError}
        blocked={
          deleteStockBlocked
        }
        blockedActionLabel="Delete anyway"
        onBlockedAction={
          onDeleteStockAnyway
        }
      />
    </>
  );
}