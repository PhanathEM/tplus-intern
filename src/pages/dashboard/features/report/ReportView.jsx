import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiAlertTriangle as AlertTriangle,
  FiBarChart2 as BarChartIcon,
  FiDownload as Download,
  FiFileText as FileText,
  FiRefreshCw as RefreshCw,
  FiX as X,
} from "react-icons/fi";
import { EmptyState } from "../../components/SharedControls";
import { getLicenseExpiryInfo } from "../../dashboard.notifications";
import { getEquipmentGroup } from "./useReport";
import {
  formatFieldValue,
  getEquipmentDisplayName,
  humanizeFieldKey,
  matchesEmployeeDepartment,
  matchesEquipmentDepartment,
} from "../../dashboard.utils";

// The panels this page is made of, in the order they appear. Doubles as the
// header subtitle, so the list and the page cannot fall out of step.
const REPORT_SECTIONS = [
  "Employees",
  "Departments",
  "Replacement",
  "Software License",
  "Managements",
  "Equipments",
  "Server Usage",
];

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

// Export action sized to sit inside a panel's coloured header without
// competing with the title. `text` names the format on the button itself; the
// longer wording ("Download PDF", "Preparing PDF...") stays in the tooltip.
function PanelExportButton({ icon: Icon, label, text, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg bg-slate-950/10 px-2.5 text-xs font-semibold text-slate-950 outline-none transition hover:bg-slate-950/20 focus-visible:ring-2 focus-visible:ring-slate-950/40 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon size={14} className="block" />
      {text}
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

const HIDDEN_DETAIL_KEYS = /(^_)|(_id$)|^id$/;

// The Replacement lists each have their own shape - stock lines carry
// per-part-type fields - so their columns are read off the rows rather than
// declared. Capped at six so the popup stays readable.
function autoDetailColumns(rows, limit = 6) {
  const keys = [];
  rows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => {
      if (!HIDDEN_DETAIL_KEYS.test(key) && !keys.includes(key)) keys.push(key);
    });
  });
  return keys.slice(0, limit).map((key) => ({ key, label: humanizeFieldKey(key) }));
}

function toDetailRows(rows, columns) {
  return rows.map((row, index) => {
    const shaped = { id: row.equipment_id ?? row.replacement_id ?? row.borrow_id ?? row.license_id ?? index };
    columns.forEach((column) => {
      shaped[column.key] = formatFieldValue(row[column.key]);
    });
    return shaped;
  });
}

// The two record shapes the popup can show, flattened to the column keys.
function toEmployeeRow(employee) {
  return {
    id: employee.employee_id,
    full_name: employee.full_name,
    position: employee.position,
    phone: employee.phone,
  };
}

function toEquipmentRow(item) {
  return {
    id: item.equipment_id,
    device: getEquipmentDisplayName(item),
    category: item.category_name || item.category,
    asset_code: item.asset_code,
    owner: item.owner_name,
  };
}

// The list behind one breakdown row, with its exports at the bottom - the
// numbers alone don't say who is in the group.
function GroupDetailModal({ title, sections, onClose }) {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState(sections[0]?.key);
  const active = sections.find((section) => section.key === activeKey) || sections[0];

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const headCell =
    "whitespace-nowrap border-y border-slate-100 px-5 py-2 text-left font-semibold uppercase leading-none tracking-wide dark:border-slate-800";
  const cell = "whitespace-nowrap border-b border-slate-50 px-5 py-2 dark:border-slate-800/60";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="animate-modal-backdrop absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label={t("Close")}
      />
      <div className="animate-modal-panel relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-950 dark:text-white">{title}</h3>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{active.countLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close")}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-slate-200 leading-none text-slate-500 outline-none transition hover:border-slate-300 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            <X size={15} className="block" />
          </button>
        </div>

        {/* Only shown when a row really has two sides to it - the gender rows
            pass a single section and get no tab bar. */}
        {sections.length > 1 && (
          <div className="flex items-center gap-1 border-b border-slate-100 px-4 pt-3 dark:border-slate-800">
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveKey(section.key)}
                className={`relative rounded-t-lg border px-4 py-2 text-[13px] font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${section.key === active.key
                  ? "-mb-px border-slate-200 border-b-transparent bg-white text-slate-900 dark:border-slate-800 dark:border-b-transparent dark:bg-slate-900 dark:text-white"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                  }`}
              >
                {section.label} ({section.rows.length})
              </button>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto">
          {active.rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-slate-400 dark:text-slate-500">
              {active.emptyText}
            </p>
          ) : (
            <table className="min-w-full border-separate border-spacing-0 text-left text-[13px]">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  {active.columns.map((column) => (
                    <th key={column.key} className={headCell}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {active.rows.map((row, index) => (
                  <tr key={row.id ?? index}>
                    {active.columns.map((column, columnIndex) => (
                      <td
                        key={column.key}
                        className={`${cell} ${columnIndex === 0
                          ? "font-semibold text-slate-950 dark:text-white"
                          : "text-slate-600 dark:text-slate-300"
                          }`}
                      >
                        {row[column.key] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
          >
            {t("Close")}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={active.onPdf}
              disabled={active.isPdfBusy || active.rows.length === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-4 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText size={14} className="block" />
              {active.isPdfBusy ? t("Preparing PDF...") : t("PDF")}
            </button>
            <button
              type="button"
              onClick={active.onExcel}
              disabled={active.isExcelBusy || active.rows.length === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-4 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={14} className="block" />
              {active.isExcelBusy ? t("Preparing Excel...") : t("Excel")}
            </button>
          </div>
        </div>
      </div>
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

function MetricRows({ rows, labelHeader, valueLabel, headerHighlight, onRowClick, t }) {
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
      {rows.map((row) => {
        const content = (
          <>
            <span className="text-slate-700 dark:text-slate-300">{row.label}</span>
            <span className="flex items-center gap-2">
              {row.tone && row.count > 0 ? (
                <span className={`rounded-full px-2 py-0.5 font-semibold tabular-nums ${ROW_TONE_CLASS[row.tone]}`}>
                  {row.count.toLocaleString()}
                </span>
              ) : (
                <span className="font-semibold tabular-nums text-slate-950 dark:text-white">
                  {row.count.toLocaleString()}
                </span>
              )}
            </span>
          </>
        );

        // A clickable row becomes a real button so it keeps keyboard focus and
        // Enter/Space; the plain rows stay as divs.
        return onRowClick ? (
          <button
            key={row.label}
            type="button"
            onClick={() => onRowClick(row)}
            className="flex w-full items-center justify-between gap-3 px-5 py-2.5 text-left text-[13px] outline-none transition hover:bg-slate-50 focus-visible:bg-slate-50 dark:hover:bg-slate-800/60 dark:focus-visible:bg-slate-800/60"
          >
            {content}
          </button>
        ) : (
          <div key={row.label} className="flex items-center justify-between gap-3 px-5 py-2.5 text-[13px]">
            {content}
          </div>
        );
      })}
    </div>
  );
}

function DepartmentRows({ rows, headerHighlight, onRowClick, t }) {
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
            <tr
              key={row.label}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? "cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/60" : undefined}
            >
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
  onDownloadEmployeesPdf,
  onDownloadEmployeesExcel,
  isDownloadingEmployeesPdf,
  isDownloadingEmployeesExcel,
  onDownloadEmployeesBySexPdf,
  onDownloadEmployeesBySexExcel,
  downloadingSex,
  onDownloadReplacementPdf,
  onDownloadReplacementExcel,
  onDownloadReplacementsPdf,
  onDownloadReplacementsExcel,
  downloadingReplacement,
  onDownloadLicenseByStatusPdf,
  onDownloadLicenseByStatusExcel,
  onDownloadLicensesPdf,
  onDownloadLicensesExcel,
  downloadingLicense,
  onDownloadManagementPdf,
  onDownloadManagementExcel,
  onDownloadManagementsPdf,
  onDownloadManagementsExcel,
  downloadingManagement,
  onDownloadDepartmentsPdf,
  onDownloadDepartmentsExcel,
  onDownloadDepartmentEmployeesPdf,
  onDownloadDepartmentEmployeesExcel,
  onDownloadDepartmentEquipmentPdf,
  onDownloadDepartmentEquipmentExcel,
  downloadingDepartment,
  onDownloadEquipmentPdf,
  onDownloadEquipmentExcel,
  isDownloadingEquipmentPdf,
  isDownloadingEquipmentExcel,
  onDownloadEquipmentGroupPdf,
  onDownloadEquipmentGroupExcel,
  downloadingEquipmentGroup,
  onDownloadServerUsagePdf,
  onDownloadServerUsageExcel,
  downloadingServerUsage,
}) {
  const { t } = useTranslation();
  // Which gender row is open, if any.
  const [genderDetail, setGenderDetail] = useState(null);

  const [departmentDetail, setDepartmentDetail] = useState(null);

  const departmentEmployees = departmentDetail
    ? report.employees.list.filter(matchesEmployeeDepartment(departmentDetail))
    : [];

  const departmentEquipment = departmentDetail
    ? report.equipment.list.filter(matchesEquipmentDepartment(departmentDetail))
    : [];

  const departmentKey = departmentDetail
    ? departmentDetail.code || departmentDetail.name || departmentDetail.label
    : "";

  const [replacementDetail, setReplacementDetail] = useState(null);

  const replacementListByKey = {
    partStock: report.partStock.list,
    partBorrow: report.partBorrow.list,
    deviceReplacement: report.replacement.list,
    replacementHistory: report.replacement.list,
  };

  const replacementRows = replacementDetail ? replacementListByKey[replacementDetail.key] || [] : [];
  const replacementColumns = autoDetailColumns(replacementRows);

  const [licenseDetail, setLicenseDetail] = useState(null);

  // Bucketed by the label the panel shows, which comes from the expiry check
  // rather than the raw status field - the same rule the export uses.
  const licenseRows = licenseDetail
    ? report.licenses.list.filter(
      (license) => (getLicenseExpiryInfo(license)?.label || license.status) === licenseDetail.label
    )
    : [];
  const licenseColumns = autoDetailColumns(licenseRows);

  const [managementDetail, setManagementDetail] = useState(null);

  // Each Managements row carries the key of the list behind it, so the popup
  // reads that list straight off the report - the same lists the exports use.
  const managementRows = managementDetail ? report.managements.lists[managementDetail.key] || [] : [];
  const managementColumns = autoDetailColumns(managementRows);

  const employeeColumns = [
    { key: "full_name", label: t("Full Name") },
    { key: "position", label: t("Position") },
    { key: "phone", label: t("Phone") },
  ];

  const equipmentColumns = [
    { key: "device", label: t("Device") },
    { key: "category", label: t("Category") },
    { key: "asset_code", label: t("Asset Code") },
    { key: "owner", label: t("Owner") },
  ];

  // Which Equipments row is open. The group resolver decides what sits behind
  // it, so the popup and the export cannot drift apart.
  const [equipmentDetail, setEquipmentDetail] = useState(null);
  const equipmentGroup = equipmentDetail ? getEquipmentGroup(report, equipmentDetail) : null;
  // Devices get the same four columns the Departments popup shows; the borrow
  // groups are read off their own rows, like Replacement and Software License.
  const equipmentGroupColumns = !equipmentGroup
    ? []
    : equipmentGroup.isEquipment
      ? equipmentColumns
      : autoDetailColumns(equipmentGroup.rows);
  const equipmentGroupRows = !equipmentGroup
    ? []
    : equipmentGroup.isEquipment
      ? equipmentGroup.rows.map(toEquipmentRow)
      : toDetailRows(equipmentGroup.rows, equipmentGroupColumns);

  const [serverUsageDetail, setServerUsageDetail] = useState(null);
  const serverUsageColumns = autoDetailColumns(report.serverUsage.list);

  const genderEmployees = genderDetail
    ? report.employees.list.filter((employee) => (employee.sex || "Unspecified") === genderDetail.key)
    : [];

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="sticky top-14 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2 dark:bg-slate-900 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Report")}</h2>
          {!isLoading && !error && (
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {REPORT_SECTIONS.map((section) => t(section)).join(", ")}
            </p>
          )}
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
                    text={t("PDF")}
                    label={isDownloadingEmployeesPdf ? t("Preparing PDF...") : t("Download PDF")}
                    onClick={onDownloadEmployeesPdf}
                    disabled={isLoading || Boolean(error) || isDownloadingEmployeesPdf}
                  />
                  <PanelExportButton
                    icon={Download}
                    text={t("Excel")}
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
                  { key: "Unspecified", label: t("Unspecified"), count: getCountByLabel(report.employees.bySex, "Unspecified") },
                  { key: "Male", label: t("Male"), count: getCountByLabel(report.employees.bySex, "Male") },
                  { key: "Female", label: t("Female"), count: getCountByLabel(report.employees.bySex, "Female") },
                ]}
                onRowClick={setGenderDetail}
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
                    text={t("PDF")}
                    label={t("Download PDF")}
                    onClick={onDownloadDepartmentsPdf}
                    disabled={isLoading || Boolean(error)}
                  />
                  <PanelExportButton
                    icon={Download}
                    text={t("Excel")}
                    label={t("Download Excel")}
                    onClick={onDownloadDepartmentsExcel}
                    disabled={isLoading || Boolean(error)}
                  />
                </>
              }
            >
              <DepartmentRows
                rows={report.departments.rows}
                headerHighlight="#fddd1c"
                onRowClick={setDepartmentDetail}
                t={t}
              />
            </ReportPanel>
            <ReportPanel
              title={t("Replacement")}
              headerColor="#fddd1c"
              headerActions={
                <>
                  <PanelExportButton
                    icon={FileText}
                    text={t("PDF")}
                    label={t("Download PDF")}
                    onClick={onDownloadReplacementsPdf}
                    disabled={isLoading || Boolean(error)}
                  />
                  <PanelExportButton
                    icon={Download}
                    text={t("Excel")}
                    label={t("Download Excel")}
                    onClick={onDownloadReplacementsExcel}
                    disabled={isLoading || Boolean(error)}
                  />
                </>
              }
            >
              <MetricRows
                labelHeader={t("Replacement")}
                headerHighlight="#fddd1c"
                rows={[
                  { key: "partStock", label: t("Stock of Replace a Part"), count: report.partStock.lineCount },
                  { key: "partBorrow", label: t("Borrow a Part"), count: report.partBorrow.current },
                  { key: "deviceReplacement", label: t("Device Replacement"), count: report.replacement.total },
                  { key: "replacementHistory", label: t("Device Replacement History"), count: report.replacement.total },
                ]}
                onRowClick={setReplacementDetail}
                t={t}
              />
            </ReportPanel>
            <ReportPanel
              title={t("Software License")}
              total={report.licenses.total}
              totalLabel={t("Total")}
              headerColor="#fddd1c"
              headerActions={
                <>
                  <PanelExportButton
                    icon={FileText}
                    text={t("PDF")}
                    label={t("Download PDF")}
                    onClick={onDownloadLicensesPdf}
                    disabled={isLoading || Boolean(error)}
                  />
                  <PanelExportButton
                    icon={Download}
                    text={t("Excel")}
                    label={t("Download Excel")}
                    onClick={onDownloadLicensesExcel}
                    disabled={isLoading || Boolean(error)}
                  />
                </>
              }
            >
              <MetricRows
                rows={report.licenses.byStatus}
                labelHeader={t("Status")}
                headerHighlight="#fddd1c"
                onRowClick={setLicenseDetail}
                t={t}
              />
            </ReportPanel>
            <ReportPanel
              title={t("Managements")}
              headerColor="#fddd1c"
              headerActions={
                <>
                  <PanelExportButton
                    icon={FileText}
                    text={t("PDF")}
                    label={t("Download PDF")}
                    onClick={onDownloadManagementsPdf}
                    disabled={isLoading || Boolean(error)}
                  />
                  <PanelExportButton
                    icon={Download}
                    text={t("Excel")}
                    label={t("Download Excel")}
                    onClick={onDownloadManagementsExcel}
                    disabled={isLoading || Boolean(error)}
                  />
                </>
              }
            >
              <MetricRows
                labelHeader={t("Managements")}
                headerHighlight="#fddd1c"
                rows={[
                  { key: "statuses", label: t("Equipment Statuses"), count: report.managements.statuses },
                  { key: "partStatuses", label: t("Part Types Statuses"), count: report.managements.partStatuses },
                  { key: "categories", label: t("Category"), count: report.managements.categories },
                  { key: "partTypes", label: t("Part Types of Stock"), count: report.managements.partTypes },
                ]}
                onRowClick={setManagementDetail}
                t={t}
              />
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
              <MetricRows
                rows={report.equipment.byStatus}
                labelHeader={t("Status")}
                headerHighlight="#fddd1c"
                onRowClick={(row) => setEquipmentDetail({ group: "status", label: row.label })}
                t={t}
              />
              <MetricRows
                rows={report.equipment.byCategory}
                labelHeader={t("Category")}
                headerHighlight="#fddd1c"
                onRowClick={(row) => setEquipmentDetail({ group: "category", label: row.label })}
                t={t}
              />
              <MetricRows
                labelHeader={t("Assign")}
                headerHighlight="#fddd1c"
                rows={[
                  { key: "assigned", label: t("Assigned"), count: getCountByLabel(report.equipment.byAssignment, "Assigned") },
                  { key: "unassigned", label: t("Unassigned"), count: getCountByLabel(report.equipment.byAssignment, "Unassigned") },
                ]}
                onRowClick={(row) => setEquipmentDetail({ group: row.key, label: row.label })}
                t={t}
              />
              <MetricRows
                labelHeader={t("Currently Borrowed")}
                headerHighlight="#fddd1c"
                rows={[
                  { key: "borrowed", label: t("Currently Borrowed"), count: report.borrow.currentlyBorrowed },
                  { key: "overdue", label: t("Overdue"), count: report.borrow.overdue, tone: "danger" },
                ]}
                onRowClick={(row) => setEquipmentDetail({ group: row.key, label: row.label })}
                t={t}
              />
              <MetricRows
                labelHeader={t("Borrow History")}
                headerHighlight="#fddd1c"
                rows={[{ label: t("Total"), count: report.borrow.historyTotal }]}
                onRowClick={() => setEquipmentDetail({ group: "history", label: t("Borrow History") })}
                t={t}
              />
            </ReportPanel>
            <ReportPanel
              title={t("Server Usage")}
              total={report.serverUsage.total}
              totalLabel={t("Total")}
              headerColor="#fddd1c"
              headerActions={
                <>
                  <PanelExportButton
                    icon={FileText}
                    text={t("PDF")}
                    label={t("Download PDF")}
                    onClick={onDownloadServerUsagePdf}
                    disabled={isLoading || Boolean(error)}
                  />
                  <PanelExportButton
                    icon={Download}
                    text={t("Excel")}
                    label={t("Download Excel")}
                    onClick={onDownloadServerUsageExcel}
                    disabled={isLoading || Boolean(error)}
                  />
                </>
              }
            >
              <MetricRows
                labelHeader={t("Server Usage")}
                headerHighlight="#fddd1c"
                rows={[{ label: t("Total"), count: report.serverUsage.total }]}
                onRowClick={() => setServerUsageDetail({ label: t("Server Usage") })}
                t={t}
              />
            </ReportPanel>
          </div>

          {report.employees.total === 0 && report.equipment.total === 0 && (
            <EmptyState icon={BarChartIcon} title={t("No data yet")} description={t("Once your data is entered, this report fills in automatically.")} />
          )}
        </>
      )}

      {departmentDetail && (
        <GroupDetailModal
          title={departmentDetail.label}
          onClose={() => setDepartmentDetail(null)}
          sections={[
            {
              key: "employees",
              label: t("Employees"),
              countLabel: t("employees_count", { count: departmentEmployees.length }),
              emptyText: t("No employees found"),
              columns: employeeColumns,
              rows: departmentEmployees.map(toEmployeeRow),
              onPdf: () => onDownloadDepartmentEmployeesPdf(departmentDetail),
              onExcel: () => onDownloadDepartmentEmployeesExcel(departmentDetail),
              isPdfBusy: downloadingDepartment === `${departmentKey}-pdf`,
              isExcelBusy: downloadingDepartment === `${departmentKey}-excel`,
            },
            {
              key: "equipment",
              label: t("Equipment"),
              countLabel: t("equipment_count", { count: departmentEquipment.length }),
              emptyText: t("No equipment found"),
              columns: equipmentColumns,
              rows: departmentEquipment.map(toEquipmentRow),
              onPdf: () => onDownloadDepartmentEquipmentPdf(departmentDetail),
              onExcel: () => onDownloadDepartmentEquipmentExcel(departmentDetail),
              isPdfBusy: downloadingDepartment === `${departmentKey}-equipment-pdf`,
              isExcelBusy: downloadingDepartment === `${departmentKey}-equipment-excel`,
            },
          ]}
        />
      )}

      {replacementDetail && (
        <GroupDetailModal
          title={replacementDetail.label}
          onClose={() => setReplacementDetail(null)}
          sections={[
            {
              key: "records",
              label: replacementDetail.label,
              countLabel: `${replacementRows.length.toLocaleString()} ${t("records")}`,
              emptyText: t("No data yet."),
              columns: replacementColumns,
              rows: toDetailRows(replacementRows, replacementColumns),
              onPdf: () => onDownloadReplacementPdf(replacementDetail.key),
              onExcel: () => onDownloadReplacementExcel(replacementDetail.key),
              isPdfBusy: downloadingReplacement === `${replacementDetail.key}-pdf`,
              isExcelBusy: downloadingReplacement === `${replacementDetail.key}-excel`,
            },
          ]}
        />
      )}

      {licenseDetail && (
        <GroupDetailModal
          title={licenseDetail.label}
          onClose={() => setLicenseDetail(null)}
          sections={[
            {
              key: "licenses",
              label: t("Software License"),
              countLabel: `${licenseRows.length.toLocaleString()} ${t("records")}`,
              emptyText: t("No data yet."),
              columns: licenseColumns,
              rows: toDetailRows(licenseRows, licenseColumns),
              onPdf: () => onDownloadLicenseByStatusPdf(licenseDetail.label),
              onExcel: () => onDownloadLicenseByStatusExcel(licenseDetail.label),
              isPdfBusy: downloadingLicense === `${licenseDetail.label}-pdf`,
              isExcelBusy: downloadingLicense === `${licenseDetail.label}-excel`,
            },
          ]}
        />
      )}

      {equipmentDetail && (
        <GroupDetailModal
          title={equipmentDetail.label}
          onClose={() => setEquipmentDetail(null)}
          sections={[
            {
              key: "records",
              label: equipmentDetail.label,
              countLabel: `${equipmentGroupRows.length.toLocaleString()} ${t("records")}`,
              emptyText: t("No data yet."),
              columns: equipmentGroupColumns,
              rows: equipmentGroupRows,
              onPdf: () => onDownloadEquipmentGroupPdf(equipmentDetail),
              onExcel: () => onDownloadEquipmentGroupExcel(equipmentDetail),
              isPdfBusy: downloadingEquipmentGroup === `${equipmentGroup.key}-pdf`,
              isExcelBusy: downloadingEquipmentGroup === `${equipmentGroup.key}-excel`,
            },
          ]}
        />
      )}

      {serverUsageDetail && (
        <GroupDetailModal
          title={serverUsageDetail.label}
          onClose={() => setServerUsageDetail(null)}
          sections={[
            {
              key: "records",
              label: t("Server Usage"),
              countLabel: `${report.serverUsage.list.length.toLocaleString()} ${t("records")}`,
              emptyText: t("No data yet."),
              columns: serverUsageColumns,
              rows: toDetailRows(report.serverUsage.list, serverUsageColumns),
              onPdf: onDownloadServerUsagePdf,
              onExcel: onDownloadServerUsageExcel,
              isPdfBusy: downloadingServerUsage === "pdf",
              isExcelBusy: downloadingServerUsage === "excel",
            },
          ]}
        />
      )}

      {managementDetail && (
        <GroupDetailModal
          title={managementDetail.label}
          onClose={() => setManagementDetail(null)}
          sections={[
            {
              key: "records",
              label: managementDetail.label,
              countLabel: `${managementRows.length.toLocaleString()} ${t("records")}`,
              emptyText: t("No data yet."),
              columns: managementColumns,
              rows: toDetailRows(managementRows, managementColumns),
              onPdf: () => onDownloadManagementPdf(managementDetail.key),
              onExcel: () => onDownloadManagementExcel(managementDetail.key),
              isPdfBusy: downloadingManagement === `${managementDetail.key}-pdf`,
              isExcelBusy: downloadingManagement === `${managementDetail.key}-excel`,
            },
          ]}
        />
      )}

      {genderDetail && (
        <GroupDetailModal
          title={genderDetail.label}
          onClose={() => setGenderDetail(null)}
          sections={[
            {
              key: "employees",
              label: t("Employees"),
              countLabel: t("employees_count", { count: genderEmployees.length }),
              emptyText: t("No employees found"),
              columns: employeeColumns,
              rows: genderEmployees.map(toEmployeeRow),
              onPdf: () => onDownloadEmployeesBySexPdf(genderDetail.key),
              onExcel: () => onDownloadEmployeesBySexExcel(genderDetail.key),
              isPdfBusy: downloadingSex === `${genderDetail.key}-pdf`,
              isExcelBusy: downloadingSex === `${genderDetail.key}-excel`,
            },
          ]}
        />
      )}
    </div>
  );
}
