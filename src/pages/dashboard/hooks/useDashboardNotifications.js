import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchCurrentBorrows } from "../../../services/borrowService";
import { fetchAvailableStock } from "../../../services/equipmentService";
import { fetchLicenses } from "../../../services/licenseService";
import { normalizeRecordList } from "../dashboard.utils";
import { navItemsByLabel } from "../dashboard.config";
import { canAccessDashboardView } from "../../../lib/permissions";
import { buildDashboardNotifications, getLicenseExpiryAlerts } from "../dashboard.notifications";

export function useDashboardNotifications({ user, onSelectView }) {
  const [readIds, setReadIds] = useState(() => new Set());
  const [data, setData] = useState({
    currentBorrows: [],
    availableStock: [],
    licenses: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let ignore = false;

    Promise.allSettled([fetchCurrentBorrows(), fetchAvailableStock(), fetchLicenses()])
      .then(([borrowsResult, stockResult, licensesResult]) => {
        if (ignore) return;

        const failures = [];
        if (borrowsResult.status === "rejected") failures.push("current borrows");
        if (stockResult.status === "rejected") failures.push("available stock");
        if (licensesResult.status === "rejected") failures.push("licenses");

        setData({
          currentBorrows:
            borrowsResult.status === "fulfilled" && Array.isArray(borrowsResult.value?.borrowed)
              ? borrowsResult.value.borrowed
              : [],
          availableStock:
            stockResult.status === "fulfilled" && Array.isArray(stockResult.value?.equipment)
              ? stockResult.value.equipment
              : [],
          licenses: licensesResult.status === "fulfilled" ? normalizeRecordList(licensesResult.value) : [],
        });
        setError(failures.length ? `Could not refresh ${failures.join(", ")} notifications.` : null);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [fetchToken]);

  function handleRetry() {
    setIsLoading(true);
    setError(null);
    setFetchToken((value) => value + 1);
  }

  // Stable DI targets for the hooks that own the underlying records
  // (Software License, Currently Borrowed) — they call these right after
  // fetching so the notification bell reflects fresh data without either
  // side knowing about the other's internals.
  const onLicensesLoaded = useCallback(
    (records) => setData((current) => ({ ...current, licenses: records })),
    []
  );
  const onBorrowsLoaded = useCallback(
    (records) => setData((current) => ({ ...current, currentBorrows: records })),
    []
  );

  const notifications = useMemo(
    () =>
      buildDashboardNotifications({ ...data, error }).map((item) => ({
        ...item,
        unread: !readIds.has(item.id),
      })),
    [data, error, readIds]
  );
  const visibleNotifications = useMemo(
    () =>
      notifications.filter(
        (item) => !item.targetView || canAccessDashboardView(user, item.targetView, navItemsByLabel)
      ),
    [notifications, user]
  );
  const licenseExpiryAlerts = useMemo(() => getLicenseExpiryAlerts(data.licenses), [data.licenses]);
  const sidebarBadges = useMemo(
    () =>
      licenseExpiryAlerts.length > 0
        ? { "Software License": { value: licenseExpiryAlerts.length, tone: "danger" } }
        : {},
    [licenseExpiryAlerts.length]
  );
  const unreadCount = visibleNotifications.filter((item) => item.unread).length;
  const hasUnread = unreadCount > 0;

  function handleMarkAllRead() {
    setReadIds((current) => {
      const next = new Set(current);
      visibleNotifications.forEach((item) => next.add(item.id));
      return next;
    });
  }

  function handleOpen(notification) {
    setReadIds((current) => new Set(current).add(notification.id));
    if (notification.targetView) {
      onSelectView?.(notification.targetView);
    }
    setIsOpen(false);
  }

  return {
    data,
    isLoading,
    error,
    handleRetry,
    onLicensesLoaded,
    onBorrowsLoaded,
    visibleNotifications,
    sidebarBadges,
    unreadCount,
    hasUnread,
    handleMarkAllRead,
    handleOpen,
    isOpen,
    setIsOpen,
  };
}
