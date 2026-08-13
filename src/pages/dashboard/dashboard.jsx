import { useEffect, useRef, useState } from "react";
import {
  FiBell as Bell,
  FiBox as Box,
  FiChevronDown as ChevronDown,
  FiLogOut as LogOut,
  FiMenu as Menu,
  FiRefreshCw as RefreshCw,
  FiSearch as Search,
  FiSettings as Settings,
  FiUser as UserIcon,
  FiX as X,
} from "react-icons/fi";
import { useEmployees } from "./features/employees/useEmployees";
import { useEquipment } from "./features/equipment/useEquipment";
import { useAssign } from "./features/assign/useAssign";
import { useCurrentBorrows } from "./features/borrow/useCurrentBorrows";
import { useBorrowHistory } from "./features/borrow/useBorrowHistory";
import { useGlobalSearch } from "./hooks/useGlobalSearch";
import { useUsers } from "./features/users/useUsers";
import { useDepartments } from "./features/departments/useDepartments";
import { useStatuses } from "./features/statuses/useStatuses";
import { useDashboardNotifications } from "./hooks/useDashboardNotifications";
import { useDashboardRouting } from "./hooks/useDashboardRouting";
import { useDashboardHome } from "./hooks/useDashboardHome";
import { EMPLOYEES_PAGE_SIZE, navItemsByLabel } from "./dashboard.config";
import { getEquipmentDisplayName } from "./dashboard.utils";
import { ConfirmDialog, EmptyState } from "./components/SharedControls";
import { SidebarBrand, SidebarNavigation } from "./components/Sidebar";
import { GlobalSearch } from "./components/GlobalSearch";
import {
  BorrowEquipmentModal,
  ColumnsPickerModal,
  EquipmentFormModal,
  EquipmentView,
  ReturnEquipmentModal,
  SoftwareLicensePickerModal,
} from "./features/equipment/EquipmentViews";
import {
  AntivirusView,
  CloudRatesView,
  CloudUsageView,
  LicenseFormModal,
  LicensesView,
  ServerUsageView,
  SsdProcurementView,
  SsdUpgradesView,
} from "./features/records/OperationalRecordViews";
import {
  DeviceReplacementCategoryBar,
  ReplaceableDevicesView,
  ReplaceDeviceDialog,
} from "./features/device-replacement/ReplacementView";
import { useReplacements } from "./features/device-replacement/useReplacements";
import { useSsdUpgrades } from "./features/records/useSsdUpgrades";
import { useSsdProcurement } from "./features/records/useSsdProcurement";
import { useAntivirus } from "./features/records/useAntivirus";
import { useCloudRates } from "./features/records/useCloudRates";
import { useServerUsage } from "./features/records/useServerUsage";
import { useCloudUsage } from "./features/records/useCloudUsage";
import { useLicenses } from "./features/records/useLicenses";
import {
  CategoryFormModal,
  DepartmentFormModal,
  DepartmentsView,
} from "./features/departments/DepartmentViews";
import { BorrowHistoryView, CurrentBorrowsView } from "./features/borrow/BorrowViews";
import {
  EmployeeDetailModal,
  EmployeeDirectoryTable,
  EmployeeFormModal,
  EmployeeSearchPanel,
} from "./features/employees/EmployeeViews";
import { ResetPasswordModal, UserPermissionsModal, UsersView } from "./features/users/UserViews";
import { StatusesView, StatusFormModal } from "./features/statuses/StatusViews";
import { AssignEquipmentView } from "./features/assign/AssignView";
import { ActivityLogView, MyActivityView } from "./features/activity/ActivityViews";
import { useActivityLog } from "./features/activity/useActivityLog";
import { useMyActivity } from "./features/activity/useMyActivity";
import { getAccessProfileLabel } from "../../lib/permissions";
import { useDashboardPermissions } from "./hooks/useDashboardPermissions";
import { ACTIVITY_ACTION_VALUES, ACTIVITY_MODULE_VALUES } from "../../lib/activityLog";
import { RecycleBinView } from "./features/recycle-bin/RecycleBinViews";
import { useRecycleBin } from "./features/recycle-bin/useRecycleBin";
import { DashboardHomeView } from "./features/home/DashboardHomeView";

function Dashboard({ user, onLogout }) {
  const permissions = useDashboardPermissions({ user });
  const {
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
    canManageAssign,
    visibleHomeNavSections,
  } = permissions;
  const activityLog = useActivityLog();
  const myActivity = useMyActivity({ entries: activityLog.entries, user });

  const routing = useDashboardRouting({
    user,
    accessibleDashboardViews,
    firstAccessibleDashboardView,
    onSelectView: handleSelectView,
  });
  const { activeView, hasActiveViewAccess } = routing;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const notifications = useDashboardNotifications({ user, onSelectView: handleSelectView });
  const isDashboardHomeView = activeView === "Dashboard" && hasActiveViewAccess;
  const home = useDashboardHome({ isActive: isDashboardHomeView, accessibleDashboardViews });

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuCloseTimeout = useRef(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const globalSearch = useGlobalSearch({
    user,
    onSelectView: handleSelectView,
    onSelectEmployee: (item) => employees.handleViewSearchDetail(item),
    onSelectEquipmentCategory: (category) =>
      equipment.handleViewCategory(equipment.resolveView(category) || "All"),
  });

  function handleSelectGlobalSearchResult(type, item) {
    globalSearch.handleSelectResult(type, item);
    setIsMobileSearchOpen(false);
  }

  const notificationsRef = useRef(null);
  const profileMenuRef = useRef(null);
  const displayName = user?.name || "Admin User";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleSelectView(label, options) {
    // Every feature hook exposes `resetForEntry()` so switching into its view
    // flips the loading spinner instantly, without this composition root
    // reaching into any hook's internal state directly.
    const resetMap = {
      "All Equipment": equipment.resetForEntry,
      "Device Replacement": replacements.resetForEntry,
      "SSD Upgrade": ssdUpgrades.resetForEntry,
      "SSD Procurement": ssdProcurement.resetForEntry,
      "Antivirus Install": antivirus.resetForEntry,
      "Software License": licenses.resetForEntry,
      "Cloud Rate": cloudRates.resetForEntry,
      "Service Usage": serverUsage.resetForEntry,
      "Cloud Usage": cloudUsage.resetForEntry,
      "Currently Borrowed": currentBorrows.resetForEntry,
      "Borrow History": borrowHistory.resetForEntry,
      Employee: employees.resetForEntry,
      Departments: departments.resetForEntry,
    };

    if (label !== activeView) {
      resetMap[label]?.();
    }

    const changed = routing.setActiveView(label, options);
    if (changed) setIsMobileSidebarOpen(false);
  }

  useEffect(() => {
    function handlePointerDown(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        notifications.setIsOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        notifications.setIsOpen(false);
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      if (profileMenuCloseTimeout.current) {
        clearTimeout(profileMenuCloseTimeout.current);
      }
    };
  }, []);

  const activeNavItem = navItemsByLabel[activeView];
  const isEmployeeView = activeView === "Employee" && hasActiveViewAccess;
  const isDepartmentsView = activeView === "Departments" && hasActiveViewAccess;
  const isEquipmentView = activeView === "All Equipment" && hasActiveViewAccess;
  const isReplacementView = activeView === "Device Replacement" && hasActiveViewAccess;
  const isSsdUpgradeView = activeView === "SSD Upgrade" && hasActiveViewAccess;
  const isSsdProcurementView = activeView === "SSD Procurement" && hasActiveViewAccess;
  const isAntivirusView = activeView === "Antivirus Install" && hasActiveViewAccess;
  const isLicenseView = activeView === "Software License" && hasActiveViewAccess;
  const isCloudRateView = activeView === "Cloud Rate" && hasActiveViewAccess;
  const isServerUsageView = activeView === "Service Usage" && hasActiveViewAccess;
  const isCloudUsageView = activeView === "Cloud Usage" && hasActiveViewAccess;
  const isAssignView = activeView === "Assign" && hasActiveViewAccess;
  const isCurrentBorrowsView = activeView === "Currently Borrowed" && hasActiveViewAccess;
  const isBorrowHistoryView = activeView === "Borrow History" && hasActiveViewAccess;
  const isUsersView = activeView === "Users" && hasActiveViewAccess;
  const isStatusView = activeView === "Status" && hasActiveViewAccess;
  const isMyActivityView = activeView === "My Activity" && hasActiveViewAccess;
  const isActivityLogView = activeView === "Activity Log" && hasActiveViewAccess;
  const isRecycleBinView = activeView === "Recycle Bin" && hasActiveViewAccess;

  const departments = useDepartments({
    isActive: isDepartmentsView,
    user,
  });

  const employees = useEmployees({
    isActive: isEmployeeView,
    user,
    loadDepartments: departments.loadDepartments,
  });

  const replacements = useReplacements({ isActive: isReplacementView, user });
  const ssdUpgrades = useSsdUpgrades({ isActive: isSsdUpgradeView });
  const ssdProcurement = useSsdProcurement({ isActive: isSsdProcurementView });
  const antivirus = useAntivirus({ isActive: isAntivirusView });
  const cloudRates = useCloudRates({ isActive: isCloudRateView });
  const serverUsage = useServerUsage({ isActive: isServerUsageView });
  const cloudUsage = useCloudUsage({ isActive: isCloudUsageView });
  const licenses = useLicenses({
    isActive: isLicenseView,
    user,
    onLicensesLoaded: notifications.onLicensesLoaded,
  });
  const statuses = useStatuses({ isActive: isStatusView, user });
  const users = useUsers({ isActive: isUsersView, user });

  const equipment = useEquipment({
    isActive: isEquipmentView,
    user,
    loadDepartments: departments.loadDepartments,
    onEquipmentMutated: notifications.handleRetry,
    onEquipmentUnassigned: employees.refreshAfterExternalEquipmentChange,
  });

  const recycleBin = useRecycleBin({
    isActive: isRecycleBinView,
    onRestore: () => {
      employees.handleRetry();
      departments.handleRetry();
      equipment.handleRetry();
    },
  });

  const assign = useAssign({
    isActive: isAssignView,
    user,
    onAssigned: () => {
      equipment.handleRetry();
      notifications.handleRetry();
    },
  });
  const currentBorrows = useCurrentBorrows({
    isActive: isCurrentBorrowsView,
    user,
    onBorrowsLoaded: notifications.onBorrowsLoaded,
    onBorrowed: () => {
      equipment.handleRetry();
      notifications.handleRetry();
    },
    onReturned: notifications.handleRetry,
  });
  const borrowHistory = useBorrowHistory({ isActive: isBorrowHistoryView });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 antialiased">
      <div className="flex min-h-screen">
        {/* Mobile sidebar */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-40 xl:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/60"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label="Close navigation"
            />
            <aside className="relative flex h-full w-72 flex-col bg-slate-950 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pr-3">
                <SidebarBrand collapsed={false} />
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-300 outline-none transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  aria-label="Close sidebar"
                >
                  <X />
                </button>
              </div>
              <SidebarNavigation activeView={activeView} onSelect={handleSelectView} user={user} badges={notifications.sidebarBadges} />
            </aside>
          </div>
        )}

        {/* Desktop sidebar */}
        <aside
          className={`sticky top-0 hidden h-screen min-h-0 shrink-0 flex-col bg-slate-950 transition-[width] duration-200 xl:flex ${isSidebarCollapsed ? "w-19" : "w-64"
            }`}
        >
          <SidebarBrand
            collapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}
          />
          <SidebarNavigation
            collapsed={isSidebarCollapsed}
            activeView={activeView}
            onSelect={handleSelectView}
            user={user}
            badges={notifications.sidebarBadges}
          />
        </aside>


        {/* Main content */}
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
              {isMobileSearchOpen ? (
                <div className="flex flex-1 items-center gap-2">
                  <GlobalSearch
                    autoFocus
                    className="flex-1"
                    value={globalSearch.query}
                    onChange={globalSearch.handleQueryChange}
                    results={globalSearch.results}
                    isLoading={globalSearch.isLoading}
                    onSelect={handleSelectGlobalSearchResult}
                  />
                  <button
                    type="button"
                    onClick={() => setIsMobileSearchOpen(false)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    aria-label="Close search"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white xl:hidden"
                    aria-label="Open navigation"
                  >
                    <Menu className="text-lg" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <h1 className="truncate text-[17px] font-semibold text-slate-950">{activeView}</h1>
                  </div>

                  <GlobalSearch
                    className="hidden w-72 shrink-0 lg:block"
                    value={globalSearch.query}
                    onChange={globalSearch.handleQueryChange}
                    results={globalSearch.results}
                    isLoading={globalSearch.isLoading}
                    onSelect={handleSelectGlobalSearchResult}
                  />

                  <button
                    type="button"
                    onClick={() => setIsMobileSearchOpen(true)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white lg:hidden"
                    aria-label="Open search"
                  >
                    <Search size={18} />
                  </button>

                  <div className="relative" ref={notificationsRef}>
                    <button
                      type="button"
                      onClick={() => {
                        notifications.setIsOpen((value) => !value);
                        setIsProfileMenuOpen(false);
                      }}
                      className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      aria-label="Notifications"
                      aria-haspopup="true"
                      aria-expanded={notifications.isOpen}
                    >
                      <Bell size={18} />
                      {notifications.hasUnread && (
                        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                          {notifications.unreadCount > 9 ? "9+" : notifications.unreadCount}
                        </span>
                      )}
                    </button>

                    {notifications.isOpen && (
                      <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">Notifications</p>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              {notifications.unreadCount} unread
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={notifications.handleRetry}
                              disabled={notifications.isLoading}
                              className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label="Refresh notifications"
                              title="Refresh notifications"
                            >
                              <RefreshCw size={13} className={notifications.isLoading ? "animate-spin" : ""} />
                            </button>
                            <button
                              type="button"
                              onClick={notifications.handleMarkAllRead}
                              disabled={notifications.visibleNotifications.length === 0}
                              className="rounded text-xs font-semibold text-orange-600 outline-none transition hover:text-orange-700 focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed disabled:text-slate-300"
                            >
                              Mark all as read
                            </button>
                          </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.isLoading && notifications.visibleNotifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-[13px] text-slate-500">
                              Loading notifications...
                            </div>
                          ) : notifications.visibleNotifications.length === 0 ? (
                            <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
                          ) : (
                            notifications.visibleNotifications.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => notifications.handleOpen(item)}
                                className="flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left outline-none transition last:border-b-0 hover:bg-slate-50 focus-visible:bg-slate-50"
                              >
                                <span
                                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.unread
                                    ? item.tone === "danger"
                                      ? "bg-rose-500"
                                      : "bg-orange-500"
                                    : "bg-transparent"
                                    }`}
                                />
                                <div className="min-w-0">
                                  <p className="text-[13px] font-semibold text-slate-950">{item.title}</p>
                                  <p className="mt-0.5 text-[13px] text-slate-500">{item.detail}</p>
                                  <p className="mt-1 text-[11px] text-slate-400">{item.time}</p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    className="relative hidden sm:block"
                    ref={profileMenuRef}
                    onMouseEnter={() => {
                      if (profileMenuCloseTimeout.current) {
                        clearTimeout(profileMenuCloseTimeout.current);
                      }
                      setIsProfileMenuOpen(true);
                      notifications.setIsOpen(false);
                    }}
                    onMouseLeave={() => {
                      profileMenuCloseTimeout.current = window.setTimeout(() => {
                        setIsProfileMenuOpen(false);
                      }, 150);
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen((value) => !value);
                        notifications.setIsOpen(false);
                      }}
                      className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      aria-haspopup="true"
                      aria-expanded={isProfileMenuOpen}
                    >
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                        {initials}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{displayName}</span>
                      <ChevronDown
                        size={14}
                        className={`text-slate-400 transition-transform ${isProfileMenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isProfileMenuOpen && (
                      <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                        <div className="border-b border-slate-100 px-3 py-2">
                          <p className="truncate text-sm font-semibold text-slate-950">{displayName}</p>
                          <p className="truncate text-xs text-slate-500">{getAccessProfileLabel(user)}</p>
                        </div>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-slate-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400"
                        >
                          <UserIcon size={15} />
                          View profile
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-slate-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400"
                        >
                          <Settings size={15} />
                          Account settings
                        </button>
                        <button
                          type="button"
                          onClick={onLogout}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-rose-600 outline-none transition hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-orange-400"
                        >
                          <LogOut size={15} />
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </header>

          {isDashboardHomeView && (
            <DashboardHomeView
              navSections={visibleHomeNavSections}
              stats={{
                ...home.stats,
                "Currently Borrowed": notifications.data.currentBorrows.length,
                "Software License": notifications.data.licenses.length,
                "My Activity": myActivity.entries.length,
                "Activity Log": activityLog.entries.length,
              }}
              isStatsLoading={home.isLoading}
              onSelectView={handleSelectView}
              notifications={notifications.visibleNotifications}
              onOpenNotification={notifications.handleOpen}
              recentActivity={myActivity.entries}
            />
          )}

          {(isEquipmentView) && (
            <EquipmentView
              canManage={canManageEquipment}
              canCreate={canCreateRecords}
              categories={equipment.categories}
              isLoading={equipment.isLoading}
              error={equipment.error}
              onRetry={equipment.handleRetry}
              selectedCategory={equipment.category}
              onSelectCategory={equipment.handleSelectCategory}
              items={equipment.items}
              columns={equipment.tableColumns}
              isItemsLoading={equipment.isItemsLoading}
              itemsError={equipment.itemsError}
              onAddNew={equipment.handleOpenAddItem}
              onEdit={equipment.handleOpenEditItem}
              onUnassign={equipment.handleOpenUnassign}
              onDelete={equipment.handleOpenDelete}
              onBorrow={currentBorrows.handleOpenBorrow}
              onAddCategory={equipment.handleOpenAddCategory}
              onEditCategory={equipment.handleOpenEditCategory}
              onDeleteCategory={equipment.handleOpenDeleteCategory}
              statuses={equipment.statuses}
              statusFilter={equipment.statusFilter}
              onFilterStatus={equipment.handleFilterStatus}
            />
          )}

          {isReplacementView && (
            <>
              <div className="px-4 pt-6 sm:px-6 lg:px-8">
                <DeviceReplacementCategoryBar
                  categories={replacements.categories}
                  selected={replacements.selectedCategory}
                  onSelect={replacements.handleSelectCategory}
                />
              </div>
              <ReplaceableDevicesView
                devices={replacements.replaceableDevices}
                columns={replacements.replaceableColumns}
                isLoading={replacements.isReplaceableLoading}
                error={replacements.replaceableError}
                onRetry={replacements.handleRetryReplaceable}
                canManage={canCreateRecords}
                onOpenReplaceDialog={replacements.handleOpenReplaceDialog}
              />
            </>
          )}

          {isSsdUpgradeView && (
            <SsdUpgradesView
              upgrades={ssdUpgrades.ssdUpgrades}
              isLoading={ssdUpgrades.isLoading}
              error={ssdUpgrades.error}
              onRetry={ssdUpgrades.handleRetry}
            />
          )}

          {isSsdProcurementView && (
            <SsdProcurementView
              procurements={ssdProcurement.ssdProcurements}
              isLoading={ssdProcurement.isLoading}
              error={ssdProcurement.error}
              onRetry={ssdProcurement.handleRetry}
            />
          )}

          {isAntivirusView && (
            <AntivirusView
              installs={antivirus.antivirusInstalls}
              isLoading={antivirus.isLoading}
              error={antivirus.error}
              onRetry={antivirus.handleRetry}
            />
          )}

          {isLicenseView && (
            <LicensesView
              licenses={licenses.licenses}
              isLoading={licenses.isLoading}
              error={licenses.error}
              onRetry={licenses.handleRetry}
              onAddNew={licenses.handleOpenAdd}
              onEdit={licenses.handleOpenEdit}
              onDelete={licenses.handleOpenDelete}
              canCreate={canCreateRecords}
              canManage={canCreateRecords}
            />
          )}

          {isDepartmentsView && (
            <DepartmentsView
              canManage={canManageDepartments}
              canCreate={canCreateRecords}
              departments={departments.departments}
              isLoading={departments.isLoading}
              error={departments.error}
              onRetry={departments.handleRetry}
              onAddNew={departments.handleOpenAdd}
              onEdit={departments.handleOpenEdit}
              onDelete={departments.handleOpenDelete}
            />
          )}

          {isCloudRateView && (
            <CloudRatesView
              rates={cloudRates.cloudRates}
              isLoading={cloudRates.isLoading}
              error={cloudRates.error}
              onRetry={cloudRates.handleRetry}
            />
          )}

          {isServerUsageView && (
            <ServerUsageView
              usage={serverUsage.serverUsage}
              isLoading={serverUsage.isLoading}
              error={serverUsage.error}
              onRetry={serverUsage.handleRetry}
            />
          )}

          {isCloudUsageView && (
            <CloudUsageView
              usage={cloudUsage.cloudUsage}
              isLoading={cloudUsage.isLoading}
              error={cloudUsage.error}
              onRetry={cloudUsage.handleRetry}
            />
          )}

          {isCurrentBorrowsView && (
            <CurrentBorrowsView
              canManage={canManageBorrows}
              loans={currentBorrows.loans}
              isLoading={currentBorrows.isLoading}
              error={currentBorrows.error}
              onRetry={currentBorrows.handleRetry}
              onReturn={currentBorrows.handleOpenReturn}
            />
          )}

          {isBorrowHistoryView && (
            <BorrowHistoryView
              history={borrowHistory.history}
              isLoading={borrowHistory.isLoading}
              error={borrowHistory.error}
              onRetry={borrowHistory.handleRetry}
              employees={borrowHistory.employeeOptions}
              filters={borrowHistory.filters}
              onFilterChange={borrowHistory.handleFilterChange}
              onClearFilters={borrowHistory.handleClearFilters}
            />
          )}

          {!hasActiveViewAccess && !firstAccessibleDashboardView && (
            <div className="px-4 py-6 sm:px-6 lg:px-8">
              <div className="rounded-xl border border-slate-200 bg-white">
                <EmptyState
                  icon={Box}
                  title="No pages assigned"
                  description="Ask an admin to add permissions to this account."
                />
              </div>
            </div>
          )}

          {hasActiveViewAccess &&
            !isDashboardHomeView &&
            !isEmployeeView &&
            !isDepartmentsView &&
            !isEquipmentView &&
            !isReplacementView &&
            !isSsdUpgradeView &&
            !isSsdProcurementView &&
            !isAntivirusView &&
            !isLicenseView &&
            !isCloudRateView &&
            !isServerUsageView &&
            !isCloudUsageView &&
            !isAssignView &&
            !isCurrentBorrowsView &&
            !isBorrowHistoryView &&
            !isUsersView &&
            !isStatusView &&
            !isMyActivityView &&
            !isActivityLogView &&
            !isRecycleBinView && (
              <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-slate-200 bg-white">
                  <EmptyState
                    icon={activeNavItem?.icon || Box}
                    title={`${activeView} module`}
                    description="This module is coming soon."
                  />
                </div>
              </div>
            )}

          {isEmployeeView && (
            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
              {/* Employee search */}
              <EmployeeSearchPanel
                term={employees.searchTerm}
                onTermChange={employees.handleSearchTermChange}
                onSubmit={employees.handleSearchSubmit}
                results={employees.searchResults}
                isLoading={employees.isSearchLoading}
                error={employees.searchError}
                hasSearched={employees.hasSearched}
                onViewDetail={employees.handleViewSearchDetail}
                onEdit={(group) => employees.handleOpenEdit(employees.getRecordFromSearchGroup(group))}
                onDelete={(group) => employees.handleOpenDelete(employees.getRecordFromSearchGroup(group))}
                canManage={canManageEmployees}
              />

              {/* Employee directory */}
              <EmployeeDirectoryTable
                canManage={canManageEmployees}
                canCreate={canCreateRecords}
                employees={employees.employees}
                totalCount={employees.totalCount}
                sort={employees.sort}
                onSort={employees.handleSort}
                isLoading={employees.isLoading}
                error={employees.error}
                onRetry={employees.handleRetry}
                page={employees.page}
                pageCount={employees.pageCount}
                onPageChange={employees.setPage}
                pageSize={EMPLOYEES_PAGE_SIZE}
                onViewDetail={employees.handleViewDetail}
                onAddNew={employees.handleOpenAdd}
                onEdit={employees.handleOpenEdit}
                onDelete={employees.handleOpenDelete}
              />
            </div>
          )}

          {isUsersView &&
            (canManageUsers ? (
              <UsersView
                users={users.users}
                pendingCount={users.pendingApprovalCount}
                isLoading={users.isLoading}
                error={users.error}
                onRetry={users.handleRetry}
                onApprove={users.handleApprove}
                onEditPermissions={users.handleOpenEditPermissions}
                onResetPassword={users.handleOpenResetPassword}
              />
            ) : (
              <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-slate-200 bg-white">
                  <EmptyState
                    icon={Box}
                    title="Not available"
                    description="This page is admin-only."
                  />
                </div>
              </div>
            ))}

          {isStatusView &&
            (canManageStatuses ? (
              <StatusesView
                statuses={statuses.statuses}
                isLoading={statuses.isLoading}
                error={statuses.error}
                onRetry={statuses.handleRetry}
                showInactive={statuses.showInactive}
                onToggleShowInactive={statuses.handleToggleShowInactive}
                onAddNew={statuses.handleOpenAdd}
                onEdit={statuses.handleOpenEdit}
                onDelete={statuses.handleOpenDelete}
              />
            ) : (
              <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-slate-200 bg-white">
                  <EmptyState
                    icon={Box}
                    title="Not available"
                    description="This page is admin-only."
                  />
                </div>
              </div>
            ))}

          {isAssignView &&
            (canManageAssign ? (
              <AssignEquipmentView
                isFormDataLoading={assign.isFormDataLoading}
                formDataError={assign.formDataError}
                onRetryFormData={assign.handleRetryFormData}
                categories={assign.formData.categories}
                positions={assign.formData.positions}
                statuses={assign.formData.statuses}
                deviceQuery={assign.deviceQuery}
                onDeviceQueryChange={assign.handleDeviceQueryChange}
                deviceCategory={assign.deviceCategory}
                onDeviceCategoryChange={assign.handleDeviceCategoryChange}
                deviceOptions={assign.deviceOptions}
                deviceColumns={assign.deviceColumns}
                isDeviceLoading={assign.isDeviceLoading}
                deviceError={assign.deviceError}
                selectedDevice={assign.selectedDevice}
                onSelectDevice={assign.handleSelectDevice}
                onClearDevice={assign.handleClearDevice}
                position={assign.position}
                onPositionChange={assign.handlePositionChange}
                employeeQuery={assign.employeeQuery}
                onEmployeeQueryChange={assign.handleEmployeeQueryChange}
                employeeOptions={assign.employeeOptions}
                isEmployeeLoading={assign.isEmployeeLoading}
                employeeError={assign.employeeError}
                selectedEmployee={assign.selectedEmployee}
                onSelectEmployee={assign.handleSelectEmployee}
                onClearEmployee={assign.handleClearEmployee}
                status={assign.status}
                onStatusChange={assign.handleStatusChange}
                assignedDate={assign.assignedDate}
                onAssignedDateChange={assign.handleAssignedDateChange}
                onSubmit={assign.handleSubmit}
                isSubmitting={assign.isSubmitting}
                submitError={assign.submitError}
                submitSuccess={assign.submitSuccess}
                conflict={assign.conflict}
                onResolveConflict={assign.handleResolveConflict}
                isResolvingConflict={assign.isResolvingConflict}
              />
            ) : (
              <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-slate-200 bg-white">
                  <EmptyState icon={Box} title="Not available" description="This page is admin-only." />
                </div>
              </div>
            ))}

          {isMyActivityView && <MyActivityView entries={myActivity.entries} />}

          {isActivityLogView &&
            (canManageActivityLog ? (
              <ActivityLogView
                entries={activityLog.filteredEntries}
                totalCount={activityLog.entries.length}
                filters={activityLog.filters}
                onFilterChange={activityLog.handleFilterChange}
                moduleOptions={ACTIVITY_MODULE_VALUES}
                actionOptions={ACTIVITY_ACTION_VALUES}
              />
            ) : (
              <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-slate-200 bg-white">
                  <EmptyState icon={Box} title="Not available" description="This page is admin-only." />
                </div>
              </div>
            ))}

          {isRecycleBinView &&
            (canManageRecycleBin ? (
              <RecycleBinView
                entries={recycleBin.entries}
                isLoading={recycleBin.isLoading}
                error={recycleBin.error}
                onRetry={recycleBin.handleRetry}
                typeFilter={recycleBin.typeFilter}
                onFilterChange={recycleBin.handleFilterChange}
                typeOptions={recycleBin.typeOptions}
                onRestore={recycleBin.handleRestore}
                onDeleteForever={recycleBin.handleOpenDelete}
                onPurgeAll={recycleBin.handleOpenPurge}
                restoringId={recycleBin.restoringId}
                deletingId={recycleBin.deletingId}
                isPurging={recycleBin.isPurging}
                actionError={recycleBin.actionError}
              />
            ) : (
              <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-slate-200 bg-white">
                  <EmptyState icon={Box} title="Not available" description="This page is admin-only." />
                </div>
              </div>
            ))}
        </main>
      </div>

      {employees.detailTarget && (
        <EmployeeDetailModal
          employee={employees.detailTarget}
          devices={employees.detailDevices}
          isLoading={employees.isDetailLoading}
          error={employees.detailError}
          onRetry={employees.handleRetryDetail}
          onClose={employees.handleCloseDetail}
          onUnassign={equipment.handleOpenUnassign}
          canManage={canManageEmployees}
        />
      )}

      <EquipmentFormModal
        isOpen={equipment.isFormOpen}
        mode={equipment.formMode}
        values={equipment.formValues}
        onChange={equipment.handleFormFieldChange}
        onSubmit={equipment.handleSubmitForm}
        onClose={equipment.handleCloseForm}
        isSubmitting={equipment.isSaving}
        error={equipment.formError}
        departments={departments.departments}
        statuses={equipment.statuses}
        categoryOptions={equipment.formCategoryOptions}
        categoryLocked={equipment.formMode === "edit" || equipment.category !== "All"}
        fields={equipment.formFields}
        onRemoveField={equipment.handleRemoveField}
        onOpenColumnsPicker={equipment.handleOpenColumnsPickerFromForm}
        onOpenSoftwareLicense={equipment.handleOpenSoftwareLicensePicker}
        softwareLicenseCount={equipment.licenseSelectedIds.length}
      />

      <SoftwareLicensePickerModal
        isOpen={equipment.isSoftwareLicensePickerOpen}
        licenses={equipment.softwareLicenseOptions}
        selectedIds={equipment.licenseSelectedIds}
        onToggle={equipment.handleToggleSoftwareLicenseSelection}
        onClose={equipment.handleCloseSoftwareLicensePicker}
        isLoading={equipment.isSoftwareLicenseOptionsLoading}
        error={equipment.softwareLicenseOptionsError}
      />

      <ColumnsPickerModal
        isOpen={equipment.isColumnsPickerOpen}
        categoryLabel={equipment.columnsPickerCategoryLabel}
        fields={equipment.availableViewFields}
        selectedKeys={equipment.columnsPickerSelectedKeys}
        onToggle={equipment.handleToggleColumnField}
        customFields={equipment.columnsPickerCustomFields}
        reusableFields={equipment.reusableCustomFields}
        fieldTypes={equipment.customFieldTypes}
        onAddField={equipment.handleAddCustomFieldFromPicker}
        onRemoveField={equipment.handleRemoveCustomFieldFromPicker}
        onReuseField={equipment.handleReuseCustomFieldFromPicker}
        onSave={equipment.handleSaveColumnsPicker}
        onClose={equipment.handleCloseColumnsPicker}
        isLoading={equipment.isColumnsPickerLoading}
        isSaving={equipment.isSavingColumns}
        error={equipment.columnsPickerError}
        onError={equipment.setColumnsPickerError}
      />

      <BorrowEquipmentModal
        isOpen={currentBorrows.isBorrowModalOpen}
        equipment={currentBorrows.borrowTarget}
        values={currentBorrows.borrowValues}
        onChange={currentBorrows.handleBorrowFieldChange}
        onSelectEmployee={currentBorrows.handleBorrowEmployeeSelect}
        onSubmit={currentBorrows.handleSubmitBorrow}
        onClose={currentBorrows.handleCloseBorrow}
        isSubmitting={currentBorrows.isBorrowing}
        error={currentBorrows.borrowError}
        employees={currentBorrows.employeeOptions}
      />

      <ReturnEquipmentModal
        isOpen={currentBorrows.isReturnModalOpen}
        loan={currentBorrows.returnTarget}
        values={currentBorrows.returnValues}
        onChange={currentBorrows.handleReturnFieldChange}
        onSubmit={currentBorrows.handleSubmitReturn}
        onClose={currentBorrows.handleCloseReturn}
        isSubmitting={currentBorrows.isReturning}
        error={currentBorrows.returnError}
      />

      <EmployeeFormModal
        isOpen={employees.isFormOpen}
        mode={employees.formMode}
        values={employees.formValues}
        onChange={employees.handleFormFieldChange}
        onSubmit={employees.handleSubmitForm}
        onClose={employees.handleCloseForm}
        isSubmitting={employees.isSaving}
        error={employees.formError}
        departments={departments.departments}
      />

      <DepartmentFormModal
        isOpen={departments.isFormOpen}
        mode={departments.formMode}
        values={departments.formValues}
        onChange={departments.handleFormFieldChange}
        onSubmit={departments.handleSubmitForm}
        onClose={departments.handleCloseForm}
        isSubmitting={departments.isSaving}
        error={departments.formError}
      />

      <UserPermissionsModal
        isOpen={Boolean(users.permissionsTarget)}
        user={users.permissionsTarget}
        values={users.permissionValues}
        onChange={users.handlePermissionFieldChange}
        onSubmit={users.handleSubmitEditPermissions}
        onClose={users.handleCloseEditPermissions}
        isSubmitting={users.isSavingPermissions}
        error={users.permissionsError}
      />

      <ResetPasswordModal
        isOpen={Boolean(users.resetPasswordTarget)}
        user={users.resetPasswordTarget}
        password={users.resetPassword}
        confirmPassword={users.resetPasswordConfirm}
        onChangePassword={users.setResetPassword}
        onChangeConfirmPassword={users.setResetPasswordConfirm}
        onSubmit={users.handleSubmitResetPassword}
        onClose={users.handleCloseResetPassword}
        isSubmitting={users.isResettingPassword}
        error={users.resetPasswordError}
      />

      <CategoryFormModal
        isOpen={equipment.isCategoryFormOpen}
        mode={equipment.categoryFormMode}
        values={equipment.categoryFormValues}
        onChange={equipment.handleCategoryFormFieldChange}
        onSubmit={equipment.handleSubmitCategoryForm}
        onClose={equipment.handleCloseCategoryForm}
        isSubmitting={equipment.isSavingCategory}
        error={equipment.categoryFormError}
      />

      <ReplaceDeviceDialog
        device={replacements.replaceDialogTarget}
        onClose={replacements.handleCloseReplaceDialog}
        activeTab={replacements.activeReplaceTab}
        onSwitchTab={replacements.handleSwitchReplaceTab}
        deviceOptions={replacements.newDeviceOptions}
        deviceOptionColumns={replacements.newDeviceColumns}
        isDeviceOptionsLoading={replacements.isNewDeviceOptionsLoading}
        deviceOptionsError={replacements.newDeviceOptionsError}
        selectedNewDevice={replacements.selectedNewDevice}
        onSelectNewDevice={replacements.handleSelectNewDevice}
        onClearNewDevice={replacements.handleClearNewDevice}
        onSubmitDevice={replacements.handleSubmitReplace}
        isSubmittingDevice={replacements.isSubmitting}
        submitDeviceError={replacements.submitError}
        partTypes={replacements.partTypes}
        selectedPartTypeId={replacements.selectedPartTypeId}
        onSelectPartType={replacements.handleSelectPartType}
        partAction={replacements.partAction}
        onSelectPartAction={replacements.handleSelectPartAction}
        partNewValue={replacements.partNewValue}
        onPartNewValueChange={replacements.handlePartNewValueChange}
        onSubmitPart={replacements.handleSubmitPartReplace}
        isSubmittingPart={replacements.isSubmittingPart}
        submitPartError={replacements.submitPartError}
      />

      <LicenseFormModal
        isOpen={licenses.isFormOpen}
        mode={licenses.formMode}
        values={licenses.formValues}
        onChange={licenses.handleFormFieldChange}
        onSubmit={licenses.handleSubmitForm}
        onClose={licenses.handleCloseForm}
        isSubmitting={licenses.isSaving}
        error={licenses.formError}
      />

      <ConfirmDialog
        isOpen={Boolean(licenses.licenseToDelete)}
        title="Delete this software license?"
        message={
          licenses.licenseToDelete
            ? `"${licenses.licenseToDelete.product_name}" will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete software license"
        onConfirm={licenses.handleConfirmDelete}
        onCancel={licenses.handleCloseDelete}
        isConfirming={licenses.isDeleting}
        error={licenses.deleteError}
      />

      <StatusFormModal
        isOpen={statuses.isFormOpen}
        mode={statuses.formMode}
        values={statuses.formValues}
        onChange={statuses.handleFormFieldChange}
        onSubmit={statuses.handleSubmitForm}
        onClose={statuses.handleCloseForm}
        isSubmitting={statuses.isSaving}
        error={statuses.formError}
      />

      <ConfirmDialog
        isOpen={Boolean(statuses.statusToDelete)}
        title="Delete this status?"
        message={
          statuses.statusToDelete
            ? `"${statuses.statusToDelete.status_name}" will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete status"
        onConfirm={statuses.handleConfirmDelete}
        onCancel={statuses.handleCloseDelete}
        isConfirming={statuses.isDeleting}
        error={statuses.deleteError}
        blocked={statuses.deleteBlocked}
        blockedActionLabel="Hide instead"
        onBlockedAction={statuses.handleHideInstead}
      />

      <ConfirmDialog
        isOpen={Boolean(employees.employeeToDelete)}
        title="Delete this employee?"
        message={
          employees.employeeToDelete
            ? `"${employees.employeeToDelete.full_name}" will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete employee"
        onConfirm={employees.handleConfirmDelete}
        onCancel={employees.handleCloseDelete}
        isConfirming={employees.isDeleting}
        error={employees.deleteError}
        blocked={employees.deleteBlocked}
        blockedActionLabel="Unassign devices"
        onBlockedAction={employees.handleViewAssignedDevicesFromDelete}
      />

      <ConfirmDialog
        isOpen={Boolean(equipment.equipmentToUnassign)}
        title="Unassign this equipment?"
        message={
          equipment.equipmentToUnassign
            ? `"${getEquipmentDisplayName(equipment.equipmentToUnassign)}" will be removed from ${equipment.equipmentToUnassign.owner_name || "its current owner"
            } and returned to stock available as Working - IT Stock.`
            : ""
        }
        confirmLabel="Unassign"
        confirmingLabel="Unassigning..."
        onConfirm={equipment.handleConfirmUnassign}
        onCancel={equipment.handleCloseUnassign}
        isConfirming={equipment.isUnassigning}
        error={equipment.unassignError}
      />

      <ConfirmDialog
        isOpen={Boolean(equipment.equipmentToDelete)}
        title="Delete this equipment?"
        message={
          equipment.equipmentToDelete
            ? `"${getEquipmentDisplayName(equipment.equipmentToDelete)}" will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete equipment"
        onConfirm={equipment.handleConfirmDelete}
        onCancel={equipment.handleCloseDelete}
        isConfirming={equipment.isDeleting}
        error={equipment.deleteError}
      />

      <ConfirmDialog
        isOpen={Boolean(departments.departmentToDelete)}
        title="Delete this department?"
        message={
          departments.departmentToDelete
            ? `"${departments.departmentToDelete.department_name}" will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete department"
        onConfirm={departments.handleConfirmDelete}
        onCancel={departments.handleCloseDelete}
        isConfirming={departments.isDeleting}
        error={departments.deleteError}
      />

      <ConfirmDialog
        isOpen={Boolean(equipment.categoryToDelete)}
        title="Delete this category?"
        message={
          equipment.categoryToDelete
            ? `"${equipment.categoryToDelete.category_name || equipment.categoryToDelete.category || equipment.categoryToDelete.label
            }" will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete category"
        onConfirm={equipment.handleConfirmDeleteCategory}
        onCancel={equipment.handleCloseDeleteCategory}
        isConfirming={equipment.isDeletingCategory}
        error={equipment.deleteCategoryError}
      />

      <ConfirmDialog
        isOpen={Boolean(recycleBin.itemToDelete)}
        title="Delete this item forever?"
        message="This will permanently remove it from the recycle bin. This cannot be undone."
        confirmLabel="Delete forever"
        onConfirm={recycleBin.handleConfirmDelete}
        onCancel={recycleBin.handleCloseDelete}
        isConfirming={Boolean(recycleBin.deletingId)}
        error={recycleBin.actionError}
      />

      <ConfirmDialog
        isOpen={recycleBin.isPurgeOpen}
        title="Purge the entire recycle bin?"
        message={`${recycleBin.entries.length} item${recycleBin.entries.length === 1 ? "" : "s"} will be permanently deleted. This cannot be undone.`}
        confirmLabel="Purge all"
        onConfirm={recycleBin.handleConfirmPurge}
        onCancel={recycleBin.handleClosePurge}
        isConfirming={recycleBin.isPurging}
        error={recycleBin.actionError}
      />
    </div>
  );
}

export default Dashboard;
