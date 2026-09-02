// Reuses the equipment feature's generic "one sheet/page per section"
// exporters — nothing about them is actually equipment-specific, they just
// take {category, columns, items} entries.
import { exportAllEquipmentToExcel, exportAllEquipmentToPdf } from "../equipment/equipmentExport";

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
