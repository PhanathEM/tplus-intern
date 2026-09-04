import { useEffect, useState } from "react";
import { fetchEmployees, fetchEmployeeFull } from "../../../../services/employeeService";
import { exportAllEmployeesToExcel, exportAllEmployeesToPdf } from "../employees/employeeExport";
import { exportAllDepartmentsToExcel, exportAllDepartmentsToPdf } from "../departments/departmentExport";
import { fetchDepartments } from "../../../../services/departmentService";
import { fetchEquipmentByStatus } from "../../../../services/equipmentService";
import { fetchLicenses } from "../../../../services/licenseService";
import { fetchCurrentBorrows, fetchBorrowHistory } from "../../../../services/borrowService";
import { fetchPartReplacements } from "../../../../services/partReplacementService";
import { fetchPartStock } from "../../../../services/partStockService";
import { fetchCurrentPartBorrows } from "../../../../services/partBorrowService";
import { fetchServerUsage } from "../../../../services/serverUsageService";
import { fetchStatuses } from "../../../../services/statusService";
import { fetchPartStatuses } from "../../../../services/partStatusService";
import { fetchCategories } from "../../../../services/categoryService";
import { fetchPartTypes } from "../../../../services/partTypeService";
import {
  exportRecordListToExcel,
  exportRecordListToPdf,
  exportRecordSectionsToExcel,
  exportRecordSectionsToPdf,
  exportManagementListToExcel,
  exportManagementListToPdf,
  exportManagementsToExcel,
  exportManagementsToPdf,
} from "./reportExport";
import { getLicenseExpiryInfo } from "../../dashboard.notifications";
import {
  getEquipmentDisplayName,
  matchesEmployeeDepartment,
  matchesEquipmentDepartment,
  normalizeRecordList,
} from "../../dashboard.utils";

const EMPTY_REPORT = {
  // `list` is the raw directory rows, kept alongside the counts so the
  // Employees panel can export the full staff list (the counts alone can't
  // reproduce names, phones or assigned devices).
  employees: { total: 0, bySex: [], list: [] },
  departments: { total: 0, rows: [], list: [] },
  equipment: { total: 0, byStatus: [], byCategory: [], byAssignment: [], list: [] },
  licenses: { total: 0, byStatus: [], list: [] },
  borrow: { currentlyBorrowed: 0, overdue: 0, historyTotal: 0 },
  replacement: { total: 0, list: [] },
  partStock: { lineCount: 0, totalQuantity: 0, list: [] },
  partBorrow: { current: 0, list: [] },
  serverUsage: { total: 0 },
  managements: {
    statuses: 0,
    partStatuses: 0,
    categories: 0,
    partTypes: 0,
    // The rows themselves, so each line can be exported on its own -
    // the counts alone can't reproduce names or descriptions.
    lists: { statuses: [], partStatuses: [], categories: [], partTypes: [] },
  },
};

// Each of these endpoints answers with either a bare array or a single
// wrapper key, so the count goes through one place rather than four.
function toList(result, key) {
  if (result.status !== "fulfilled") return [];
  const data = result.value;
  if (Array.isArray(data)) return data;
  if (key && Array.isArray(data?.[key])) return data[key];
  return [];
}

function countBy(list, getKey, fallback = "Unspecified") {
  const counts = new Map();
  list.forEach((item) => {
    const key = getKey(item) || fallback;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function loadReport() {
  return Promise.allSettled([
    fetchEmployees(),
    fetchDepartments(),
    fetchEquipmentByStatus(),
    fetchLicenses(),
    fetchCurrentBorrows(),
    fetchBorrowHistory({}),
    fetchPartReplacements(),
    fetchPartStock(),
    fetchCurrentPartBorrows(),
    fetchServerUsage(),
    fetchStatuses(),
    fetchPartStatuses(),
    fetchCategories(),
    fetchPartTypes(),
  ]).then(
    ([
      employeesResult,
      departmentsResult,
      equipmentResult,
      licensesResult,
      currentBorrowsResult,
      borrowHistoryResult,
      replacementsResult,
      partStockResult,
      partBorrowResult,
      serverUsageResult,
      statusesResult,
      partStatusesResult,
      categoriesResult,
      partTypesResult,
    ]) => {
      const report = { ...EMPTY_REPORT };

      if (employeesResult.status === "fulfilled") {
        const employees = Array.isArray(employeesResult.value) ? employeesResult.value : [];
        report.employees = {
          total: employees.length,
          bySex: countBy(employees, (employee) => employee.sex),
          list: employees,
        };
      }

      if (departmentsResult.status === "fulfilled") {
        const departments = Array.isArray(departmentsResult.value) ? departmentsResult.value : [];
        report.departments = {
          total: departments.length,
          rows: departments.map((dept) => ({
            label: dept.department_name || dept.department_code || "—",
            // Kept alongside the label so a row export can match employees on
            // either the code or the full name, whichever they carry.
            code: dept.department_code || "",
            name: dept.department_name || "",
            employeeCount: dept.employee_count ?? 0,
            equipmentCount: dept.equipment_count ?? 0,
          })),
          list: departments,
        };
      }

      if (equipmentResult.status === "fulfilled") {
        const items = Array.isArray(equipmentResult.value) ? equipmentResult.value : [];
        report.equipment = {
          total: items.length,
          list: items,
          byStatus: countBy(items, (item) => item.status_name || item.status),
          byCategory: countBy(items, (item) => item.category_name || item.category),
          // An item with an owner on file is currently assigned to someone —
          // the same definition Home's category-occupancy panel uses.
          byAssignment: countBy(items, (item) => (item.owner_name ? "Assigned" : "Unassigned")),
        };
      }

      if (licensesResult.status === "fulfilled") {
        const licenses = Array.isArray(licensesResult.value) ? licensesResult.value : [];
        report.licenses = {
          total: licenses.length,
          byStatus: countBy(licenses, (license) => getLicenseExpiryInfo(license)?.label || license.status),
          list: licenses,
        };
      }

      if (currentBorrowsResult.status === "fulfilled") {
        const borrowed = Array.isArray(currentBorrowsResult.value?.borrowed) ? currentBorrowsResult.value.borrowed : [];
        report.borrow.currentlyBorrowed = borrowed.length;
        report.borrow.overdue = borrowed.filter((record) => record.is_overdue).length;
      }

      if (borrowHistoryResult.status === "fulfilled") {
        const history = Array.isArray(borrowHistoryResult.value?.history) ? borrowHistoryResult.value.history : [];
        report.borrow.historyTotal = history.length;
      }

      if (replacementsResult.status === "fulfilled") {
        const data = replacementsResult.value;
        const rows = Array.isArray(data?.replacements) ? data.replacements : [];
        report.replacement.total = typeof data?.count === "number" ? data.count : rows.length;
        report.replacement.list = rows;
      }

      if (partStockResult.status === "fulfilled") {
        const stock = Array.isArray(partStockResult.value?.stock) ? partStockResult.value.stock : [];
        report.partStock = {
          lineCount: stock.length,
          totalQuantity: stock.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0),
          list: stock,
        };
      }

      if (partBorrowResult.status === "fulfilled") {
        const data = partBorrowResult.value;
        const borrowed = Array.isArray(data?.borrowed) ? data.borrowed : Array.isArray(data) ? data : [];
        report.partBorrow.current = borrowed.length;
        report.partBorrow.list = borrowed;
      }

      if (serverUsageResult.status === "fulfilled") {
        report.serverUsage.total = normalizeRecordList(serverUsageResult.value).length;
      }

      const managementLists = {
        statuses: toList(statusesResult, "statuses"),
        partStatuses: toList(partStatusesResult, "statuses"),
        categories: toList(categoriesResult, "categories"),
        partTypes: toList(partTypesResult, "part_types"),
      };

      report.managements = {
        statuses: managementLists.statuses.length,
        partStatuses: managementLists.partStatuses.length,
        categories: managementLists.categories.length,
        partTypes: managementLists.partTypes.length,
        lists: managementLists,
      };

      return report;
    }
  );
}

export function useReport({ isActive }) {
  const [report, setReport] = useState(EMPTY_REPORT);
  const [isLoading, setIsLoading] = useState(isActive);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);
  const [isDownloadingEmployeesPdf, setIsDownloadingEmployeesPdf] = useState(false);
  const [isDownloadingEmployeesExcel, setIsDownloadingEmployeesExcel] = useState(false);
  // "<sex>-pdf" / "<sex>-excel" while that one row is exporting.
  const [downloadingSex, setDownloadingSex] = useState("");
  // "<listKey>-pdf" / "<listKey>-excel" while that row is exporting.
  const [downloadingManagement, setDownloadingManagement] = useState("");
  // "<department code or name>-pdf" / "-excel" while that row is exporting.
  const [downloadingDepartment, setDownloadingDepartment] = useState("");
  // "<row key>-pdf" / "-excel" for the Replacement and Software License rows.
  const [downloadingReplacement, setDownloadingReplacement] = useState("");
  const [downloadingLicense, setDownloadingLicense] = useState("");

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    loadReport()
      .then((data) => {
        if (!ignore) {
          setReport(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isActive, fetchToken]);

  function handleRetry() {
    setIsLoading(true);
    setError(null);
    setFetchToken((value) => value + 1);
  }

  function resetForEntry() {
    setIsLoading(true);
    setError(null);
  }

  // The staff-list export needs each employee's assigned devices, which only
  // the per-employee endpoint returns. A failure for one employee leaves that
  // row deviceless rather than sinking the whole export.
  // `filter` narrows the staff list before the per-employee device lookups,
  // so a gender export only fetches the rows it actually needs.
  function downloadEmployeeList(setIsDownloading, exportAll, filter) {
    const list = filter ? report.employees.list.filter(filter) : report.employees.list;
    setIsDownloading(true);
    Promise.all(
      list.map((employee) =>
        fetchEmployeeFull(employee.employee_id)
          .then((data) => ({ employee, devices: Array.isArray(data?.equipment) ? data.equipment : [] }))
          .catch(() => ({ employee, devices: [] }))
      )
    )
      .then((entries) => exportAll(entries))
      .finally(() => setIsDownloading(false));
  }

  function handleDownloadEmployeesPdf() {
    downloadEmployeeList(setIsDownloadingEmployeesPdf, exportAllEmployeesToPdf);
  }

  function handleDownloadEmployeesExcel() {
    downloadEmployeeList(setIsDownloadingEmployeesExcel, exportAllEmployeesToExcel);
  }

  // countBy() buckets a blank sex as "Unspecified", so the filter has to
  // match that same fallback rather than looking for the literal value.
  function matchesSex(sex) {
    return (employee) => (employee.sex || "Unspecified") === sex;
  }

  function handleDownloadEmployeesBySexPdf(sex) {
    setDownloadingSex(`${sex}-pdf`);
    downloadEmployeeList(
      (value) => setDownloadingSex(value ? `${sex}-pdf` : ""),
      exportAllEmployeesToPdf,
      matchesSex(sex)
    );
  }

  function handleDownloadEmployeesBySexExcel(sex) {
    setDownloadingSex(`${sex}-excel`);
    downloadEmployeeList(
      (value) => setDownloadingSex(value ? `${sex}-excel` : ""),
      exportAllEmployeesToExcel,
      matchesSex(sex)
    );
  }

  function departmentKey(row) {
    return row.code || row.name || row.label;
  }

  function handleDownloadDepartmentEmployeesPdf(row) {
    const key = departmentKey(row);
    downloadEmployeeList(
      (value) => setDownloadingDepartment(value ? `${key}-pdf` : ""),
      exportAllEmployeesToPdf,
      matchesEmployeeDepartment(row)
    );
  }

  function handleDownloadDepartmentEmployeesExcel(row) {
    const key = departmentKey(row);
    downloadEmployeeList(
      (value) => setDownloadingDepartment(value ? `${key}-excel` : ""),
      exportAllEmployeesToExcel,
      matchesEmployeeDepartment(row)
    );
  }

  // The four Replacement rows and the lists behind them. Device Replacement
  // and its History are the same records, which is why both rows read 51.
  function replacementSections() {
    return [
      { key: "partStock", title: "Part Types of Stock Replacement", rows: report.partStock.list },
      { key: "partBorrow", title: "Borrow a Part", rows: report.partBorrow.list },
      { key: "deviceReplacement", title: "Device Replacement", rows: report.replacement.list },
      { key: "replacementHistory", title: "Device Replacement History", rows: report.replacement.list },
    ];
  }

  // The equipment side of a department row, shaped for export: the display
  // name the tables use, plus the fields worth reading in a sheet.
  function departmentEquipmentRows(row) {
    return report.equipment.list.filter(matchesEquipmentDepartment(row)).map((item) => ({
      device: getEquipmentDisplayName(item),
      category: item.category_name || item.category || "",
      asset_code: item.asset_code || "",
      status: item.status_name || item.status || "",
      owner: item.owner_name || "",
    }));
  }

  function handleDownloadDepartmentEquipmentPdf(row) {
    const key = departmentKey(row);
    setDownloadingDepartment(`${key}-equipment-pdf`);
    exportRecordListToPdf(`tplus-${key}-equipment`, `${row.label} - Equipment`, departmentEquipmentRows(row));
    setDownloadingDepartment("");
  }

  function handleDownloadDepartmentEquipmentExcel(row) {
    const key = departmentKey(row);
    setDownloadingDepartment(`${key}-equipment-excel`);
    exportRecordListToExcel(`tplus-${key}-equipment`, `${row.label} - Equipment`, departmentEquipmentRows(row));
    setDownloadingDepartment("");
  }

  function handleDownloadReplacementPdf(rowKey) {
    const section = replacementSections().find((item) => item.key === rowKey);
    if (!section) return;
    setDownloadingReplacement(`${rowKey}-pdf`);
    exportRecordListToPdf(`tplus-${rowKey}`, section.title, section.rows);
    setDownloadingReplacement("");
  }

  function handleDownloadReplacementExcel(rowKey) {
    const section = replacementSections().find((item) => item.key === rowKey);
    if (!section) return;
    setDownloadingReplacement(`${rowKey}-excel`);
    exportRecordListToExcel(`tplus-${rowKey}`, section.title, section.rows);
    setDownloadingReplacement("");
  }

  function handleDownloadReplacementsPdf() {
    exportRecordSectionsToPdf("tplus-replacement", replacementSections());
  }

  function handleDownloadReplacementsExcel() {
    exportRecordSectionsToExcel("tplus-replacement", replacementSections());
  }

  // Licenses are bucketed by the same label the panel shows, so a row export
  // matches on that rather than on the raw status field.
  function licensesWithLabel(label) {
    return report.licenses.list.filter(
      (license) => (getLicenseExpiryInfo(license)?.label || license.status) === label
    );
  }

  function handleDownloadLicenseByStatusPdf(label) {
    setDownloadingLicense(`${label}-pdf`);
    exportRecordListToPdf(`tplus-licenses-${label}`, `Software License - ${label}`, licensesWithLabel(label));
    setDownloadingLicense("");
  }

  function handleDownloadLicenseByStatusExcel(label) {
    setDownloadingLicense(`${label}-excel`);
    exportRecordListToExcel(`tplus-licenses-${label}`, `Software License - ${label}`, licensesWithLabel(label));
    setDownloadingLicense("");
  }

  function handleDownloadLicensesPdf() {
    exportRecordListToPdf("tplus-licenses", "Software License", report.licenses.list);
  }

  function handleDownloadLicensesExcel() {
    exportRecordListToExcel("tplus-licenses", "Software License", report.licenses.list);
  }

  function handleDownloadManagementPdf(listKey) {
    setDownloadingManagement(`${listKey}-pdf`);
    exportManagementListToPdf(listKey, report.managements.lists[listKey]);
    setDownloadingManagement("");
  }

  function handleDownloadManagementExcel(listKey) {
    setDownloadingManagement(`${listKey}-excel`);
    exportManagementListToExcel(listKey, report.managements.lists[listKey]);
    setDownloadingManagement("");
  }

  function handleDownloadManagementsPdf() {
    exportManagementsToPdf(report.managements.lists);
  }

  function handleDownloadManagementsExcel() {
    exportManagementsToExcel(report.managements.lists);
  }

  function handleDownloadDepartmentsPdf() {
    exportAllDepartmentsToPdf(report.departments.list);
  }

  function handleDownloadDepartmentsExcel() {
    exportAllDepartmentsToExcel(report.departments.list);
  }

  return {
    report,
    isLoading,
    error,
    handleRetry,
    resetForEntry,
    handleDownloadEmployeesPdf,
    handleDownloadEmployeesExcel,
    handleDownloadEmployeesBySexPdf,
    handleDownloadEmployeesBySexExcel,
    downloadingSex,
    handleDownloadDepartmentEmployeesPdf,
    handleDownloadDepartmentEmployeesExcel,
    handleDownloadDepartmentEquipmentPdf,
    handleDownloadDepartmentEquipmentExcel,
    downloadingDepartment,
    handleDownloadReplacementPdf,
    handleDownloadReplacementExcel,
    handleDownloadReplacementsPdf,
    handleDownloadReplacementsExcel,
    downloadingReplacement,
    handleDownloadLicenseByStatusPdf,
    handleDownloadLicenseByStatusExcel,
    handleDownloadLicensesPdf,
    handleDownloadLicensesExcel,
    downloadingLicense,
    handleDownloadManagementPdf,
    handleDownloadManagementExcel,
    handleDownloadManagementsPdf,
    handleDownloadManagementsExcel,
    downloadingManagement,
    isDownloadingEmployeesPdf,
    isDownloadingEmployeesExcel,
    handleDownloadDepartmentsPdf,
    handleDownloadDepartmentsExcel,
  };
}
