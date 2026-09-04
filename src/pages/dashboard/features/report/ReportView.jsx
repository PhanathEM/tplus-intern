import { useTranslation } from "react-i18next";
import {
  FiAlertTriangle as AlertTriangle,
  FiBarChart2 as BarChartIcon,
  FiDownload as Download,
  FiFileText as FileText,
  FiRefreshCw as RefreshCw,
} from "react-icons/fi";
import { EmptyState } from "../../components/SharedControls";

function getCountByLabel(rows, label) {
  return rows.find((row) => row.label === label)?.count || 0;
}

// Picks black or white text for a given hex background using relative
// luminance, so a light header color (like yellow) doesn't end up with
// unreadable white-on-yellow text.
function getReadableTextTone(hex) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  if (!match) return "light";
  const [r, g, b] = match.slice(1).map((part) => parseInt(part, 16) / 255);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? "dark" : "light";
}

// Icon-only export action sized to sit inside a panel's coloured header
// without competing with the title — the label rides in the tooltip.
function PanelExportButton({ icon: Icon, label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-950/10 text-slate-950 outline-none transition hover:bg-slate-950/20 focus-visible:ring-2 focus-visible:ring-slate-950/40 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon size={14} className="block" />
    </button>
  );
}

function ReportPanel({ title, total, totalLabel, headerColor, headerTextTone, headerActions, children }) {
  const textTone = headerColor ? headerTextTone || getReadableTextTone(headerColor) : null;
  const isDarkText = textTone === "dark";

  return (
    <div className="mb-4 break-inside-avoid overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div
        className={`flex items-center justify-between gap-3 px-5 py-4 ${headerColor ? "" : "border-b border-slate-100 dark:border-slate-800"}`}
        style={headerColor ? { backgroundColor: headerColor } : undefined}
      >
        <h3
          className={`text-[15px] font-semibold ${headerColor ? (isDarkText ? "text-slate-950" : "text-white") : "text-slate-950 dark:text-white"
            }`}
        >
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {headerActions}
          {typeof total === "number" && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${headerColor
                ? isDarkText
                  ? "bg-slate-950/10 text-slate-950"
                  : "bg-white/20 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
            >
              {totalLabel}: {total.toLocaleString()}
            </span>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

// Only for numbers worth calling out — everything else stays neutral so a
// highlight actually draws the eye when it's used.
const ROW_TONE_CLASS = {
  danger: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  success: "bg-[#00c16a]/10 text-[#00c16a] dark:bg-[#00c16a]/15",
};

function MetricRows({ rows, labelHeader, valueLabel, headerHighlight, t }) {
  if (rows.length === 0) {
    return <p className="px-5 py-6 text-center text-[13px] text-slate-400 dark:text-slate-500">{t("No data yet.")}</p>;
  }
  const isHighlightDark = headerHighlight && getReadableTextTone(headerHighlight) === "dark";
  const pillClass = headerHighlight
    ? `inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal leading-normal ${isHighlightDark ? "text-slate-950" : "text-white"
    }`
    : "";
  return (
    <div className="divide-y divide-slate-50 dark:divide-slate-800">
      <div className="flex items-center justify-between px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        <span className={pillClass} style={headerHighlight ? { backgroundColor: headerHighlight } : undefined}>
          {labelHeader || t("Label")}
        </span>
        <span className={pillClass} style={headerHighlight ? { backgroundColor: headerHighlight } : undefined}>
          {valueLabel || t("Count")}
        </span>
      </div>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between px-5 py-2.5 text-[13px]">
          <span className="text-slate-700 dark:text-slate-300">{row.label}</span>
          {row.tone && row.count > 0 ? (
            <span className={`rounded-full px-2 py-0.5 font-semibold tabular-nums ${ROW_TONE_CLASS[row.tone]}`}>
              {row.count.toLocaleString()}
            </span>
          ) : (
            <span className="font-semibold tabular-nums text-slate-950 dark:text-white">{row.count.toLocaleString()}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function DepartmentRows({ rows, headerHighlight, t }) {
  if (rows.length === 0) {
    return <p className="px-5 py-6 text-center text-[13px] text-slate-400 dark:text-slate-500">{t("No data yet.")}</p>;
  }
  const isHighlightDark = headerHighlight && getReadableTextTone(headerHighlight) === "dark";
  const pillClass = headerHighlight
    ? `inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal leading-normal ${isHighlightDark ? "text-slate-950" : "text-white"
    }`
    : "";
  const pillStyle = headerHighlight ? { backgroundColor: headerHighlight } : undefined;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-left text-[13px] dark:divide-slate-800">
        <thead className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <tr>
            <th className="px-5 py-2.5 font-semibold">
              <span className={pillClass} style={pillStyle}>{t("Department")}</span>
            </th>
            <th className="px-5 py-2.5 font-semibold">
              <span className={pillClass} style={pillStyle}>{t("Employees")}</span>
            </th>
            <th className="px-5 py-2.5 font-semibold">
              <span className={pillClass} style={pillStyle}>{t("Equipment")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="px-5 py-2.5 font-medium text-slate-800 dark:text-slate-200">{row.label}</td>
              <td className="px-5 py-2.5 tabular-nums text-slate-600 dark:text-slate-300">{row.employeeCount.toLocaleString()}</td>
              <td className="px-5 py-2.5 tabular-nums text-slate-600 dark:text-slate-300">{row.equipmentCount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReportView({
  report,
  isLoading,
  error,
  onRetry,
  onDownloadPdf,
  onDownloadExcel,
  isExportingPdf,
  isExportingExcel,
  onDownloadEmployeesPdf,
  onDownloadEmployeesExcel,
  isDownloadingEmployeesPdf,
  isDownloadingEmployeesExcel,
  onDownloadDepartmentsPdf,
  onDownloadDepartmentsExcel,
  onDownloadEquipmentPdf,
  onDownloadEquipmentExcel,
  isDownloadingEquipmentPdf,
  isDownloadingEquipmentExcel,
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="sticky top-14 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2 dark:bg-slate-900 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Report")}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isLoading || Boolean(error) || isExportingPdf}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
          >
            <FileText size={14} />
            {isExportingPdf ? t("Preparing PDF...") : t("Download PDF")}
          </button>
          <button
            type="button"
            onClick={onDownloadExcel}
            disabled={isLoading || Boolean(error) || isExportingExcel}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
          >
            <Download size={14} />
            {isExportingExcel ? t("Preparing Excel...") : t("Download Excel")}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-[13px] text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          {t("Loading report...")}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t("Couldn't load the report")}</p>
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
        </div>
      ) : (
        <>
          <div className="columns-1 gap-4 lg:columns-2">
            <ReportPanel
              title={t("Employees")}
              total={report.employees.total}
              totalLabel={t("Total")}
              headerColor="#fddd1c"
              headerTextTone="dark"
              headerActions={
                <>
                  <PanelExportButton
                    icon={FileText}
                    label={isDownloadingEmployeesPdf ? t("Preparing PDF...") : t("Download PDF")}
                    onClick={onDownloadEmployeesPdf}
                    disabled={isLoading || Boolean(error) || isDownloadingEmployeesPdf}
                  />
                  <PanelExportButton
                    icon={Download}
                    label={isDownloadingEmployeesExcel ? t("Preparing Excel...") : t("Download Excel")}
                    onClick={onDownloadEmployeesExcel}
                    disabled={isLoading || Boolean(error) || isDownloadingEmployeesExcel}
                  />
                </>
              }
            >
              <MetricRows
                labelHeader={t("Gender")}
                headerHighlight="#fddd1c"
                rows={[
                  { label: t("Unspecified"), count: getCountByLabel(report.employees.bySex, "Unspecified") },
                  { label: t("Male"), count: getCountByLabel(report.employees.bySex, "Male") },
                  { label: t("Female"), count: getCountByLabel(report.employees.bySex, "Female") },
                ]}
                t={t}
              />
            </ReportPanel>
            <ReportPanel
              title={t("Departments")}
              total={report.departments.total}
              totalLabel={t("Total")}
              headerColor="#fddd1c"
              headerActions={
                <>
                  <PanelExportButton
                    icon={FileText}
                    label={t("Download PDF")}
                    onClick={onDownloadDepartmentsPdf}
                    disabled={isLoading || Boolean(error)}
                  />
                  <PanelExportButton
                    icon={Download}
                    label={t("Download Excel")}
                    onClick={onDownloadDepartmentsExcel}
                    disabled={isLoading || Boolean(error)}
                  />
                </>
              }
            >
              <DepartmentRows rows={report.departments.rows} headerHighlight="#fddd1c" t={t} />
            </ReportPanel>
            <ReportPanel title={t("Replacement")} headerColor="#fddd1c">
              <MetricRows
                labelHeader={t("Replacement")}
                headerHighlight="#fddd1c"
                rows={[
                  { label: t("Stock of Replace a Part"), count: report.partStock.lineCount },
                  { label: t("Borrow a Part"), count: report.partBorrow.current },
                  { label: t("Device Replacement"), count: report.replacement.total },
                  { label: t("Device Replacement History"), count: report.replacement.total },
                ]}
                t={t}
              />
            </ReportPanel>
            <ReportPanel
              title={t("Software License")}
              total={report.licenses.total}
              totalLabel={t("Total")}
              headerColor="#fddd1c"
            >
              <MetricRows rows={report.licenses.byStatus} labelHeader={t("Status")} headerHighlight="#fddd1c" t={t} />
            </ReportPanel>
            <ReportPanel
              title={t("Equipments")}
              total={report.equipment.total}
              totalLabel={t("Total")}
              headerColor="#fddd1c"
              headerActions={
                <>
                  <PanelExportButton
                    icon={FileText}
                    label={isDownloadingEquipmentPdf ? t("Preparing PDF...") : t("Download PDF")}
                    onClick={onDownloadEquipmentPdf}
                    disabled={isLoading || Boolean(error) || isDownloadingEquipmentPdf}
                  />
                  <PanelExportButton
                    icon={Download}
                    label={isDownloadingEquipmentExcel ? t("Preparing Excel...") : t("Download Excel")}
                    onClick={onDownloadEquipmentExcel}
                    disabled={isLoading || Boolean(error) || isDownloadingEquipmentExcel}
                  />
                </>
              }
            >
              <MetricRows rows={report.equipment.byStatus} labelHeader={t("Status")} headerHighlight="#fddd1c" t={t} />
              <MetricRows rows={report.equipment.byCategory} labelHeader={t("Category")} headerHighlight="#fddd1c" t={t} />
              <MetricRows
                labelHeader={t("Assign")}
                headerHighlight="#fddd1c"
                rows={[
                  { label: t("Assigned"), count: getCountByLabel(report.equipment.byAssignment, "Assigned") },
                  { label: t("Unassigned"), count: getCountByLabel(report.equipment.byAssignment, "Unassigned") },
                ]}
                t={t}
              />
              <MetricRows
                labelHeader={t("Currently Borrowed")}
                headerHighlight="#fddd1c"
                rows={[
                  { label: t("Currently Borrowed"), count: report.borrow.currentlyBorrowed },
                  { label: t("Overdue"), count: report.borrow.overdue, tone: "danger" },
                ]}
                t={t}
              />
              <MetricRows
                labelHeader={t("Borrow History")}
                headerHighlight="#fddd1c"
                rows={[{ label: t("Total"), count: report.borrow.historyTotal }]}
                t={t}
              />
            </ReportPanel>
            <ReportPanel title={t("Server Usage")} headerColor="#fddd1c">
              <MetricRows
                labelHeader={t("Server Usage")}
                headerHighlight="#fddd1c"
                rows={[{ label: t("Total"), count: report.serverUsage.total }]}
                t={t}
              />
            </ReportPanel>
          </div>

          {report.employees.total === 0 && report.equipment.total === 0 && (
            <EmptyState icon={BarChartIcon} title={t("No data yet")} description={t("Once your data is entered, this report fills in automatically.")} />
          )}
        </>
      )}
    </div>
  );
}
