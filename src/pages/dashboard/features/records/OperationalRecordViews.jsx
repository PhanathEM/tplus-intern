import { useEffect, useMemo } from "react";
import {
  FiActivity as Activity,
  FiCloud as Cloud,
  FiDollarSign as DollarSign,
  FiHardDrive as HardDrive,
  FiKey as Key,
  FiPlusCircle as PlusCircle,
  FiRefreshCw as RefreshCw,
  FiShield as Shield,
  FiShoppingCart as ShoppingCart,
  FiX as X,
} from "react-icons/fi";
import {
  antivirusColumns,
  cloudRateColumns,
  cloudUsageColumns,
  licenseColumns,
  replacementColumns,
  serverUsageColumns,
  ssdProcurementColumns,
  ssdUpgradeColumns,
} from "../../dashboard.config";
import { getLicenseExpiryInfo } from "../../dashboard.notifications";
import { RecordCellValue, RecordsTableView } from "../../components/RecordsTableView";
import { FormField, formInputClass } from "../../components/SharedControls";

function LicenseStatusCell({ license }) {
  const status = String(license.status || "").toLowerCase();

  if (!status) return <span className="text-slate-400">N/A</span>;

  if (status.includes("expired")) {
    return <span className="font-semibold text-rose-600">{license.status}</span>;
  }

  if (status.includes("near expire") || status.includes("expiring")) {
    return <span className="font-semibold text-amber-600">{license.status}</span>;
  }

  if (status.includes("active")) {
    return <span className="font-semibold text-emerald-600">{license.status}</span>;
  }

  return <span>{license.status}</span>;
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
        aria-label="Close"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">
              {isEdit ? "Edit software license" : "Add software license"}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {isEdit ? "Update this software license's details." : "Create a new software license renewal record."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Product Name *" htmlFor="license-product-name">
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

              <FormField label="Product Type" htmlFor="license-product-type">
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

              <FormField label="License Type *" htmlFor="license-license-type">
                <select
                  id="license-license-type"
                  required
                  autoComplete="off"
                  value={values.license_type}
                  onChange={(e) => onChange("license_type", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                >
                  <option value="Free">Free</option>
                  <option value="Annual Subscription">Annual Subscription</option>
                  <option value="Perpetual">Perpetual</option>
                </select>
              </FormField>

              <FormField label="Date Start" htmlFor="license-date-start">
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
                label={requiresExpiry ? "Date Expire *" : "Date Expire"}
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
                <div className="sm:col-span-2 -mt-2 text-xs text-slate-500">
                  {values.license_type === "Perpetual"
                    ? "Perpetual licenses are bought once and never expire, so no expiry date is needed."
                    : "Free licenses are always active, so no expiry date is needed."}
                </div>
              )}

              <div className="sm:col-span-2">
                <FormField label="Remark" htmlFor="license-remark">
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

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add software license"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ReplacementsView({ replacements, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={replacements}
      columnsConfig={replacementColumns}
      title="Device replacements"
      recordLabel="replacement"
      loadingText="Loading replacements..."
      errorTitle="Couldn't load replacements"
      emptyIcon={RefreshCw}
      emptyTitle="No replacements found"
      emptyDescription="Replacement records will appear here."
      rowKey={(replacement, index) => replacement.replacement_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

export function SsdUpgradesView({ upgrades, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={upgrades}
      columnsConfig={ssdUpgradeColumns}
      title="SSD upgrades"
      recordLabel="SSD upgrade"
      loadingText="Loading SSD upgrades..."
      errorTitle="Couldn't load SSD upgrades"
      emptyIcon={HardDrive}
      emptyTitle="No SSD upgrades found"
      emptyDescription="SSD upgrade records will appear here."
      rowKey={(upgrade, index) => upgrade.upgrade_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

export function SsdProcurementView({ procurements, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={procurements}
      columnsConfig={ssdProcurementColumns}
      title="SSD procurement"
      recordLabel="procurement"
      loadingText="Loading SSD procurement..."
      errorTitle="Couldn't load SSD procurement"
      emptyIcon={ShoppingCart}
      emptyTitle="No SSD procurement found"
      emptyDescription="SSD procurement records will appear here."
      rowKey={(procurement, index) => procurement.procurement_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

export function AntivirusView({ installs, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={installs}
      columnsConfig={antivirusColumns}
      title="Antivirus installs"
      recordLabel="install"
      loadingText="Loading antivirus installs..."
      errorTitle="Couldn't load antivirus installs"
      emptyIcon={Shield}
      emptyTitle="No antivirus installs found"
      emptyDescription="Antivirus install records will appear here."
      rowKey={(install, index) => install.install_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
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

  return (
    <RecordsTableView
      records={licenses}
      columnsConfig={licenseColumns}
      title="Software Licenses"
      recordLabel="software license"
      loadingText="Loading software licenses..."
      errorTitle="Couldn't load software licenses"
      emptyIcon={Key}
      emptyTitle="No software licenses found"
      emptyDescription="Software license records will appear here."
      rowKey={(license, index) => license.license_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      headerActions={
        <>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-[13px] font-semibold text-rose-700">
            {statusCounts.expired} expired
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-[13px] font-semibold text-amber-700">
            {statusCounts.nearExpire} near expire
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[13px] font-semibold text-emerald-700">
            {statusCounts.active} active
          </span>
          {canCreate && (
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <PlusCircle size={15} />
              Add Software License
            </button>
          )}
        </>
      }
      getRowClassName={(license) => {
        const info = getLicenseExpiryInfo(license);
        if (info?.isExpired) return "bg-rose-50/50 hover:bg-rose-50";
        if (info) return "bg-amber-50/50 hover:bg-amber-50";
        return "";
      }}
      renderCell={(license, column) => {
        if (column.key === "status") return <LicenseStatusCell license={license} />;
        return <RecordCellValue value={license[column.key]} />;
      }}
      renderRowActions={
        canManage &&
        ((license) => (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onEdit(license)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(license)}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 outline-none transition hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Delete
            </button>
          </div>
        ))
      }
    />
  );
}

export function CloudRatesView({ rates, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={rates}
      columnsConfig={cloudRateColumns}
      title="Cloud rates"
      recordLabel="rate"
      loadingText="Loading cloud rates..."
      errorTitle="Couldn't load cloud rates"
      emptyIcon={DollarSign}
      emptyTitle="No cloud rates found"
      emptyDescription="Cloud rate records will appear here."
      rowKey={(rate, index) => rate.rate_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

export function ServerUsageView({ usage, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={usage}
      columnsConfig={serverUsageColumns}
      title="Service usage"
      recordLabel="usage"
      loadingText="Loading service usage..."
      errorTitle="Couldn't load service usage"
      emptyIcon={Activity}
      emptyTitle="No service usage found"
      emptyDescription="Service usage records will appear here."
      rowKey={(record, index) => record.usage_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

export function CloudUsageView({ usage, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={usage}
      columnsConfig={cloudUsageColumns}
      title="Cloud usage"
      recordLabel="usage record"
      loadingText="Loading cloud usage..."
      errorTitle="Couldn't load cloud usage"
      emptyIcon={Cloud}
      emptyTitle="No cloud usage found"
      emptyDescription="Cloud usage records will appear here."
      rowKey={(record, index) => record.usage_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}
