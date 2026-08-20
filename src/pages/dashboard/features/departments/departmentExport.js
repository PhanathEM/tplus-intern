import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import writeXlsxFile from "write-excel-file/browser";
import { departmentColumns } from "../../dashboard.config";
import { formatFieldValue } from "../../dashboard.utils";

const WIDE_TABLE_HEADER_STYLE = { fontWeight: "bold", backgroundColor: "#1F3864", textColor: "#FFFFFF" };

// Departments are flat records (no nested devices like employees have), so a
// plain grid table is the natural shape here — same columns as the on-screen
// table, one row per department.
function buildDepartmentsTable(departments) {
  const head = departmentColumns.map((column) => column.label);
  const rows = departments.map((department) => departmentColumns.map((column) => formatFieldValue(department[column.key])));
  return { head, rows };
}

function computeColumnWidths(head, rows) {
  return head.map((label, columnIndex) => {
    const headerLength = String(label ?? "").length;
    const longestValueLength = rows.reduce((max, row) => Math.max(max, String(row[columnIndex] ?? "").length), 0);
    return { width: Math.min(Math.max(headerLength, longestValueLength) + 2, 40) };
  });
}

export function exportAllDepartmentsToExcel(departments) {
  const { head, rows } = buildDepartmentsTable(departments);

  const headerRow = head.map((label) => ({ value: label, ...WIDE_TABLE_HEADER_STYLE }));
  const dataRows = rows.map((row) => row.map((value) => ({ value })));

  return writeXlsxFile([headerRow, ...dataRows], {
    sheet: "Departments",
    columns: computeColumnWidths(head, rows),
  }).toFile("departments.xlsx");
}

export function exportAllDepartmentsToPdf(departments) {
  const { head, rows } = buildDepartmentsTable(departments);
  const doc = new jsPDF({ format: "a4" });

  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("Departments", 14, 14);

  autoTable(doc, {
    head: [head],
    body: rows,
    startY: 20,
    styles: { font: "times", fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [31, 56, 100], textColor: 255, fontStyle: "bold" },
    theme: "grid",
  });

  doc.save("departments.pdf");
}
