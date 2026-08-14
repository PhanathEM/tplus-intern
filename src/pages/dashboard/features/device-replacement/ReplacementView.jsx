import { useMemo } from "react";
import { FiAlertTriangle as AlertTriangle, FiRefreshCw as RefreshCw, FiSearch as Search, FiX as X } from "react-icons/fi";
import { replacementColumns } from "../../dashboard.config";
import { getRecordColumns } from "../../dashboard.utils";
import { EmptyState, formInputClass } from "../../components/SharedControls";
import { RecordCellValue } from "../../components/RecordsTableView";
import { DynamicEquipmentTable } from "../../components/DynamicEquipmentTable";
import { CategoryTabs } from "../../components/CategoryTabs";

const RAM_CAPACITY_OPTIONS = ["2 GB", "4 GB", "8 GB", "16 GB", "32 GB", "64 GB", "128 GB", "256 GB"];
const HD_CAPACITY_OPTIONS = [
  "500 GB",
  "1000 GB (1 TB)",
  "2000 GB (2 TB)",
  "4000 GB (4 TB)",
  "8000 GB (8 TB)",
  "12000 GB (12 TB)",
  "16000 GB (16 TB)",
  "20000 GB (20 TB)",
  "24000 GB (24 TB)",
  "26000 GB (26 TB)",
];

function FilterBar({ filters, onFilterChange, categories, idPrefix }) {
  const categoryOptions = useMemo(
    () => [
      { value: "All", label: "All categories" },
      ...categories.map((category) => ({ value: category.category_name, label: category.category_name })),
    ],
    [categories]
  );

  return (
    <>
      <CategoryTabs
        options={categoryOptions}
        selected={filters.category}
        onSelect={(value) => onFilterChange("category", value)}
      />
      <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            id={`${idPrefix}-search`}
            type="text"
            autoComplete="off"
            value={filters.q}
            onChange={(e) => onFilterChange("q", e.target.value)}
            placeholder="Employee or device..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-8 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
          {filters.q && (
            <button
              type="button"
              onClick={() => onFilterChange("q", "")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export function DeviceReplacementCategoryBar({ categories = [], selected, onSelect }) {
  const categoryOptions = useMemo(
    () => [
      { value: "All", label: "All categories" },
      ...categories.map((category) => ({ value: category.category_name, label: category.category_name })),
    ],
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
}) {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">Devices you can replace</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500">
                {devices.length} device{devices.length === 1 ? "" : "s"}
                {canManage && devices.length > 0 ? " · click a row to replace" : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onRetry}
            disabled={isLoading}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <DynamicEquipmentTable
          columns={columns}
          records={devices}
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

export function ReplacementsView({ replacements, isLoading, error, onRetry, filters, onFilterChange, categories = [] }) {
  const columns = useMemo(() => getRecordColumns(replacements, replacementColumns), [replacements]);

  return (
    <div className="px-4 pb-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">Replacement history</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500">
                {replacements.length} replacement{replacements.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onRetry}
            disabled={isLoading}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <FilterBar
          filters={filters}
          onFilterChange={onFilterChange}
          categories={categories}
          idPrefix="replacement-history"
        />

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
                  {columns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {replacements.map((replacement, index) => (
                  <tr key={replacement.replacement_id ?? index} className="transition hover:bg-slate-50/70">
                    {columns.map((column) => (
                      <td key={column.key} className="whitespace-nowrap px-4 py-3 text-slate-600">
                        <RecordCellValue value={replacement[column.key]} />
                      </td>
                    ))}
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

const REPLACE_DIALOG_TABS = [
  { value: "device", label: "Replace the whole" },
  { value: "part", label: "Replace a part" },
];

export function ReplaceDeviceDialog({
  device,
  onClose,
  activeTab,
  onSwitchTab,

  // "Replace the whole" tab
  deviceOptions = [],
  deviceOptionColumns = [],
  isDeviceOptionsLoading,
  deviceOptionsError,
  selectedNewDevice,
  onSelectNewDevice,
  onClearNewDevice,
  onSubmitDevice,
  isSubmittingDevice,
  submitDeviceError,

  // "Replace a part" tab
  partTypes = [],
  selectedPartTypeId,
  onSelectPartType,
  partAction,
  onSelectPartAction,
  partNewValue,
  onPartNewValueChange,
  onSubmitPart,
  isSubmittingPart,
  submitPartError,
}) {
  if (!device) return null;

  const selectedPartType = partTypes.find((item) => String(item.part_type_id) === String(selectedPartTypeId));
  // CPUs (is_countable: false) can only ever be swapped one-for-one — there's
  // nowhere to "add" a second one — so only countable parts (RAM, storage)
  // get the Add option; everything else is always a replace.
  const partNeedsValue =
    partAction === "add" || (partAction === "replace" && Boolean(selectedPartType?.tracks_value));
  const canSubmitPart = Boolean(selectedPartTypeId && (!partNeedsValue || partNewValue.trim()));
  const isRamPart = selectedPartType?.part_name?.trim().toLowerCase() === "ram";
  const isHdPart = selectedPartType?.part_name?.trim().toLowerCase() === "hard disk";
  const capacityOptions = isRamPart ? RAM_CAPACITY_OPTIONS : isHdPart ? HD_CAPACITY_OPTIONS : null;

  // Read straight off the device row instead of asking — the API never wants
  // old_value for a part with an equipment_column, since it'd just be
  // misreported.
  function getPartOldValueDisplay(partType) {
    const value = partType.equipment_column ? device[partType.equipment_column] : null;
    if (value === null || value === undefined || value === "") {
      return partType.equipment_column ? "—" : "Not tracked";
    }
    return String(value);
  }

  // "16" + "4" -> "20"; "16GB" + "4" -> "20GB" — carry the old value's unit
  // suffix (if any) over to the total so it still reads naturally.
  let resultingTotal = null;
  if (selectedPartType?.is_countable && partAction === "add") {
    const oldRaw = selectedPartType.equipment_column ? device[selectedPartType.equipment_column] : null;
    const oldStr = oldRaw === null || oldRaw === undefined ? "" : String(oldRaw);
    const oldNum = parseFloat(oldStr);
    const addNum = parseFloat(partNewValue);
    if (!Number.isNaN(oldNum) && !Number.isNaN(addNum)) {
      const unit = oldStr.match(/[a-zA-Z]+$/)?.[0] || "";
      resultingTotal = `${oldNum + addNum}${unit}`;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-label="Close" />
      <div className="relative flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">Replace this device</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {device.display_name} — {device.owner_name}
              {device.owner_position ? ` (${device.owner_position})` : ""}
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

        <div className="border-b border-slate-200 bg-slate-50 px-6 pt-3">
          <div className="flex gap-1">
            {REPLACE_DIALOG_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => onSwitchTab(tab.value)}
                className={`-mb-px inline-flex h-10 items-center rounded-t-lg border px-4 text-[13px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${activeTab === tab.value
                  ? "border-slate-200 border-b-white bg-white text-slate-950"
                  : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "device" ? (
          <form onSubmit={onSubmitDevice} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
            <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-5">
              {submitDeviceError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                  {submitDeviceError}
                </div>
              )}

              <div className="flex min-h-0 flex-1 flex-col">
                <p className="mb-1.5 text-xs font-semibold text-slate-600">New device</p>
                <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-slate-100">
                  <DynamicEquipmentTable
                    columns={deviceOptionColumns}
                    records={deviceOptions}
                    rowKey={(option, index) => option.equipment_id ?? index}
                    isLoading={isDeviceOptionsLoading}
                    loadingText={`Loading ${device.category_name} in stock...`}
                    error={deviceOptionsError}
                    errorTitle="Couldn't load devices"
                    emptyIcon={Search}
                    emptyTitle="No devices available"
                    emptyDescription={`No ${device.category_name} available in stock right now.`}
                    getRowClassName={(option) =>
                      selectedNewDevice?.equipment_id === option.equipment_id ? "bg-orange-50" : ""
                    }
                    selectable={{
                      isSelected: (option) => selectedNewDevice?.equipment_id === option.equipment_id,
                      onSelect: (option) =>
                        selectedNewDevice?.equipment_id === option.equipment_id
                          ? onClearNewDevice()
                          : onSelectNewDevice(option),
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmittingDevice}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedNewDevice || isSubmittingDevice}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmittingDevice ? "Replacing..." : "Replace device"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={onSubmitPart} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
            <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
              {submitPartError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                  {submitPartError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="replace-part-select" className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Part
                  </label>
                  <select
                    id="replace-part-select"
                    value={selectedPartTypeId}
                    onChange={(e) => onSelectPartType(e.target.value)}
                    className={formInputClass}
                  >
                    <option value="">Select a part...</option>
                    {partTypes.map((partType) => (
                      <option key={partType.part_type_id} value={partType.part_type_id}>
                        {partType.part_name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPartType?.is_countable && (
                  <div>
                    <label htmlFor="replace-part-action" className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Action
                    </label>
                    <select
                      id="replace-part-action"
                      value={partAction}
                      onChange={(e) => onSelectPartAction(e.target.value)}
                      className={formInputClass}
                    >
                      <option value="replace">Replace</option>
                      <option value="add">Add More</option>
                    </select>
                  </div>
                )}

                {selectedPartType && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-600">Current {selectedPartType.part_name}</p>
                    <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                      {getPartOldValueDisplay(selectedPartType)}
                    </div>
                  </div>
                )}

                {partNeedsValue && (
                  <div>
                    <label htmlFor="replace-part-value" className="mb-1.5 block text-xs font-semibold text-slate-600">
                      {partAction === "add" ? "Amount to add" : "New value"}
                    </label>
                    {capacityOptions ? (
                      <select
                        id="replace-part-value"
                        value={partNewValue}
                        onChange={(e) => onPartNewValueChange(e.target.value)}
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
                        id="replace-part-value"
                        type="text"
                        autoComplete="off"
                        value={partNewValue}
                        onChange={(e) => onPartNewValueChange(e.target.value)}
                        placeholder={partAction === "add" ? `e.g. "8"` : `e.g. "32"`}
                        className={formInputClass}
                      />
                    )}
                  </div>
                )}

                {resultingTotal !== null && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-600">Resulting total</p>
                    <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
                      {resultingTotal}
                    </div>
                  </div>
                )}
              </div>
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
        )}
      </div>
    </div>
  );
}
