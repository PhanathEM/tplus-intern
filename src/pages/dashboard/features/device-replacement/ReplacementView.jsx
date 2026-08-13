import { useMemo } from "react";
import { FiAlertTriangle as AlertTriangle, FiRefreshCw as RefreshCw, FiSearch as Search, FiX as X } from "react-icons/fi";
import { replacementColumns } from "../../dashboard.config";
import { getRecordColumns } from "../../dashboard.utils";
import { EmptyState, formInputClass } from "../../components/SharedControls";
import { RecordCellValue } from "../../components/RecordsTableView";
import { DynamicEquipmentTable } from "../../components/DynamicEquipmentTable";
import { CategoryTabs } from "../../components/CategoryTabs";

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

const PART_ACTION_OPTIONS = [
  { value: "replace", label: "Replace" },
  { value: "add", label: "Add" },
  { value: "remove", label: "Remove" },
];

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
  // "add" only makes sense for parts that accumulate (RAM, storage) — a CPU
  // has nothing to sum, so the option only shows once a countable part is picked.
  const partAvailableActions = PART_ACTION_OPTIONS.filter(
    (option) => option.value !== "add" || selectedPartType?.is_countable
  );
  const partNeedsValue = partAction === "add" || (partAction === "replace" && selectedPartType?.tracks_value);
  const canSubmitPart = Boolean(selectedPartTypeId && (!partNeedsValue || partNewValue.trim()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-label="Close" />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
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

        <div className="flex gap-2 border-b border-slate-100 px-6 pt-3">
          {REPLACE_DIALOG_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onSwitchTab(tab.value)}
              className={`-mb-px inline-flex h-9 items-center border-b-2 px-3.5 text-[13px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${activeTab === tab.value
                ? "border-slate-950 text-slate-950"
                : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "device" ? (
          <form onSubmit={onSubmitDevice} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
            <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
              {submitDeviceError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                  {submitDeviceError}
                </div>
              )}

              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-600">New device</p>
                {selectedNewDevice ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50 px-3.5 py-2.5">
                    <p className="truncate text-[13px] font-semibold text-slate-900">
                      {selectedNewDevice.display_name}
                      {selectedNewDevice.asset_code ? ` (${selectedNewDevice.asset_code})` : ""}
                    </p>
                    <button
                      type="button"
                      onClick={onClearNewDevice}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <X size={13} />
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-100">
                    <DynamicEquipmentTable
                      columns={deviceOptionColumns}
                      records={deviceOptions}
                      rowKey={(option, index) => option.equipment_id ?? index}
                      isLoading={isDeviceOptionsLoading}
                      loadingText={`Loading ${device.category_name} in stock...`}
                      error={deviceOptionsError}
                      errorTitle="Couldn't load devices"
                      emptyTitle="No devices available"
                      emptyDescription={`No ${device.category_name} available in stock right now.`}
                      renderRowActions={(option) => (
                        <button
                          type="button"
                          onClick={() => onSelectNewDevice(option)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                          Select
                        </button>
                      )}
                    />
                  </div>
                )}
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
          <form onSubmit={onSubmitPart} autoComplete="off">
            <div className="flex flex-col gap-4 px-6 py-5">
              {submitPartError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                  {submitPartError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600" htmlFor="replace-part-type">
                  Part
                </label>
                <select
                  id="replace-part-type"
                  value={selectedPartTypeId}
                  onChange={(e) => onSelectPartType(e.target.value)}
                  className={formInputClass}
                >
                  <option value="">Select a part</option>
                  {partTypes.map((partType) => (
                    <option key={partType.part_type_id} value={partType.part_type_id}>
                      {partType.part_name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPartTypeId && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-slate-600">Action</p>
                  <div className="flex gap-2">
                    {partAvailableActions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onSelectPartAction(option.value)}
                        className={`inline-flex h-9 flex-1 items-center justify-center rounded-lg border px-3 text-[13px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${partAction === option.value
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {partNeedsValue && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600" htmlFor="replace-part-value">
                    {partAction === "add" ? "Amount to add" : "New value"}
                  </label>
                  <input
                    id="replace-part-value"
                    type="text"
                    autoComplete="off"
                    value={partNewValue}
                    onChange={(e) => onPartNewValueChange(e.target.value)}
                    placeholder={`e.g. "32" for ${selectedPartType?.part_name || "this part"}`}
                    className={formInputClass}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
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
