import { jsPDF } from "jspdf";
import writeXlsxFile from "write-excel-file/browser";
import { formatFieldValue, getEmployeeDepartmentCode } from "../../dashboard.utils";

function getExportFilename(employee) {
  return (employee.full_name || "employee").replace(/[\\/:*?"<>|]/g, "-").trim() || "employee";
}

function getEmployeeExportFields(employee) {
  return [
    ["Full Name", employee.full_name || "—"],
    ["Position", employee.position || "—"],
    ["Department", getEmployeeDepartmentCode(employee) || "—"],
    ["Location", employee.location || "—"],
    ["Staff Code", employee.staff_code || "—"],
    ["Phone", employee.phone || "—"],
    ["Sex", employee.sex || "—"],
  ];
}

// device is { equipment_id, category, columns: [{field, header}], item, licenses }
// from GET /api/employees/:id/full — column headers come straight from the
// backend, same as what the detail popup renders.
function getDeviceExportFields(device) {
  const fields = (device.columns || []).map(({ field, header }) => [header, formatFieldValue(device.item?.[field])]);
  if (device.licenses?.length > 0) {
    fields.push(["Software Licenses", device.licenses.map((license) => license.product_name).filter(Boolean).join(", ")]);
  }
  return fields;
}

const HEADER_ROW_STYLE = { fontWeight: "bold" };
const WIDE_TABLE_HEADER_STYLE = { fontWeight: "bold", backgroundColor: "#1F3864", textColor: "#FFFFFF" };

function fieldsToSheetRows(fields) {
  return fields.map(([label, value]) => [{ value: label }, { value: String(value) }]);
}

// Label at a fixed x, colon at a fixed x, value at a fixed x — so the colons
// line up in a column regardless of label length ("Position" vs "Anti Virus
// License"), instead of the colon just trailing right after each label.
const PDF_LABEL_X = 14;
const PDF_COLON_X = 60;
const PDF_VALUE_X = 65;

function writePdfFieldRows(doc, fields, startY) {
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = startY;

  fields.forEach(([label, value]) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("times", "bold");
    doc.text(String(label), PDF_LABEL_X, y);
    doc.text(":", PDF_COLON_X, y);
    doc.setFont("times", "normal");
    doc.text(String(value), PDF_VALUE_X, y, { maxWidth: 130 });
    y += 8;
  });

  return y;
}

// Vertical "Label : Value" section for one employee — name as the heading,
// then one "Device N" block per device. Shared by the single-employee PDF
// and the "download all" PDF, which just repeats this once per employee.
function writeEmployeePdfSection(doc, employee, devices, startY) {
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text(employee.full_name || "Employee", 14, startY);

  doc.setFontSize(11);
  const employeeFields = getEmployeeExportFields(employee).filter(([label]) => label !== "Full Name");
  let y = writePdfFieldRows(doc, employeeFields, startY + 12);

  devices.forEach((device, index) => {
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    } else {
      y += 6;
    }

    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.text(`Device ${index + 1}`, 14, y);
    doc.setFontSize(11);
    y += 8;

    y = writePdfFieldRows(doc, getDeviceExportFields(device), y);
  });

  return y;
}

// One flat row per device (Device 1, Device 2, ...) with the employee's own
// fields repeated on each — spreadsheet/table-friendly, unlike the vertical
// field/value layout used elsewhere in this file. `entries` is one or many
// { employee, devices } pairs, so the same builder covers both the
// single-employee export and "download all".
function buildEmployeesWideTable(entries) {
  // Different categories carry different columns — union them across every
  // employee/device in first-seen order so Laptop + Server rows both fit.
  const deviceColumnKeys = [];
  const deviceColumnLabels = {};
  let hasLicenses = false;
  entries.forEach(({ devices }) => {
    devices.forEach((device) => {
      (device.columns || []).forEach(({ field, header }) => {
        if (!deviceColumnKeys.includes(field)) {
          deviceColumnKeys.push(field);
          deviceColumnLabels[field] = header;
        }
      });
      if (device.licenses?.length > 0) hasLicenses = true;
    });
  });

  const head = [
    "Employee Name",
    "Position",
    "Department",
    "Location",
    "Staff Code",
    "Phone",
    "Sex",
    "Device",
    ...deviceColumnKeys.map((key) => deviceColumnLabels[key]),
    ...(hasLicenses ? ["Software Licenses"] : []),
  ];

  const rows = [];
  entries.forEach(({ employee, devices }) => {
    const employeeValues = getEmployeeExportFields(employee)
      .filter(([label]) => label !== "Full Name")
      .map(([, value]) => String(value));
    const baseValues = [employee.full_name || "—", ...employeeValues];

    if (devices.length === 0) {
      rows.push([...baseValues, "—", ...deviceColumnKeys.map(() => ""), ...(hasLicenses ? [""] : [])]);
      return;
    }

    devices.forEach((device, index) => {
      rows.push([
        ...baseValues,
        `Device ${index + 1}`,
        ...deviceColumnKeys.map((key) => formatFieldValue(device.item?.[key])),
        ...(hasLicenses
          ? [device.licenses?.map((license) => license.product_name).filter(Boolean).join(", ") || ""]
          : []),
      ]);
    });
  });

  return { head, rows };
}

export function exportEmployeeToPdf(employee, devices = []) {
  const doc = new jsPDF({ format: "a4" });
  writeEmployeePdfSection(doc, employee, devices, 20);
  doc.save(`${getExportFilename(employee)}.pdf`);
}

// `entries`: [{ employee, devices }] — one PDF, one section per employee, a
// fresh page between each so they don't run together mid-page.
export function exportAllEmployeesToPdf(entries) {
  const doc = new jsPDF({ format: "a4" });

  entries.forEach(({ employee, devices }, index) => {
    if (index > 0) doc.addPage();
    writeEmployeePdfSection(doc, employee, devices, 20);
  });

  doc.save("employees.pdf");
}

// Widen each column to fit its longest cell instead of Excel's default flat
// width, so headers like "Department" and values like "LTMKT-Anousit" don't
// get clipped.
function computeColumnWidths(head, rows) {
  return head.map((label, columnIndex) => {
    const headerLength = String(label ?? "").length;
    const longestValueLength = rows.reduce(
      (max, row) => Math.max(max, String(row[columnIndex] ?? "").length),
      0
    );
    return { width: Math.min(Math.max(headerLength, longestValueLength) + 2, 40) };
  });
}

export function exportEmployeeToExcel(employee, devices = []) {
  const { head, rows } = buildEmployeesWideTable([{ employee, devices }]);

  const headerRow = head.map((label) => ({ value: label, ...WIDE_TABLE_HEADER_STYLE }));
  const dataRows = rows.map((row) => row.map((value) => ({ value })));

  return writeXlsxFile([headerRow, ...dataRows], {
    sheet: "Employee",
    columns: computeColumnWidths(head, rows),
  }).toFile(`${getExportFilename(employee)}.xlsx`);
}

// `entries`: [{ employee, devices }] — one sheet, every employee's rows one
// after another, same wide-table shape as the single-employee export.
export function exportAllEmployeesToExcel(entries) {
  const { head, rows } = buildEmployeesWideTable(entries);

  const headerRow = head.map((label) => ({ value: label, ...WIDE_TABLE_HEADER_STYLE }));
  const dataRows = rows.map((row) => row.map((value) => ({ value })));

  return writeXlsxFile([headerRow, ...dataRows], {
    sheet: "Employees",
    columns: computeColumnWidths(head, rows),
  }).toFile("employees.xlsx");
}

export function exportEmployeeDetailToExcel(employee, devices) {
  const headerRow = [{ value: "Field", ...HEADER_ROW_STYLE }, { value: "Value", ...HEADER_ROW_STYLE }];

  const rows = [
    [{ value: "Employee", ...HEADER_ROW_STYLE }],
    headerRow,
    ...fieldsToSheetRows(getEmployeeExportFields(employee)),
  ];

  devices.forEach((device, index) => {
    rows.push([]);
    rows.push([{ value: `Device ${index + 1}`, ...HEADER_ROW_STYLE }]);
    rows.push(headerRow);
    rows.push(...fieldsToSheetRows(getDeviceExportFields(device)));
  });

  return writeXlsxFile(rows, { sheet: "Employee" }).toFile(`${getExportFilename(employee)}-detail.xlsx`);
}
