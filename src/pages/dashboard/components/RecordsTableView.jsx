import { useMemo } from "react";
import {
  FiAlertTriangle as AlertTriangle,
  FiRefreshCw as RefreshCw,
} from "react-icons/fi";
import { formatFieldValue } from "../dashboard.utils";
import { EmptyState } from "./SharedControls";

export function RecordCellValue({ value }) {
  if (typeof value === "boolean") {
    return (
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${value
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-slate-600"
          }`}
      >
        {value ? "Yes" : "No"}
      </span>
    );
  }

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return (
      <span className="text-slate-400">
        N/A
      </span>
    );
  }

  return (
    <span>
      {formatFieldValue(value)}
    </span>
  );
}

export function RecordsTableView({
  records,
  columnsConfig,
  title,
  recordLabel,
  loadingText,
  errorTitle,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  rowKey,
  isLoading,
  error,
  onRetry,
  headerActions,
  topContent,
  renderCell,
  getRowClassName,
  renderRowActions,
  hideRefresh = false,
}) {
  /*
   * IMPORTANT:
   * Only use columnsConfig.
   *
   * Do NOT automatically generate columns from records.
   * This allows each page to decide exactly which
   * columns should be displayed.
   */
  const columns = useMemo(
    () => columnsConfig || [],
    [columnsConfig]
  );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">
              {title}
            </h2>

            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500">
                {records.length} {recordLabel}
                {records.length === 1 ? "" : "s"}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {headerActions}

            {!hideRefresh && (
              <button
                type="button"
                onClick={onRetry}
                disabled={isLoading}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={
                    isLoading
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500">
            {loadingText}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500">
              <AlertTriangle size={18} />
            </div>

            <p className="text-[13px] font-semibold text-slate-700">
              {errorTitle}
            </p>

            <p className="text-xs text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <>
            {topContent}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-[13px]">
                <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className="whitespace-nowrap px-4 py-3 font-semibold"
                      >
                        {column.label}
                      </th>
                    ))}

                    {renderRowActions && (
                      <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {records.map((record, index) => (
                    <tr
                      key={rowKey(record, index)}
                      className={`transition hover:bg-slate-50/70 ${getRowClassName?.(record) ||
                        ""
                        }`}
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-4 py-3 text-slate-600 ${column.key === "remark"
                              ? "min-w-72 whitespace-normal"
                              : "whitespace-nowrap"
                            }`}
                        >
                          {renderCell ? (
                            renderCell(
                              record,
                              column
                            )
                          ) : (
                            <RecordCellValue
                              value={
                                record[
                                column.key
                                ]
                              }
                            />
                          )}
                        </td>
                      ))}

                      {renderRowActions && (
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {renderRowActions(
                            record
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}