import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FiAlertTriangle as AlertTriangle,
  FiEdit2 as Edit2,
  FiFileText as FileText,
  FiGrid as Grid,
  FiPlusCircle as PlusCircle,
  FiRefreshCw as RefreshCw,
  FiSliders as Sliders,
  FiTrash2 as Trash2,
  FiX as X,
} from "react-icons/fi";
import { EmptyState, FormField, formInputClass, RollingText, RowActionsMenu } from "../../components/SharedControls";

export function StatusesView({
  statuses,
  isLoading,
  error,
  onRetry,
  onAddNew,
  onEdit,
  onDelete,
  onDownloadStatusPdf,
  onDownloadStatusExcel,
  downloadingPdfId,
  downloadingExcelId,
  onDownloadAllPdf,
  onDownloadAllExcel,
  isDownloadingAllPdf,
  isDownloadingAllExcel,
  downloadError,
  canManage = true,
}) {
  const { t } = useTranslation();

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Equipment statuses")}</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                {t("status_count", { count: statuses.length })}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canManage && (
              <button
                type="button"
                onClick={onAddNew}
                className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
              >
                <PlusCircle size={15} />
                <RollingText text={t("Add Status")} />
              </button>
            )}
          </div>
        </div>

        {downloadError && (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertTriangle size={14} />
            {downloadError}
          </div>
        )}

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">{t("Loading statuses...")}</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t("Couldn't load statuses")}</p>
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
        ) : statuses.length === 0 ? (
          <EmptyState icon={Sliders} title={t("No statuses found")} description={t("Equipment statuses will appear here.")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[13px] dark:divide-slate-800">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">{t("Status Name")}</th>
                  <th className="px-5 py-3 font-semibold">{t("Description")}</th>
                  <th className="px-5 py-3 font-semibold">{t("Equipment")}</th>
                  <th className="px-5 py-3 text-right font-semibold">
                    <RowActionsMenu
                      items={[
                        {
                          icon: FileText,
                          label: isDownloadingAllPdf ? t("Preparing PDF...") : t("Download All PDFs"),
                          onClick: onDownloadAllPdf,
                        },
                        {
                          icon: Grid,
                          label: isDownloadingAllExcel ? t("Preparing Excel...") : t("Download All Excel"),
                          onClick: onDownloadAllExcel,
                        },
                      ]}
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {statuses.map((status) => (
                  <tr key={status.status_id} className={`transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40 ${status.is_active ? "" : "opacity-60"}`}>
                    <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-950 dark:text-white">
                      {status.status_name}
                    </td>
                    <td className="max-w-72 truncate px-5 py-3.5 text-slate-600 dark:text-slate-300" title={status.description || ""}>
                      {status.description || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {status.equipment_count ?? 0}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      {canManage && (
                        <div className="flex items-center justify-end">
                          <RowActionsMenu
                            items={[
                              {
                                icon: FileText,
                                label:
                                  downloadingPdfId === status.status_id ? t("Preparing PDF...") : t("Download as PDF"),
                                onClick: () => onDownloadStatusPdf(status),
                              },
                              {
                                icon: Grid,
                                label:
                                  downloadingExcelId === status.status_id
                                    ? t("Preparing Excel...")
                                    : t("Download as Excel"),
                                onClick: () => onDownloadStatusExcel(status),
                              },
                              { divider: true },
                              { icon: Edit2, label: t("Edit"), onClick: () => onEdit(status) },
                              { icon: Trash2, label: t("Delete"), onClick: () => onDelete(status), destructive: true },
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

export function StatusFormModal({ isOpen, mode, values, onChange, onSubmit, onClose, isSubmitting, error }) {
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
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{isEdit ? t("Edit status") : t("Add status")}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {isEdit ? t("Update this status's details.") : t("Create a new equipment status.")}
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField label={t("Status Name *")} htmlFor="status-name">
                  <input
                    id="status-name"
                    type="text"
                    required
                    autoComplete="off"
                    value={values.status_name}
                    onChange={(e) => onChange("status_name", e.target.value)}
                    className={formInputClass}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField label={t("Description")} htmlFor="status-description">
                  <textarea
                    id="status-description"
                    rows={2}
                    value={values.description}
                    onChange={(e) => onChange("description", e.target.value)}
                    className={`${formInputClass} h-auto min-h-16 py-2`}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

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
              className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
            >
              <RollingText text={isSubmitting ? t("Saving...") : isEdit ? t("Save changes") : t("Add status")} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
