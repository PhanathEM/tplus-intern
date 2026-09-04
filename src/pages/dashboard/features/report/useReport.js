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
import { getLicenseExpiryInfo } from "../../dashboard.notifications";
import { normalizeRecordList } from "../../dashboard.utils";

const EMPTY_REPORT = {
  // `list` is the raw directory rows, kept alongside the counts so the
  // Employees panel can export the full staff list (the counts alone can't
  // reproduce names, phones or assigned devices).
  employees: { total: 0, bySex: [], list: [] },
  departments: { total: 0, rows: [], list: [] },
  equipment: { total: 0, byStatus: [], byCategory: [], byAssignment: [] },
  licenses: { total: 0, byStatus: [] },
  borrow: { currentlyBorrowed: 0, overdue: 0, historyTotal: 0 },
  replacement: { total: 0 },
  partStock: { lineCount: 0, totalQuantity: 0 },
  partBorrow: { current: 0 },
  serverUsage: { total: 0 },
};

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
        report.replacement.total =
          typeof data?.count === "number" ? data.count : Array.isArray(data?.replacements) ? data.replacements.length : 0;
      }

      if (partStockResult.status === "fulfilled") {
        const stock = Array.isArray(partStockResult.value?.stock) ? partStockResult.value.stock : [];
        report.partStock = {
          lineCount: stock.length,
          totalQuantity: stock.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0),
        };
      }

      if (partBorrowResult.status === "fulfilled") {
        const data = partBorrowResult.value;
        const borrowed = Array.isArray(data?.borrowed) ? data.borrowed : Array.isArray(data) ? data : [];
        report.partBorrow.current = borrowed.length;
      }

      if (serverUsageResult.status === "fulfilled") {
        report.serverUsage.total = normalizeRecordList(serverUsageResult.value).length;
      }

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
  function downloadEmployeeList(setIsDownloading, exportAll) {
    setIsDownloading(true);
    Promise.all(
      report.employees.list.map((employee) =>
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
    isDownloadingEmployeesPdf,
    isDownloadingEmployeesExcel,
    handleDownloadDepartmentsPdf,
    handleDownloadDepartmentsExcel,
  };
}
