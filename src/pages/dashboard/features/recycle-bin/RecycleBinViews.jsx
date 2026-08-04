import { useMemo, useState } from "react";
import {
  FiAlertTriangle as AlertTriangle,
  FiChevronDown as ChevronDown,
  FiRefreshCw as RefreshCw,
  FiRotateCcw as RotateCcw,
  FiTrash2 as Trash2,
} from "react-icons/fi";
import { EmptyState } from "../../components/SharedControls";
import { formatFieldValue, humanizeFieldKey } from "../../dashboard.utils";

const IGNORED_KEYS = new Set([
  "id",
  "recycle_bin_id",
  "bin_id",
  "entity_type",
  "entityType",
  "type",
  "data",
  "record",
  "snapshot",
  "payload",
  "entity_data",
  "original_data",
  "deleted_at",
  "deletedAt",
  "created_at",
  "createdAt",
  "deleted_by",
  "deletedBy",
]);

const RECORD_FIELD_CANDIDATES = ["data", "record", "snapshot", "payload", "entity_data", "original_data"];

const LABEL_FIELD_CANDIDATES = [
  "full_name",
  "department_name",
  "category_name",
  "name",
  "device_type",
  "computer_name",
  "username",
  "title",
];

function getEntryId(entry) {
  return entry?.id ?? entry?.recycle_bin_id ?? entry?.bin_id ?? null;
}

function getEntryType(entry) {
  return entry?.entity_type ?? entry?.entityType ?? entry?.type ?? "Unknown";
}

function getEntryRecord(entry) {
  for (const key of RECORD_FIELD_CANDIDATES) {
    if (entry?.[key] && typeof entry[key] === "object") return entry[key];
  }
  return entry || {};
}

function getEntryLabel(entry) {
  const record = getEntryRecord(entry);
  for (const key of LABEL_FIELD_CANDIDATES) {
    if (record?.[key]) return record[key];
  }
  const id = getEntryId(entry);
  return `${getEntryType(entry)} #${id ?? "—"}`;
}

function getEntryTimestamp(entry) {
  return entry?.deleted_at ?? entry?.deletedAt ?? entry?.created_at ?? entry?.createdAt ?? null;
}

function getEntryDeletedBy(entry) {
  return entry?.deleted_by ?? entry?.deletedBy ?? entry?.deleted_by_name ?? null;
}

function formatTimestamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function RecycleBinRow({ entry, onRestore, onDeleteForever, isRestoring, isDeleting }) {
  const [expanded, setExpanded] = useState(false);
  const record = useMemo(() => getEntryRecord(entry), [entry]);
  const entries = Object.entries(record).filter(([key]) => !IGNORED_KEYS.has(key));
  const isBusy = isRestoring || isDeleting;

  return (
    <>
      <tr className="transition hover:bg-slate-50/70">
        <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatTimestamp(getEntryTimestamp(entry))}</td>
        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{getEntryType(entry)}</td>
        <td className="px-4 py-3 font-medium text-slate-800">{getEntryLabel(entry)}</td>
        <td className="whitespace-nowrap px-4 py-3 text-slate-500">{getEntryDeletedBy(entry) || "—"}</td>
        <td className="whitespace-nowrap px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            {entries.length > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Details
                <ChevronDown size={12} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onRestore(entry)}
              disabled={isBusy}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 outline-none transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={12} className={isRestoring ? "animate-spin" : ""} />
              {isRestoring ? "Restoring..." : "Restore"}
            </button>
            <button
              type="button"
              onClick={() => onDeleteForever(entry)}
              disabled={isBusy}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 outline-none transition hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={12} />
              {isDeleting ? "Deleting..." : "Delete Forever"}
            </button>
          </div>
        </td>
      </tr>
      {expanded && entries.length > 0 && (
        <tr className="bg-slate-50/60">
          <td colSpan={5} className="px-4 py-3">
            <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-3">
              {entries.map(([key, value]) => (
                <div key={key} className="min-w-0">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {humanizeFieldKey(key)}
                  </dt>
                  <dd className="truncate text-xs text-slate-700" title={formatFieldValue(value)}>
                    {formatFieldValue(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </td>
        </tr>
      )}
    </>
  );
}

const selectClass =
  "h-9 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 outline-none transition hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

export function RecycleBinView({
  entries,
  isLoading,
  error,
  onRetry,
  typeFilter,
  onFilterChange,
  typeOptions,
  onRestore,
  onDeleteForever,
  onPurgeAll,
  restoringId,
  deletingId,
  isPurging,
  actionError,
}) {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">Recycle bin</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500">
                {entries.length} item{entries.length === 1 ? "" : "s"} pending restore or permanent deletion
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(event) => onFilterChange(event.target.value)}
              className={selectClass}
            >
              <option value="All">All types</option>
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onRetry}
              disabled={isLoading}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
            {entries.length > 0 && (
              <button
                type="button"
                onClick={onPurgeAll}
                disabled={isPurging}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3.5 text-[13px] font-semibold text-rose-600 outline-none transition hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={14} />
                {isPurging ? "Purging..." : "Purge All"}
              </button>
            )}
          </div>
        </div>

        {actionError && (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700">
            <AlertTriangle size={14} />
            {actionError}
          </div>
        )}

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500">Loading recycle bin...</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700">Couldn&apos;t load the recycle bin</p>
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
        ) : entries.length === 0 ? (
          <EmptyState icon={Trash2} title="Recycle bin is empty" description="Deleted records will show up here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[13px]">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Deleted</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Deleted By</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-right">&nbsp;</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {entries.map((entry) => {
                  const id = getEntryId(entry);
                  return (
                    <RecycleBinRow
                      key={id}
                      entry={entry}
                      onRestore={onRestore}
                      onDeleteForever={onDeleteForever}
                      isRestoring={restoringId === id}
                      isDeleting={deletingId === id}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
