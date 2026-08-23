import { useMemo } from "react";
import { FiAlertTriangle as AlertTriangle, FiRefreshCw as RefreshCw, FiSearch as Search } from "react-icons/fi";
import { borrowHistoryColumns, currentBorrowColumns } from "../../dashboard.config";
import { getRecordColumns } from "../../dashboard.utils";
import { EmptyState, EmployeeSelectDropdown, formInputClass } from "../../components/SharedControls";
import { RecordCellValue, RecordsTableView } from "../../components/RecordsTableView";

export function CurrentBorrowsView({ loans, isLoading, error, onRetry, onReturn, canManage = true }) {
  return (
    <RecordsTableView
      records={loans}
      columnsConfig={currentBorrowColumns}
      title="Currently borrowed"
      recordLabel="loan"
      loadingText="Loading current loans..."
      errorTitle="Couldn't load current loans"
      emptyIcon={RefreshCw}
      emptyTitle="Nothing borrowed"
      emptyDescription="Equipment currently on loan will appear here."
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
            Return
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
  employees,
  filters,
  onFilterChange,
  onClearFilters,
}) {
  const columns = useMemo(() => getRecordColumns(history, borrowHistoryColumns), [history]);
  const hasActiveFilters = Boolean(filters.borrower_id || filters.from || filters.to);

return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">Borrow history</h2>
          {!isLoading && !error && (
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {history.length} record{history.length === 1 ? "" : "s"}
            </p>
          )}
        </div>

<div className="flex flex-wrap items-end gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="w-56">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">Borrower</label>
            <EmployeeSelectDropdown
              employees={employees}
              selectedId={filters.borrower_id}
              onSelect={(employee) => onFilterChange("borrower_id", String(employee.employee_id))}
              placeholder="All employees"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="history-from">
              From
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
              To
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
              onClick={onClearFilters}
              className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
            >
              Clear filters
            </button>
          )}
        </div>

{isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading borrow history...</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Couldn&apos;t load borrow history</p>
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
        ) : history.length === 0 ? (
          <EmptyState icon={Search} title="No borrow history" description="Loan records will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[13px] dark:divide-slate-800">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {history.map((record, index) => (
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
                            {record.loan_status}
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
