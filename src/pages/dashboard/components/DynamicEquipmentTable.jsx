import { FiAlertTriangle as AlertTriangle, FiRefreshCw as RefreshCw } from "react-icons/fi";
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
  loadingText = "Loading equipment...",
  error,
  errorTitle = "Couldn't load equipment",
  onRetry,
  emptyIcon,
  emptyTitle = "No equipment found",
  emptyDescription = "Equipment will appear here.",
  renderRowActions,
  getRowClassName,
  onRowClick,
  selectable,
}) {
  if (isLoading) {
    return <div className="px-5 py-10 text-center text-[13px] text-slate-500">{loadingText}</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500">
          <AlertTriangle size={18} />
        </div>
        <p className="text-[13px] font-semibold text-slate-700">{errorTitle}</p>
        <p className="text-xs text-slate-500">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <RefreshCw size={13} />
          Retry
        </button>
      </div>
    );
  }

  if (records.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-left text-[13px]">
        <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            {selectable && <th className="w-10 px-4 py-3" />}
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                {column.label}
              </th>
            ))}
            {renderRowActions && <th className="whitespace-nowrap px-4 py-3 font-semibold text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {records.map((record, index) => (
            <tr
              key={rowKey(record, index)}
              onClick={onRowClick ? () => onRowClick(record) : undefined}
              className={`transition hover:bg-slate-50/70 ${onRowClick ? "cursor-pointer" : ""} ${getRowClassName?.(record) || ""}`}
            >
              {selectable && (
                <td className="whitespace-nowrap px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectable.isSelected(record)}
                    onChange={() => selectable.onSelect(record)}
                    className="h-4 w-4 rounded border-slate-300 text-orange-500 outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                  />
                </td>
              )}
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 text-slate-600 ${column.key === "remark" ? "min-w-72 whitespace-normal" : "whitespace-nowrap"
                    }`}
                >
                  <RecordCellValue value={record[column.key]} />
                </td>
              ))}
              {renderRowActions && (
                <td className="whitespace-nowrap px-4 py-3 text-right">{renderRowActions(record)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
