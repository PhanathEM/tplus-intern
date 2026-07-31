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
  canManage = true,
}) {
  const columns = useMemo(() => getRecordColumns(items, equipmentItemColumns), [items]);

return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <ChevronDown size={14} className="rotate-90 text-slate-500" />
              Back to categories
            </button>
            <h2 className="text-[15px] font-semibold text-slate-950">{category}</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500">
                {items.length} item{items.length === 1 ? "" : "s"}
                {statusFilter !== "All" && ` · ${statusFilter}`}
              </p>
            )}
          </div>
          <CategoryDropdown options={statusOptions} selected={statusFilter} onSelect={onFilterStatus} />
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
                {items.map((item, index) => (
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
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                          Edit
                        </button>
                      </td>
                    )}
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

export function EquipmentView({
  categories,
  isLoading,
  error,
  onRetry,
  selectedCategory,
  onSelectCategory,
  detailCategory,
  items,
  isItemsLoading,
  itemsError,
  onViewCategory,
  onBackToCategories,
  onAddNew,
  onEdit,
  statuses,
  statusFilter,
  onFilterStatus,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  canManage = true,
}) {
  const statusOptions = useMemo(() => ["All", ...statuses.map((item) => item.status_name)], [statuses]);

 const categoryOptions = useMemo(
    () => ["All", ...categories.map((item) => item.category)],
    [categories]
  );

 const filteredCategories = useMemo(
    () =>
      selectedCategory === "All"
        ? categories
        : categories.filter((item) => item.category === selectedCategory),
    [categories, selectedCategory]
  );

 const totals = useMemo(
    () =>
      filteredCategories.reduce(
        (acc, item) => ({
          totalItems: acc.totalItems + item.total_items,
          noOwner: acc.noOwner + item.no_owner,
          hasOwner: acc.hasOwner + item.has_owner,
        }),
        { totalItems: 0, noOwner: 0, hasOwner: 0 }
      ),
    [filteredCategories]
  );

if (detailCategory) {
    return (
      <EquipmentItemsTable
        category={detailCategory}
        items={items}
        isLoading={isItemsLoading}
        error={itemsError}
        onRetry={() => onViewCategory(detailCategory, statusFilter)}
        onBack={onBackToCategories}
        statusOptions={statusOptions}
        statusFilter={statusFilter}
        onFilterStatus={onFilterStatus}
        onEdit={onEdit}
        canManage={canManage}
      />
    );
  }

return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">Equipment by category</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500">
                {filteredCategories.length} categor{filteredCategories.length === 1 ? "y" : "ies"} ·{" "}
                {totals.totalItems} items · {totals.hasOwner} assigned · {totals.noOwner} unassigned
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
            <CategoryDropdown options={categoryOptions} selected={selectedCategory} onSelect={onSelectCategory} />
          </div>
        </div>

{isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500">Loading equipment categories...</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700">Couldn&apos;t load equipment data</p>
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
        ) : filteredCategories.length === 0 ? (
          <EmptyState icon={Box} title="No equipment found" description="No items match the selected category." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[13px]">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Total items</th>
                  <th className="px-5 py-3 font-semibold">No owner</th>
                  <th className="px-5 py-3 font-semibold">Has owner</th>
                  <th className="px-5 py-3 font-semibold">Ownership</th>
                  <th className="px-5 py-3 font-semibold text-right">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCategories.map((item) => {
                  const ownedPct =
                    item.total_items === 0 ? 0 : Math.round((item.has_owner / item.total_items) * 100);
                  return (
                    <tr key={item.category} className="transition hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-950">
                        {item.category}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{item.total_items}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{item.no_owner}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{item.has_owner}</td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${ownedPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{ownedPct}%</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onViewCategory(item.category)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                          >
                            View All Items
                            <ChevronDown size={12} className="-rotate-90" />
                          </button>

{canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => onEditCategory(item)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                              >
                                Edit
                              </button>

<button
                                type="button"
                                onClick={() => onDeleteCategory(item)}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 outline-none transition hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
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

// ---------------------------------------------------------------------------
// Operational record tables
// ---------------------------------------------------------------------------
