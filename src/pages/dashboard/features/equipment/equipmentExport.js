import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import writeXlsxFile from "write-excel-file/browser";
import { formatFieldValue } from "../../dashboard.utils";

const WIDE_TABLE_HEADER_STYLE = { fontWeight: "bold", backgroundColor: "#1F3864", textColor: "#FFFFFF" };

// Excel sheet names can't exceed 31 characters or contain \ / ? * [ ] : —
// category labels are short/plain today, but this keeps a rename from ever
// silently breaking the export.
function sanitizeSheetName(label) {
  return (label || "Sheet").replace(/[\\/?*[\]:]/g, "-").slice(0, 31) || "Sheet";
}

// `entries`: [{ category, columns, items }] — each category keeps its own
// column set (Laptop's fields don't match Server's), so no cross-category
// column merging happens here.
function buildCategoryTable({ columns, items }) {
  const head = columns.map((column) => column.label);
  const rows = items.map((item, index) =>
    columns.map((column) => (column.key === "_row_number" ? String(index + 1) : formatFieldValue(item[column.key])))
  );
  return { head, rows };
}

function computeColumnWidths(head, rows) {
  return head.map((label, columnIndex) => {
    const headerLength = String(label ?? "").length;
    const longestValueLength = rows.reduce((max, row) => Math.max(max, String(row[columnIndex] ?? "").length), 0);
    return { width: Math.min(Math.max(headerLength, longestValueLength) + 2, 40) };
  });
}

function getExportFilename(name) {
  return (name || "equipment").replace(/[\\/:*?"<>|]/g, "-").trim() || "equipment";
}

// One workbook, one sheet per entry — works equally well for "download all"
// (one entry per category) and a single category's own download (one entry).
export function exportAllEquipmentToExcel(entries, filename) {
  const sheets = entries.map(({ category, columns, items }) => {
    const { head, rows } = buildCategoryTable({ columns, items });
    const headerRow = head.map((label) => ({ value: label, ...WIDE_TABLE_HEADER_STYLE }));
    const dataRows = rows.map((row) => row.map((value) => ({ value })));

    return {
      sheet: sanitizeSheetName(category),
      data: [headerRow, ...dataRows],
      columns: computeColumnWidths(head, rows),
    };
  });

  return writeXlsxFile(sheets).toFile(`${getExportFilename(filename)}.xlsx`);
}

// One PDF, one heading + table per entry, a fresh page between each.
export function exportAllEquipmentToPdf(entries, filename) {
  const doc = new jsPDF({ format: "a4", orientation: "landscape" });

  entries.forEach(({ category, columns, items }, index) => {
    if (index > 0) doc.addPage();

    const { head, rows } = buildCategoryTable({ columns, items });

    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text(category || "Equipment", 14, 14);

    autoTable(doc, {
      head: [head],
      body: rows,
      startY: 20,
      styles: { font: "times", fontSize: 8, cellPadding: 3, overflow: "linebreak" },
      headStyles: { fillColor: [31, 56, 100], textColor: 255, fontStyle: "bold" },
      theme: "grid",
    });
  });

  doc.save(`${getExportFilename(filename)}.pdf`);
}
