// Reuses the equipment feature's generic "one sheet/page per section"
// exporters — nothing about them is actually equipment-specific, they just
// take {category, columns, items} entries.
import { exportAllEquipmentToExcel, exportAllEquipmentToPdf } from "../equipment/equipmentExport";
import { humanizeFieldKey } from "../../dashboard.utils";

const METRIC_COLUMNS = [
  { key: "metric", label: "Metric" },
  { key: "value", label: "Value" },
];

const LABEL_COUNT_COLUMNS = [
  { key: "label", label: "Label" },
  { key: "count", label: "Count" },
];

function metricRows(pairs) {
  return pairs.map(([metric, value]) => ({ metric, value }));
}

function buildReportEntries(report) {
  return [
    {
      category: "Workforce",
      columns: METRIC_COLUMNS,
      items: metricRows([
        ["Total Employees", report.employees.total],
        ...report.employees.bySex.map((row) => [row.label, row.count]),
        ["Total Departments", report.departments.total],
      ]),
    },
    {
      category: "Departments",
      columns: [
        { key: "label", label: "Department" },
        { key: "employeeCount", label: "Employees" },
        { key: "equipmentCount", label: "Equipment" },
      ],
      items: report.departments.rows,
    },
    {
      category: "Equipment by Status",
      columns: LABEL_COUNT_COLUMNS,
      items: [{ label: "Total Equipment", count: report.equipment.total }, ...report.equipment.byStatus],
    },
    {
      category: "Equipment by Category",
      columns: LABEL_COUNT_COLUMNS,
      items: report.equipment.byCategory,
    },
    {
      category: "Assign, Currently Borrowed & Borrow History",
      columns: METRIC_COLUMNS,
      items: metricRows([
        ["Assigned", report.equipment.byAssignment.find((row) => row.label === "Assigned")?.count || 0],
        ["Unassigned", report.equipment.byAssignment.find((row) => row.label === "Unassigned")?.count || 0],
        ["Currently Borrowed", report.borrow.currentlyBorrowed],
        ["Overdue", report.borrow.overdue],
        ["Borrow History (Total)", report.borrow.historyTotal],
      ]),
    },
    {
      category: "Software License",
      columns: LABEL_COUNT_COLUMNS,
      items: [{ label: "Total Licenses", count: report.licenses.total }, ...report.licenses.byStatus],
    },
    {
      category: "Replacement",
      columns: METRIC_COLUMNS,
      items: metricRows([
        ["Stock of Replace a Part", report.partStock.lineCount],
        ["Borrow a Part", report.partBorrow.current],
        ["Device Replacement", report.replacement.total],
        ["Device Replacement History", report.replacement.total],
      ]),
    },
    {
      category: "Managements",
      columns: METRIC_COLUMNS,
      items: metricRows([
        ["Equipment Statuses", report.managements.statuses],
        ["Part Types Statuses", report.managements.partStatuses],
        ["Category", report.managements.categories],
        ["Part Types of Stock", report.managements.partTypes],
      ]),
    },
    {
      category: "Cloud",
      columns: METRIC_COLUMNS,
      items: metricRows([["Server Usage Records", report.serverUsage.total]]),
    },
  ];
}

export function exportReportToExcel(report) {
  return exportAllEquipmentToExcel(buildReportEntries(report), "tplus-report");
}

export function exportReportToPdf(report) {
  return exportAllEquipmentToPdf(buildReportEntries(report), "tplus-report");
}

// One section per Managements row. Each list has its own shape, so the columns
// are declared per key rather than auto-detected - that keeps the sheet
// headings readable instead of raw field names.
const MANAGEMENT_SECTIONS = {
  statuses: {
    category: "Equipment Statuses",
    columns: [
      { key: "status_name", label: "Status Name" },
      { key: "description", label: "Description" },
      { key: "equipment_count", label: "Equipment" },
    ],
  },
  partStatuses: {
    category: "Part Types Statuses",
    columns: [
      { key: "status_name", label: "Status Name" },
      { key: "description", label: "Description" },
      { key: "is_borrowable", label: "Borrowable" },
      { key: "part_stock_count", label: "Part Stock" },
    ],
  },
  categories: {
    category: "Category",
    columns: [
      { key: "category_name", label: "Category" },
      { key: "description", label: "Description" },
    ],
  },
  partTypes: {
    category: "Part Types of Stock",
    columns: [
      { key: "part_name", label: "Part Name" },
      { key: "description", label: "Description" },
    ],
  },
};

function buildManagementEntry(listKey, rows) {
  const section = MANAGEMENT_SECTIONS[listKey];
  if (!section) return null;
  return { ...section, items: Array.isArray(rows) ? rows : [] };
}

export function exportManagementListToPdf(listKey, rows) {
  const entry = buildManagementEntry(listKey, rows);
  if (entry) exportAllEquipmentToPdf([entry], `tplus-${listKey}`);
}

export function exportManagementListToExcel(listKey, rows) {
  const entry = buildManagementEntry(listKey, rows);
  if (entry) exportAllEquipmentToExcel([entry], `tplus-${listKey}`);
}

function buildManagementEntries(lists) {
  return Object.keys(MANAGEMENT_SECTIONS)
    .map((listKey) => buildManagementEntry(listKey, lists?.[listKey]))
    .filter(Boolean);
}

export function exportManagementsToPdf(lists) {
  exportAllEquipmentToPdf(buildManagementEntries(lists), "tplus-managements");
}

export function exportManagementsToExcel(lists) {
  exportAllEquipmentToExcel(buildManagementEntries(lists), "tplus-managements");
}

// Columns read off the rows themselves. These lists (stock lines, part borrows,
// replacements, licenses) each have their own shape and gain fields over time,
// so declaring them by hand would go stale; keys beginning with "_" are the
// display-only extras the tables add and stay out.
function autoColumns(rows) {
  const keys = [];
  rows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => {
      if (!key.startsWith("_") && !keys.includes(key)) keys.push(key);
    });
  });
  return keys.map((key) => ({ key, label: humanizeFieldKey(key) }));
}

function buildListEntry(title, rows) {
  const items = Array.isArray(rows) ? rows : [];
  return { category: title, columns: autoColumns(items), items };
}

export function exportRecordListToPdf(fileName, title, rows) {
  exportAllEquipmentToPdf([buildListEntry(title, rows)], fileName);
}

export function exportRecordListToExcel(fileName, title, rows) {
  exportAllEquipmentToExcel([buildListEntry(title, rows)], fileName);
}

export function exportRecordSectionsToPdf(fileName, sections) {
  exportAllEquipmentToPdf(sections.map(({ title, rows }) => buildListEntry(title, rows)), fileName);
}

export function exportRecordSectionsToExcel(fileName, sections) {
  exportAllEquipmentToExcel(sections.map(({ title, rows }) => buildListEntry(title, rows)), fileName);
}
