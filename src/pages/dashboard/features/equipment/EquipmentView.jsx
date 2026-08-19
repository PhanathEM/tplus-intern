import { useMemo, useState } from "react";
import {
  FiBox as Box,
  FiChevronDown as ChevronDown,
  FiEdit2 as Edit2,
  FiPlusCircle as PlusCircle,
  FiRepeat as Repeat,
  FiSearch as Search,
  FiTrash2 as Trash2,
  FiUserX as UserX,
  FiX as X,
} from "react-icons/fi";
import { getRecordColumns } from "../../dashboard.utils";
import { EmptyState, RowActionsMenu } from "../../components/SharedControls";
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

  const baseColumns = useMemo(
    () => configuredColumns.map(({ key, label }) => ({ key, label })),
    [configuredColumns]
  );
  const columns = useMemo(() => {
    const filtered = getRecordColumns(items, baseColumns).filter(
      // software_licenses is the raw array behind license_names/license_status/etc. —
      // those flat fields already display fine as columns, the array itself doesn't.
      // category is redundant here since the page title/tabs already show it.
      // equipment_id isn't sequential (739, 740, 741...) — replaced below with a
      // frontend-numbered "No." column, same pattern as other tables in the app.
      (column) =>
        !column.key.startsWith("__") &&
        column.key !== "software_licenses" &&
        column.key !== "category" &&
        column.key !== "equipment_id"
    );
    // Remark tends to be long free text — push it to the end so it doesn't
    // interrupt the more scannable columns.
    const remarkIndex = filtered.findIndex((column) => column.key === "remark");
    const reordered = [...filtered];
    if (remarkIndex !== -1) {
      const [remarkColumn] = reordered.splice(remarkIndex, 1);
      reordered.push(remarkColumn);
    }
    return [{ key: "_row_number", label: "No." }, ...reordered];
  }, [items, baseColumns]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matches = !term
      ? items
      : items.filter((item) => columns.some((column) => String(item[column.key] ?? "").toLowerCase().includes(term)));
    return matches.map((item, index) => ({ ...item, _row_number: index + 1 }));
  }, [items, columns, search]);

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
                {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Equipment"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-8 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-400"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            {canCreate && onAddNew && (
              <button
                type="button"
                onClick={onAddNew}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
            records={filteredItems}
            rowKey={(item, index) => item.equipment_id ?? index}
            isLoading={isLoading}
            loadingText="Loading equipment..."
            error={error}
            errorTitle="Couldn't load equipment"
            onRetry={onRetry}
            emptyIcon={Box}
            emptyTitle="No equipment found"
            emptyDescription={search ? `No equipment matches "${search}".` : "This category has no items."}
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
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
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
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">Equipment</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500">
                {items.length} item{items.length === 1 ? "" : "s"} · {selectedCategoryLabel}
              </p>
            )}
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
                  ...(selectedCategoryEntry
                    ? [
                        { icon: Edit2, label: "Edit Category", onClick: () => onEditCategory(selectedCategoryEntry) },
                        {
                          icon: Trash2,
                          label: "Delete Category",
                          onClick: () => onDeleteCategory(selectedCategoryEntry),
                          destructive: true,
                        },
                        { divider: true },
                      ]
                    : []),
                  { icon: PlusCircle, label: "New Category", onClick: onAddCategory },
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

// ---------------------------------------------------------------------------
// Operational record tables
// ---------------------------------------------------------------------------
