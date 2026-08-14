export const ROLES = { ADMIN: "admin", VIEWER: "viewer" };

export const PERMISSIONS = {
  EMPLOYEE: "employee",
  DEPARTMENTS: "departments",
  EQUIPMENT: "equipment",
  ASSIGN_EQUIPMENT: "assign_equipment",
  CURRENTLY_BORROWED: "currently_borrowed",
  BORROW_HISTORY: "borrow_history",
  DEVICE_REPLACEMENT: "device_replacement",
  PART_STOCK: "part_stock",
  SSD_UPGRADE: "ssd_upgrade",
  SSD_PROCUREMENT: "ssd_procurement",
  ANTIVIRUS_INSTALL: "antivirus_install",
  LICENSE: "license",
  EQUIPMENT_STATUS: "equipment_status",
  CLOUD_RATE: "cloud_rate",
  CLOUD_USAGE: "cloud_usage",
  SERVICE_USAGE: "service_usage",
  USERS: "users",
  ACTIVITY_LOG: "activity_log",
  RECYCLE_BIN: "recycle_bin",
};

export const PERMISSION_DEFINITIONS = [
  { value: PERMISSIONS.EMPLOYEE, label: "Employee" },
  { value: PERMISSIONS.DEPARTMENTS, label: "Departments" },
  { value: PERMISSIONS.EQUIPMENT, label: "All Equipment" },
  { value: PERMISSIONS.ASSIGN_EQUIPMENT, label: "Assign" },
  { value: PERMISSIONS.CURRENTLY_BORROWED, label: "Currently Borrowed" },
  { value: PERMISSIONS.BORROW_HISTORY, label: "Borrow History" },
  { value: PERMISSIONS.PART_STOCK, label: "Stock of Replace a Part" },
  { value: PERMISSIONS.DEVICE_REPLACEMENT, label: "Device Replacement" },
  { value: PERMISSIONS.SSD_UPGRADE, label: "SSD Upgrade" },
  { value: PERMISSIONS.SSD_PROCUREMENT, label: "SSD Procurement" },
  { value: PERMISSIONS.ANTIVIRUS_INSTALL, label: "Antivirus Install" },
  { value: PERMISSIONS.LICENSE, label: "Software License" },
  { value: PERMISSIONS.CLOUD_RATE, label: "Cloud Rate" },
  { value: PERMISSIONS.CLOUD_USAGE, label: "Cloud Usage" },
  { value: PERMISSIONS.SERVICE_USAGE, label: "Service Usage" },
  { value: PERMISSIONS.USERS, label: "Users" },
  { value: PERMISSIONS.ACTIVITY_LOG, label: "Activity Log" },
  { value: PERMISSIONS.RECYCLE_BIN, label: "Recycle Bin" },
  { value: PERMISSIONS.EQUIPMENT_STATUS, label: "Status" },
];

const ADMIN_ONLY_DEFAULT_PERMISSIONS = new Set([
  PERMISSIONS.USERS,
  PERMISSIONS.ACTIVITY_LOG,
  PERMISSIONS.RECYCLE_BIN,
  PERMISSIONS.EQUIPMENT_STATUS,
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
      const items = item.children?.length ? item.children : [item];
      return items
        .filter((candidate) => canAccessNavItem(user, candidate))
        .map((candidate) => candidate.label);
    })
  );
}

export function getPermissionLabel(permission) {
  return PERMISSION_LABEL_BY_VALUE[permission] || permission;
}

export function getPermissionSummary(user, maxLabels = 3) {
  const permissions = normalizeUserPermissions(user);

  if (permissions.length === ALL_PERMISSION_VALUES.length) return "All access";
  if (permissions.length === 0) return "No access";

  const labels = permissions.map(getPermissionLabel);
  const visibleLabels = labels.slice(0, maxLabels).join(", ");
  const remainingCount = labels.length - maxLabels;

  return remainingCount > 0 ? `${visibleLabels} +${remainingCount} more` : visibleLabels;
}

export function getAccessProfileLabel(user) {
  const permissions = normalizeUserPermissions(user);
  if (permissions.length === ALL_PERMISSION_VALUES.length) return "Full access";
  if (permissions.length === 0) return "No pages assigned";
  return "Custom access";
}

export function permissionsToRole(permissions) {
  return normalizePermissionValues(permissions).includes(PERMISSIONS.USERS)
    ? ROLES.ADMIN
    : ROLES.VIEWER;
}
