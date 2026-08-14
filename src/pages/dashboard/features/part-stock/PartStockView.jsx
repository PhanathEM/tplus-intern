import {
  FiCpu as Cpu,
  FiHardDrive as HardDrive,
  FiMousePointer as MousePointer,
  FiPackage as Package,
  FiPlusCircle as PlusCircle,
  FiServer as Server,
  FiShoppingBag as ShoppingBag,
  FiType as Type,
  FiX as X,
} from "react-icons/fi";
import { HD_CAPACITY_OPTIONS, partStockColumns, RAM_CAPACITY_OPTIONS } from "../../dashboard.config";
import { RecordCellValue, RecordsTableView } from "../../components/RecordsTableView";
import { ConfirmDialog, FormField, formInputClass } from "../../components/SharedControls";

const PART_ICON_BY_NAME = {
  ram: Server,
  cpu: Cpu,
  "hard disk": HardDrive,
  bag: ShoppingBag,
  mouse: MousePointer,
  keyboard: Type,
};

function PartTypeCard({ partType, isSelected, quantity, onSelect }) {
  const normalizedName = partType.part_name?.trim().toLowerCase();
  const Icon = PART_ICON_BY_NAME[normalizedName] || Package;

  return (
    <button
      type="button"
      onClick={() => onSelect(partType.part_type_id)}
      className={`flex flex-col overflow-hidden rounded-xl border text-left outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${isSelected ? "border-orange-300 ring-2 ring-orange-100" : "border-slate-200 hover:border-slate-300"
        }`}
    >
      <div className={`grid h-24 place-items-center ${isSelected ? "bg-orange-50" : "bg-slate-50"}`}>
        <Icon size={32} className={isSelected ? "text-orange-500" : "text-slate-400"} />
      </div>
      <div className="flex items-center justify-between gap-2 px-3.5 py-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-slate-900">{partType.part_name}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {quantity} in stock{partType.is_countable === false ? " · Not countable" : ""}
          </p>
        </div>
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm font-semibold leading-none ${isSelected ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-400"
            }`}
        >
          +
        </span>
      </div>
    </button>
  );
}

function AddStockDialog({
  isOpen,
  values,
  partTypes,
  statuses,
  lockedPartTypeId,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
}) {
  if (!isOpen) return null;

  const selectedPartType = partTypes.find((item) => String(item.part_type_id) === String(values.part_type_id));
  const isPartLocked = Boolean(lockedPartTypeId);
  const needsValue = Boolean(selectedPartType?.tracks_value);
  const normalizedName = selectedPartType?.part_name?.trim().toLowerCase();
  const capacityOptions =
    normalizedName === "ram" ? RAM_CAPACITY_OPTIONS : normalizedName === "hard disk" ? HD_CAPACITY_OPTIONS : null;
  const canSubmit = Boolean(
    values.part_type_id && values.quantity && values.status && (!needsValue || values.part_value.trim())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <h2 className="text-[15px] font-semibold text-slate-950">
            {isPartLocked && selectedPartType ? `Add ${selectedPartType.part_name} to stock` : "Add to stock"}
          </h2>
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

            <FormField label="Part" htmlFor="add-stock-part">
              {isPartLocked ? (
                <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                  {selectedPartType?.part_name || "—"}
                </div>
              ) : (
                <select
                  id="add-stock-part"
                  value={values.part_type_id}
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

            {needsValue && (
              <FormField label="Value" htmlFor="add-stock-value">
                {capacityOptions ? (
                  <select
                    id="add-stock-value"
                    value={values.part_value}
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
                    value={values.part_value}
                    onChange={(e) => onChange("part_value", e.target.value)}
                    placeholder='e.g. "32"'
                    className={formInputClass}
                  />
                )}
              </FormField>
            )}

            <FormField label="Quantity" htmlFor="add-stock-quantity">
              <input
                id="add-stock-quantity"
                type="number"
                min="1"
                step="1"
                value={values.quantity}
                onChange={(e) => onChange("quantity", e.target.value)}
                className={formInputClass}
              />
            </FormField>

            <FormField label="Status" htmlFor="add-stock-status">
              <select
                id="add-stock-status"
                value={values.status}
                onChange={(e) => onChange("status", e.target.value)}
                className={formInputClass}
              >
                <option value="">Select status...</option>
                {statuses.map((status) => (
                  <option key={status.status_id} value={status.status_name}>
                    {status.status_name}
                  </option>
                ))}
              </select>
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
              {isSubmitting ? "Adding..." : "Add"}
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
  statuses,

  isAddDialogOpen,
  addFormValues,
  isSubmittingAdd,
  addError,
  onOpenAddDialog,
  onCloseAddDialog,
  onAddFormChange,
  onSubmitAdd,

  editingStockId,
  editQuantityValue,
  isSavingQuantity,
  editQuantityError,
  onStartEditQuantity,
  onCancelEditQuantity,
  onEditQuantityChange,
  onSaveEditQuantity,

  stockToDelete,
  isDeletingStock,
  deleteStockError,
  deleteStockBlocked,
  onOpenDeleteStock,
  onCloseDeleteStock,
  onConfirmDeleteStock,
  onDeleteStockAnyway,
}) {
  const selectedPartType = partTypes.find((item) => String(item.part_type_id) === String(selectedPartTypeId));
  const filteredStock = selectedPartType
    ? stock.filter((item) => String(item.part_type_id) === String(selectedPartTypeId))
    : stock;

  return (
    <>
      <div className="px-4 pt-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-[15px] font-semibold text-slate-950">Stock of Replace a Part</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">Click a part to see its stock.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 px-5 py-5 sm:grid-cols-3 lg:grid-cols-6">
            {partTypes.map((partType) => {
              const quantity = stock
                .filter((item) => String(item.part_type_id) === String(partType.part_type_id))
                .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

              return (
                <PartTypeCard
                  key={partType.part_type_id}
                  partType={partType}
                  isSelected={String(partType.part_type_id) === String(selectedPartTypeId)}
                  quantity={quantity}
                  onSelect={onSelectPart}
                />
              );
            })}
          </div>
        </div>
      </div>

      <RecordsTableView
        records={filteredStock}
        columnsConfig={partStockColumns}
        title={selectedPartType ? `${selectedPartType.part_name} stock` : "All part stock"}
        recordLabel="entry"
        loadingText="Loading part stock..."
        errorTitle="Couldn't load part stock"
        emptyIcon={Package}
        emptyTitle="No parts in stock"
        emptyDescription={
          selectedPartType
            ? `No ${selectedPartType.part_name} in stock right now.`
            : "Parts removed from equipment will appear here."
        }
        rowKey={(item, index) => item.stock_id ?? index}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        headerActions={
          <button
            type="button"
            onClick={() => onOpenAddDialog(selectedPartTypeId)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <PlusCircle size={15} />
            Add to stock
          </button>
        }
        renderCell={(record, column) => {
          if (column.key === "quantity" && editingStockId === record.stock_id) {
            return (
              <div className="flex flex-col gap-1">
                <input
                  type="number"
                  min="0"
                  step="1"
                  autoFocus
                  value={editQuantityValue}
                  onChange={(e) => onEditQuantityChange(e.target.value)}
                  className="h-8 w-20 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
                {editQuantityError && <p className="text-xs text-rose-600">{editQuantityError}</p>}
              </div>
            );
          }
          return <RecordCellValue value={record[column.key]} />;
        }}
        renderRowActions={(record) =>
          editingStockId === record.stock_id ? (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCancelEditQuantity}
                disabled={isSavingQuantity}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSaveEditQuantity}
                disabled={isSavingQuantity}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingQuantity ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => onStartEditQuantity(record)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Edit qty
              </button>
              <button
                type="button"
                onClick={() => onOpenDeleteStock(record)}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 outline-none transition hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Delete
              </button>
            </div>
          )
        }
      />

      <AddStockDialog
        isOpen={isAddDialogOpen}
        values={addFormValues}
        partTypes={partTypes}
        statuses={statuses}
        lockedPartTypeId={selectedPartTypeId}
        onChange={onAddFormChange}
        onSubmit={onSubmitAdd}
        onClose={onCloseAddDialog}
        isSubmitting={isSubmittingAdd}
        error={addError}
      />

      <ConfirmDialog
        isOpen={Boolean(stockToDelete)}
        title="Delete stock line?"
        message={
          stockToDelete
            ? `Remove ${stockToDelete.part_name}${stockToDelete.part_value ? ` (${stockToDelete.part_value})` : ""} from stock. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        confirmingLabel="Deleting..."
        onConfirm={onConfirmDeleteStock}
        onCancel={onCloseDeleteStock}
        isConfirming={isDeletingStock}
        error={deleteStockError}
        blocked={deleteStockBlocked}
        blockedActionLabel="Delete anyway"
        onBlockedAction={onDeleteStockAnyway}
      />
    </>
  );
}
