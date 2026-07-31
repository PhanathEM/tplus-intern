const LOW_STOCK_THRESHOLD = 2;
const BORROW_DUE_SOON_DAYS = 3;
const LICENSE_EXPIRY_WARNING_DAYS = 30;

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
    record.equipment_code ||
    record.service_tag ||
    `Equipment #${record.equipment_id || record.borrow_id || "N/A"}`
  );
}

function licenseName(record) {
  return record.product_name || record.product_type || `License #${record.license_id || "N/A"}`;
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
      targetView: "Employee",
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
      targetView: "Stock Available",
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
          targetView: "Stock Available",
          tone: count === 0 ? "danger" : "warning",
        });
      });
  }

  licenses
    .filter((license) => {
      const days = daysUntil(license.date_expire);
      const status = String(license.status || "").toLowerCase();
      return status.includes("expire") || (days !== null && days <= LICENSE_EXPIRY_WARNING_DAYS);
    })
    .slice(0, 5)
    .forEach((license) => {
      const days = daysUntil(license.date_expire);
      const isExpired = days !== null && days < 0;
      notifications.push({
        id: `license-expiry-${license.license_id || licenseName(license)}`,
        title: isExpired ? "License expired" : "License expiring soon",
        detail: `${licenseName(license)} ${isExpired ? "expired" : "expires"} on ${formatDate(license.date_expire)}`,
        time: isExpired ? "Needs renewal" : `${Math.max(days ?? 0, 0)} day${days === 1 ? "" : "s"} left`,
        targetView: "License",
        tone: isExpired ? "danger" : "warning",
      });
    });

  return notifications;
}
