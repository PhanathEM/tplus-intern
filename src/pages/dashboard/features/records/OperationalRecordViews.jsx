import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiActivity as Activity,
  FiAlertTriangle as AlertTriangle,
  FiEdit2 as Edit2,
  FiKey as Key,
  FiPlusCircle as PlusCircle,
  FiRefreshCw as RefreshCw,
  FiSearch as Search,
  FiTrash2 as Trash2,
  FiX as X,
} from "react-icons/fi";
import { licenseColumns } from "../../dashboard.config";
import { getLicenseExpiryInfo } from "../../dashboard.notifications";
import { formatFieldValue } from "../../dashboard.utils";
import { translateLabel } from "../../../../lib/i18nLabel";
import { RecordCellValue, RecordsTableView } from "../../components/RecordsTableView";
import { EmptyState, FormField, formInputClass, Pagination, RadioSelect, RowActionsMenu } from "../../components/SharedControls";

function LicenseStatusCell({ license }) {
  const { t, i18n } = useTranslation();
  const status = String(license.status || "").toLowerCase();
  const translatedStatus = translateLabel(t, i18n, license.status);

  if (!status) return <span className="text-slate-400 dark:text-slate-500">{t("N/A")}</span>;

  if (status.includes("expired")) {
    return <span className="font-semibold text-rose-600 dark:text-rose-400">{translatedStatus}</span>;
  }

  if (status.includes("near expire") || status.includes("expiring")) {
    return <span className="font-semibold text-amber-600 dark:text-amber-400">{translatedStatus}</span>;
  }

  if (status.includes("active")) {
    return <span className="font-semibold text-emerald-600 dark:text-emerald-400">{translatedStatus}</span>;
  }

  return <span>{translatedStatus}</span>;
}

export function LicenseFormModal({
  isOpen,
  mode,
  values,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
}) {
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
  const requiresExpiry = values.license_type === "Annual Subscription";

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
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">
              {isEdit ? t("Edit software license") : t("Add software license")}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {isEdit ? t("Update this software license's details.") : t("Create a new software license renewal record.")}
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
              <FormField label={t("Product Name *")} htmlFor="license-product-name">
                <input
                  id="license-product-name"
                  type="text"
                  required
                  autoComplete="off"
                  value={values.product_name}
                  onChange={(e) => onChange("product_name", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label={t("Product Type")} htmlFor="license-product-type">
                <input
                  id="license-product-type"
                  type="text"
                  autoComplete="off"
                  value={values.product_type}
                  onChange={(e) => onChange("product_type", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label={t("License Type *")} htmlFor="license-license-type">
                <RadioSelect
                  id="license-license-type"
                  options={[
                    { value: "Free", label: t("Free") },
                    { value: "Annual Subscription", label: t("Annual Subscription") },
                    { value: "Perpetual", label: t("Perpetual") },
                  ]}
                  value={values.license_type}
                  onSelect={(value) => onChange("license_type", value)}
                  placeholder={t("Select license type...")}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label={t("Date Start")} htmlFor="license-date-start">
                <input
                  id="license-date-start"
                  type="date"
                  value={values.date_start}
                  onChange={(e) => onChange("date_start", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField
                label={requiresExpiry ? t("Date Expire *") : t("Date Expire")}
                htmlFor="license-date-expire"
              >
                <input
                  id="license-date-expire"
                  type="date"
                  required={requiresExpiry}
                  value={values.date_expire}
                  onChange={(e) => onChange("date_expire", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting || !requiresExpiry}
                />
              </FormField>

              {!requiresExpiry && (
                <div className="sm:col-span-2 -mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {values.license_type === "Perpetual"
                    ? t("Perpetual licenses are bought once and never expire, so no expiry date is needed.")
                    : t("Free licenses are always active, so no expiry date is needed.")}
                </div>
              )}

              <div className="sm:col-span-2">
                <FormField label={t("Remark")} htmlFor="license-remark">
                  <textarea
                    id="license-remark"
                    rows={3}
                    value={values.remark}
                    onChange={(e) => onChange("remark", e.target.value)}
                    className={`${formInputClass} h-auto min-h-24 py-2`}
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
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-offset-slate-900"
            >
              {isSubmitting ? t("Saving...") : isEdit ? t("Save changes") : t("Add software license")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LicensesView({
  licenses,
  isLoading,
  error,
  onRetry,
  onAddNew,
  onEdit,
  onDelete,
  canCreate = true,
  canManage = true,
}) {
  const { t } = useTranslation();
  const statusCounts = useMemo(() => {
    const counts = { expired: 0, nearExpire: 0, active: 0 };
    licenses.forEach((license) => {
      const status = String(license.status || "").toLowerCase();
      if (status.includes("expired")) counts.expired += 1;
      else if (status.includes("near expire") || status.includes("expiring")) counts.nearExpire += 1;
      else if (status.includes("active")) counts.active += 1;
    });
    return counts;
  }, [licenses]);

  // License IDs aren't sequential (16, 17, 2, 1...), so hide that column and
  // number rows ourselves instead.
  const numberedLicenses = useMemo(
    () => licenses.map((license, index) => ({ ...license, _row_number: index + 1 })),
    [licenses]
  );
  const numberedColumns = useMemo(
    () => [{ key: "_row_number", label: "No." }, ...licenseColumns.filter((column) => column.key !== "license_id")],
    []
  );

  return (
    <RecordsTableView
      records={numberedLicenses}
      columnsConfig={numberedColumns}
      title={t("Software License")}
      recordLabel="software license"
      loadingText={t("Loading software licenses...")}
      errorTitle={t("Couldn't load software licenses")}
      emptyIcon={Key}
      emptyTitle={t("No software licenses found")}
      emptyDescription={t("Software license records will appear here.")}
      rowKey={(license, index) => license.license_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      hideRefresh
      headerActions={
        <>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-[13px] font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {t("expired_count", { count: statusCounts.expired })}
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-[13px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            {t("near_expire_count", { count: statusCounts.nearExpire })}
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[13px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {t("active_count", { count: statusCounts.active })}
          </span>
          {canCreate && (
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-offset-slate-900"
            >
              <PlusCircle size={15} />
              {t("Add Software License")}
            </button>
          )}
        </>
      }
      getRowClassName={(license) => {
        const info = getLicenseExpiryInfo(license);
        if (info?.isExpired) return "bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/20 dark:hover:bg-rose-950/30";
        if (info) return "bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30";
        return "";
      }}
      renderCell={(license, column) => {
        if (column.key === "status") return <LicenseStatusCell license={license} />;
        return <RecordCellValue value={license[column.key]} />;
      }}
      renderRowActions={
        canManage &&
        ((license) => (
          <div className="flex items-center justify-end">
            <RowActionsMenu
              items={[
                { icon: Edit2, label: t("Edit"), onClick: () => onEdit(license) },
                { icon: Trash2, label: t("Delete"), onClick: () => onDelete(license), destructive: true },
              ]}
            />
          </div>
        ))
      }
    />
  );
}

// Matches the "Plan optimize" capacity-planning sheet this data comes from —
// a grouped, spreadsheet-style header (Total Capacity/Usage/Reducing/After
// Reducing bands) instead of the app's usual flat column list, since that
// grouping is the whole point of this particular table. The header's own
// fixed light background is a deliberate design choice (like conditional
// formatting in the source sheet), not tied to the app's light/dark toggle.
const SERVER_USAGE_BASE_CELL =
  "border border-slate-200 bg-[#f9fbfc] px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-900";
const SERVER_USAGE_GROUP_CELL =
  "border border-slate-200 bg-[#f9fbfc] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-slate-900";
const SERVER_USAGE_FIELD_CELL = "border border-slate-200 bg-[#f9fbfc] px-3 py-1.5 text-center text-xs font-bold text-slate-900";
const SERVER_USAGE_UNIT_CELL = "border border-slate-200 bg-[#f9fbfc] px-3 py-1 text-center text-[10px] font-medium text-slate-500";
const SERVER_USAGE_DATA_CELL = "border border-slate-200 bg-white px-3 py-2 whitespace-nowrap text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";

const SERVER_USAGE_PAGE_SIZE = 15;

export function ServerUsageView({
  usage,
  isLoading,
  error,
  onRetry,
  onEdit,
  dateRange = { from: "", to: "" },
  onDateRangeChange,
  onClearDateRange,
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const hasActiveDateRange = Boolean(dateRange.from || dateRange.to);

  const filteredUsage = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return usage;
    return usage.filter((record) =>
      [record.device_name, record.ip_address, record.owner_name, record.due_date].some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );
  }, [usage, search]);

  // A new search means a whole new result set — start back on page 1 rather
  // than stranding the user on a page number that may no longer exist.
  // Adjusted during render (not an effect) per React's guidance for
  // resetting state when a prop/derived value changes.
  const [prevSearch, setPrevSearch] = useState(search);
  if (search !== prevSearch) {
    setPrevSearch(search);
    setPage(1);
  }
  const [prevDateRange, setPrevDateRange] = useState(dateRange);
  if (dateRange.from !== prevDateRange.from || dateRange.to !== prevDateRange.to) {
    setPrevDateRange(dateRange);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(filteredUsage.length / SERVER_USAGE_PAGE_SIZE));
  const paginatedUsage = filteredUsage.slice((page - 1) * SERVER_USAGE_PAGE_SIZE, page * SERVER_USAGE_PAGE_SIZE);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Server Usage")}</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                {t("usage_count", { count: filteredUsage.length })}
              </p>
            )}
          </div>
          {!isLoading && !error && usage.length > 0 && (
            <div className="relative w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
              <input
                id="server-usage-search"
                type="text"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Search...")}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-14 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:bg-slate-800 dark:focus:ring-slate-700"
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
          )}
        </div>

        {onDateRangeChange && (
          <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div>
              <label htmlFor="server-usage-from" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t("From")}
              </label>
              <input
                id="server-usage-from"
                type="date"
                autoComplete="off"
                value={dateRange.from}
                onChange={(e) => onDateRangeChange("from", e.target.value)}
                className={formInputClass}
              />
            </div>
            <div>
              <label htmlFor="server-usage-to" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t("To")}
              </label>
              <input
                id="server-usage-to"
                type="date"
                autoComplete="off"
                value={dateRange.to}
                onChange={(e) => onDateRangeChange("to", e.target.value)}
                className={formInputClass}
              />
            </div>
            {hasActiveDateRange && (
              <button
                type="button"
                onClick={onClearDateRange}
                className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
              >
                {t("Clear filters")}
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">{t("Loading server usage...")}</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t("Couldn't load server usage")}</p>
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
        ) : usage.length === 0 ? (
          <EmptyState icon={Activity} title={t("No server usage found")} description={t("Server usage records will appear here.")} />
        ) : filteredUsage.length === 0 ? (
          <EmptyState icon={Activity} title={t("No server usage found")} description={t("No server usage matches", { term: search })} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr>
                  <th rowSpan={3} className={SERVER_USAGE_BASE_CELL}>{t("No.")}</th>
                  <th rowSpan={3} className={SERVER_USAGE_BASE_CELL}>{t("Due Date")}</th>
                  <th rowSpan={3} className={SERVER_USAGE_BASE_CELL}>{t("Name")}</th>
                  <th rowSpan={3} className={SERVER_USAGE_BASE_CELL}>{t("IP Address")}</th>
                  <th colSpan={3} className={SERVER_USAGE_GROUP_CELL}>{t("Total Capacity")}</th>
                  <th colSpan={3} className={SERVER_USAGE_GROUP_CELL}>{t("Usage")}</th>
                  <th rowSpan={3} className={SERVER_USAGE_BASE_CELL}>{t("Owner")}</th>
                </tr>
                <tr>
                  <th className={SERVER_USAGE_FIELD_CELL}>{t("CPU")}</th>
                  <th className={SERVER_USAGE_FIELD_CELL}>{t("Memory")}</th>
                  <th className={SERVER_USAGE_FIELD_CELL}>{t("HDD")}</th>
                  <th className={SERVER_USAGE_FIELD_CELL}>{t("CPU")}</th>
                  <th className={SERVER_USAGE_FIELD_CELL}>{t("Memory")}</th>
                  <th className={SERVER_USAGE_FIELD_CELL}>{t("HDD")}</th>
                </tr>
                <tr>
                  {/* Usage's CPU/Memory are percentages in the real data, not
                      GB — labeled accurately here rather than copying the
                      sheet's "GB" for all three. */}
                  <th className={SERVER_USAGE_UNIT_CELL}>Core</th>
                  <th className={SERVER_USAGE_UNIT_CELL}>GB</th>
                  <th className={SERVER_USAGE_UNIT_CELL}>GB</th>
                  <th className={SERVER_USAGE_UNIT_CELL}>%</th>
                  <th className={SERVER_USAGE_UNIT_CELL}>%</th>
                  <th className={SERVER_USAGE_UNIT_CELL}>GB</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsage.map((record, index) => (
                  <tr
                    key={record.usage_id ?? index}
                    onClick={onEdit ? () => onEdit(record) : undefined}
                    className={
                      onEdit
                        ? "group relative cursor-pointer transition hover:z-10 hover:shadow-[0_1px_2px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.35)]"
                        : undefined
                    }
                  >
                    <td className={`${SERVER_USAGE_DATA_CELL} ${onEdit ? "group-hover:relative group-hover:z-10 group-hover:rounded-l-lg" : ""}`}>
                      {(page - 1) * SERVER_USAGE_PAGE_SIZE + index + 1}
                    </td>
                    <td className={SERVER_USAGE_DATA_CELL}>{formatFieldValue(record.due_date)}</td>
                    <td className={SERVER_USAGE_DATA_CELL}>{formatFieldValue(record.device_name)}</td>
                    <td className={SERVER_USAGE_DATA_CELL}>{formatFieldValue(record.ip_address)}</td>
                    <td className={SERVER_USAGE_DATA_CELL}>{formatFieldValue(record.cpu_core_total)}</td>
                    <td className={SERVER_USAGE_DATA_CELL}>{formatFieldValue(record.memory_gb_total)}</td>
                    <td className={SERVER_USAGE_DATA_CELL}>{formatFieldValue(record.hdd_gb_total)}</td>
                    <td className={SERVER_USAGE_DATA_CELL}>{formatFieldValue(record.cpu_usage_pct)}</td>
                    <td className={SERVER_USAGE_DATA_CELL}>{formatFieldValue(record.memory_usage_pct)}</td>
                    <td className={SERVER_USAGE_DATA_CELL}>{formatFieldValue(record.hdd_usage_gb)}</td>
                    <td className={`${SERVER_USAGE_DATA_CELL} ${onEdit ? "group-hover:relative group-hover:z-10 group-hover:rounded-r-lg" : ""}`}>
                      {formatFieldValue(record.owner_name)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && filteredUsage.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-[13px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span>
              {t("Showing")} {(page - 1) * SERVER_USAGE_PAGE_SIZE + 1}
              {"–"}
              {Math.min(page * SERVER_USAGE_PAGE_SIZE, filteredUsage.length)} {t("of")} {filteredUsage.length}
            </span>
            <Pagination currentPage={page} pageCount={pageCount} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}

// Any logged-in user with access to this page can update these 3 usage
// numbers via PATCH /api/server-usage/equipment/:equipment_id/usage — the
// "Total Capacity" numbers (cpu_core_total/memory_gb_total/hdd_gb_total)
// aren't part of this form; those still need an admin via the Configure/Add
// flow. The backend creates the usage row automatically the first time a
// server's usage is set through this form, so there's no separate "add" flow.
export function ServerUsageEditModal({ target, values, onChange, onSubmit, onClose, isSubmitting, error }) {
  const { t } = useTranslation();

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-label={t("Close")} />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Edit usage")}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {target.device_name || t("Update this server's usage numbers.")}
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
                {t(error)}
              </div>
            )}
            <div className="grid gap-4">
              <FormField label={t("CPU Usage (%)")} htmlFor="server-usage-cpu">
                <input
                  id="server-usage-cpu"
                  type="text"
                  autoComplete="off"
                  value={values.cpu_usage_pct}
                  onChange={(e) => onChange("cpu_usage_pct", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
              <FormField label={t("Memory Usage (%)")} htmlFor="server-usage-memory">
                <input
                  id="server-usage-memory"
                  type="text"
                  autoComplete="off"
                  value={values.memory_usage_pct}
                  onChange={(e) => onChange("memory_usage_pct", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
              <FormField label={t("HDD Usage (GB)")} htmlFor="server-usage-hdd">
                <input
                  id="server-usage-hdd"
                  type="text"
                  autoComplete="off"
                  value={values.hdd_usage_gb}
                  onChange={(e) => onChange("hdd_usage_gb", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
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
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-offset-slate-900"
            >
              {isSubmitting ? t("Saving...") : t("Save changes")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
