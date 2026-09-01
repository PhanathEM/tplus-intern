import { useMemo } from "react";
import {
  canAccessDashboardView,
  getAccessibleDashboardViews,
  getVisibleNavSections,
  hasPermission,
  isAdmin,
  PERMISSIONS,
} from "../../../lib/permissions";
import { navSections, navItemsByLabel } from "../dashboard.config";

export function useDashboardPermissions({ user }) {
  const canCreateRecords = isAdmin(user);
  const canManageEquipment = hasPermission(user, PERMISSIONS.EQUIPMENT);
  const canManageDepartments = hasPermission(user, PERMISSIONS.DEPARTMENTS);
  const canManageEmployees = hasPermission(user, PERMISSIONS.EMPLOYEE);
  const canManageBorrows = hasPermission(user, PERMISSIONS.CURRENTLY_BORROWED);
  const canManageActivityLog = hasPermission(user, PERMISSIONS.ACTIVITY_LOG);
  const canManageRecycleBin = hasPermission(user, PERMISSIONS.RECYCLE_BIN);

  const accessibleDashboardViews = useMemo(
    () => getAccessibleDashboardViews(user, navSections),
    [user]
  );
  const firstAccessibleDashboardView = accessibleDashboardViews[0] || null;
  const canManageUsers = canAccessDashboardView(user, "Users", navItemsByLabel);
  const canManageStatuses = canAccessDashboardView(user, "Statuses", navItemsByLabel);
  const canManageCategory = canAccessDashboardView(user, "Category", navItemsByLabel);
  const canManagePartTypes = canAccessDashboardView(user, "Part Types", navItemsByLabel);
  const canManagePartStatuses = canAccessDashboardView(user, "Part Types Statuses", navItemsByLabel);
  const canManageAssign = canAccessDashboardView(user, "Assign", navItemsByLabel);

  const visibleHomeNavSections = useMemo(
    () => getVisibleNavSections(user, navSections).filter((section) => section.label !== "Overview"),
    [user]
  );

  return {
    canCreateRecords,
    canManageEquipment,
    canManageDepartments,
    canManageEmployees,
    canManageBorrows,
    canManageActivityLog,
    canManageRecycleBin,
    accessibleDashboardViews,
    firstAccessibleDashboardView,
    canManageUsers,
    canManageStatuses,
    canManageCategory,
    canManagePartTypes,
    canManagePartStatuses,
    canManageAssign,
    visibleHomeNavSections,
  };
}
