import { useMemo, useState } from "react";
import { FiActivity as ActivityIcon, FiChevronDown as ChevronDown } from "react-icons/fi";
import { EmptyState } from "../../components/SharedControls";
import { formatFieldValue, humanizeFieldKey } from "../../dashboard.utils";

const ACTION_STYLES = {
  create: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  update: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  delete: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  approve: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  reset_password: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  assign: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  unassign: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  borrow: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  return: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const ACTION_LABELS = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  approve: "Approved",
  reset_password: "Password reset",
  assign: "Assigned",
  unassign: "Unassigned",
  borrow: "Borrowed",
  return: "Returned",
};

const IGNORED_DIFF_KEYS = new Set([
  "created_at",
  "updated_at",
  "createdAt",
  "updatedAt",
  "password",
  "password_hash",
]);

function formatTimestamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function diffFields(before, after) {
  if (!before || !after) return [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes = [];
  for (const key of keys) {
    if (IGNORED_DIFF_KEYS.has(key)) continue;
    const from = before[key];
    const to = after[key];
    if (String(from ?? "") === String(to ?? "")) continue;
    changes.push({ key, from, to });
  }
  return changes;
}

function ActionBadge({ action }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${ACTION_STYLES[action] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        }`}
    >
      {ACTION_LABELS[action] || action}
    </span>
  );
}

function ActivityDetails({ entry, changes, columnCount }) {
  const snapshot = entry.before || entry.after;

  return (
    <tr className="bg-slate-50/60 dark:bg-slate-800/40">
      <td colSpan={columnCount} className="px-4 py-3">
        {entry.action === "update" ? (
          changes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {changes.map((change) => (
                <span
                  key={change.key}
                  className="rounded-lg bg-white px-2.5 py-1.5 text-xs text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{humanizeFieldKey(change.key)}:</span>{" "}
                  <span className="text-rose-600 line-through dark:text-rose-400">{formatFieldValue(change.from)}</span>{" "}
                  <span className="text-slate-400 dark:text-slate-600">&rarr;</span>{" "}
                  <span className="text-emerald-700 dark:text-emerald-400">{formatFieldValue(change.to)}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">No field changes recorded.</p>
          )
        ) : snapshot ? (
          <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-3">
            {Object.entries(snapshot)
              .filter(([key]) => !IGNORED_DIFF_KEYS.has(key))
              .map(([key, value]) => (
                <div key={key} className="min-w-0">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {humanizeFieldKey(key)}
                  </dt>
                  <dd className="truncate text-xs text-slate-700 dark:text-slate-300" title={formatFieldValue(value)}>
                    {formatFieldValue(value)}
                  </dd>
                </div>
              ))}
          </dl>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">No additional details recorded.</p>
        )}
      </td>
    </tr>
  );
}

function ActivityRow({ entry, showActor }) {
  const [expanded, setExpanded] = useState(false);
  const changes = useMemo(() => diffFields(entry.before, entry.after), [entry.before, entry.after]);
  const hasDetails = Boolean(entry.before || entry.after);
  const columnCount = showActor ? 6 : 5;

  return (
    <>
      <tr className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
        <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">{formatTimestamp(entry.timestamp)}</td>
        {showActor && (
          <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-950 dark:text-white">{entry.actorName}</td>
        )}
        <td className="whitespace-nowrap px-4 py-3">
          <ActionBadge action={entry.action} />
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{entry.module}</td>
        <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
          <span className="font-medium">{entry.entityLabel || `#${entry.entityId ?? "—"}`}</span>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-right">
          {hasDetails && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              Details
              <ChevronDown size={12} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          )}
        </td>
      </tr>
      {expanded && <ActivityDetails entry={entry} changes={changes} columnCount={columnCount} />}
    </>
  );
}

function ActivityTable({ entries, showActor, emptyDescription }) {
  if (entries.length === 0) {
    return <EmptyState icon={ActivityIcon} title="No activity yet" description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-left text-[13px] dark:divide-slate-800">
        <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 font-semibold">Time</th>
            {showActor && <th className="whitespace-nowrap px-4 py-3 font-semibold">User</th>}
            <th className="whitespace-nowrap px-4 py-3 font-semibold">Action</th>
            <th className="whitespace-nowrap px-4 py-3 font-semibold">Module</th>
            <th className="px-4 py-3 font-semibold">Item</th>
            <th className="whitespace-nowrap px-4 py-3 font-semibold text-right">&nbsp;</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
          {entries.map((entry) => (
            <ActivityRow key={entry.id} entry={entry} showActor={showActor} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MyActivityView({ entries }) {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">My activity</h2>
          <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
            {entries.length} action{entries.length === 1 ? "" : "s"} recorded on this device
          </p>
        </div>
        <ActivityTable
          entries={entries}
          showActor={false}
          emptyDescription="Things you add, edit, or delete will show up here."
        />
      </div>
    </div>
  );
}

const selectClass =
  "h-9 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 outline-none transition hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:focus-visible:ring-offset-slate-900";

export function ActivityLogView({
  entries,
  totalCount,
  filters,
  onFilterChange,
  moduleOptions,
  actionOptions,
}) {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">Activity log</h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              Showing {entries.length} of {totalCount} action{totalCount === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filters.module}
              onChange={(event) => onFilterChange("module", event.target.value)}
              className={selectClass}
            >
              <option value="All">All modules</option>
              {moduleOptions.map((module) => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </select>
            <select
              value={filters.action}
              onChange={(event) => onFilterChange("action", event.target.value)}
              className={selectClass}
            >
              <option value="All">All actions</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {ACTION_LABELS[action] || action}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={filters.search}
              onChange={(event) => onFilterChange("search", event.target.value)}
              placeholder="Search user or item..."
              className="h-9 w-52 rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:focus-visible:ring-offset-slate-900"
            />
          </div>
        </div>

        <ActivityTable entries={entries} showActor emptyDescription="No activity matches these filters." />
      </div>
    </div>
  );
}
