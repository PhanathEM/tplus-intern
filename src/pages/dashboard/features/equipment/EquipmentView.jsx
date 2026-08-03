import { useMemo } from "react";
import {
  FiAlertTriangle as AlertTriangle,
  FiBox as Box,
  FiChevronDown as ChevronDown,
  FiPlusCircle as PlusCircle,
  FiRefreshCw as RefreshCw,
} from "react-icons/fi";
import { equipmentItemColumns } from "../../dashboard.config";
import { getRecordColumns } from "../../dashboard.utils";
import { CategoryDropdown, EmptyState } from "../../components/SharedControls";
import { RecordCellValue } from "../../components/RecordsTableView";

export function EquipmentItemsTable({
  category,
  items,
  isLoading,
  error,
  onRetry,
  onBack,
  statusOptions,
  statusFilter,
  onFilterStatus,
  onEdit,
  onUnassign,
  canManage = true,
  showBackButton = true,
}) {
  const columns = useMemo(() => getRecordColumns(items, equipmentItemColumns), [items]);

return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            {showBackButton && onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <ChevronDown size={14} className="rotate-90 text-slate-500" />
                Back to categories
              </button>
            )}
            <h2 className="text-[15px] font-semibold text-slate-950">{category}</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500">
                {items.length} item{items.length === 1 ? "" : "s"}
                {statusFilter !== "All" && ` · ${statusFilter}`}
              </p>
            )}
          </div>
          <CategoryDropdown options={statusOptions} selected={statusFilter} onSelect={onFilterStatus} label="Status" />
        </div>

{isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500">Loading equipment...</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700">Couldn&apos;t load equipment</p>
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
        ) : items.length === 0 ? (
          <EmptyState icon={Box} title="No equipment found" description="This category has no items." />
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
                  {canManage && (
                    <th className="whitespace-nowrap px-4 py-3 font-semibold text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item, index) => {
                  const hasOwner = Boolean(item.owner_id || item.owner_name);

                  return (
                    <tr key={item.equipment_id ?? index} className="transition hover:bg-slate-50/70">
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-4 py-3 text-slate-600 ${column.key === "remark" ? "min-w-72 whitespace-normal" : "whitespace-nowrap"
                            }`}
                        >
                          <RecordCellValue value={item[column.key]} />
                        </td>
                      ))}
                      {canManage && (
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {hasOwner && onUnassign && (
                              <button
                                type="button"
                                onClick={() => onUnassign(item)}
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-700 outline-none transition hover:border-amber-300 hover:bg-amber-50 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                              >
                                Unassign
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onEdit(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function EquipmentView({
  categories,
  isLoading,
  error,
  onRetry,
  selectedCategory,
  onSelectCategory,
  items,
  isItemsLoading,
  itemsError,
  onAddNew,
  onEdit,
  onUnassign,
  statuses,
  statusFilter,
  onFilterStatus,
  onAddCategory,
  canManage = true,
}) {
  const statusOptions = useMemo(() => ["All", ...statuses.map((item) => item.status_name)], [statuses]);

  const categoryOptions = useMemo(
    () => ["All Equipments", ...categories.map((item) => item.category)],
    [categories]
  );

  const summaryLabel = selectedCategory === "All" ? "All equipment" : selectedCategory;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">Equipment</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500">
                {items.length} item{items.length === 1 ? "" : "s"} · {selectedCategory === "All" ? "All categories" : selectedCategory}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={onAddNew}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <PlusCircle size={15} />
                  Add New Item
                </button>
                <button
                  type="button"
                  onClick={onAddCategory}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <PlusCircle size={15} />
                  Add New Category
                </button>
              </>
            )}
            <CategoryDropdown
              options={categoryOptions}
              selected={selectedCategory === "All" ? "All Equipments" : selectedCategory}
              onSelect={(value) => onSelectCategory(value === "All Equipments" ? "All" : value)}
              label="Category"
            />
          </div>
        </div>

        <EquipmentItemsTable
          category={summaryLabel}
          items={items}
          isLoading={isItemsLoading}
          error={itemsError}
          onRetry={onRetry}
          onBack={null}
          statusOptions={statusOptions}
          statusFilter={statusFilter}
          onFilterStatus={onFilterStatus}
          onEdit={onEdit}
          onUnassign={onUnassign}
          canManage={canManage}
          showBackButton={false}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Operational record tables
// ---------------------------------------------------------------------------
