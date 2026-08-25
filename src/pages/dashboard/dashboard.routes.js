import { navItemsByLabel } from "./dashboard.config";

export const DASHBOARD_APP_TITLE = "TPLUS Management System";
export const DASHBOARD_BASE_PATH = "/dashboard";
export const DASHBOARD_DEFAULT_VIEW = "Dashboard";

export const dashboardRouteByView = {
  Dashboard: "dashboard",
  Employees: "employee",
  Departments: "departments",
  Equipments: "equipment",
  Assign: "assign",
  "Currently Borrowed": "currently-borrowed",
  "Borrow History": "borrow-history",
  "Stock of Replace a Part": "part-stock",
  "Borrow a Part": "part-borrow",
  "Device Replacement": "device-replacement",
  "Device Replacement History": "replacement-history",
  "SSD Upgrade": "ssd-upgrade",
  "SSD Procurement": "ssd-procurement",
  "Software License": "license",
  "Cloud Rate": "cloud-rate",
  "Cloud Usage": "cloud-usage",
  "Server Usage": "server-usage",
  Statuses: "statuses",
  Category: "category",
  "Part Types": "part-types",
  Users: "users",
  "Activity Log": "activity-log",
  "Recycle Bin": "recycle-bin",
};

const dashboardViewByRoute = Object.fromEntries(
  Object.entries(dashboardRouteByView).map(([view, route]) => [route, view])
);

export function getDashboardPathForView(view) {
  const route = dashboardRouteByView[view] || dashboardRouteByView[DASHBOARD_DEFAULT_VIEW];
  return `${DASHBOARD_BASE_PATH}/${route}`;
}

export function getDashboardTitle(view) {
  if (!navItemsByLabel[view]) return DASHBOARD_APP_TITLE;
  return `${view} | ${DASHBOARD_APP_TITLE}`;
}

export function getDashboardViewFromPath(pathname) {
  const cleanPath = pathname.replace(/\/+$/, "") || "/";

  if (cleanPath === "/" || cleanPath === DASHBOARD_BASE_PATH) {
    return DASHBOARD_DEFAULT_VIEW;
  }

  const prefix = `${DASHBOARD_BASE_PATH}/`;
  if (!cleanPath.startsWith(prefix)) return null;

  const route = cleanPath.slice(prefix.length).split("/")[0].toLowerCase();
  return dashboardViewByRoute[route] || null;
}

export function getInitialDashboardView() {
  if (typeof window === "undefined") return DASHBOARD_DEFAULT_VIEW;
  return getDashboardViewFromPath(window.location.pathname) || DASHBOARD_DEFAULT_VIEW;
}

export function syncDashboardPath(view, mode = "push") {
  if (typeof window === "undefined") return;

  const nextPath = getDashboardPathForView(view);
  if (window.location.pathname === nextPath) return;

  const method = mode === "replace" ? "replaceState" : "pushState";
  window.history[method]({ activeView: view }, "", nextPath);
}
