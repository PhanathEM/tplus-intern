import { useMemo } from "react";
import { FiBox as Box, FiChevronDown as ChevronDown, FiPlusCircle as PlusCircle } from "react-icons/fi";
import { getRecordColumns } from "../../dashboard.utils";
import { CategoryDropdown, EmptyState } from "../../components/SharedControls";
import { DynamicEquipmentTable } from "../../components/DynamicEquipmentTable";
import { CategoryTabs } from "../../components/CategoryTabs";

export function EquipmentItemsTable({
  category,
  items,
  configuredColumns = [],
  isLoading,
  error,
  onRetry,
  onBack,
  statusOptions,
  statusFilter,
  onFilterStatus,
  onEdit,
  onUnassign,
  onDelete,
  onBorrow,
  borrowableStatusNames,
  onAddNew,
  isUnconfigured = false,
  canCreate = true,
  canManage = true,
  showBackButton = true,
}) {
  const baseColumns = useMemo(
    () => configuredColumns.map(({ key, label }) => ({ key, label })),
    [configuredColumns]
  );
  const columns = useMemo(
    () =>
      getRecordColumns(items, baseColumns).filter(
        // software_licenses is the raw array behind license_names/license_status/etc. —
        // those flat fields already display fine as columns, the array itself doesn't.
        (column) => !column.key.startsWith("__") && column.key !== "software_licenses"
      ),
    [items, baseColumns]
  );

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
          <div className="flex items-center gap-2">
            {canCreate && onAddNew && (
              <button
                type="button"
                onClick={onAddNew}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <PlusCircle size={15} />
                Add New Item
              </button>
            )}
            <CategoryDropdown options={statusOptions} selected={statusFilter} onSelect={onFilterStatus} label="Status" />
          </div>
        </div>

{isUnconfigured ? (
          <EmptyState
            icon={Box}
            title="Empty"
            description={`${category} has no columns configured yet. Click "Add New Item" to set them up.`}
          />
        ) : (
          <DynamicEquipmentTable
            columns={columns}
            records={items}
            rowKey={(item, index) => item.equipment_id ?? index}
            isLoading={isLoading}
            loadingText="Loading equipment..."
            error={error}
            errorTitle="Couldn't load equipment"
            onRetry={onRetry}
            emptyIcon={Box}
            emptyTitle="No equipment found"
            emptyDescription="This category has no items."
            renderRowActions={
              canManage &&
              ((item) => {
                const hasOwner = Boolean(item.owner_id || item.owner_name);
                return (
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
                    {!hasOwner && onBorrow && borrowableStatusNames?.has(item.status) && (
                      <button
                        type="button"
                        onClick={() => onBorrow(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      >
                        Borrow
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      Edit
                    </button>
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 outline-none transition hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                );
              })
            }
          />
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
  columns,
  isItemsLoading,
  itemsError,
  onAddNew,
  onEdit,
  onUnassign,
  onDelete,
  onBorrow,
  statuses,
  statusFilter,
  onFilterStatus,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  canManage = true,
  canCreate = true,
}) {
  const statusOptions = useMemo(() => ["All", ...statuses.map((item) => item.status_name)], [statuses]);

  const borrowableStatusNames = useMemo(
    () => new Set(statuses.filter((item) => item.is_borrowable).map((item) => item.status_name)),
    [statuses]
  );

  const categoryOptions = useMemo(
    () => [
      { value: "All", label: "All Equipments" },
      ...categories.map((item) => ({ value: item.slug, label: item.label })),
    ],
    [categories]
  );

  const selectedCategoryEntry = useMemo(
    () => categories.find((item) => item.slug === selectedCategory) || null,
    [selectedCategory, categories]
  );

  const selectedCategoryLabel =
    selectedCategory === "All" ? "All equipment" : selectedCategoryEntry?.label || selectedCategory;

  const isUnconfigured = selectedCategory !== "All" && selectedCategoryEntry?.columnCount === 0;

  const filteredItems = useMemo(() => {
    if (statusFilter === "All") return items;
    return items.filter((item) => (item.status || item.status_name) === statusFilter);
  }, [items, statusFilter]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">Equipment</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500">
                {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"} · {selectedCategoryLabel}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canCreate && selectedCategory !== "All" && selectedCategoryEntry && (
              <>
                <button
                  type="button"
                  onClick={() => onEditCategory(selectedCategoryEntry)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  Edit Category
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCategory(selectedCategoryEntry)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3.5 text-[13px] font-semibold text-rose-600 outline-none transition hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  Delete Category
                </button>
              </>
            )}
            {canCreate && (
              <button
                type="button"
                onClick={onAddCategory}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <PlusCircle size={15} />
                Add New Category
              </button>
            )}
          </div>
        </div>

        <CategoryTabs
          options={categoryOptions}
          selected={selectedCategory}
          onSelect={onSelectCategory}
        />

        <EquipmentItemsTable
          category={selectedCategoryLabel}
          items={filteredItems}
          configuredColumns={selectedCategory === "All" ? [] : columns}
          isLoading={isItemsLoading}
          error={itemsError}
          isUnconfigured={isUnconfigured}
          onRetry={onRetry}
          onBack={null}
          statusOptions={statusOptions}
          statusFilter={statusFilter}
          onFilterStatus={onFilterStatus}
          onEdit={onEdit}
          onUnassign={onUnassign}
          onDelete={onDelete}
          onBorrow={onBorrow}
          borrowableStatusNames={borrowableStatusNames}
          onAddNew={onAddNew}
          canCreate={canCreate}
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
