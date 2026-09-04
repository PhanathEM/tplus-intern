export const ROLES = { ADMIN: "admin", VIEWER: "viewer" };

export const PERMISSIONS = {
  EMPLOYEE: "employee",
  DEPARTMENTS: "departments",
  EQUIPMENT: "equipment",
  ASSIGN_EQUIPMENT: "assign_equipment",
  CURRENTLY_BORROWED: "currently_borrowed",
  BORROW_HISTORY: "borrow_history",
  DEVICE_REPLACEMENT: "device_replacement",
  REPLACEMENT_HISTORY: "replacement_history",
  PART_STOCK: "part_stock",
  PART_BORROW: "part_borrow",
  LICENSE: "license",
  EQUIPMENT_STATUS: "equipment_status",
  EQUIPMENT_CATEGORY: "equipment_category",
  PART_TYPE: "part_type",
  PART_STATUS: "part_status",
  SERVICE_USAGE: "service_usage",
  REPORT: "report",
  USERS: "users",
  ACTIVITY_LOG: "activity_log",
  RECYCLE_BIN: "recycle_bin",
};

export const PERMISSION_DEFINITIONS = [
  { value: PERMISSIONS.EMPLOYEE, label: "Employee" },
  { value: PERMISSIONS.DEPARTMENTS, label: "Departments" },
  { value: PERMISSIONS.EQUIPMENT, label: "All Equipment" },
  { value: PERMISSIONS.ASSIGN_EQUIPMENT, label: "Assignation" },
  { value: PERMISSIONS.CURRENTLY_BORROWED, label: "Currently Borrowed" },
  { value: PERMISSIONS.BORROW_HISTORY, label: "Borrow History" },
  { value: PERMISSIONS.PART_STOCK, label: "Stock of Replace a Part" },
  { value: PERMISSIONS.PART_BORROW, label: "Borrow a Part" },
  { value: PERMISSIONS.DEVICE_REPLACEMENT, label: "Device Replacement" },
  { value: PERMISSIONS.REPLACEMENT_HISTORY, label: "Device Replacement History" },
  { value: PERMISSIONS.LICENSE, label: "Software License" },
  { value: PERMISSIONS.SERVICE_USAGE, label: "Server Usage" },
  { value: PERMISSIONS.REPORT, label: "Report" },
  { value: PERMISSIONS.USERS, label: "Users" },
  { value: PERMISSIONS.ACTIVITY_LOG, label: "Activity Log" },
  { value: PERMISSIONS.RECYCLE_BIN, label: "Recycle Bin" },
  { value: PERMISSIONS.EQUIPMENT_STATUS, label: "Status" },
  { value: PERMISSIONS.EQUIPMENT_CATEGORY, label: "Category" },
  { value: PERMISSIONS.PART_TYPE, label: "Part Types" },
  { value: PERMISSIONS.PART_STATUS, label: "Part Types Statuses" },
];

const ADMIN_ONLY_DEFAULT_PERMISSIONS = new Set([
  PERMISSIONS.REPORT,
  PERMISSIONS.USERS,
  PERMISSIONS.ACTIVITY_LOG,
  PERMISSIONS.RECYCLE_BIN,
  PERMISSIONS.EQUIPMENT_STATUS,
  PERMISSIONS.EQUIPMENT_CATEGORY,
  PERMISSIONS.PART_TYPE,
  PERMISSIONS.PART_STATUS,
  PERMISSIONS.ASSIGN_EQUIPMENT,
]);

export const ALL_PERMISSION_VALUES = PERMISSION_DEFINITIONS.map((permission) => permission.value);
export const DEFAULT_USER_PERMISSION_VALUES = ALL_PERMISSION_VALUES.filter(
  (permission) => !ADMIN_ONLY_DEFAULT_PERMISSIONS.has(permission)
);

const PERMISSION_LABEL_BY_VALUE = PERMISSION_DEFINITIONS.reduce(
  (labels, permission) => ({ ...labels, [permission.value]: permission.label }),
  {}
);

const PERMISSION_STORAGE_KEY = "tplus_user_permissions";
const EXPLICIT_PERMISSION_KEYS = [
  "permissions",
  "permission_keys",
  "permissionKeys",
  "user_permissions",
  "userPermissions",
];

export function isAdmin(user) {
  return String(user?.role ?? "").toLowerCase() === ROLES.ADMIN;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function parsePermissionInput(value) {
  if (Array.isArray(value)) return value;

  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([permission]) => permission);
  }

  if (typeof value !== "string") return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    return parsePermissionInput(JSON.parse(trimmed));
  } catch {
    return trimmed.split(",").map((permission) => permission.trim());
  }
}

function getPermissionToken(permission) {
  if (permission && typeof permission === "object") {
    return (
      permission.value ??
      permission.key ??
      permission.name ??
      permission.permission ??
      permission.permission_key ??
      permission.permissionKey
    );
  }

  return permission;
}

export function normalizePermissionValues(value) {
  const allowed = new Set(ALL_PERMISSION_VALUES);
  return [...new Set(parsePermissionInput(value).map(getPermissionToken).filter(Boolean).map(String))].filter(
    (permission) => allowed.has(permission)
  );
}

function getExplicitPermissionInput(user) {
  if (!user || typeof user !== "object") return null;
  const key = EXPLICIT_PERMISSION_KEYS.find((candidate) => hasOwn(user, candidate));
  return key ? user[key] : null;
}

function getUserPermissionStorageKey(user) {
  const id = user?.user_id ?? user?.id ?? user?.username;
  return id === undefined || id === null || id === "" ? null : String(id);
}

function readStoredPermissions() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(PERMISSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getStoredPermissionsForUser(user) {
  const key = getUserPermissionStorageKey(user);
  if (!key) return null;

  const stored = readStoredPermissions();
  return hasOwn(stored, key) ? normalizePermissionValues(stored[key]) : null;
}

export function rememberUserPermissions(user, permissions) {
  if (typeof window === "undefined") return;

  const key = getUserPermissionStorageKey(user);
  if (!key) return;

  const stored = readStoredPermissions();
  stored[key] = normalizePermissionValues(permissions);
  window.localStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify(stored));
}

export function mergeStoredPermissionsForUser(user) {
  const storedPermissions = getStoredPermissionsForUser(user);
  return storedPermissions ? { ...user, permissions: storedPermissions } : user;
}

export function normalizeUserPermissions(user) {
  const explicitPermissions = getExplicitPermissionInput(user);
  if (explicitPermissions !== null) return normalizePermissionValues(explicitPermissions);

  const storedPermissions = getStoredPermissionsForUser(user);
  if (storedPermissions !== null) return storedPermissions;

  return isAdmin(user) ? ALL_PERMISSION_VALUES : DEFAULT_USER_PERMISSION_VALUES;
}

export function hasPermission(user, permission) {
  if (!permission) return true;
  return normalizeUserPermissions(user).includes(permission);
}

export function getPermissionForNavItem(item) {
  return item?.permission || (item?.adminOnly ? PERMISSIONS.USERS : null);
}

export function canAccessNavItem(user, item) {
  if (!item) return false;

  if (item.children?.length) {
    return item.children.some((child) => canAccessNavItem(user, child));
  }

  return hasPermission(user, getPermissionForNavItem(item));
}

export function canAccessDashboardView(user, view, navItemsByLabel) {
  const item = navItemsByLabel[view];
  if (!item) return false;
  return hasPermission(user, getPermissionForNavItem(item));
}

export function getVisibleNavSections(user, navSections) {
  return navSections
    .map((section) => ({
      ...section,
      items: section.items
        .map((item) => {
          if (!item.children?.length) return item;
          const children = item.children.filter((child) => canAccessNavItem(user, child));
          return children.length > 0 ? { ...item, children } : null;
        })
        .filter((item) => item && canAccessNavItem(user, item)),
    }))
    .filter((section) => section.items.length > 0);
}

export function getAccessibleDashboardViews(user, navSections) {
  return navSections.flatMap((section) =>
    section.items.flatMap((item) => {
      // A `standalone` item (e.g. Settings) opens as its own page — its
      // children exist only to compute whether it's reachable at all
      // (canAccessNavItem's own children-OR check below), not as separate
      // routable views in their own right.
      if (item.standalone) {
        return canAccessNavItem(user, item) ? [item.label] : [];
      }
      const items = item.children?.length ? item.children : [item];
      return items
        .filter((candidate) => canAccessNavItem(user, candidate))
        .map((candidate) => candidate.label);
    })
  );
}

function identity(value) {
  return value;
}

export function getPermissionLabel(permission, t = identity) {
  return t(PERMISSION_LABEL_BY_VALUE[permission] || permission);
}

export function getPermissionSummary(user, maxLabels = 3, t = identity) {
  const permissions = normalizeUserPermissions(user);

  if (permissions.length === ALL_PERMISSION_VALUES.length) return t("All access");
  if (permissions.length === 0) return t("No access");

  const labels = permissions.map((permission) => getPermissionLabel(permission, t));
  const visibleLabels = labels.slice(0, maxLabels).join(", ");
  const remainingCount = labels.length - maxLabels;

  return remainingCount > 0 ? `${visibleLabels} ${t("more_count", { count: remainingCount })}` : visibleLabels;
}

// Coarse three-state summary for list views where the exact permission
// list is too long to show inline — "All access" (admin-equivalent),
// "Some access" (a limited custom set), or "No access" (nothing granted).
export function getAccessLevelSummary(user, t = identity) {
  const permissions = normalizeUserPermissions(user);
  if (permissions.length === ALL_PERMISSION_VALUES.length) return t("All access");
  if (permissions.length === 0) return t("No access");
  return t("Some access");
}

export function getAccessProfileLabel(user, t = identity) {
  const permissions = normalizeUserPermissions(user);
  if (permissions.length === ALL_PERMISSION_VALUES.length) return t("Full access");
  if (permissions.length === 0) return t("No pages assigned");
  return t("Custom access");
}

export function permissionsToRole(permissions) {
  return normalizePermissionValues(permissions).includes(PERMISSIONS.USERS)
    ? ROLES.ADMIN
    : ROLES.VIEWER;
}
