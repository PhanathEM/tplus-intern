const LOW_STOCK_THRESHOLD = 2;
const BORROW_DUE_SOON_DAYS = 3;
export const LICENSE_EXPIRY_WARNING_DAYS = 7;

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysUntil(value) {
  const date = parseDate(value);
  if (!date) return null;
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - startOfToday().getTime()) / 86400000);
}

function formatDate(value) {
  const date = parseDate(value);
  if (!date) return "unknown date";
  return date.toISOString().slice(0, 10);
}

function equipmentName(record) {
  return (
    record.computer_name ||
    record.device_model ||
    record.asset_code ||
    record.equipment_code ||
    record.service_tag ||
    `Equipment #${record.equipment_id || record.borrow_id || "N/A"}`
  );
}

function licenseName(record) {
  return record.product_name || record.product_type || `License #${record.license_id || "N/A"}`;
}

export function getLicenseExpiryInfo(record) {
  const days = daysUntil(record.date_expire);
  const status = String(record.status || "").toLowerCase();
  const statusLooksExpired = /\bexpired\b/.test(status);

  if (statusLooksExpired || (days !== null && days < 0)) {
    return {
      days,
      isExpired: true,
      tone: "danger",
      label: "Expired",
      dateLabel: formatDate(record.date_expire),
    };
  }

  if (days !== null && days <= LICENSE_EXPIRY_WARNING_DAYS) {
    return {
      days,
      isExpired: false,
      tone: "warning",
      label: days === 0 ? "Expires today" : `${days} day${days === 1 ? "" : "s"} left`,
      dateLabel: formatDate(record.date_expire),
    };
  }

  return null;
}

export function getLicenseExpiryAlerts(licenses = []) {
  return licenses
    .map((license) => ({ license, info: getLicenseExpiryInfo(license) }))
    .filter((item) => item.info)
    .sort((a, b) => (a.info.days ?? -9999) - (b.info.days ?? -9999));
}

function groupStockByCategory(stock) {
  const groups = new Map();

  for (const item of stock) {
    const category = item.category || item.category_name || item.device_type || "Uncategorized";
    groups.set(category, (groups.get(category) || 0) + 1);
  }

  return [...groups.entries()].sort((a, b) => a[1] - b[1]);
}

export function buildDashboardNotifications({ currentBorrows = [], availableStock = [], licenses = [], error }) {
  const notifications = [];

  if (error) {
    notifications.push({
      id: "system-notification-refresh-error",
      title: "Notification refresh failed",
      detail: error,
      time: "Just now",
      targetView: "Employees",
      tone: "danger",
    });
  }

  currentBorrows
    .filter((loan) => loan.is_overdue || (daysUntil(loan.expected_return_date) ?? 1) < 0)
    .slice(0, 5)
    .forEach((loan) => {
      notifications.push({
        id: `borrow-overdue-${loan.borrow_id || loan.equipment_id || equipmentName(loan)}`,
        title: "Borrow overdue",
        detail: `${equipmentName(loan)} was due ${formatDate(loan.expected_return_date)}${
          loan.borrower_name ? ` by ${loan.borrower_name}` : ""
        }`,
        time: "Needs action",
        targetView: "Currently Borrowed",
        tone: "danger",
      });
    });

  currentBorrows
    .filter((loan) => {
      const days = daysUntil(loan.expected_return_date);
      return days !== null && days >= 0 && days <= BORROW_DUE_SOON_DAYS && !loan.is_overdue;
    })
    .slice(0, 3)
    .forEach((loan) => {
      const days = daysUntil(loan.expected_return_date);
      notifications.push({
        id: `borrow-due-soon-${loan.borrow_id || loan.equipment_id || equipmentName(loan)}`,
        title: "Borrow return due soon",
        detail: `${equipmentName(loan)} is due ${days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`}`,
        time: formatDate(loan.expected_return_date),
        targetView: "Currently Borrowed",
        tone: "warning",
      });
    });

  if (availableStock.length === 0) {
    notifications.push({
      id: "stock-empty",
      title: "No available stock",
      detail: "There is no unassigned equipment available.",
      time: "Stock alert",
      targetView: "Equipments",
      tone: "danger",
    });
  } else {
    groupStockByCategory(availableStock)
      .filter(([, count]) => count <= LOW_STOCK_THRESHOLD)
      .slice(0, 4)
      .forEach(([category, count]) => {
        notifications.push({
          id: `stock-low-${category}`,
          title: "Low stock",
          detail: `${category} has ${count} available item${count === 1 ? "" : "s"} left.`,
          time: "Stock alert",
          targetView: "Equipments",
          tone: count === 0 ? "danger" : "warning",
        });
      });
  }

  getLicenseExpiryAlerts(licenses)
    .slice(0, 5)
    .forEach(({ license, info }) => {
      notifications.push({
        id: `license-expiry-${license.license_id || licenseName(license)}`,
        title: info.isExpired ? "Software license expired" : "Software license expiring soon",
        detail: `${licenseName(license)} ${info.isExpired ? "expired" : "expires"} on ${info.dateLabel}`,
        time: info.isExpired ? "Needs renewal" : info.label,
        targetView: "Software License",
        tone: info.tone,
      });
    });

  return notifications;
}
