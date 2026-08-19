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
  (device.licenses || []).forEach((license, index) => {
    fields.push([
      `License ${index + 1}`,
      [license.product_name, license.license_type, license.status].filter(Boolean).join(" · ") || "—",
    ]);
  });
  return fields;
}

const HEADER_ROW_STYLE = { fontWeight: "bold" };
const TABLE_HEADER_STYLE = { fontWeight: "bold", backgroundColor: "#FFFF00" };

function fieldsToSheetRows(fields) {
  return fields.map(([label, value]) => [{ value: label }, { value: String(value) }]);
}

function writePdfFieldRows(doc, fields, startY) {
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = startY;

  fields.forEach(([label, value]) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
    doc.setFont(undefined, "bold");
    doc.text(`${label}:`, 14, y);
    doc.setFont(undefined, "normal");
    doc.text(String(value), 60, y, { maxWidth: 135 });
    y += 9;
  });

  return y;
}

export function exportEmployeeToPdf(employee) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Employee Details", 14, 20);

  doc.setFontSize(11);
  writePdfFieldRows(doc, getEmployeeExportFields(employee), 34);

  doc.save(`${getExportFilename(employee)}.pdf`);
}

export function exportEmployeeToExcel(employee) {
  const fields = getEmployeeExportFields(employee);
  const rows = [
    fields.map(([label]) => ({ value: label, ...TABLE_HEADER_STYLE })),
    fields.map(([, value]) => ({ value: String(value) })),
  ];

  return writeXlsxFile(rows, { sheet: "Employee" }).toFile(`${getExportFilename(employee)}.xlsx`);
}

// Full export matching the employee detail popup: employee info plus every
// column of every assigned device, nothing hidden.
export function exportEmployeeDetailToPdf(employee, devices) {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(16);
  doc.text(employee.full_name || "Employee", 14, 20);

  doc.setFontSize(11);
  let y = writePdfFieldRows(doc, getEmployeeExportFields(employee), 34);

  devices.forEach((device, index) => {
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    } else {
      y += 6;
    }

    const deviceTitle = `Device ${index + 1}`;
    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.text(deviceTitle, 14, y);
    doc.setFont(undefined, "normal");
    doc.setFontSize(11);
    y += 8;

    y = writePdfFieldRows(doc, getDeviceExportFields(device), y);
  });

  doc.save(`${getExportFilename(employee)}-detail.pdf`);
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
