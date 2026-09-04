import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiAlertTriangle as AlertTriangle,
  FiRefreshCw as RefreshCw,
  FiSettings as Settings,
} from "react-icons/fi";
import { formatFieldValue } from "../dashboard.utils";
import { translateLabel } from "../../../lib/i18nLabel";
import { EmptyState, Pagination } from "./SharedControls";

export function RecordCellValue({ value }) {
  const { t } = useTranslation();

  if (typeof value === "boolean") {
    return (
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${value
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
          }`}
      >
        {value ? t("Yes") : t("No")}
      </span>
    );
  }

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return (
      <span className="text-slate-400 dark:text-slate-500">
        {t("N/A")}
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
  actionsHeader,
  hideRefresh = false,
  // Opt-in: pass a page size to paginate. Left off, the table renders every
  // record exactly as before, so the other pages using this are unaffected.
  pageSize = 0,
}) {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);

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

  const pageCount = pageSize > 0 ? Math.max(1, Math.ceil(records.length / pageSize)) : 1;
  // Derived rather than reset in an effect: filtering the list down can drop
  // the page count below the page you were on, which would otherwise show
  // an empty table until you clicked something.
  const safePage = Math.min(page, pageCount);
  const visibleRecords = pageSize > 0 ? records.slice((safePage - 1) * pageSize, safePage * pageSize) : records;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-xl bg-white dark:bg-slate-900">
        {/* z-20 beats the hovered row's own stacking so a lifted row passes
            under this bar rather than over it. */}
        <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 bg-white py-2 dark:bg-slate-900">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">
              {title}
            </h2>

            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
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
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
              >
                <RefreshCw
                  size={14}
                  className={
                    isLoading
                      ? "animate-spin"
                      : ""
                  }
                />

                {t("Refresh")}
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">
            {loadingText}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle size={18} />
            </div>

            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
              {errorTitle}
            </p>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {error}
            </p>

            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              <RefreshCw size={13} />
              {t("Retry")}
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

            {/* border-separate (not the default collapse) so a hovered row can
                round its end cells — border-radius on a cell is ignored in the
                collapsed model. Row lines therefore live on the cells rather
                than on <tr>, which can't carry borders here. */}
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-[13px]">
                <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    {columns.map((column) => {
                      const ColumnIcon = column.icon;
                      return (
                        <th
                          key={column.key}
                          className="whitespace-nowrap border-y border-slate-100 px-5 py-2 font-semibold leading-none dark:border-slate-800"
                        >
                          <span className="flex items-center gap-1.5">
                            {ColumnIcon && <ColumnIcon size={13} className="shrink-0" />}
                            {translateLabel(t, i18n, column.label)}
                          </span>
                        </th>
                      );
                    })}

                    {renderRowActions && (
                      <th className="whitespace-nowrap border-y border-slate-100 px-5 py-2 text-right font-semibold leading-none dark:border-slate-800">
                        <span className="flex items-center justify-end gap-1.5">
                          <Settings size={13} className="shrink-0" />
                          {actionsHeader || t("Action")}
                        </span>
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {visibleRecords.map((record, index) => {
                    // Every cell keeps a full border at rest — top transparent,
                    // bottom the row separator — so hover only recolours it into
                    // a card around the row, with no 1px height jump.
                    const cellClass =
                      "border border-x-transparent border-t-transparent border-b-slate-50 bg-white px-5 py-2 group-hover:border-y-slate-200 dark:border-b-slate-800/60 dark:bg-slate-900 dark:group-hover:border-y-slate-700";
                    const lastIndex = columns.length - 1;
                    return (
                      <tr
                        key={rowKey(record, index)}
                        className={getRowClassName?.(record) || undefined}
                      >
                        {columns.map((column, columnIndex) => (
                          <td
                            key={column.key}
                            className={`${cellClass} text-slate-600 dark:text-slate-300 ${column.key === "remark" ? "min-w-72 whitespace-normal" : "whitespace-nowrap"
                              } ${columnIndex === 0 ? "rounded-l-lg group-hover:border-l-slate-200 dark:group-hover:border-l-slate-700" : ""
                              } ${!renderRowActions && columnIndex === lastIndex
                                ? "rounded-r-lg group-hover:border-r-slate-200 dark:group-hover:border-r-slate-700"
                                : ""
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
                                  column.key === "status" && record[column.key]
                                    ? translateLabel(t, i18n, record[column.key])
                                    : record[column.key]
                                }
                              />
                            )}
                          </td>
                        ))}

                        {renderRowActions && (
                          <td className={`${cellClass} whitespace-nowrap rounded-r-lg text-right group-hover:border-r-slate-200 dark:group-hover:border-r-slate-700`}>
                            {renderRowActions(
                              record
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pageSize > 0 && pageCount > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
                <Pagination currentPage={safePage} pageCount={pageCount} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}