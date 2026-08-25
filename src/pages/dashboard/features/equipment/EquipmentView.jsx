import { useMemo, useState } from "react";
import {
  FiAlertTriangle as AlertTriangle,
  FiBox as Box,
  FiChevronDown as ChevronDown,
  FiEdit2 as Edit2,
  FiFileText as FileText,
  FiGrid as Grid,
  FiPlusCircle as PlusCircle,
  FiRefreshCw as RefreshCw,
  FiRepeat as Repeat,
  FiSearch as Search,
  FiTrash2 as Trash2,
  FiUserX as UserX,
  FiX as X,
} from "react-icons/fi";
import { buildEquipmentDisplayColumns } from "../../dashboard.utils";
import { EmptyState, RadioSelect, RowActionsMenu } from "../../components/SharedControls";
import { DynamicEquipmentTable } from "../../components/DynamicEquipmentTable";
import { CategoryTabs } from "../../components/CategoryTabs";
import { exportAllEquipmentToExcel, exportAllEquipmentToPdf } from "./equipmentExport";

const EQUIPMENT_PAGE_SIZE = 15;

export function EquipmentItemsTable({
  category,
  items,
  configuredColumns = [],
  isLoading,
  error,
  onRetry,
  onBack,
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // A new category means a whole new item list — start back on page 1
  // rather than stranding the user on a page number that may not exist.
  // Adjusted during render (not an effect) per React's guidance for
  // resetting state when a prop changes.
  const [prevCategory, setPrevCategory] = useState(category);
  if (category !== prevCategory) {
    setPrevCategory(category);
    setPage(1);
  }

  const baseColumns = useMemo(
    () => configuredColumns.map(({ key, label }) => ({ key, label })),
    [configuredColumns]
  );
  const columns = useMemo(() => buildEquipmentDisplayColumns(items, baseColumns), [items, baseColumns]);

  // Whichever status values actually appear on this category's items —
  // statuses are admin-configurable, so this stays in sync automatically
  // instead of hardcoding a fixed list.
  const statusOptions = useMemo(() => {
    const values = new Set(items.map((item) => item.status).filter((value) => value && String(value).trim()));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matches = items
      .filter((item) => !statusFilter || item.status === statusFilter)
      .filter(
        (item) => !term || columns.some((column) => String(item[column.key] ?? "").toLowerCase().includes(term))
      );
    return matches.map((item, index) => ({ ...item, _row_number: index + 1 }));
  }, [items, columns, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / EQUIPMENT_PAGE_SIZE));
  const paginatedItems = filteredItems.slice((page - 1) * EQUIPMENT_PAGE_SIZE, page * EQUIPMENT_PAGE_SIZE);

return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            {showBackButton && onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white dark:focus-visible:ring-offset-slate-900"
              >
                <ChevronDown size={14} className="rotate-90 text-slate-500 dark:text-slate-400" />
                Back to categories
              </button>
            )}
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{category}</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
              <input
                type="text"
                autoComplete="off"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search Equipment"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-8 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-700"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="w-56">
              <RadioSelect
                id="equipment-status-filter"
                options={[
                  { value: "", label: "All Statuses" },
                  ...statusOptions.map((status) => ({ value: status, label: status })),
                ]}
                value={statusFilter}
                onSelect={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                placeholder="All Statuses"
              />
            </div>
            {canCreate && onAddNew && (
              <button
                type="button"
                onClick={onAddNew}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-offset-slate-900"
              >
                <PlusCircle size={15} />
                New Equipment
              </button>
            )}
          </div>
        </div>

{isUnconfigured ? (
          <EmptyState
            icon={Box}
            title="Empty"
            description={`${category} has no columns configured yet. Click "New Equipment" to set them up.`}
          />
        ) : (
          <DynamicEquipmentTable
            columns={columns}
            records={paginatedItems}
            rowKey={(item, index) => item.equipment_id ?? index}
            isLoading={isLoading}
            loadingText="Loading equipment..."
            error={error}
            errorTitle="Couldn't load equipment"
            onRetry={onRetry}
            emptyIcon={Box}
            emptyTitle="No equipment found"
            emptyDescription={search ? `No equipment matches "${search}".` : "This category has no items."}
            actionsHeader={
              <RowActionsMenu
                items={[
                  {
                    icon: FileText,
                    label: "Download PDF",
                    onClick: () => exportAllEquipmentToPdf([{ category, columns, items }], category),
                  },
                  {
                    icon: Grid,
                    label: "Download Excel",
                    onClick: () => exportAllEquipmentToExcel([{ category, columns, items }], category),
                  },
                ]}
              />
            }
            renderRowActions={
              canManage &&
              ((item) => {
                const hasOwner = Boolean(item.owner_id || item.owner_name);
                const menuItems = [];

                if (hasOwner && onUnassign) {
                  menuItems.push({ icon: UserX, label: "Unassign", onClick: () => onUnassign(item) });
                }
                if (!hasOwner && onBorrow && borrowableStatusNames?.has(item.status)) {
                  menuItems.push({ icon: Repeat, label: "Borrow", onClick: () => onBorrow(item) });
                }
                menuItems.push({ icon: Edit2, label: "Edit", onClick: () => onEdit(item) });
                if (onDelete) {
                  menuItems.push({ icon: Trash2, label: "Delete", onClick: () => onDelete(item), destructive: true });
                }

                return (
                  <div className="flex items-center justify-end">
                    <RowActionsMenu items={menuItems} />
                  </div>
                );
              })
            }
          />
        )}

        {!isUnconfigured && !isLoading && !error && filteredItems.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-[13px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span>
              Showing {(page - 1) * EQUIPMENT_PAGE_SIZE + 1}
              {"–"}
              {Math.min(page * EQUIPMENT_PAGE_SIZE, filteredItems.length)} of {filteredItems.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(Math.max(1, page - 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-900 dark:disabled:hover:border-slate-700"
              >
                Previous
              </button>
              <span className="tabular-nums text-slate-400 dark:text-slate-500">
                {page} / {pageCount}
              </span>
              <button
                type="button"
                disabled={page === pageCount}
                onClick={() => setPage(Math.min(pageCount, page + 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-900 dark:disabled:hover:border-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function EquipmentView({
  categories,
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
  onDownloadAllExcel,
  onDownloadAllPdf,
  isDownloadingAllExcel = false,
  isDownloadingAllPdf = false,
  canManage = true,
  canCreate = true,
}) {
  const borrowableStatusNames = useMemo(
    () => new Set(statuses.filter((item) => item.is_borrowable).map((item) => item.status_name)),
    [statuses]
  );

  const categoryOptions = useMemo(
    () => categories.map((item) => ({ value: item.slug, label: item.label })),
    [categories]
  );

  const selectedCategoryEntry = useMemo(
    () => categories.find((item) => item.slug === selectedCategory) || null,
    [selectedCategory, categories]
  );

  const selectedCategoryLabel = selectedCategoryEntry?.label || selectedCategory;

  const isUnconfigured = selectedCategoryEntry?.columnCount === 0;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">Equipments</h2>
          </div>
        </div>

        <CategoryTabs
          options={categoryOptions}
          selected={selectedCategory}
          onSelect={onSelectCategory}
          trailing={
            canCreate && (
              <RowActionsMenu
                items={[
                  {
                    icon: FileText,
                    label: isDownloadingAllPdf ? "Preparing PDF..." : "Download All PDFs",
                    onClick: onDownloadAllPdf,
                  },
                  {
                    icon: Grid,
                    label: isDownloadingAllExcel ? "Preparing Excel..." : "Download All Excel",
                    onClick: onDownloadAllExcel,
                  },
                ]}
              />
            )
          }
        />

        <EquipmentItemsTable
          category={selectedCategoryLabel}
          items={items}
          configuredColumns={columns}
          isLoading={isItemsLoading}
          error={itemsError}
          isUnconfigured={isUnconfigured}
          onRetry={onRetry}
          onBack={null}
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

// Standalone category management page (Managements > Category) — the same
// categories list, Add/Edit/Delete handlers, and modals the Equipment page's
// tab kebab menu used to expose inline, just given a proper table + its own
// place in the nav instead.
export function CategoryManagementView({
  categories,
  isLoading,
  error,
  onRetry,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  canManage = true,
}) {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">Equipment categories</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                {categories.length} categor{categories.length === 1 ? "y" : "ies"}
              </p>
            )}
          </div>
          {canManage && (
            <button
              type="button"
              onClick={onAddCategory}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-offset-slate-900"
            >
              <PlusCircle size={15} />
              New Category
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading categories...</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Couldn&apos;t load categories</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        ) : categories.length === 0 ? (
          <EmptyState icon={Box} title="No categories found" description="Equipment categories will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[13px] dark:divide-slate-800">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Category Name</th>
                  <th className="px-5 py-3 font-semibold">Columns Configured</th>
                  <th className="px-5 py-3 font-semibold">Equipment</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {categories.map((category) => (
                  <tr
                    key={category.categoryId ?? category.slug}
                    className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-950 dark:text-white">
                      {category.label}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {category.columnCount ?? 0}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {category.count ?? 0}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      {canManage && (
                        <div className="flex items-center justify-end">
                          <RowActionsMenu
                            items={[
                              { icon: Edit2, label: "Edit", onClick: () => onEditCategory(category) },
                              { icon: Trash2, label: "Delete", onClick: () => onDeleteCategory(category), destructive: true },
                            ]}
                          />
                        </div>
                      )}
                    </td>
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

// ---------------------------------------------------------------------------
// Operational record tables
// ---------------------------------------------------------------------------
