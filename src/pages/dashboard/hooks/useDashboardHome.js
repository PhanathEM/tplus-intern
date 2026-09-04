import { useEffect, useState } from "react";
import { fetchEmployees } from "../../../services/employeeService";
import { fetchDepartments } from "../../../services/departmentService";
import { fetchEquipmentByStatus, fetchEquipmentCategorySummary } from "../../../services/equipmentService";
import { fetchBorrowHistory } from "../../../services/borrowService";
import { fetchPartReplacements } from "../../../services/partReplacementService";
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
  "Server Usage": () => fetchServerUsage().then((data) => normalizeRecordList(data).length),
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

// Every equipment record (any category), each carrying status_name and
// category_name — grouped client-side into the two Home insight panels
// below instead of firing a separate request per breakdown.
function loadEquipmentInsights() {
  return fetchEquipmentByStatus().then((data) => {
    const items = Array.isArray(data) ? data : [];

    const statusCounts = new Map();
    const categoryCounts = new Map();

    items.forEach((item) => {
      const status = item.status_name || item.status || "Unknown";
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);

      const category = item.category_name || item.category || "Uncategorized";
      const current = categoryCounts.get(category) || { total: 0, occupied: 0 };
      current.total += 1;
      // An item with an owner on file is currently assigned/in use — the
      // closest real equivalent this data has to "occupied".
      if (item.owner_name) current.occupied += 1;
      categoryCounts.set(category, current);
    });

    const total = items.length || 1;
    const statusBreakdown = [...statusCounts.entries()]
      .map(([label, count]) => ({ label, count, percent: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const categoryOccupancy = [...categoryCounts.entries()]
      .map(([label, { total: categoryTotal, occupied }]) => ({
        label,
        total: categoryTotal,
        occupied,
        percent: categoryTotal > 0 ? Math.round((occupied / categoryTotal) * 100) : 0,
      }))
      // Every category, largest first - the panel scrolls rather than hiding
      // the smaller ones behind a top-four cut.
      .sort((a, b) => b.total - a.total);

    return { statusBreakdown, categoryOccupancy };
  });
}

export function useDashboardHome({ isActive, accessibleDashboardViews }) {
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(isActive);
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [categoryOccupancy, setCategoryOccupancy] = useState([]);
  const [isInsightsLoading, setIsInsightsLoading] = useState(isActive);

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

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    const canSeeEquipment = accessibleDashboardViews.includes("Equipments");

    (canSeeEquipment ? loadEquipmentInsights() : Promise.resolve(null))
      .then((result) => {
        if (ignore) return;
        setStatusBreakdown(result?.statusBreakdown || []);
        setCategoryOccupancy(result?.categoryOccupancy || []);
      })
      .catch(() => {
        if (ignore) return;
        setStatusBreakdown([]);
        setCategoryOccupancy([]);
      })
      .finally(() => {
        if (!ignore) setIsInsightsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isActive, accessibleDashboardViews]);

  return { stats, isLoading, statusBreakdown, categoryOccupancy, isInsightsLoading };
}
