import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { translateLabel } from "../../../../lib/i18nLabel";
import {
  FiAlertTriangle as AlertTriangle,
  FiBox as Box,
  FiChevronDown as ChevronDown,
  FiEdit2 as Edit2,
  FiPlusCircle as PlusCircle,
  FiRefreshCw as RefreshCw,
  FiTrash2 as Trash2,
  FiX as X,
} from "react-icons/fi";
import { buildEquipmentDisplayColumns } from "../../dashboard.utils";
import { EmptyState, Pagination, RadioSelect, RollingText, RowActionsMenu } from "../../components/SharedControls";
import { DynamicEquipmentTable } from "../../components/DynamicEquipmentTable";
import { CategoryTabs } from "../../components/CategoryTabs";

const EQUIPMENT_PAGE_SIZE = 20;

export function EquipmentItemsTable({
  category,
  items,
  configuredColumns = [],
  isLoading,
  error,
  onRetry,
  onBack,
  onEdit,
  onDelete,
  onAddNew,
  isUnconfigured = false,
  canCreate = true,
  canManage = true,
  showBackButton = true,
  idFilter = null,
  onClearIdFilter,
  // From the header search bar — this page has no search box of its own.
  search = "",
}) {
  const { t, i18n } = useTranslation();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // A new category means a whole new item list — start back on page 1
  // rather than stranding the user on a page number that may not exist.
  // Adjusted during render (not an effect) per React's guidance for
  // resetting state when a prop changes. A change to idFilter (set/cleared
  // by a "Low stock" notification) resizes the visible list the same way,
  // so it gets the same page-1 reset.
  const [prevCategory, setPrevCategory] = useState(category);
  const [prevIdFilter, setPrevIdFilter] = useState(idFilter);
  if (category !== prevCategory || idFilter !== prevIdFilter) {
    setPrevCategory(category);
    setPrevIdFilter(idFilter);
    setPage(1);
    // A status picked before this idFilter appeared may no longer apply to
    // any of the now-visible items (e.g. "Low stock only" narrows the list
    // down to statuses that dropdown selection wouldn't have offered) —
    // drop it rather than silently filtering everything down to zero.
    if (statusFilter) setStatusFilter("");
  }

  const baseColumns = useMemo(
    () => configuredColumns.map(({ key, label }) => ({ key, label })),
    [configuredColumns]
  );
  const columns = useMemo(() => buildEquipmentDisplayColumns(items, baseColumns), [items, baseColumns]);

  // Whichever status values actually appear on the items currently in view —
  // scoped to idFilter (e.g. a "Low stock only" pin) so the list only
  // offers statuses that would actually produce results, not every status
  // used anywhere in the whole category. Statuses are admin-configurable,
  // so this stays in sync automatically instead of hardcoding a fixed list.
  const statusOptions = useMemo(() => {
    const scoped = items.filter((item) => !idFilter || idFilter.has(item.equipment_id));
    const values = new Set(scoped.map((item) => item.status).filter((value) => value && String(value).trim()));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [items, idFilter]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matches = items
      .filter((item) => !idFilter || idFilter.has(item.equipment_id))
      .filter((item) => !statusFilter || item.status === statusFilter)
      .filter(
        (item) => !term || columns.some((column) => String(item[column.key] ?? "").toLowerCase().includes(term))
      );
    return matches.map((item, index) => ({ ...item, _row_number: index + 1 }));
  }, [items, columns, search, statusFilter, idFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / EQUIPMENT_PAGE_SIZE));
  // Derived rather than reset in an effect: narrowing the header search can
  // drop the page count below the page you were on, which would otherwise
  // leave the table blank.
  const safePage = Math.min(page, pageCount);
  const paginatedItems = filteredItems.slice((safePage - 1) * EQUIPMENT_PAGE_SIZE, safePage * EQUIPMENT_PAGE_SIZE);

return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-xl bg-white dark:bg-slate-900">
        {/* z-20 beats the hovered row so a lifted row passes under this bar. */}
        <div className="sticky top-14 z-20 flex flex-wrap items-start justify-between gap-3 bg-white px-5 py-2.5 dark:bg-slate-900">
          <div>
            {showBackButton && onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white dark:focus-visible:ring-offset-slate-900"
              >
                <ChevronDown size={14} className="rotate-90 text-slate-500 dark:text-slate-400" />
                {t("Back to categories")}
              </button>
            )}
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{category}</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400">
                <span>{t("item_count", { count: filteredItems.length })}</span>
                {idFilter && (
                  <button
                    type="button"
                    onClick={onClearIdFilter}
                    className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700 outline-none transition hover:bg-orange-100 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-950/60"
                  >
                    {t("Low stock only")}
                    <X size={11} />
                  </button>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-56">
              <RadioSelect
                id="equipment-status-filter"
                options={[
                  { value: "", label: t("All Statuses") },
                  ...statusOptions.map((status) => ({ value: status, label: translateLabel(t, i18n, status) })),
                ]}
                value={statusFilter}
                onSelect={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                placeholder={t("All Statuses")}
              />
            </div>
            {canCreate && onAddNew && (
              <button
                type="button"
                onClick={onAddNew}
                className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
              >
                <PlusCircle size={15} />
                <RollingText text={t("New Equipment")} />
              </button>
            )}
          </div>
        </div>

{isUnconfigured ? (
          <EmptyState
            icon={Box}
            title={t("Empty")}
            description={t("category_no_columns", { category })}
          />
        ) : (
          <DynamicEquipmentTable
            columns={columns}
            records={paginatedItems}
            rowKey={(item, index) => item.equipment_id ?? index}
            isLoading={isLoading}
            loadingText={t("Loading equipment...")}
            error={error}
            errorTitle={t("Couldn't load equipment")}
            onRetry={onRetry}
            emptyIcon={Box}
            emptyTitle={t("No equipment found")}
            emptyDescription={search ? t("No equipment matches", { term: search }) : t("This category has no items.")}
            renderRowActions={
              canManage &&
              ((item) => {
                const iconButtonClass =
                  "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white";

                return (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      title={t("Edit")}
                      aria-label={t("Edit")}
                      className={iconButtonClass}
                    >
                      <Edit2 size={14} className="block" />
                    </button>
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        title={t("Delete")}
                        aria-label={t("Delete")}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                      >
                        <Trash2 size={14} className="block" />
                      </button>
                    )}
                  </div>
                );
              })
            }
          />
        )}

        {!isUnconfigured && !isLoading && !error && filteredItems.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <Pagination currentPage={safePage} pageCount={pageCount} onPageChange={setPage} />
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
  onDelete,
  idFilter = null,
  onClearIdFilter,
  canManage = true,
  canCreate = true,
  // From the header search bar — this page has no search box of its own.
  search = "",
}) {
  const { t } = useTranslation();

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
      <div className="overflow-hidden rounded-xl bg-white dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Equipments")}</h2>
          </div>
        </div>

        <CategoryTabs
          options={categoryOptions}
          selected={selectedCategory}
          onSelect={onSelectCategory}
        />

        <EquipmentItemsTable
          search={search}
          category={selectedCategoryLabel}
          items={items}
          configuredColumns={columns}
          isLoading={isItemsLoading}
          error={itemsError}
          isUnconfigured={isUnconfigured}
          onRetry={onRetry}
          onBack={null}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddNew={onAddNew}
          canCreate={canCreate}
          canManage={canManage}
          showBackButton={false}
          idFilter={idFilter}
          onClearIdFilter={onClearIdFilter}
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
  const { t } = useTranslation();

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Equipment categories")}</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                {t("category_count", { count: categories.length })}
              </p>
            )}
          </div>
          {canManage && (
            <button
              type="button"
              onClick={onAddCategory}
              className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
            >
              <PlusCircle size={15} />
              <RollingText text={t("New Category")} />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">{t("Loading categories...")}</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t("Couldn't load categories")}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              <RefreshCw size={13} />
              {t("Retry")}
            </button>
          </div>
        ) : categories.length === 0 ? (
          <EmptyState icon={Box} title={t("No categories found")} description={t("Equipment categories will appear here.")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[13px] dark:divide-slate-800">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">{t("Category Name")}</th>
                  <th className="px-5 py-3 font-semibold">{t("Columns Configured")}</th>
                  <th className="px-5 py-3 font-semibold">{t("Equipment")}</th>
                  <th className="px-5 py-3 text-right font-semibold">{t("Actions")}</th>
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
                              { icon: Edit2, label: t("Edit"), onClick: () => onEditCategory(category) },
                              { icon: Trash2, label: t("Delete"), onClick: () => onDeleteCategory(category), destructive: true },
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
