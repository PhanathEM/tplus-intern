import { useTranslation } from "react-i18next";
import { FiAlertTriangle as AlertTriangle, FiRefreshCw as RefreshCw, FiSettings as Settings } from "react-icons/fi";
import { translateLabel } from "../../../lib/i18nLabel";
import { EmptyState } from "./SharedControls";
import { RecordCellValue } from "./RecordsTableView";

// Renders whatever `columns` the API hands back for a given category — no
// per-category layout in the frontend, so a brand-new category (or a
// category-less "general layout" response) just works.
export function DynamicEquipmentTable({
  columns,
  records,
  rowKey,
  isLoading,
  loadingText,
  error,
  errorTitle,
  onRetry,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  renderRowActions,
  actionsHeader,
  getRowClassName,
  onRowClick,
  selectable,
}) {
  const { t, i18n } = useTranslation();

  if (isLoading) {
    return (
      <div className="px-5 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">
        {loadingText || t("Loading equipment...")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
          <AlertTriangle size={18} />
        </div>
        <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{errorTitle || t("Couldn't load equipment")}</p>
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
    );
  }

  if (records.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle || t("No equipment found")}
        description={emptyDescription || t("Equipment will appear here.")}
      />
    );
  }

  const headerCellClass =
    "whitespace-nowrap border-y border-slate-100 px-5 py-2 font-semibold leading-none dark:border-slate-800";
  // Every cell keeps a full border at rest — top transparent, bottom the row
  // separator — so hover only recolours it into a card around the row, with
  // no 1px height jump.
  const cellClass =
    "border border-x-transparent border-t-transparent border-b-slate-50 bg-white px-5 py-2 group-hover:border-y-slate-200 dark:border-b-slate-800/60 dark:bg-slate-900 dark:group-hover:border-y-slate-700";
  const roundLeft = "rounded-l-lg group-hover:border-l-slate-200 dark:group-hover:border-l-slate-700";
  const roundRight = "rounded-r-lg group-hover:border-r-slate-200 dark:group-hover:border-r-slate-700";

  return (
    // border-separate (not the default collapse) so a hovered row can round
    // its end cells — border-radius on a cell is ignored in the collapsed
    // model. Row lines therefore live on the cells rather than on <tr>.
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-left text-[13px]">
        <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          <tr>
            {selectable && <th className={`w-10 ${headerCellClass}`} />}
            {columns.map((column) => {
              const ColumnIcon = column.icon;
              return (
                <th key={column.key} className={headerCellClass}>
                  <span className="flex items-center gap-1.5">
                    {ColumnIcon && <ColumnIcon size={13} className="shrink-0" />}
                    {translateLabel(t, i18n, column.label)}
                  </span>
                </th>
              );
            })}
            {renderRowActions && (
              <th className={`${headerCellClass} text-right`}>
                <span className="flex items-center justify-end gap-1.5">
                  <Settings size={13} className="shrink-0" />
                  {actionsHeader || t("Action")}
                </span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr
              key={rowKey(record, index)}
              onClick={onRowClick ? () => onRowClick(record) : undefined}
              className={`${onRowClick ? "group cursor-pointer" : ""} ${getRowClassName?.(record) || ""}`}
            >
              {selectable && (
                <td className={`${cellClass} ${roundLeft} whitespace-nowrap`} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectable.isSelected(record)}
                    onChange={() => selectable.onSelect(record)}
                    className="h-4 w-4 rounded border-slate-300 text-orange-500 outline-none focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-600 dark:bg-slate-800"
                  />
                </td>
              )}
              {columns.map((column, columnIndex) => {
                const isFirstCell = !selectable && columnIndex === 0;
                const isLastCell = !renderRowActions && columnIndex === columns.length - 1;
                return (
                  <td
                    key={column.key}
                    className={`${cellClass} text-slate-600 dark:text-slate-300 ${column.key === "remark" ? "min-w-72 whitespace-normal" : "whitespace-nowrap"
                      } ${isFirstCell ? roundLeft : ""} ${isLastCell ? roundRight : ""}`}
                  >
                    <RecordCellValue
                      value={
                        column.key === "status" && record[column.key]
                          ? translateLabel(t, i18n, record[column.key])
                          : record[column.key]
                      }
                    />
                  </td>
                );
              })}
              {renderRowActions && (
                <td className={`${cellClass} ${roundRight} whitespace-nowrap text-right`}>
                  {renderRowActions(record)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
