import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle as AlertTriangle, FiChevronDown as ChevronDown, FiMonitor as Monitor, FiPlusCircle as PlusCircle, FiRefreshCw as RefreshCw, FiSearch as Search, FiX as X } from "react-icons/fi";
import { OLD_PART_STATUS_OPTIONS, PART_ACTION_OPTIONS } from "../../dashboard.config";
import { EmptyState, formInputClass, RadioSelect } from "../../components/SharedControls";
import { DynamicEquipmentTable } from "../../components/DynamicEquipmentTable";
import { CategoryTabs } from "../../components/CategoryTabs";
import { AddStockDialog } from "../../components/AddStockDialog";

// "16 GB · DDR5 (412 available)" — whichever identifying fields this stock
// line has (part_value/ram_type for RAM, model_name/number for CPU etc.).
function getStockOptionLabel(item) {
  const bits = [item.part_value, item.ram_type, item.model_name, item.model_number, item.disk_type, item.disk_interface].filter(
    (value) => value && String(value).trim()
  );
  const label = bits.length ? bits.join(" · ") : "Unlabeled";
  return `${label} (${item.quantity} available)`;
}

// Radio-style list for picking a stock line — no search box, since these
// lists are short (a handful of lines per part). Rendered through a portal
// with fixed positioning so it isn't clipped by the dialog's own scrolling
// content area, the way an absolutely-positioned panel would be.
function StockLineSelect({ id, options, selectedId, onSelect, placeholder = "Select a stock line..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuRect, setMenuRect] = useState(null);
  const containerRef = useRef(null);
  const menuRef = useRef(null);

  function updateMenuRect() {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMenuRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }

  useEffect(() => {
    if (!isOpen) return;

    updateMenuRect();

    function handlePointerDown(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateMenuRect);
    window.addEventListener("scroll", updateMenuRect, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateMenuRect);
      window.removeEventListener("scroll", updateMenuRect, true);
    };
  }, [isOpen]);

  const selectedOption = options.find((option) => String(option.stock_id) === String(selectedId));

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen((value) => !value)}
        className={`${formInputClass} flex items-center justify-between text-left`}
      >
        <span className={`truncate ${selectedOption ? "text-slate-900" : "text-slate-400"}`}>
          {selectedOption ? getStockOptionLabel(selectedOption) : placeholder}
        </span>
        <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen &&
        menuRect &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: menuRect.top, left: menuRect.left, width: menuRect.width }}
            className="z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <div className="max-h-56 overflow-y-auto p-1.5">
              {options.map((option) => {
                const isSelected = String(option.stock_id) === String(selectedId);
                return (
                  <button
                    key={option.stock_id}
                    type="button"
                    onClick={() => {
                      onSelect(option.stock_id);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${isSelected ? "text-orange-700" : "text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${isSelected ? "border-orange-500" : "border-slate-300"
                        }`}
                    >
                      {isSelected && <span className="h-2 w-2 rounded-full bg-orange-500" />}
                    </span>
                    <span className="truncate">{getStockOptionLabel(option)}</span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export function DeviceReplacementCategoryBar({ categories = [], selected, onSelect }) {
  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.category_name, label: category.category_name })),
    [categories]
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <CategoryTabs options={categoryOptions} selected={selected} onSelect={onSelect} />
    </div>
  );
}

export function ReplaceableDevicesView({
  devices,
  columns = [],
  isLoading,
  error,
  onRetry,
  canManage = true,
  onOpenReplaceDialog,
  search = "",
  onSearchChange,
}) {
  // The backend's own equipment_id isn't sequential (and we dropped its "No."
  // column), so number rows 1..n ourselves, matching whatever's on screen.
  const numberedDevices = useMemo(
    () => devices.map((device, index) => ({ ...device, _row_number: index + 1 })),
    [devices]
  );
  const numberedColumns = useMemo(() => [{ key: "_row_number", label: "No." }, ...columns], [columns]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">Devices you can replace</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500">
                {devices.length} device{devices.length === 1 ? "" : "s"}
                {canManage && devices.length > 0 ? " · These devices have owners, click to replace devices" : ""}
              </p>
            )}
          </div>

          {onSearchChange && (
            <div className="relative w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                id="replaceable-devices-search"
                type="text"
                autoComplete="off"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search Employee"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-8 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
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
        </div>

        <DynamicEquipmentTable
          columns={numberedColumns}
          records={numberedDevices}
          rowKey={(device, index) => device.equipment_id ?? index}
          isLoading={isLoading}
          loadingText="Loading devices..."
          error={error}
          errorTitle="Couldn't load devices"
          onRetry={onRetry}
          emptyIcon={Search}
          emptyTitle="No devices found"
          emptyDescription="Owned devices will appear here."
          onRowClick={canManage ? onOpenReplaceDialog : undefined}
        />
      </div>
    </div>
  );
}

// "Kaisone Inthisane" -> "KI" for the avatar circle.
function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
  return initials || "?";
}

// RAM's value is a bare number ("16") everywhere else in the app (device
// fields, stock lines) — only here, next to an arrow with no other context,
// does it need the unit spelled out to read as a capacity at a glance.
function formatPartValue(partName, value) {
  if (value === null || value === undefined || value === "") return "Empty";
  if (partName?.trim().toLowerCase() === "ram" && /^\d+(\.\d+)?$/.test(String(value).trim())) {
    return `${value} GB`;
  }
  return String(value);
}

function ReplacementHistoryRow({ replacement }) {
  const deviceLabel =
    replacement.computer_name || replacement.device_name || replacement.device_model || replacement.asset_code || "—";

  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
            {getInitials(replacement.owner_name)}
          </span>
          <span className="font-semibold text-slate-900">{replacement.owner_name || "—"}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{replacement.staff_code || "—"}</td>
      <td className="whitespace-nowrap px-4 py-3">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-700">
          <Monitor size={12} className="shrink-0 text-slate-400" />
          {deviceLabel}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{replacement.asset_code || "—"}</td>
      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{replacement.category_name || "—"}</td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="inline-flex items-center gap-2 text-[13px]">
          <span className="font-semibold text-slate-700">{replacement.part_name || "Part"}</span>
          <span className="rounded-md bg-rose-50 px-2 py-0.5 font-mono text-xs font-semibold text-rose-600 line-through">
            {formatPartValue(replacement.part_name, replacement.old_value)}
          </span>
          <span className="text-slate-300">&rarr;</span>
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-700">
            {formatPartValue(replacement.part_name, replacement.new_value)}
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatReplacementDate(replacement.replacement_date)}</td>
    </tr>
  );
}

function formatReplacementDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ReplacementHistoryView({
  replacements,
  isLoading,
  error,
  onRetry,
}) {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-slate-950">Device Replacement History</h2>
          {!isLoading && !error && (
            <p className="mt-0.5 text-[13px] text-slate-500">
              {replacements.length} replacement{replacements.length === 1 ? "" : "s"}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500">Loading replacements...</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700">Couldn&apos;t load replacements</p>
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
        ) : replacements.length === 0 ? (
          <EmptyState
            icon={RefreshCw}
            title="No replacements found"
            description="Replacement records will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[13px]">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Employee</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Staff Code</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Computer</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Asset Code</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Category</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Replacement</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {replacements.map((replacement, index) => (
                  <ReplacementHistoryRow key={replacement.replacement_id ?? index} replacement={replacement} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReplaceDeviceDialog({
  device,
  onClose,

  // "Replace a part" tab
  partTypes = [],
  stockColumnCustomFieldOptions = [],
  selectedPartTypeId,
  onSelectPartType,
  partAction,
  onSelectPartAction,
  partNewValue,
  oldPartStatus,
  onSelectOldPartStatus,
  onSubmitPart,
  isSubmittingPart,
  submitPartError,

  // Stock picker — fitting a part now has to come off the shelf
  availableStock = [],
  isAvailableStockLoading,
  availableStockError,
  onRetryAvailableStock,
  selectedStockId,
  onSelectStock,

  // "Add to stock" shortcut, shown inline when the shelf is empty
  isQuickAddDialogOpen,
  quickAddFormValues,
  isSubmittingQuickAdd,
  quickAddError,
  onOpenQuickAddDialog,
  onCloseQuickAddDialog,
  onQuickAddFormChange,
  onSubmitQuickAdd,
}) {
  if (!device) return null;

  const selectedPartType = partTypes.find((item) => String(item.part_type_id) === String(selectedPartTypeId));
  // A device has exactly one bag, mouse, or keyboard — there's nothing to
  // "add" alongside it, only ever a swap.
  const SINGLE_UNIT_PARTS = ["bag", "mouse", "keyboard"];
  const availablePartActions = PART_ACTION_OPTIONS.filter(
    (option) => !(option.value === "add" && SINGLE_UNIT_PARTS.includes(selectedPartType?.part_name?.trim().toLowerCase()))
  );
  // "add" always needs a value; "replace" only when the part tracks one.
  // Both install a physical unit, so both need a stock pick; only "replace"
  // displaces an old part, so only it asks what happens to it.
  const partNeedsValue =
    partAction === "add" || (partAction === "replace" && Boolean(selectedPartType?.tracks_value));
  const canSubmitPart = Boolean(
    selectedPartTypeId &&
      (!partNeedsValue || partNewValue.trim()) &&
      selectedStockId &&
      (partAction !== "replace" || oldPartStatus)
  );

  // Read straight off the device row instead of asking — the API never wants
  // old_value for a part with an equipment_column, since it'd just be
  // misreported.
  function getPartOldValueDisplay(partType) {
    if (!partType.equipment_column) return "—";
    const value = device[partType.equipment_column];
    return value === null || value === undefined || value === "" ? "—" : String(value);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-label="Close" />
      <div className="relative flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">Replace this device</h2>
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

        <form onSubmit={onSubmitPart} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
            {submitPartError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                {submitPartError}
              </div>
            )}

            <div>
              <p className="mb-1.5 text-xs font-semibold text-slate-600">Part</p>
              <div className="flex flex-wrap gap-2">
                {partTypes.map((partType) => {
                  const isSelected = String(partType.part_type_id) === String(selectedPartTypeId);
                  return (
                    <button
                      key={partType.part_type_id}
                      type="button"
                      onClick={() => onSelectPartType(partType.part_type_id)}
                      className={`inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${isSelected
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                    >
                      {partType.part_name}
                    </button>
                  );
                })}
              </div>
            </div>

            {!selectedPartType ? (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                Select a part above to continue
              </div>
            ) : (
              <>
                {availablePartActions.length > 1 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-600">Action</p>
                    <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
                      {availablePartActions.map((option) => {
                        const isSelected = partAction === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => onSelectPartAction(option.value)}
                            className={`rounded-full px-4 py-1.5 text-[13px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${isSelected
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                              }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {partAction === "replace" && (
                    <div>
                      <label htmlFor="replace-part-old-status" className="mb-1.5 block text-xs font-semibold text-slate-600">
                        Old {selectedPartType.part_name} Status
                      </label>
                      <RadioSelect
                        id="replace-part-old-status"
                        options={OLD_PART_STATUS_OPTIONS}
                        value={oldPartStatus}
                        onSelect={onSelectOldPartStatus}
                        placeholder="Select a status..."
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="replace-part-current" className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Current {selectedPartType.part_name}
                    </label>
                    <div
                      id="replace-part-current"
                      className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
                    >
                      {getPartOldValueDisplay(selectedPartType)}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="replace-part-stock" className="mb-1.5 block text-xs font-semibold text-slate-600">
                      New {selectedPartType.part_name}
                    </label>

                    {isAvailableStockLoading ? (
                      <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                        Loading stock...
                      </div>
                    ) : availableStockError ? (
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
                        <span className="text-sm text-rose-700">{availableStockError}</span>
                        <button
                          type="button"
                          onClick={onRetryAvailableStock}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 outline-none transition hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400"
                        >
                          <RefreshCw size={13} />
                          Retry
                        </button>
                      </div>
                    ) : availableStock.length === 0 ? (
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                        <span className="text-sm text-amber-800">
                          No {selectedPartType.part_name} in stock right now.
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenQuickAddDialog(selectedPartTypeId)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-800 outline-none transition hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-amber-400"
                        >
                          <PlusCircle size={13} />
                          Add to stock
                        </button>
                      </div>
                    ) : (
                      <StockLineSelect
                        id="replace-part-stock"
                        options={availableStock}
                        selectedId={selectedStockId}
                        onSelect={onSelectStock}
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-auto flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmittingPart}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmitPart || isSubmittingPart}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmittingPart ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>

      <AddStockDialog
        isOpen={isQuickAddDialogOpen}
        values={quickAddFormValues}
        partTypes={partTypes}
        customFieldCatalog={stockColumnCustomFieldOptions}
        lockedPartTypeId={selectedPartTypeId}
        onChange={onQuickAddFormChange}
        onSubmit={onSubmitQuickAdd}
        onClose={onCloseQuickAddDialog}
        isSubmitting={isSubmittingQuickAdd}
        error={quickAddError}
      />
    </div>
  );
}
