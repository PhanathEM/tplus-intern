import { useEffect, useState } from "react";
import { fetchEmployees } from "../../../services/employeeService";
import { fetchDepartments } from "../../../services/departmentService";
import { fetchEquipmentCategorySummary } from "../../../services/equipmentService";
import { fetchBorrowHistory } from "../../../services/borrowService";
import { fetchPartReplacements } from "../../../services/partReplacementService";
import { fetchSsdUpgrades } from "../../../services/ssdUpgradeService";
import { fetchSsdProcurement } from "../../../services/ssdProcurementService";
import { fetchCloudRates } from "../../../services/cloudRateService";
import { fetchCloudUsage } from "../../../services/cloudUsageService";
import { fetchServerUsage } from "../../../services/serverUsageService";
import { fetchUsers } from "../../../services/userService";
import { fetchRecycleBin } from "../../../services/recycleBinService";
import { normalizeRecordList } from "../dashboard.utils";

const HOME_STAT_FETCHERS = {
  Employees: () => fetchEmployees().then((data) => (Array.isArray(data) ? data.length : 0)),
  Departments: () => fetchDepartments().then((data) => (Array.isArray(data) ? data.length : 0)),
  Equipments: () =>
    fetchEquipmentCategorySummary().then((data) =>
      Array.isArray(data) ? data.reduce((sum, category) => sum + (category.total_items || 0), 0) : 0
    ),
  "Borrow History": () =>
    fetchBorrowHistory({}).then((data) => (Array.isArray(data?.history) ? data.history.length : 0)),
  "Device Replacement": () =>
    fetchPartReplacements().then((data) =>
      typeof data?.count === "number" ? data.count : Array.isArray(data?.replacements) ? data.replacements.length : 0
    ),
  "SSD Upgrade": () => fetchSsdUpgrades().then((data) => normalizeRecordList(data).length),
  "SSD Procurement": () => fetchSsdProcurement().then((data) => normalizeRecordList(data).length),
  "Cloud Rate": () => fetchCloudRates().then((data) => normalizeRecordList(data).length),
  "Cloud Usage": () => fetchCloudUsage().then((data) => normalizeRecordList(data).length),
  "Service Usage": () => fetchServerUsage().then((data) => normalizeRecordList(data).length),
  Users: () =>
    fetchUsers().then((data) => {
      const list = Array.isArray(data) ? data : data?.users;
      return Array.isArray(list) ? list.length : 0;
    }),
  "Recycle Bin": () =>
    fetchRecycleBin().then((data) =>
      typeof data?.count === "number" ? data.count : Array.isArray(data?.items) ? data.items.length : 0
    ),
};

export function useDashboardHome({ isActive, accessibleDashboardViews }) {
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(isActive);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    const labels = Object.keys(HOME_STAT_FETCHERS).filter((label) => accessibleDashboardViews.includes(label));

    Promise.allSettled(labels.map((label) => HOME_STAT_FETCHERS[label]()))
      .then((results) => {
        if (ignore) return;
        const next = {};
        results.forEach((result, index) => {
          next[labels[index]] = result.status === "fulfilled" ? result.value : null;
        });
        setStats((current) => ({ ...current, ...next }));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isActive, accessibleDashboardViews]);

  return { stats, isLoading };
}
