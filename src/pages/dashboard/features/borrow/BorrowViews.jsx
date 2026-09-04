import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle as AlertTriangle, FiRefreshCw as RefreshCw, FiSearch as Search, FiX as X } from "react-icons/fi";
import { borrowHistoryColumns, currentBorrowColumns } from "../../dashboard.config";
import { getRecordColumns } from "../../dashboard.utils";
import { translateLabel } from "../../../../lib/i18nLabel";
import { EmptyState, formInputClass } from "../../components/SharedControls";
import { RecordCellValue, RecordsTableView } from "../../components/RecordsTableView";

export function CurrentBorrowsView({ loans, isLoading, error, onRetry, onReturn, canManage = true }) {
  const { t } = useTranslation();

  return (
    <RecordsTableView
      records={loans}
      columnsConfig={currentBorrowColumns}
      title={t("Currently borrowed")}
      recordLabel="loan"
      loadingText={t("Loading current loans...")}
      errorTitle={t("Couldn't load current loans")}
      emptyIcon={RefreshCw}
      emptyTitle={t("Nothing borrowed")}
      emptyDescription={t("Equipment currently on loan will appear here.")}
      rowKey={(loan, index) => loan.borrow_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      hideRefresh
      renderRowActions={
        canManage &&
        ((loan) => (
          <button
            type="button"
            onClick={() => onReturn(loan)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            {t("Return")}
          </button>
        ))
      }
    />
  );
}

export function BorrowHistoryView({
  history,
  isLoading,
  error,
  onRetry,
  filters,
  onFilterChange,
  onClearFilters,
}) {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");
  const columns = useMemo(() => getRecordColumns(history, borrowHistoryColumns), [history]);

  const filteredHistory = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return history;
    return history.filter((record) =>
      columns.some((column) => String(record[column.key] ?? "").toLowerCase().includes(term))
    );
  }, [history, columns, search]);

  const hasActiveFilters = Boolean(filters.from || filters.to || search);

  function handleClearAll() {
    setSearch("");
    onClearFilters();
  }

return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Borrow history")}</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                {t("record_count", { count: filteredHistory.length })}
              </p>
            )}
          </div>
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
            <input
              id="borrow-history-search"
              type="text"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search...")}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-14 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800 "
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
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
        </div>

<div className="flex flex-wrap items-end gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="history-from">
              {t("From")}
            </label>
            <input
              id="history-from"
              type="date"
              autoComplete="off"
              value={filters.from}
              onChange={(e) => onFilterChange("from", e.target.value)}
              className={formInputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="history-to">
              {t("To")}
            </label>
            <input
              id="history-to"
              type="date"
              autoComplete="off"
              value={filters.to}
              onChange={(e) => onFilterChange("to", e.target.value)}
              className={formInputClass}
            />
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
            >
              {t("Clear filters")}
            </button>
          )}
        </div>

{isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">{t("Loading borrow history...")}</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t("Couldn't load borrow history")}</p>
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
        ) : history.length === 0 ? (
          <EmptyState icon={Search} title={t("No borrow history")} description={t("Loan records will appear here.")} />
        ) : filteredHistory.length === 0 ? (
          <EmptyState icon={Search} title={t("No borrow history")} description={t("No borrow history matches", { term: search })} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[13px] dark:divide-slate-800">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                      {translateLabel(t, i18n, column.label)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {filteredHistory.map((record, index) => (
                  <tr key={record.borrow_id ?? index} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 text-slate-600 dark:text-slate-300 ${column.key === "remark" ? "min-w-72 whitespace-normal" : "whitespace-nowrap"
                          }`}
                      >
                        {column.key === "loan_status" ? (
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${record.loan_status === "Returned"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                              }`}
                          >
                            {translateLabel(t, i18n, record.loan_status)}
                          </span>
                        ) : (
                          <RecordCellValue value={record[column.key]} />
                        )}
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

// ---------------------------------------------------------------------------
// Employee search
// ---------------------------------------------------------------------------
