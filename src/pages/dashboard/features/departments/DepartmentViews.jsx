import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FiEdit2 as Edit2,
  FiFileText as FileText,
  FiGrid as Grid,
  FiPlusCircle as PlusCircle,
  FiSearch as Search,
  FiTrash2 as Trash2,
  FiUsers as Users,
  FiX as X,
} from "react-icons/fi";
import { departmentColumns } from "../../dashboard.config";
import { FormField, formInputClass, RowActionsMenu } from "../../components/SharedControls";
import { RecordsTableView } from "../../components/RecordsTableView";

export function DepartmentsView({
  departments,
  isLoading,
  error,
  onRetry,
  search = "",
  onSearchChange,
  onAddNew,
  onEdit,
  onDelete,
  onDownloadAllExcel,
  onDownloadAllPdf,
  canManage = true,
  canCreate = true,
}) {
  const { t } = useTranslation();

  // department_id is the raw database id — new departments don't land at the
  // end of that sequence, so number rows ourselves instead of showing it.
  const numberedDepartments = useMemo(
    () => departments.map((department, index) => ({ ...department, _row_number: index + 1 })),
    [departments]
  );
  const numberedColumns = useMemo(
    () => [{ key: "_row_number", label: "No." }, ...departmentColumns.filter((column) => column.key !== "department_id")],
    []
  );

  return (
    <RecordsTableView
      records={numberedDepartments}
      columnsConfig={numberedColumns}
      title={t("Departments")}
      recordLabel="department"
      loadingText={t("Loading departments...")}
      errorTitle={t("Couldn't load departments")}
      emptyIcon={Users}
      emptyTitle={t("No departments found")}
      emptyDescription={search ? t("No department matches", { term: search }) : t("Department records will appear here.")}
      rowKey={(department, index) => department.department_id ?? department.department_code ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      hideRefresh
      actionsHeader={
        <RowActionsMenu
          items={[
            { icon: FileText, label: t("Download All PDFs"), onClick: onDownloadAllPdf },
            { icon: Grid, label: t("Download All Excel"), onClick: onDownloadAllExcel },
          ]}
        />
      }
      headerActions={
        <>
          {onSearchChange && (
            <div className="relative w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
              <input
                id="department-search"
                type="text"
                autoComplete="off"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t("Search...")}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-14 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:bg-slate-800 dark:focus:ring-slate-700"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  aria-label={t("Clear search")}
                  className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-300 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                >
                  <X size={13} />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
                  Ctrl K
                </kbd>
              )}
            </div>
          )}

          {canCreate && (
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-offset-slate-900"
            >
              <PlusCircle size={14} />
              {t("New Department")}
            </button>
          )}
        </>
      }
      renderRowActions={
        canManage &&
        ((department) => (
          <div className="flex items-center justify-end">
            <RowActionsMenu
              items={[
                { icon: Edit2, label: t("Edit"), onClick: () => onEdit(department) },
                { icon: Trash2, label: t("Delete"), onClick: () => onDelete(department), destructive: true },
              ]}
            />
          </div>
        ))
      }
    />
  );
}

export function DepartmentFormModal({
  isOpen,
  mode,
  values,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
}) {
  const { t } = useTranslation();

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

if (!isOpen) return null;

 const isEdit = mode === "edit";

return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label={t("Close")}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">
              {isEdit ? t("Edit department") : t("Add new department")}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {isEdit ? t("Update this department's details.") : t("Create a new department.")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label={t("Close")}
          >
            <X size={16} />
          </button>
        </div>

<form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}
            <div className="grid gap-4">
              <FormField label={t("Department Code *")} htmlFor="department-code">
                <input
                  id="department-code"
                  type="text"
                  required
                  autoComplete="off"
                  value={values.department_code}
                  onChange={(e) => onChange("department_code", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
              <FormField label={t("Department Name *")} htmlFor="department-name">
                <input
                  id="department-name"
                  type="text"
                  required
                  autoComplete="off"
                  value={values.department_name}
                  onChange={(e) => onChange("department_name", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>
          </div>

<div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-offset-slate-900"
            >
              {isSubmitting ? t("Saving...") : isEdit ? t("Save changes") : t("Add department")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CategoryFormModal({
  isOpen,
  mode,
  values,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
}) {
  const { t } = useTranslation();

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

if (!isOpen) return null;

 const isEdit = mode === "edit";

return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label={t("Close")}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">
              {isEdit ? t("Edit category") : t("Add new category")}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {isEdit ? t("Update this category's details.") : t("Create a new category.")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label={t("Close")}
          >
            <X size={16} />
          </button>
        </div>

<form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}
            <div className="grid gap-4">
              <FormField label={t("Category Name *")} htmlFor="category-name">
                <input
                  id="category-name"
                  type="text"
                  required
                  autoComplete="off"
                  value={values.category_name}
                  onChange={(e) => onChange("category_name", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

<FormField label={t("Description")} htmlFor="category-description">
                <input
                  id="category-description"
                  type="text"
                  autoComplete="off"
                  value={values.description}
                  onChange={(e) => onChange("description", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>
          </div>

<div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-offset-slate-900"
            >
              {isSubmitting ? t("Saving...") : isEdit ? t("Save changes") : t("Add category")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
