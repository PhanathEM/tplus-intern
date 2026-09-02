import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiActivity as ActivityIcon, FiChevronDown as ChevronDown, FiSearch as Search } from "react-icons/fi";
import { EmptyState, Pagination, RadioSelect } from "../../components/SharedControls";
import { formatFieldValue, humanizeFieldKey } from "../../dashboard.utils";
import { translateLabel } from "../../../../lib/i18nLabel";

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
  "is_active",
  // A display-only row index some tables add for numbering ("No." columns
  // over ids that aren't sequential) — never real data, so never worth
  // logging.
  "_row_number",
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
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${ACTION_STYLES[action] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        }`}
    >
      {t(ACTION_LABELS[action] || action)}
    </span>
  );
}

function ActivityDetails({ entry, changes, columnCount }) {
  const { t, i18n } = useTranslation();
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
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{translateLabel(t, i18n, humanizeFieldKey(change.key))}:</span>{" "}
                  <span className="text-rose-600 line-through dark:text-rose-400">{formatFieldValue(change.from)}</span>{" "}
                  <span className="text-slate-400 dark:text-slate-600">&rarr;</span>{" "}
                  <span className="text-emerald-700 dark:text-emerald-400">{formatFieldValue(change.to)}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("No field changes recorded.")}</p>
          )
        ) : snapshot ? (
          <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-3">
            {Object.entries(snapshot)
              .filter(([key]) => !IGNORED_DIFF_KEYS.has(key))
              .map(([key, value]) => (
                <div key={key} className="min-w-0">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {translateLabel(t, i18n, humanizeFieldKey(key))}
                  </dt>
                  <dd className="truncate text-xs text-slate-700 dark:text-slate-300" title={formatFieldValue(value)}>
                    {formatFieldValue(value)}
                  </dd>
                </div>
              ))}
          </dl>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">{t("No additional details recorded.")}</p>
        )}
      </td>
    </tr>
  );
}

function ActivityRow({ entry, showActor }) {
  const { t } = useTranslation();
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
        <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{t(entry.module)}</td>
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
              {t("Details")}
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
  const { t } = useTranslation();

  if (entries.length === 0) {
    return <EmptyState icon={ActivityIcon} title={t("No activity yet")} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-left text-[13px] dark:divide-slate-800">
        <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("Time")}</th>
            {showActor && <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("User")}</th>}
            <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("Action")}</th>
            <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("Module")}</th>
            <th className="px-4 py-3 font-semibold">{t("Item")}</th>
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

const ACTIVITY_LOG_PAGE_SIZE = 15;

export function ActivityLogView({
  entries,
  totalCount,
  filters,
  onFilterChange,
  moduleOptions,
  actionOptions,
}) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  // A filter change means a whole new result set — start back on page 1
  // rather than stranding the user on a page number that may not exist.
  // Adjusted during render (not an effect) per React's guidance for
  // resetting state when a prop changes.
  const [prevFilters, setPrevFilters] = useState(filters);
  if (
    filters.module !== prevFilters.module ||
    filters.action !== prevFilters.action ||
    filters.search !== prevFilters.search
  ) {
    setPrevFilters(filters);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(entries.length / ACTIVITY_LOG_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedEntries = entries.slice(
    (currentPage - 1) * ACTIVITY_LOG_PAGE_SIZE,
    currentPage * ACTIVITY_LOG_PAGE_SIZE
  );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Activity Log")}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {t("activity_count_summary", { shown: entries.length, total: totalCount })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-52">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
              <input
                type="text"
                value={filters.search}
                onChange={(event) => onFilterChange("search", event.target.value)}
                placeholder={t("Search...")}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-14 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:bg-slate-800 dark:focus:ring-slate-700"
              />
              {!filters.search && (
                <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
                  Ctrl K
                </kbd>
              )}
            </div>
            <div className="w-56">
              <RadioSelect
                id="activity-log-module-filter"
                options={[
                  { value: "All", label: t("All modules") },
                  ...moduleOptions.map((module) => ({ value: module, label: t(module) })),
                ]}
                value={filters.module}
                onSelect={(value) => onFilterChange("module", value)}
                placeholder={t("All modules")}
              />
            </div>
            <div className="w-44">
              <RadioSelect
                id="activity-log-action-filter"
                options={[
                  { value: "All", label: t("All actions") },
                  ...actionOptions.map((action) => ({ value: action, label: t(ACTION_LABELS[action] || action) })),
                ]}
                value={filters.action}
                onSelect={(value) => onFilterChange("action", value)}
                placeholder={t("All actions")}
              />
            </div>
          </div>
        </div>

        <ActivityTable entries={paginatedEntries} showActor emptyDescription={t("No activity matches these filters.")} />

        {entries.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-[13px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span>
              {t("Showing")} {(currentPage - 1) * ACTIVITY_LOG_PAGE_SIZE + 1}
              {"–"}
              {Math.min(currentPage * ACTIVITY_LOG_PAGE_SIZE, entries.length)} {t("of")} {entries.length}
            </span>
            <Pagination currentPage={currentPage} pageCount={pageCount} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
