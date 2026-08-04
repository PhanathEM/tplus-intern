import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  fetchEquipmentCategorySummary,
  fetchEquipmentByCategory,
  fetchEquipmentStatuses,
  createEquipment,
  updateEquipment,
  fetchAvailableStock,
  assignEquipment,
  unassignEquipment,
} from "../../services/equipmentService";
import {
  fetchEmployees,
  searchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../../services/employeeService";
import { fetchReplacements } from "../../services/replacementService";
import { fetchSsdUpgrades } from "../../services/ssdUpgradeService";
import { fetchSsdProcurement } from "../../services/ssdProcurementService";
import { fetchAntivirusInstalls } from "../../services/antivirusService";
import { fetchLicenses } from "../../services/licenseService";
import { fetchCloudRates } from "../../services/cloudRateService";
import { fetchServerUsage } from "../../services/serverUsageService";
import { fetchCloudUsage } from "../../services/cloudUsageService";
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../services/departmentService";
import { createCategory, updateCategory, deleteCategory } from "../../services/categoryService";
import { fetchUsers, updateUser, resetUserPassword } from "../../services/userService";
import {
  createBorrow,
  fetchCurrentBorrows,
  returnBorrow,
  fetchBorrowHistory,
} from "../../services/borrowService";
import {
  ADD_EQUIPMENT_INITIAL_VALUES,
  ASSIGN_EQUIPMENT_INITIAL_VALUES,
  BORROW_EQUIPMENT_INITIAL_VALUES,
  BORROW_HISTORY_INITIAL_FILTERS,
  EMPLOYEE_FORM_INITIAL_VALUES,
  EMPLOYEES_PAGE_SIZE,
  EQUIPMENT_CATEGORY_OPTIONS,
  RETURN_EQUIPMENT_INITIAL_VALUES,
  navSections,
  navItemsByLabel,
} from "./dashboard.config";
import { getEmployeeDepartmentCode, groupEmployeeSearchResults, normalizeRecordList } from "./dashboard.utils";
import { buildDashboardNotifications } from "./dashboard.notifications";
import {
  DASHBOARD_DEFAULT_VIEW,
  getDashboardTitle,
  getDashboardViewFromPath,
  getInitialDashboardView,
  syncDashboardPath,
} from "./dashboard.routes";
import { ConfirmDialog, EmptyState } from "./components/SharedControls";
import { SidebarBrand, SidebarNavigation } from "./components/Sidebar";
import { GlobalSearch } from "./components/GlobalSearch";
import {
  AssignEquipmentModal,
  BorrowEquipmentModal,
  EquipmentFormModal,
  EquipmentView,
  ReturnEquipmentModal,
} from "./features/equipment/EquipmentViews";
import {
  AntivirusView,
  CloudRatesView,
  CloudUsageView,
  LicensesView,
  ReplacementsView,
  ServerUsageView,
  SsdProcurementView,
  SsdUpgradesView,
} from "./features/records/OperationalRecordViews";
import {
  CategoryFormModal,
  DepartmentFormModal,
  DepartmentsView,
} from "./features/departments/DepartmentViews";
import {
  AvailableStockView,
  BorrowHistoryView,
  CurrentBorrowsView,
} from "./features/borrow/BorrowViews";
import {
  EmployeeDetailModal,
  EmployeeDirectoryTable,
  EmployeeFormModal,
  EmployeeSearchPanel,
} from "./features/employees/EmployeeViews";
import { ResetPasswordModal, UserPermissionsModal, UsersView } from "./features/users/UserViews";
import { ActivityLogView, MyActivityView } from "./features/activity/ActivityViews";
import {
  canAccessDashboardView,
  getAccessProfileLabel,
  getAccessibleDashboardViews,
  getVisibleNavSections,
  hasPermission,
  isAdmin,
  mergeStoredPermissionsForUser,
  normalizeUserPermissions,
  PERMISSIONS,
  permissionsToRole,
  rememberUserPermissions,
} from "../../lib/permissions";
import {
  ACTIVITY_ACTION_VALUES,
  ACTIVITY_MODULE_VALUES,
  ACTIVITY_MODULES,
  getActivityLog,
  logActivity,
  subscribeActivityLog,
} from "../../lib/activityLog";
import { RecycleBinView } from "./features/recycle-bin/RecycleBinViews";
import {
  deleteRecycleBinItem,
  fetchRecycleBin,
  purgeRecycleBin,
  restoreRecycleBinItem,
} from "../../services/recycleBinService";
import { DashboardHomeView } from "./features/home/DashboardHomeView";

function excludeBrokenStatuses(data) {
  const list = Array.isArray(data) ? data : [];
  return list.filter((status) => !/broken/i.test(status?.status_name || ""));
}

const HOME_STAT_FETCHERS = {
  Employee: () => fetchEmployees().then((data) => (Array.isArray(data) ? data.length : 0)),
  Departments: () => fetchDepartments().then((data) => (Array.isArray(data) ? data.length : 0)),
  "All Equipment": () =>
    fetchEquipmentCategorySummary().then((data) =>
      Array.isArray(data) ? data.reduce((sum, category) => sum + (category.total_items || 0), 0) : 0
    ),
  "Borrow History": () =>
    fetchBorrowHistory({}).then((data) => (Array.isArray(data?.history) ? data.history.length : 0)),
  "Device Replacement": () => fetchReplacements().then((data) => normalizeRecordList(data).length),
  "SSD Upgrade": () => fetchSsdUpgrades().then((data) => normalizeRecordList(data).length),
  "SSD Procurement": () => fetchSsdProcurement().then((data) => normalizeRecordList(data).length),
  "Antivirus Install": () => fetchAntivirusInstalls().then((data) => normalizeRecordList(data).length),
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

function createEmptyGlobalSearchResults() {
  return {
    employees: [],
    departments: [],
    equipment: [],
    users: [],
  };
}

function Dashboard({ user, onLogout }) {
  const canCreateRecords = isAdmin(user);
  const canManageEquipment = hasPermission(user, PERMISSIONS.EQUIPMENT);
  const canManageDepartments = hasPermission(user, PERMISSIONS.DEPARTMENTS);
  const canManageEmployees = hasPermission(user, PERMISSIONS.EMPLOYEE);
  const canManageStock = hasPermission(user, PERMISSIONS.STOCK_AVAILABLE);
  const canManageBorrows = hasPermission(user, PERMISSIONS.CURRENTLY_BORROWED);
  const canManageActivityLog = hasPermission(user, PERMISSIONS.ACTIVITY_LOG);
  const [activityEntries, setActivityEntries] = useState(() => getActivityLog());
  const [activityLogFilters, setActivityLogFilters] = useState({
    module: "All",
    action: "All",
    search: "",
  });
  useEffect(() => subscribeActivityLog(() => setActivityEntries(getActivityLog())), []);

  const currentActorId = user?.user_id ?? user?.id ?? null;
  const myActivityEntries = useMemo(
    () => activityEntries.filter((entry) => String(entry.actorId) === String(currentActorId)),
    [activityEntries, currentActorId]
  );
  const filteredActivityLogEntries = useMemo(() => {
    const { module, action, search } = activityLogFilters;
    const term = search.trim().toLowerCase();

    return activityEntries.filter((entry) => {
      if (module !== "All" && entry.module !== module) return false;
      if (action !== "All" && entry.action !== action) return false;
      if (term) {
        const haystack = `${entry.actorName} ${entry.entityLabel}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [activityEntries, activityLogFilters]);

  function handleActivityLogFilterChange(key, value) {
    setActivityLogFilters((current) => ({ ...current, [key]: value }));
  }

  const canManageRecycleBin = hasPermission(user, PERMISSIONS.RECYCLE_BIN);
  const [recycleBinEntries, setRecycleBinEntries] = useState([]);
  const [isRecycleBinLoading, setIsRecycleBinLoading] = useState(false);
  const [recycleBinError, setRecycleBinError] = useState(null);
  const [recycleBinFetchToken, setRecycleBinFetchToken] = useState(0);
  const [recycleBinTypeFilter, setRecycleBinTypeFilter] = useState("All");
  const [restoringRecycleBinId, setRestoringRecycleBinId] = useState(null);
  const [deletingRecycleBinId, setDeletingRecycleBinId] = useState(null);
  const [isPurgingRecycleBin, setIsPurgingRecycleBin] = useState(false);
  const [recycleBinActionError, setRecycleBinActionError] = useState(null);
  const [recycleBinItemToDelete, setRecycleBinItemToDelete] = useState(null);
  const [isPurgeRecycleBinOpen, setIsPurgeRecycleBinOpen] = useState(false);

  const recycleBinTypeOptions = useMemo(() => {
    const types = new Set(
      recycleBinEntries.map((entry) => entry?.entity_type ?? entry?.entityType ?? entry?.type).filter(Boolean)
    );
    return [...types].sort();
  }, [recycleBinEntries]);

  function handleRetryRecycleBin() {
    setIsRecycleBinLoading(true);
    setRecycleBinError(null);
    setRecycleBinFetchToken((value) => value + 1);
  }

  function handleRecycleBinFilterChange(value) {
    setRecycleBinTypeFilter(value);
    setIsRecycleBinLoading(true);
    setRecycleBinError(null);
  }

  function refreshAfterRecycleBinChange() {
    handleRetryRecycleBin();
    handleRetryEmployees();
    handleRetryDepartments();
    handleRetryEquipment();
  }

  function handleRestoreRecycleBinItem(entry) {
    const id = entry?.id ?? entry?.recycle_bin_id ?? entry?.bin_id;
    if (id === undefined || id === null) return;

    setRestoringRecycleBinId(id);
    setRecycleBinActionError(null);

    restoreRecycleBinItem(id)
      .then(() => {
        refreshAfterRecycleBinChange();
      })
      .catch((error) => setRecycleBinActionError(error.message || "Could not restore this item."))
      .finally(() => setRestoringRecycleBinId(null));
  }

  function handleOpenDeleteRecycleBinItem(entry) {
    setRecycleBinItemToDelete(entry);
    setRecycleBinActionError(null);
  }

  function handleCloseDeleteRecycleBinItem() {
    setRecycleBinItemToDelete(null);
  }

  function handleConfirmDeleteRecycleBinItem() {
    const id = recycleBinItemToDelete?.id ?? recycleBinItemToDelete?.recycle_bin_id ?? recycleBinItemToDelete?.bin_id;
    if (id === undefined || id === null) return;

    setDeletingRecycleBinId(id);
    setRecycleBinActionError(null);

    deleteRecycleBinItem(id)
      .then(() => {
        setRecycleBinItemToDelete(null);
        handleRetryRecycleBin();
      })
      .catch((error) => setRecycleBinActionError(error.message || "Could not permanently delete this item."))
      .finally(() => setDeletingRecycleBinId(null));
  }

  function handleOpenPurgeRecycleBin() {
    setIsPurgeRecycleBinOpen(true);
    setRecycleBinActionError(null);
  }

  function handleClosePurgeRecycleBin() {
    setIsPurgeRecycleBinOpen(false);
  }

  function handleConfirmPurgeRecycleBin() {
    setIsPurgingRecycleBin(true);
    setRecycleBinActionError(null);

    purgeRecycleBin()
      .then(() => {
        setIsPurgeRecycleBinOpen(false);
        handleRetryRecycleBin();
      })
      .catch((error) => setRecycleBinActionError(error.message || "Could not purge the recycle bin."))
      .finally(() => setIsPurgingRecycleBin(false));
  }

  const accessibleDashboardViews = useMemo(
    () => getAccessibleDashboardViews(user, navSections),
    [user]
  );
  const firstAccessibleDashboardView = accessibleDashboardViews[0] || null;
  const canManageUsers = canAccessDashboardView(user, "Users", navItemsByLabel);
  const initialDashboardView = getInitialDashboardView();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState(initialDashboardView);
  const hasActiveViewAccess = accessibleDashboardViews.includes(activeView);
  const isDashboardHomeView = activeView === "Dashboard" && hasActiveViewAccess;
  const [homeStats, setHomeStats] = useState({});
  const [isHomeStatsLoading, setIsHomeStatsLoading] = useState(initialDashboardView === "Dashboard");
  const visibleHomeNavSections = useMemo(
    () =>
      getVisibleNavSections(user, navSections).filter((section) => section.label !== "Overview"),
    [user]
  );

  useEffect(() => {
    if (!isDashboardHomeView) return;

    let ignore = false;

    const labels = Object.keys(HOME_STAT_FETCHERS).filter((label) => accessibleDashboardViews.includes(label));

    Promise.allSettled(labels.map((label) => HOME_STAT_FETCHERS[label]()))
      .then((results) => {
        if (ignore) return;
        const next = {};
        results.forEach((result, index) => {
          next[labels[index]] = result.status === "fulfilled" ? result.value : null;
        });
        setHomeStats((current) => ({ ...current, ...next }));
      })
      .finally(() => {
        if (!ignore) setIsHomeStatsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isDashboardHomeView, accessibleDashboardViews]);

  const [readNotificationIds, setReadNotificationIds] = useState(() => new Set());
  const [notificationData, setNotificationData] = useState({
    currentBorrows: [],
    availableStock: [],
    licenses: [],
  });
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState(null);
  const [notificationsFetchToken, setNotificationsFetchToken] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuCloseTimeout = useRef(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState(createEmptyGlobalSearchResults);
  const [isGlobalSearchLoading, setIsGlobalSearchLoading] = useState(false);
  const globalSearchEquipmentCacheRef = useRef(null);

  function handleGlobalSearchQueryChange(nextQuery) {
    setGlobalSearchQuery(nextQuery);
    if (nextQuery.trim().length < 2) {
      setGlobalSearchResults(createEmptyGlobalSearchResults());
      setIsGlobalSearchLoading(false);
    }
  }

  useEffect(() => {
    const term = globalSearchQuery.trim();
    if (term.length < 2) return;

    let ignore = false;
    const lowerTerm = term.toLowerCase();

    const timeoutId = window.setTimeout(() => {
      setIsGlobalSearchLoading(true);

      const jobs = [];

      if (hasPermission(user, PERMISSIONS.EMPLOYEE)) {
        jobs.push(
          searchEmployees(term)
            .then((data) => ({
              key: "employees",
              items: groupEmployeeSearchResults(Array.isArray(data) ? data : []).slice(0, 5),
            }))
            .catch(() => ({ key: "employees", items: [] }))
        );
      }

      if (hasPermission(user, PERMISSIONS.DEPARTMENTS)) {
        jobs.push(
          fetchDepartments()
            .then((data) => ({
              key: "departments",
              items: (Array.isArray(data) ? data : [])
                .filter((department) =>
                  `${department.department_name || ""} ${department.department_code || ""}`
                    .toLowerCase()
                    .includes(lowerTerm)
                )
                .slice(0, 5),
            }))
            .catch(() => ({ key: "departments", items: [] }))
        );
      }

      if (hasPermission(user, PERMISSIONS.USERS)) {
        jobs.push(
          fetchUsers()
            .then((data) => {
              const list = Array.isArray(data) ? data : data?.users;
              return {
                key: "users",
                items: (Array.isArray(list) ? list : [])
                  .filter((candidate) =>
                    `${candidate.full_name || ""} ${candidate.username || ""}`.toLowerCase().includes(lowerTerm)
                  )
                  .slice(0, 5),
              };
            })
            .catch(() => ({ key: "users", items: [] }))
        );
      }

      if (hasPermission(user, PERMISSIONS.EQUIPMENT)) {
        const equipmentPromise = globalSearchEquipmentCacheRef.current
          ? Promise.resolve(globalSearchEquipmentCacheRef.current)
          : fetchEquipmentByCategory("", "All")
              .then((data) => {
                const list = Array.isArray(data) ? data : [];
                globalSearchEquipmentCacheRef.current = list;
                return list;
              })
              .catch(() => []);

        jobs.push(
          equipmentPromise.then((list) => ({
            key: "equipment",
            items: list
              .filter((item) =>
                `${item.computer_name || ""} ${item.equipment_code || ""} ${item.service_tag || ""} ${
                  item.device_model || ""
                } ${item.owner_name || ""}`
                  .toLowerCase()
                  .includes(lowerTerm)
              )
              .slice(0, 5),
          }))
        );
      }

      Promise.all(jobs)
        .then((jobResults) => {
          if (ignore) return;
          const next = createEmptyGlobalSearchResults();
          jobResults.forEach(({ key, items }) => {
            next[key] = items;
          });
          setGlobalSearchResults(next);
        })
        .finally(() => {
          if (!ignore) setIsGlobalSearchLoading(false);
        });
    }, 350);

    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [globalSearchQuery, user]);

  function handleSelectGlobalSearchResult(type, item) {
    setGlobalSearchQuery("");
    setGlobalSearchResults(createEmptyGlobalSearchResults());
    setIsGlobalSearchLoading(false);
    setIsMobileSearchOpen(false);

    if (type === "employees") {
      handleSelectView("Employee");
      handleViewEmployeeSearchDetail(item);
    } else if (type === "departments") {
      handleSelectView("Departments");
    } else if (type === "equipment") {
      handleSelectView("All Equipment");
      handleViewEquipmentCategory(item.category || item.category_name || "All", "All");
    } else if (type === "users") {
      handleSelectView("Users");
    }
  }
  const [equipmentCategories, setEquipmentCategories] = useState([]);
  const [equipmentCategory, setEquipmentCategory] = useState("All");
  const [isEquipmentLoading, setIsEquipmentLoading] = useState(initialDashboardView === "Equipment");
  const [equipmentError, setEquipmentError] = useState(null);
  const [equipmentFetchToken, setEquipmentFetchToken] = useState(0);
  const [equipmentDetailCategory, setEquipmentDetailCategory] = useState(null);
  const [equipmentItems, setEquipmentItems] = useState([]);
  const [isEquipmentItemsLoading, setIsEquipmentItemsLoading] = useState(false);
  const [equipmentItemsError, setEquipmentItemsError] = useState(null);
  const [equipmentStatuses, setEquipmentStatuses] = useState([]);
  const [equipmentStatusFilter, setEquipmentStatusFilter] = useState("All");
  const [isEquipmentFormOpen, setIsEquipmentFormOpen] = useState(false);
  const [equipmentFormMode, setEquipmentFormMode] = useState("add");
  const [equipmentFormTarget, setEquipmentFormTarget] = useState(null);
  const [equipmentFormValues, setEquipmentFormValues] = useState(ADD_EQUIPMENT_INITIAL_VALUES);
  const [isSavingEquipment, setIsSavingEquipment] = useState(false);
  const [equipmentFormError, setEquipmentFormError] = useState(null);
  const [equipmentToUnassign, setEquipmentToUnassign] = useState(null);
  const [isUnassigningEquipment, setIsUnassigningEquipment] = useState(false);
  const [unassignEquipmentError, setUnassignEquipmentError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(initialDashboardView === "Departments");
  const [departmentsError, setDepartmentsError] = useState(null);
  const [departmentsFetchToken, setDepartmentsFetchToken] = useState(0);
  const [users, setUsers] = useState([]);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [isUsersLoading, setIsUsersLoading] = useState(initialDashboardView === "Users");
  const [usersError, setUsersError] = useState(null);
  const [usersFetchToken, setUsersFetchToken] = useState(0);
  const [replacements, setReplacements] = useState([]);
  const [isReplacementsLoading, setIsReplacementsLoading] = useState(
    initialDashboardView === "Device Replacement"
  );
  const [replacementsError, setReplacementsError] = useState(null);
  const [replacementsFetchToken, setReplacementsFetchToken] = useState(0);
  const [ssdUpgrades, setSsdUpgrades] = useState([]);
  const [isSsdUpgradesLoading, setIsSsdUpgradesLoading] = useState(initialDashboardView === "SSD Upgrade");
  const [ssdUpgradesError, setSsdUpgradesError] = useState(null);
  const [ssdUpgradesFetchToken, setSsdUpgradesFetchToken] = useState(0);
  const [ssdProcurements, setSsdProcurements] = useState([]);
  const [isSsdProcurementLoading, setIsSsdProcurementLoading] = useState(
    initialDashboardView === "SSD Procurement"
  );
  const [ssdProcurementError, setSsdProcurementError] = useState(null);
  const [ssdProcurementFetchToken, setSsdProcurementFetchToken] = useState(0);
  const [antivirusInstalls, setAntivirusInstalls] = useState([]);
  const [isAntivirusLoading, setIsAntivirusLoading] = useState(initialDashboardView === "Antivirus Install");
  const [antivirusError, setAntivirusError] = useState(null);
  const [antivirusFetchToken, setAntivirusFetchToken] = useState(0);
  const [licenses, setLicenses] = useState([]);
  const [isLicensesLoading, setIsLicensesLoading] = useState(initialDashboardView === "License");
  const [licensesError, setLicensesError] = useState(null);
  const [licensesFetchToken, setLicensesFetchToken] = useState(0);
  const [cloudRates, setCloudRates] = useState([]);
  const [isCloudRatesLoading, setIsCloudRatesLoading] = useState(initialDashboardView === "Cloud Rate");
  const [cloudRatesError, setCloudRatesError] = useState(null);
  const [cloudRatesFetchToken, setCloudRatesFetchToken] = useState(0);
  const [serverUsage, setServerUsage] = useState([]);
  const [isServerUsageLoading, setIsServerUsageLoading] = useState(initialDashboardView === "Service Usage");
  const [serverUsageError, setServerUsageError] = useState(null);
  const [serverUsageFetchToken, setServerUsageFetchToken] = useState(0);
  const [cloudUsage, setCloudUsage] = useState([]);
  const [isCloudUsageLoading, setIsCloudUsageLoading] = useState(initialDashboardView === "Cloud Usage");
  const [cloudUsageError, setCloudUsageError] = useState(null);
  const [cloudUsageFetchToken, setCloudUsageFetchToken] = useState(0);
  const [availableStock, setAvailableStock] = useState([]);
  const [isAvailableStockLoading, setIsAvailableStockLoading] = useState(
    initialDashboardView === "Stock Available"
  );
  const [availableStockError, setAvailableStockError] = useState(null);
  const [availableStockFetchToken, setAvailableStockFetchToken] = useState(0);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignValues, setAssignValues] = useState(ASSIGN_EQUIPMENT_INITIAL_VALUES);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState(null);
  const [assignEmployeeOptions, setAssignEmployeeOptions] = useState([]);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [borrowTarget, setBorrowTarget] = useState(null);
  const [borrowValues, setBorrowValues] = useState(BORROW_EQUIPMENT_INITIAL_VALUES);
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [borrowError, setBorrowError] = useState(null);
  const [currentBorrows, setCurrentBorrows] = useState([]);
  const [isCurrentBorrowsLoading, setIsCurrentBorrowsLoading] = useState(
    initialDashboardView === "Currently Borrowed"
  );
  const [currentBorrowsError, setCurrentBorrowsError] = useState(null);
  const [currentBorrowsFetchToken, setCurrentBorrowsFetchToken] = useState(0);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null);
  const [returnValues, setReturnValues] = useState(RETURN_EQUIPMENT_INITIAL_VALUES);
  const [isReturning, setIsReturning] = useState(false);
  const [returnError, setReturnError] = useState(null);
  const [borrowHistory, setBorrowHistory] = useState([]);
  const [isBorrowHistoryLoading, setIsBorrowHistoryLoading] = useState(
    initialDashboardView === "Borrow History"
  );
  const [borrowHistoryError, setBorrowHistoryError] = useState(null);
  const [borrowHistoryFetchToken, setBorrowHistoryFetchToken] = useState(0);
  const [borrowHistoryFilters, setBorrowHistoryFilters] = useState(BORROW_HISTORY_INITIAL_FILTERS);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [employeeSearchResults, setEmployeeSearchResults] = useState([]);
  const [isEmployeeSearchLoading, setIsEmployeeSearchLoading] = useState(false);
  const [employeeSearchError, setEmployeeSearchError] = useState(null);
  const [hasSearchedEmployees, setHasSearchedEmployees] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(initialDashboardView === "Employee");
  const [employeesError, setEmployeesError] = useState(null);
  const [employeesFetchToken, setEmployeesFetchToken] = useState(0);
  const [employeeSort, setEmployeeSort] = useState({ key: null, direction: "asc" });
  const [employeePage, setEmployeePage] = useState(1);
  const [employeeDetailTarget, setEmployeeDetailTarget] = useState(null);
  const [employeeDetailDevices, setEmployeeDetailDevices] = useState([]);
  const [isEmployeeDetailLoading, setIsEmployeeDetailLoading] = useState(false);
  const [employeeDetailError, setEmployeeDetailError] = useState(null);
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const [employeeFormMode, setEmployeeFormMode] = useState("add");
  const [employeeFormTarget, setEmployeeFormTarget] = useState(null);
  const [employeeFormValues, setEmployeeFormValues] = useState(EMPLOYEE_FORM_INITIAL_VALUES);
  const [isSavingEmployee, setIsSavingEmployee] = useState(false);
  const [employeeFormError, setEmployeeFormError] = useState(null);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeletingEmployee, setIsDeletingEmployee] = useState(false);
  const [deleteEmployeeError, setDeleteEmployeeError] = useState(null);
  const [deleteEmployeeBlocked, setDeleteEmployeeBlocked] = useState(false);

  const [isDepartmentFormOpen, setIsDepartmentFormOpen] = useState(false);
  const [departmentFormMode, setDepartmentFormMode] = useState("add");
  const [departmentFormTarget, setDepartmentFormTarget] = useState(null);
  const [departmentFormValues, setDepartmentFormValues] = useState({ department_code: "", department_name: "" });
  const [isSavingDepartment, setIsSavingDepartment] = useState(false);
  const [departmentFormError, setDepartmentFormError] = useState(null);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [isDeletingDepartment, setIsDeletingDepartment] = useState(false);
  const [deleteDepartmentError, setDeleteDepartmentError] = useState(null);

  const [userPermissionsTarget, setUserPermissionsTarget] = useState(null);
  const [userPermissionValues, setUserPermissionValues] = useState({ full_name: "", permissions: [] });
  const [isSavingUserPermissions, setIsSavingUserPermissions] = useState(false);
  const [userPermissionsError, setUserPermissionsError] = useState(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState(null);

  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [categoryFormMode, setCategoryFormMode] = useState("add");
  const [categoryFormTarget, setCategoryFormTarget] = useState(null);
  const [categoryFormValues, setCategoryFormValues] = useState({ category_name: "", description: "" });
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryFormError, setCategoryFormError] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [deleteCategoryError, setDeleteCategoryError] = useState(null);
  const notificationsRef = useRef(null);
  const profileMenuRef = useRef(null);
  const selectViewRef = useRef(null);
  const displayName = user?.name || "Admin User";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const notifications = useMemo(
    () =>
      buildDashboardNotifications({
        ...notificationData,
        error: notificationsError,
      }).map((item) => ({
        ...item,
        unread: !readNotificationIds.has(item.id),
      })),
    [notificationData, notificationsError, readNotificationIds]
  );
  const visibleNotifications = useMemo(
    () =>
      notifications.filter(
        (item) => !item.targetView || canAccessDashboardView(user, item.targetView, navItemsByLabel)
      ),
    [notifications, user]
  );
  const unreadNotificationCount = visibleNotifications.filter((item) => item.unread).length;
  const hasUnreadNotifications = unreadNotificationCount > 0;

  const equipmentFormCategoryOptions = useMemo(() => {
    const names = new Set(EQUIPMENT_CATEGORY_OPTIONS);
    equipmentCategories.forEach((item) => names.add(item.category));
    if (equipmentFormTarget?.category_name) names.add(equipmentFormTarget.category_name);
    if (equipmentFormTarget?.category) names.add(equipmentFormTarget.category);
    return [...names].sort();
  }, [equipmentCategories, equipmentFormTarget]);

  const sortedEmployees = useMemo(() => {
    if (!employeeSort.key) return employees;
    const sorted = [...employees].sort((a, b) =>
      String(a[employeeSort.key] ?? "").localeCompare(String(b[employeeSort.key] ?? ""))
    );
    return employeeSort.direction === "asc" ? sorted : sorted.reverse();
  }, [employees, employeeSort]);

  const employeePageCount = Math.max(1, Math.ceil(sortedEmployees.length / EMPLOYEES_PAGE_SIZE));
  const paginatedEmployees = sortedEmployees.slice(
    (employeePage - 1) * EMPLOYEES_PAGE_SIZE,
    employeePage * EMPLOYEES_PAGE_SIZE
  );

  function handleEmployeeSort(key) {
    setEmployeeSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
    setEmployeePage(1);
  }

  function handleRetryEmployees() {
    setIsEmployeesLoading(true);
    setEmployeesError(null);
    setEmployeesFetchToken((value) => value + 1);
  }

  function handleRetryDepartments() {
    setIsDepartmentsLoading(true);
    setDepartmentsError(null);
    setDepartmentsFetchToken((value) => value + 1);
  }

  function handleRetryUsers() {
    setIsUsersLoading(true);
    setUsersError(null);
    setUsersFetchToken((value) => value + 1);
  }

  function handleOpenAddEmployee() {
    setEmployeeFormMode("add");
    setEmployeeFormTarget(null);
    setEmployeeFormValues(EMPLOYEE_FORM_INITIAL_VALUES);
    setEmployeeFormError(null);
    setIsEmployeeFormOpen(true);

    fetchDepartments()
      .then((data) => setDepartments(Array.isArray(data) ? data : []))
      .catch(() => setDepartments([]));
  }

  function handleOpenAddDepartment() {
    setDepartmentFormMode("add");
    setDepartmentFormTarget(null);
    setDepartmentFormValues({ department_code: "", department_name: "" });
    setDepartmentFormError(null);
    setIsDepartmentFormOpen(true);
  }

  function handleOpenEditDepartment(department) {
    setDepartmentFormMode("edit");
    setDepartmentFormTarget(department);
    setDepartmentFormValues({
      department_code: department.department_code || "",
      department_name: department.department_name || "",
    });
    setDepartmentFormError(null);
    setIsDepartmentFormOpen(true);
  }

  function handleOpenAddCategory() {
    setCategoryFormMode("add");
    setCategoryFormTarget(null);
    setCategoryFormValues({ category_name: "", description: "" });
    setCategoryFormError(null);
    setIsCategoryFormOpen(true);
  }

  function handleOpenEditCategory(category) {
    setCategoryFormMode("edit");
    setCategoryFormTarget(category);
    setCategoryFormValues({
      category_name: category.category_name || category.category || "",
      description: category.description || "",
    });
    setCategoryFormError(null);
    setIsCategoryFormOpen(true);
  }

  function handleCloseCategoryForm() {
    setIsCategoryFormOpen(false);
  }

  function handleCategoryFormFieldChange(key, value) {
    setCategoryFormValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmitCategoryForm(event) {
    event.preventDefault();

    if (!categoryFormValues.category_name.trim()) {
      setCategoryFormError("Please enter a category name.");
      return;
    }

    setIsSavingCategory(true);
    setCategoryFormError(null);

    const payload = {
      category_name: categoryFormValues.category_name.trim(),
      description: categoryFormValues.description?.trim() || "",
    };

    const id = categoryFormTarget?.id ?? categoryFormTarget?.category_id ?? categoryFormTarget?.categoryId ?? null;
    const isEdit = categoryFormMode === "edit" && id;

    const req = isEdit ? updateCategory(id, payload) : createCategory(payload);

    req
      .then((data) => {
        logActivity({
          actor: user,
          action: isEdit ? "update" : "create",
          module: ACTIVITY_MODULES.CATEGORY,
          entityId: id ?? data?.category_id ?? data?.id,
          entityLabel: payload.category_name,
          before: isEdit ? categoryFormTarget : null,
          after: { ...payload, ...(data && typeof data === "object" ? data : {}) },
        });
        setIsCategoryFormOpen(false);
        handleRetryEquipment();
      })
      .catch((error) => setCategoryFormError(error.message || "Something went wrong."))
      .finally(() => setIsSavingCategory(false));
  }

  function handleOpenDeleteCategory(category) {
    setCategoryToDelete(category);
    setDeleteCategoryError(null);
  }

  function handleCloseDeleteCategory() {
    setCategoryToDelete(null);
  }

  function handleConfirmDeleteCategory() {
    if (!categoryToDelete) return;

    setIsDeletingCategory(true);
    setDeleteCategoryError(null);

    const id = categoryToDelete?.id ?? categoryToDelete?.category_id ?? categoryToDelete?.categoryId ?? null;

    deleteCategory(id)
      .then(() => {
        logActivity({
          actor: user,
          action: "delete",
          module: ACTIVITY_MODULES.CATEGORY,
          entityId: id,
          entityLabel: categoryToDelete?.category_name || categoryToDelete?.category || `Category ${id}`,
          before: categoryToDelete,
        });
        setCategoryToDelete(null);
        handleRetryEquipment();
      })
      .catch((error) => setDeleteCategoryError(error.message || "Something went wrong."))
      .finally(() => setIsDeletingCategory(false));
  }

  function handleCloseDepartmentForm() {
    setIsDepartmentFormOpen(false);
  }

  function handleDepartmentFormFieldChange(key, value) {
    setDepartmentFormValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmitDepartmentForm(event) {
    event.preventDefault();

    if (!departmentFormValues.department_code.trim() || !departmentFormValues.department_name.trim()) {
      setDepartmentFormError("Please enter both department code and name.");
      return;
    }

    setIsSavingDepartment(true);
    setDepartmentFormError(null);

    const payload = {
      department_code: departmentFormValues.department_code.trim(),
      department_name: departmentFormValues.department_name.trim(),
    };

    const isEdit = departmentFormMode === "edit";
    const request = isEdit
      ? updateDepartment(departmentFormTarget.department_id, payload)
      : createDepartment(payload);

    request
      .then((data) => {
        logActivity({
          actor: user,
          action: isEdit ? "update" : "create",
          module: ACTIVITY_MODULES.DEPARTMENT,
          entityId: isEdit ? departmentFormTarget.department_id : data?.department_id,
          entityLabel: payload.department_name,
          before: isEdit ? departmentFormTarget : null,
          after: { ...payload, ...(data && typeof data === "object" ? data : {}) },
        });
        setIsDepartmentFormOpen(false);
        handleRetryDepartments();
      })
      .catch((error) => setDepartmentFormError(error.message || "Something went wrong."))
      .finally(() => setIsSavingDepartment(false));
  }

  function handleOpenDeleteDepartment(department) {
    setDepartmentToDelete(department);
    setDeleteDepartmentError(null);
  }

  function handleCloseDeleteDepartment() {
    setDepartmentToDelete(null);
  }

  function handleConfirmDeleteDepartment() {
    if (!departmentToDelete) return;

    setIsDeletingDepartment(true);
    setDeleteDepartmentError(null);

    deleteDepartment(departmentToDelete.department_id)
      .then(() => {
        logActivity({
          actor: user,
          action: "delete",
          module: ACTIVITY_MODULES.DEPARTMENT,
          entityId: departmentToDelete.department_id,
          entityLabel: departmentToDelete.department_name,
          before: departmentToDelete,
        });
        setDepartmentToDelete(null);
        handleRetryDepartments();
      })
      .catch((error) => setDeleteDepartmentError(error.message || "Something went wrong."))
      .finally(() => setIsDeletingDepartment(false));
  }

  function handleApproveUser(targetUser) {
    updateUser(targetUser.user_id, { is_active: true })
      .then(() => {
        logActivity({
          actor: user,
          action: "approve",
          module: ACTIVITY_MODULES.USER,
          entityId: targetUser.user_id,
          entityLabel: targetUser.full_name || targetUser.username,
          before: targetUser,
          after: { ...targetUser, is_active: true },
        });
        handleRetryUsers();
      })
      .catch((error) => setUsersError(error.message || "Something went wrong."));
  }

  function handleOpenEditUserPermissions(user) {
    setUserPermissionsTarget(user);
    setUserPermissionValues({
      full_name: user.full_name || "",
      permissions: normalizeUserPermissions(user),
    });
    setUserPermissionsError(null);
  }

  function handleCloseEditUserPermissions() {
    setUserPermissionsTarget(null);
  }

  function handleUserPermissionFieldChange(key, value) {
    setUserPermissionValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmitEditUserPermissions(event) {
    event.preventDefault();

    const permissions = normalizeUserPermissions({ permissions: userPermissionValues.permissions });
    const payload = {
      full_name: userPermissionValues.full_name.trim(),
      permissions,
      role: permissionsToRole(permissions),
    };
    const legacyPayload = {
      full_name: payload.full_name,
      role: payload.role,
    };

    setIsSavingUserPermissions(true);
    setUserPermissionsError(null);

    updateUser(userPermissionsTarget.user_id, payload)
      .catch((error) => {
        if (![400, 422].includes(error.status)) throw error;
        return updateUser(userPermissionsTarget.user_id, legacyPayload);
      })
      .then(() => {
        logActivity({
          actor: user,
          action: "update",
          module: ACTIVITY_MODULES.USER,
          entityId: userPermissionsTarget.user_id,
          entityLabel: userPermissionsTarget.username || payload.full_name,
          before: userPermissionsTarget,
          after: { ...userPermissionsTarget, ...payload },
        });
        rememberUserPermissions(userPermissionsTarget, permissions);
        setUserPermissionsTarget(null);
        handleRetryUsers();
      })
      .catch((error) => setUserPermissionsError(error.message || "Something went wrong."))
      .finally(() => setIsSavingUserPermissions(false));
  }

  function handleOpenResetPassword(user) {
    setResetPasswordTarget(user);
    setResetPassword("");
    setResetPasswordConfirm("");
    setResetPasswordError(null);
  }

  function handleCloseResetPassword() {
    setResetPasswordTarget(null);
  }

  function handleSubmitResetPassword(event) {
    event.preventDefault();

    if (resetPassword !== resetPasswordConfirm) {
      setResetPasswordError("Passwords do not match.");
      return;
    }

    setIsResettingPassword(true);
    setResetPasswordError(null);

    resetUserPassword(resetPasswordTarget.user_id, resetPassword)
      .then(() => {
        logActivity({
          actor: user,
          action: "reset_password",
          module: ACTIVITY_MODULES.USER,
          entityId: resetPasswordTarget.user_id,
          entityLabel: resetPasswordTarget.username || resetPasswordTarget.full_name,
        });
        setResetPasswordTarget(null);
      })
      .catch((error) => setResetPasswordError(error.message || "Something went wrong."))
      .finally(() => setIsResettingPassword(false));
  }

  function handleOpenEditEmployee(employee) {
    setEmployeeFormMode("edit");
    setEmployeeFormTarget(employee);
    setEmployeeFormValues({
      full_name: employee.full_name || "",
      position: employee.position || "",
      department: getEmployeeDepartmentCode(employee) || "",
      location: employee.location || "",
      staff_code: employee.staff_code || "",
      phone: employee.phone || "",
      sex: employee.sex || "",
    });
    setEmployeeFormError(null);
    setIsEmployeeFormOpen(true);

    fetchDepartments()
      .then((data) => setDepartments(Array.isArray(data) ? data : []))
      .catch(() => setDepartments([]));
  }

  function handleCloseEmployeeForm() {
    setIsEmployeeFormOpen(false);
  }

  function handleEmployeeFormFieldChange(key, value) {
    setEmployeeFormValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmitEmployeeForm(event) {
    event.preventDefault();

    if (!employeeFormValues.full_name.trim()) {
      setEmployeeFormError("Please enter a full name.");
      return;
    }

    setIsSavingEmployee(true);
    setEmployeeFormError(null);

    const payload = Object.fromEntries(
      Object.entries(employeeFormValues).filter(([, value]) => value.trim() !== "")
    );

    const isEdit = employeeFormMode === "edit";
    const request = isEdit ? updateEmployee(employeeFormTarget.employee_id, payload) : createEmployee(payload);

    request
      .then((data) => {
        logActivity({
          actor: user,
          action: isEdit ? "update" : "create",
          module: ACTIVITY_MODULES.EMPLOYEE,
          entityId: isEdit ? employeeFormTarget.employee_id : data?.employee_id,
          entityLabel: payload.full_name || employeeFormTarget?.full_name,
          before: isEdit ? employeeFormTarget : null,
          after: { ...payload, ...(data && typeof data === "object" ? data : {}) },
        });
        setIsEmployeeFormOpen(false);
        handleRetryEmployees();
      })
      .catch((error) => setEmployeeFormError(error.message || "Something went wrong."))
      .finally(() => setIsSavingEmployee(false));
  }

  function handleOpenDeleteEmployee(employee) {
    setEmployeeToDelete(employee);
    setDeleteEmployeeError(null);
    setDeleteEmployeeBlocked(false);
  }

  function handleCloseDeleteEmployee() {
    setEmployeeToDelete(null);
    setDeleteEmployeeError(null);
    setDeleteEmployeeBlocked(false);
  }

  function handleViewAssignedDevicesFromDelete() {
    if (!employeeToDelete) return;
    const employee = employeeToDelete;
    handleCloseDeleteEmployee();
    handleViewEmployeeDetail(employee);
  }

  function handleConfirmDeleteEmployee() {
    if (!employeeToDelete) return;

    setIsDeletingEmployee(true);
    setDeleteEmployeeError(null);
    setDeleteEmployeeBlocked(false);

    deleteEmployee(employeeToDelete.employee_id)
      .then(() => {
        logActivity({
          actor: user,
          action: "delete",
          module: ACTIVITY_MODULES.EMPLOYEE,
          entityId: employeeToDelete.employee_id,
          entityLabel: employeeToDelete.full_name,
          before: employeeToDelete,
        });
        setEmployeeToDelete(null);
        handleRetryEmployees();
        const term = employeeSearchTerm.trim();
        if (hasSearchedEmployees && term) runEmployeeSearch(term);
      })
      .catch((error) => {
        const data = error.response?.data;
        const ownedEquipment = data?.references?.owned_equipment || 0;

        setDeleteEmployeeBlocked(ownedEquipment > 0);
        setDeleteEmployeeError(
          ownedEquipment > 0
            ? `This employee has ${ownedEquipment} assigned device${ownedEquipment === 1 ? "" : "s"}. Unassign ${
                ownedEquipment === 1 ? "it" : "them"
              } first.`
            : data?.error || error.message || "Could not delete employee."
        );
      })
      .finally(() => setIsDeletingEmployee(false));
  }

  function handleViewEmployeeDetail(employee) {
    setEmployeeDetailTarget(employee);
    setIsEmployeeDetailLoading(true);
    setEmployeeDetailError(null);
    setEmployeeDetailDevices([]);

    searchEmployees(employee.full_name)
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        setEmployeeDetailDevices(rows.filter((row) => row.employee_id === employee.employee_id));
      })
      .catch((error) => setEmployeeDetailError(error.message || "Something went wrong."))
      .finally(() => setIsEmployeeDetailLoading(false));
  }

  function handleRetryEmployeeDetail() {
    if (employeeDetailTarget) handleViewEmployeeDetail(employeeDetailTarget);
  }

  function handleCloseEmployeeDetail() {
    setEmployeeDetailTarget(null);
  }

  function handleSelectView(label, { updateUrl = true } = {}) {
    if (!navItemsByLabel[label]) return;
    if (!canAccessDashboardView(user, label, navItemsByLabel)) return;

    if (label === "All Equipment" && label !== activeView) {
      setIsEquipmentLoading(true);
      setEquipmentError(null);
    }
    if (label === "Device Replacement" && label !== activeView) {
      setIsReplacementsLoading(true);
      setReplacementsError(null);
    }
    if (label === "SSD Upgrade" && label !== activeView) {
      setIsSsdUpgradesLoading(true);
      setSsdUpgradesError(null);
    }
    if (label === "SSD Procurement" && label !== activeView) {
      setIsSsdProcurementLoading(true);
      setSsdProcurementError(null);
    }
    if (label === "Antivirus Install" && label !== activeView) {
      setIsAntivirusLoading(true);
      setAntivirusError(null);
    }
    if (label === "License" && label !== activeView) {
      setIsLicensesLoading(true);
      setLicensesError(null);
    }
    if (label === "Cloud Rate" && label !== activeView) {
      setIsCloudRatesLoading(true);
      setCloudRatesError(null);
    }
    if (label === "Service Usage" && label !== activeView) {
      setIsServerUsageLoading(true);
      setServerUsageError(null);
    }
    if (label === "Cloud Usage" && label !== activeView) {
      setIsCloudUsageLoading(true);
      setCloudUsageError(null);
    }
    if (label === "Stock Available" && label !== activeView) {
      setIsAvailableStockLoading(true);
      setAvailableStockError(null);
    }
    if (label === "Currently Borrowed" && label !== activeView) {
      setIsCurrentBorrowsLoading(true);
      setCurrentBorrowsError(null);
    }
    if (label === "Borrow History" && label !== activeView) {
      setIsBorrowHistoryLoading(true);
      setBorrowHistoryError(null);
    }
    if (label === "Employee" && label !== activeView) {
      setIsEmployeesLoading(true);
      setEmployeesError(null);
    }
    if (label === "Departments" && label !== activeView) {
      setIsDepartmentsLoading(true);
      setDepartmentsError(null);
    }
    if (activeView === "Equipment" && label !== "Equipment") {
      setEquipmentDetailCategory(null);
    }
    if (updateUrl) {
      syncDashboardPath(label);
    }
    setActiveView(label);
    setIsMobileSidebarOpen(false);
  }

  useEffect(() => {
    selectViewRef.current = handleSelectView;
  });

  useEffect(() => {
    if (hasActiveViewAccess || !firstAccessibleDashboardView) return;
    selectViewRef.current?.(firstAccessibleDashboardView);
  }, [firstAccessibleDashboardView, hasActiveViewAccess]);

  function handleMarkAllNotificationsRead() {
    setReadNotificationIds((current) => {
      const next = new Set(current);
      visibleNotifications.forEach((item) => next.add(item.id));
      return next;
    });
  }

  function handleRetryNotifications() {
    setIsNotificationsLoading(true);
    setNotificationsError(null);
    setNotificationsFetchToken((value) => value + 1);
  }

  function handleOpenNotification(notification) {
    setReadNotificationIds((current) => new Set(current).add(notification.id));
    if (notification.targetView) {
      handleSelectView(notification.targetView);
    }
    setIsNotificationsOpen(false);
  }

  useEffect(() => {
    function handlePointerDown(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
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

  useEffect(() => {
    document.title = getDashboardTitle(activeView);
    syncDashboardPath(activeView, "replace");
  }, [activeView]);

  useEffect(() => {
    function handlePopState() {
      const view = getDashboardViewFromPath(window.location.pathname) || DASHBOARD_DEFAULT_VIEW;
      selectViewRef.current?.(view, { updateUrl: false });
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    let ignore = false;

    Promise.allSettled([fetchCurrentBorrows(), fetchAvailableStock(), fetchLicenses()])
      .then(([borrowsResult, stockResult, licensesResult]) => {
        if (ignore) return;

        const failures = [];
        if (borrowsResult.status === "rejected") failures.push("current borrows");
        if (stockResult.status === "rejected") failures.push("available stock");
        if (licensesResult.status === "rejected") failures.push("licenses");

        setNotificationData({
          currentBorrows:
            borrowsResult.status === "fulfilled" && Array.isArray(borrowsResult.value?.borrowed)
              ? borrowsResult.value.borrowed
              : [],
          availableStock:
            stockResult.status === "fulfilled" && Array.isArray(stockResult.value?.equipment)
              ? stockResult.value.equipment
              : [],
          licenses:
            licensesResult.status === "fulfilled" ? normalizeRecordList(licensesResult.value) : [],
        });
        setNotificationsError(
          failures.length ? `Could not refresh ${failures.join(", ")} notifications.` : null
        );
      })
      .finally(() => {
        if (!ignore) setIsNotificationsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [notificationsFetchToken]);

  const activeNavItem = navItemsByLabel[activeView];
  const isEmployeeView = activeView === "Employee" && hasActiveViewAccess;
  const isDepartmentsView = activeView === "Departments" && hasActiveViewAccess;
  const isEquipmentView = activeView === "All Equipment" && hasActiveViewAccess;
  const isReplacementView = activeView === "Device Replacement" && hasActiveViewAccess;
  const isSsdUpgradeView = activeView === "SSD Upgrade" && hasActiveViewAccess;
  const isSsdProcurementView = activeView === "SSD Procurement" && hasActiveViewAccess;
  const isAntivirusView = activeView === "Antivirus Install" && hasActiveViewAccess;
  const isLicenseView = activeView === "License" && hasActiveViewAccess;
  const isCloudRateView = activeView === "Cloud Rate" && hasActiveViewAccess;
  const isServerUsageView = activeView === "Service Usage" && hasActiveViewAccess;
  const isCloudUsageView = activeView === "Cloud Usage" && hasActiveViewAccess;
  const isAvailableStockView = activeView === "Stock Available" && hasActiveViewAccess;
  const isCurrentBorrowsView = activeView === "Currently Borrowed" && hasActiveViewAccess;
  const isBorrowHistoryView = activeView === "Borrow History" && hasActiveViewAccess;
  const isUsersView = activeView === "Users" && hasActiveViewAccess;
  const isMyActivityView = activeView === "My Activity" && hasActiveViewAccess;
  const isActivityLogView = activeView === "Activity Log" && hasActiveViewAccess;
  const isRecycleBinView = activeView === "Recycle Bin" && hasActiveViewAccess;

  useEffect(() => {
    if (!isEquipmentView) return;

    let ignore = false;

    fetchEquipmentCategorySummary()
      .then((data) => {
        if (!ignore) {
          setEquipmentCategories(data);
          setEquipmentError(null);
        }
      })
      .catch((error) => {
        if (!ignore) setEquipmentError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsEquipmentLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isEquipmentView, equipmentFetchToken]);

  useEffect(() => {
    if (!isEquipmentView) return;
    handleViewEquipmentCategory(equipmentCategory, equipmentStatusFilter);
  }, [isEquipmentView, equipmentFetchToken, equipmentCategory, equipmentStatusFilter]);

  useEffect(() => {
    if (!isEquipmentView) return;

    let ignore = false;

    fetchEquipmentStatuses()
      .then((data) => {
        if (!ignore) setEquipmentStatuses(excludeBrokenStatuses(data));
      })
      .catch(() => {
        if (!ignore) setEquipmentStatuses([]);
      });

    return () => {
      ignore = true;
    };
  }, [isEquipmentView]);

  useEffect(() => {
    if (!isEmployeeView) return;

    let ignore = false;

    fetchEmployees()
      .then((data) => {
        if (!ignore) {
          setEmployees(Array.isArray(data) ? data : []);
          setEmployeesError(null);
        }
      })
      .catch((error) => {
        if (!ignore) setEmployeesError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsEmployeesLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isEmployeeView, employeesFetchToken]);

  useEffect(() => {
    if (!isReplacementView) return;

    let ignore = false;

    fetchReplacements()
      .then((data) => {
        if (!ignore) {
          setReplacements(normalizeRecordList(data));
          setReplacementsError(null);
        }
      })
      .catch((error) => {
        if (!ignore) setReplacementsError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsReplacementsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isReplacementView, replacementsFetchToken]);

  useEffect(() => {
    if (!isSsdUpgradeView) return;

    let ignore = false;

    fetchSsdUpgrades()
      .then((data) => {
        if (!ignore) {
          setSsdUpgrades(normalizeRecordList(data));
          setSsdUpgradesError(null);
        }
      })
      .catch((error) => {
        if (!ignore) setSsdUpgradesError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsSsdUpgradesLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isSsdUpgradeView, ssdUpgradesFetchToken]);

  useEffect(() => {
    if (!isSsdProcurementView) return;

    let ignore = false;

    fetchSsdProcurement()
      .then((data) => {
        if (!ignore) {
          setSsdProcurements(normalizeRecordList(data));
          setSsdProcurementError(null);
        }
      })
      .catch((error) => {
        if (!ignore) setSsdProcurementError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsSsdProcurementLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isSsdProcurementView, ssdProcurementFetchToken]);

  useEffect(() => {
    if (!isAntivirusView) return;

    let ignore = false;

    fetchAntivirusInstalls()
      .then((data) => {
        if (!ignore) {
          setAntivirusInstalls(normalizeRecordList(data));
          setAntivirusError(null);
        }
      })
      .catch((error) => {
        if (!ignore) setAntivirusError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsAntivirusLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isAntivirusView, antivirusFetchToken]);

  useEffect(() => {
    if (!isLicenseView) return;

    let ignore = false;

    fetchLicenses()
      .then((data) => {
        const records = normalizeRecordList(data);
        if (!ignore) {
          setLicenses(records);
          setNotificationData((current) => ({ ...current, licenses: records }));
          setLicensesError(null);
        }
      })
      .catch((error) => {
        if (!ignore) setLicensesError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsLicensesLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isLicenseView, licensesFetchToken]);

  useEffect(() => {
    if (!isDepartmentsView) return;

    let ignore = false;

    fetchDepartments()
      .then((data) => {
        if (!ignore) {
          setDepartments(Array.isArray(data) ? data : []);
          setDepartmentsError(null);
        }
      })
      .catch((error) => {
        if (!ignore) setDepartmentsError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsDepartmentsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isDepartmentsView, departmentsFetchToken]);

  useEffect(() => {
    if (!isUsersView) return;

    let ignore = false;

    fetchUsers()
      .then((data) => {
        if (ignore) return;
        const list = Array.isArray(data) ? data : data?.users;
        setUsers(Array.isArray(list) ? list.map(mergeStoredPermissionsForUser) : []);
        setPendingApprovalCount(
          data?.pending_approval ?? (Array.isArray(list) ? list.filter((u) => !u.is_active).length : 0)
        );
        setUsersError(null);
      })
      .catch((error) => {
        if (!ignore) setUsersError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsUsersLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isUsersView, usersFetchToken]);

  useEffect(() => {
    if (!isRecycleBinView) return;

    let ignore = false;

    fetchRecycleBin(recycleBinTypeFilter === "All" ? undefined : recycleBinTypeFilter)
      .then((data) => {
        if (ignore) return;
        const list = Array.isArray(data) ? data : data?.items ?? data?.data;
        setRecycleBinEntries(Array.isArray(list) ? list : []);
        setRecycleBinError(null);
      })
      .catch((error) => {
        if (!ignore) setRecycleBinError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsRecycleBinLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isRecycleBinView, recycleBinFetchToken, recycleBinTypeFilter]);

  useEffect(() => {
    if (!isCloudRateView) return;

    let ignore = false;

    fetchCloudRates()
      .then((data) => {
        if (!ignore) {
          setCloudRates(normalizeRecordList(data));
          setCloudRatesError(null);
        }
      })
      .catch((error) => {
        if (!ignore) setCloudRatesError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsCloudRatesLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isCloudRateView, cloudRatesFetchToken]);

  useEffect(() => {
    if (!isServerUsageView) return;

    let ignore = false;

    fetchServerUsage()
      .then((data) => {
        if (!ignore) {
          setServerUsage(normalizeRecordList(data));
          setServerUsageError(null);
        }
      })
      .catch((error) => {
        if (!ignore) setServerUsageError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsServerUsageLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isServerUsageView, serverUsageFetchToken]);

  useEffect(() => {
    if (!isCloudUsageView) return;

    let ignore = false;

    fetchCloudUsage()
      .then((data) => {
        if (!ignore) {
          setCloudUsage(normalizeRecordList(data));
          setCloudUsageError(null);
        }
      })
      .catch((error) => {
        if (!ignore) setCloudUsageError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsCloudUsageLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isCloudUsageView, cloudUsageFetchToken]);

  useEffect(() => {
    if (!isAvailableStockView) return;

    let ignore = false;

    fetchAvailableStock()
      .then((data) => {
        const records = Array.isArray(data?.equipment) ? data.equipment : [];
        if (!ignore) {
          setAvailableStock(records);
          setNotificationData((current) => ({ ...current, availableStock: records }));
          setAvailableStockError(null);
        }
      })
      .catch((error) => {
        if (!ignore) setAvailableStockError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsAvailableStockLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isAvailableStockView, availableStockFetchToken]);

  useEffect(() => {
    if (!isCurrentBorrowsView) return;

    let ignore = false;

    fetchCurrentBorrows()
      .then((data) => {
        const records = Array.isArray(data?.borrowed) ? data.borrowed : [];
        if (!ignore) {
          setCurrentBorrows(records);
          setNotificationData((current) => ({ ...current, currentBorrows: records }));
          setCurrentBorrowsError(null);
        }
      })
      .catch((error) => {
        if (!ignore) setCurrentBorrowsError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsCurrentBorrowsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isCurrentBorrowsView, currentBorrowsFetchToken]);

  useEffect(() => {
    if (!isBorrowHistoryView) return;

    let ignore = false;

    fetchEmployees()
      .then((data) => {
        if (!ignore) setAssignEmployeeOptions(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!ignore) setAssignEmployeeOptions([]);
      });

    return () => {
      ignore = true;
    };
  }, [isBorrowHistoryView]);

  useEffect(() => {
    if (!isBorrowHistoryView) return;

    let ignore = false;

    fetchBorrowHistory(borrowHistoryFilters)
      .then((data) => {
        if (!ignore) {
          setBorrowHistory(Array.isArray(data?.history) ? data.history : []);
          setBorrowHistoryError(null);
        }
      })
      .catch((error) => {
        if (!ignore) setBorrowHistoryError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsBorrowHistoryLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isBorrowHistoryView, borrowHistoryFetchToken, borrowHistoryFilters]);

  function handleRetryEquipment() {
    setIsEquipmentLoading(true);
    setEquipmentError(null);
    setEquipmentFetchToken((value) => value + 1);
  }

  function handleOpenAddEquipmentItem() {
    setEquipmentFormMode("add");
    setEquipmentFormTarget(null);
    setEquipmentFormValues(ADD_EQUIPMENT_INITIAL_VALUES);
    setEquipmentFormError(null);
    setIsEquipmentFormOpen(true);

    fetchDepartments()
      .then((data) => setDepartments(Array.isArray(data) ? data : []))
      .catch(() => setDepartments([]));

    fetchEquipmentStatuses()
      .then((data) => setEquipmentStatuses(excludeBrokenStatuses(data)))
      .catch(() => setEquipmentStatuses([]));
  }

  function handleOpenEditEquipmentItem(item) {
    setEquipmentFormMode("edit");
    setEquipmentFormTarget(item);
    setEquipmentFormValues({
      category: item.category_name || item.category || "",
      device_type: item.device_type || "",
      device_model: item.device_model || "",
      manufacturer: item.manufacturer || "",
      equipment_code: item.equipment_code || "",
      service_tag: item.service_tag || "",
      serial_no: item.serial_no || "",
      product_id: item.product_id || "",
      mac_address: item.mac_address || "",
      ip_address: item.ip_address || "",
      os_type: item.os_type || "",
      os_version: item.os_version || "",
      cpu: item.cpu || "",
      ram: item.ram || "",
      hd: item.hd || "",
      windows_license: item.windows_license || "",
      av_license: item.av_license || "",
      purchase_date: item.purchase_date ? item.purchase_date.slice(0, 10) : "",
      received_date: item.received_date ? item.received_date.slice(0, 10) : "",
      department: item.department_code || item.department || "",
      status: item.status || item.status_name || "",
      remark: item.remark || "",
    });
    setEquipmentFormError(null);
    setIsEquipmentFormOpen(true);

    fetchDepartments()
      .then((data) => setDepartments(Array.isArray(data) ? data : []))
      .catch(() => setDepartments([]));

    fetchEquipmentStatuses()
      .then((data) => setEquipmentStatuses(excludeBrokenStatuses(data)))
      .catch(() => setEquipmentStatuses([]));
  }

  function handleCloseEquipmentForm() {
    setIsEquipmentFormOpen(false);
  }

  function handleEquipmentFormFieldChange(key, value) {
    setEquipmentFormValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmitEquipmentForm(event) {
    event.preventDefault();
    setIsSavingEquipment(true);
    setEquipmentFormError(null);

    const payload = Object.fromEntries(
      Object.entries(equipmentFormValues).filter(([, value]) => value.trim() !== "")
    );

    const isEdit = equipmentFormMode === "edit";
    const request = isEdit ? updateEquipment(equipmentFormTarget.equipment_id, payload) : createEquipment(payload);

    request
      .then((data) => {
        logActivity({
          actor: user,
          action: isEdit ? "update" : "create",
          module: ACTIVITY_MODULES.EQUIPMENT,
          entityId: isEdit ? equipmentFormTarget.equipment_id : data?.equipment_id,
          entityLabel: getEquipmentDisplayName(isEdit ? equipmentFormTarget : payload),
          before: isEdit ? equipmentFormTarget : null,
          after: { ...payload, ...(data && typeof data === "object" ? data : {}) },
        });
        setIsEquipmentFormOpen(false);
        handleRetryEquipment();
        handleRetryNotifications();
        if (equipmentDetailCategory) {
          handleViewEquipmentCategory(equipmentDetailCategory, equipmentStatusFilter);
        }
      })
      .catch((error) => setEquipmentFormError(error.message || "Something went wrong."))
      .finally(() => setIsSavingEquipment(false));
  }

  function getEquipmentDisplayName(item) {
    return (
      [item?.category || item?.category_name, item?.device_type, item?.device_model].filter(Boolean).join(" - ") ||
      item?.computer_name ||
      item?.equipment_code ||
      item?.service_tag ||
      `Equipment ${item?.equipment_id || ""}`.trim()
    );
  }

  function handleOpenUnassignEquipment(item) {
    setEquipmentToUnassign(item);
    setUnassignEquipmentError(null);
  }

  function handleCloseUnassignEquipment() {
    setEquipmentToUnassign(null);
    setUnassignEquipmentError(null);
  }

  function handleConfirmUnassignEquipment() {
    if (!equipmentToUnassign?.equipment_id) return;

    setIsUnassigningEquipment(true);
    setUnassignEquipmentError(null);

    unassignEquipment(equipmentToUnassign.equipment_id)
      .then(() => {
        logActivity({
          actor: user,
          action: "unassign",
          module: ACTIVITY_MODULES.EQUIPMENT,
          entityId: equipmentToUnassign.equipment_id,
          entityLabel: getEquipmentDisplayName(equipmentToUnassign),
          before: equipmentToUnassign,
        });
        setEquipmentToUnassign(null);
        handleRetryEquipment();
        handleRetryAvailableStock();
        handleRetryNotifications();
        if (equipmentDetailCategory) {
          handleViewEquipmentCategory(equipmentDetailCategory, equipmentStatusFilter);
        }
        const term = employeeSearchTerm.trim();
        if (hasSearchedEmployees && term) runEmployeeSearch(term);
        if (employeeDetailTarget) handleRetryEmployeeDetail();
      })
      .catch((error) => setUnassignEquipmentError(error.message || "Something went wrong."))
      .finally(() => setIsUnassigningEquipment(false));
  }

  function handleRetryReplacements() {
    setIsReplacementsLoading(true);
    setReplacementsError(null);
    setReplacementsFetchToken((value) => value + 1);
  }

  function handleRetrySsdUpgrades() {
    setIsSsdUpgradesLoading(true);
    setSsdUpgradesError(null);
    setSsdUpgradesFetchToken((value) => value + 1);
  }

  function handleRetrySsdProcurement() {
    setIsSsdProcurementLoading(true);
    setSsdProcurementError(null);
    setSsdProcurementFetchToken((value) => value + 1);
  }

  function handleRetryAntivirus() {
    setIsAntivirusLoading(true);
    setAntivirusError(null);
    setAntivirusFetchToken((value) => value + 1);
  }

  function handleRetryLicenses() {
    setIsLicensesLoading(true);
    setLicensesError(null);
    setLicensesFetchToken((value) => value + 1);
  }

  function handleRetryCloudRates() {
    setIsCloudRatesLoading(true);
    setCloudRatesError(null);
    setCloudRatesFetchToken((value) => value + 1);
  }

  function handleRetryServerUsage() {
    setIsServerUsageLoading(true);
    setServerUsageError(null);
    setServerUsageFetchToken((value) => value + 1);
  }

  function handleRetryCloudUsage() {
    setIsCloudUsageLoading(true);
    setCloudUsageError(null);
    setCloudUsageFetchToken((value) => value + 1);
  }

  function handleRetryAvailableStock() {
    setIsAvailableStockLoading(true);
    setAvailableStockError(null);
    setAvailableStockFetchToken((value) => value + 1);
  }

  function handleRetryCurrentBorrows() {
    setIsCurrentBorrowsLoading(true);
    setCurrentBorrowsError(null);
    setCurrentBorrowsFetchToken((value) => value + 1);
  }

  function handleRetryBorrowHistory() {
    setIsBorrowHistoryLoading(true);
    setBorrowHistoryError(null);
    setBorrowHistoryFetchToken((value) => value + 1);
  }

  function handleBorrowHistoryFilterChange(key, value) {
    setIsBorrowHistoryLoading(true);
    setBorrowHistoryError(null);
    setBorrowHistoryFilters((current) => ({ ...current, [key]: value }));
  }

  function handleClearBorrowHistoryFilters() {
    setIsBorrowHistoryLoading(true);
    setBorrowHistoryError(null);
    setBorrowHistoryFilters(BORROW_HISTORY_INITIAL_FILTERS);
  }

  function handleOpenReturnEquipment(loan) {
    setReturnTarget(loan);
    setReturnValues(RETURN_EQUIPMENT_INITIAL_VALUES);
    setReturnError(null);
    setIsReturnModalOpen(true);
  }

  function handleCloseReturnEquipment() {
    setIsReturnModalOpen(false);
  }

  function handleReturnFieldChange(key, value) {
    setReturnValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmitReturnEquipment(event) {
    event.preventDefault();
    if (!returnTarget) return;

    if (!returnValues.return_date) {
      setReturnError("Please set a return date.");
      return;
    }

    setIsReturning(true);
    setReturnError(null);

    const payload = { return_date: returnValues.return_date };
    if (returnValues.condition_on_return.trim()) {
      payload.condition_on_return = returnValues.condition_on_return;
    }

    returnBorrow(returnTarget.borrow_id, payload)
      .then(() => {
        logActivity({
          actor: user,
          action: "return",
          module: ACTIVITY_MODULES.BORROW,
          entityId: returnTarget.borrow_id,
          entityLabel: returnTarget.computer_name || returnTarget.equipment_code || `Borrow ${returnTarget.borrow_id}`,
          before: returnTarget,
          after: payload,
        });
        setIsReturnModalOpen(false);
        handleRetryCurrentBorrows();
        handleRetryNotifications();
      })
      .catch((error) => setReturnError(error.message || "Something went wrong."))
      .finally(() => setIsReturning(false));
  }

  function handleOpenAssignEquipment(item) {
    setAssignTarget(item);
    setAssignValues(ASSIGN_EQUIPMENT_INITIAL_VALUES);
    setAssignError(null);
    setIsAssignModalOpen(true);

    fetchEmployees()
      .then((data) => setAssignEmployeeOptions(Array.isArray(data) ? data : []))
      .catch(() => setAssignEmployeeOptions([]));

    fetchDepartments()
      .then((data) => setDepartments(Array.isArray(data) ? data : []))
      .catch(() => setDepartments([]));

    fetchEquipmentStatuses()
      .then((data) => setEquipmentStatuses(excludeBrokenStatuses(data)))
      .catch(() => setEquipmentStatuses([]));
  }

  function handleCloseAssignEquipment() {
    setIsAssignModalOpen(false);
  }

  function handleAssignFieldChange(key, value) {
    setAssignValues((current) => ({ ...current, [key]: value }));
  }

  function handleAssignEmployeeSelect(employee) {
    setAssignValues((current) => ({
      ...current,
      employee_id: String(employee.employee_id),
      department: getEmployeeDepartmentCode(employee) || current.department,
    }));
  }

  function handleSubmitAssignEquipment(event) {
    event.preventDefault();
    if (!assignTarget) return;

    if (!assignValues.employee_id) {
      setAssignError("Please select an employee.");
      return;
    }

    setIsAssigning(true);
    setAssignError(null);

    const payload = { equipment_id: assignTarget.equipment_id };
    for (const [key, value] of Object.entries(assignValues)) {
      if (value.trim() === "") continue;
      payload[key] = key === "employee_id" ? Number(value) : value;
    }

    assignEquipment(payload)
      .then(() => {
        logActivity({
          actor: user,
          action: "assign",
          module: ACTIVITY_MODULES.EQUIPMENT,
          entityId: assignTarget.equipment_id,
          entityLabel: getEquipmentDisplayName(assignTarget),
          after: payload,
        });
        setIsAssignModalOpen(false);
        handleRetryAvailableStock();
        handleRetryNotifications();
      })
      .catch((error) => setAssignError(error.message || "Something went wrong."))
      .finally(() => setIsAssigning(false));
  }

  function handleOpenBorrowEquipment(item) {
    setBorrowTarget(item);
    setBorrowValues(BORROW_EQUIPMENT_INITIAL_VALUES);
    setBorrowError(null);
    setIsBorrowModalOpen(true);

    fetchEmployees()
      .then((data) => setAssignEmployeeOptions(Array.isArray(data) ? data : []))
      .catch(() => setAssignEmployeeOptions([]));
  }

  function handleCloseBorrowEquipment() {
    setIsBorrowModalOpen(false);
  }

  function handleBorrowFieldChange(key, value) {
    setBorrowValues((current) => ({ ...current, [key]: value }));
  }

  function handleBorrowEmployeeSelect(employee) {
    setBorrowValues((current) => ({ ...current, employee_id: String(employee.employee_id) }));
  }

  function handleSubmitBorrowEquipment(event) {
    event.preventDefault();
    if (!borrowTarget) return;

    if (!borrowValues.employee_id) {
      setBorrowError("Please select an employee.");
      return;
    }
    if (!borrowValues.expected_return_date) {
      setBorrowError("Please set an expected return date.");
      return;
    }

    setIsBorrowing(true);
    setBorrowError(null);

    const payload = {
      equipment_id: borrowTarget.equipment_id,
      borrower_id: Number(borrowValues.employee_id),
      expected_return_date: borrowValues.expected_return_date,
    };
    if (borrowValues.purpose.trim()) payload.purpose = borrowValues.purpose;
    if (borrowValues.condition_on_borrow.trim()) payload.condition_on_borrow = borrowValues.condition_on_borrow;
    if (borrowValues.remark.trim()) payload.remark = borrowValues.remark;

    createBorrow(payload)
      .then(() => {
        logActivity({
          actor: user,
          action: "borrow",
          module: ACTIVITY_MODULES.BORROW,
          entityId: borrowTarget.equipment_id,
          entityLabel: getEquipmentDisplayName(borrowTarget),
          after: payload,
        });
        setIsBorrowModalOpen(false);
        handleRetryAvailableStock();
        handleRetryNotifications();
      })
      .catch((error) => setBorrowError(error.message || "Something went wrong."))
      .finally(() => setIsBorrowing(false));
  }

  function handleViewEquipmentCategory(category, status = "All") {
    setEquipmentCategory(category);
    setEquipmentDetailCategory(category);
    setEquipmentStatusFilter(status);
    setIsEquipmentItemsLoading(true);
    setEquipmentItemsError(null);

    const queryCategory = category === "All" ? "" : category;
    fetchEquipmentByCategory(queryCategory, status)
      .then((data) => setEquipmentItems(Array.isArray(data) ? data : []))
      .catch((error) => setEquipmentItemsError(error.message || "Something went wrong."))
      .finally(() => setIsEquipmentItemsLoading(false));
  }

  function handleSelectEquipmentCategory(category) {
    handleViewEquipmentCategory(category, equipmentStatusFilter);
  }

  function handleFilterEquipmentStatus(status) {
    handleViewEquipmentCategory(equipmentCategory, status);
  }

  function handleBackToEquipmentCategories() {
    setEquipmentDetailCategory(null);
  }

  function runEmployeeSearch(term) {
    setIsEmployeeSearchLoading(true);
    setEmployeeSearchError(null);
    setHasSearchedEmployees(true);

    searchEmployees(term)
      .then((data) => setEmployeeSearchResults(Array.isArray(data) ? data : []))
      .catch((error) => setEmployeeSearchError(error.message || "Something went wrong."))
      .finally(() => setIsEmployeeSearchLoading(false));
  }

  function handleEmployeeSearchSubmit(event) {
    event.preventDefault();
    const term = employeeSearchTerm.trim();
    if (term) runEmployeeSearch(term);
  }

  function handleEmployeeSearchTermChange(value) {
    setEmployeeSearchTerm(value);
    if (!value.trim()) {
      setHasSearchedEmployees(false);
      setEmployeeSearchResults([]);
      setEmployeeSearchError(null);
    }
  }

  function handleViewEmployeeSearchDetail(group) {
    setEmployeeDetailTarget({
      employee_id: group.employee_id,
      full_name: group.owner_name,
      position: group.employee_position,
      department: group.employee_department,
      location: group.employee_location,
    });
    setEmployeeDetailDevices(group.devices);
    setIsEmployeeDetailLoading(false);
    setEmployeeDetailError(null);
  }

  function getEmployeeRecordFromSearchGroup(group) {
    const firstDevice = group.devices?.[0] || {};
    const employeeId = group.employee_id ?? firstDevice.employee_id;
    const fullName = group.owner_name ?? firstDevice.owner_name ?? firstDevice.full_name ?? "";
    const directoryRecord = employees.find(
      (employee) =>
        (employeeId !== undefined && String(employee.employee_id) === String(employeeId)) ||
        (fullName && employee.full_name === fullName)
    );

    if (directoryRecord) return directoryRecord;

    return {
      employee_id: employeeId,
      full_name: fullName,
      position: group.employee_position ?? firstDevice.employee_position ?? firstDevice.position ?? "",
      department:
        group.employee_department ??
        firstDevice.employee_department ??
        firstDevice.department ??
        firstDevice.department_code ??
        "",
      department_code:
        group.employee_department ?? firstDevice.department_code ?? firstDevice.department ?? "",
      location: group.employee_location ?? firstDevice.employee_location ?? firstDevice.location ?? "",
      staff_code: firstDevice.staff_code ?? "",
      phone: firstDevice.phone ?? "",
      sex: firstDevice.sex ?? "",
    };
  }

  useEffect(() => {
    if (!isEmployeeView) return;
    const term = employeeSearchTerm.trim();
    if (!term) return;

    const timeoutId = window.setTimeout(() => runEmployeeSearch(term), 400);
    return () => window.clearTimeout(timeoutId);
  }, [employeeSearchTerm, isEmployeeView]);

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
              <SidebarNavigation activeView={activeView} onSelect={handleSelectView} user={user} />
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
                    value={globalSearchQuery}
                    onChange={handleGlobalSearchQueryChange}
                    results={globalSearchResults}
                    isLoading={isGlobalSearchLoading}
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
                    value={globalSearchQuery}
                    onChange={handleGlobalSearchQueryChange}
                    results={globalSearchResults}
                    isLoading={isGlobalSearchLoading}
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
                        setIsNotificationsOpen((value) => !value);
                        setIsProfileMenuOpen(false);
                      }}
                      className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      aria-label="Notifications"
                      aria-haspopup="true"
                      aria-expanded={isNotificationsOpen}
                    >
                      <Bell size={18} />
                      {hasUnreadNotifications && (
                        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                          {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                        </span>
                      )}
                    </button>

                    {isNotificationsOpen && (
                      <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">Notifications</p>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              {unreadNotificationCount} unread
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleRetryNotifications}
                              disabled={isNotificationsLoading}
                              className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label="Refresh notifications"
                              title="Refresh notifications"
                            >
                              <RefreshCw size={13} className={isNotificationsLoading ? "animate-spin" : ""} />
                            </button>
                            <button
                              type="button"
                              onClick={handleMarkAllNotificationsRead}
                              disabled={visibleNotifications.length === 0}
                              className="rounded text-xs font-semibold text-orange-600 outline-none transition hover:text-orange-700 focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed disabled:text-slate-300"
                            >
                              Mark all as read
                            </button>
                          </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {isNotificationsLoading && visibleNotifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-[13px] text-slate-500">
                              Loading notifications...
                            </div>
                          ) : visibleNotifications.length === 0 ? (
                            <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
                          ) : (
                            visibleNotifications.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleOpenNotification(item)}
                                className="flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left outline-none transition last:border-b-0 hover:bg-slate-50 focus-visible:bg-slate-50"
                              >
                                <span
                                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                    item.unread
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
                      setIsNotificationsOpen(false);
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
                        setIsNotificationsOpen(false);
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
                ...homeStats,
                "Stock Available": notificationData.availableStock.length,
                "Currently Borrowed": notificationData.currentBorrows.length,
                License: notificationData.licenses.length,
                "My Activity": myActivityEntries.length,
                "Activity Log": activityEntries.length,
              }}
              isStatsLoading={isHomeStatsLoading}
              onSelectView={handleSelectView}
              notifications={visibleNotifications}
              onOpenNotification={handleOpenNotification}
              recentActivity={myActivityEntries}
            />
          )}

          {(isEquipmentView) && (
            <EquipmentView
              canManage={canManageEquipment}
              canCreate={canCreateRecords}
              categories={equipmentCategories}
              isLoading={isEquipmentLoading}
              error={equipmentError}
              onRetry={handleRetryEquipment}
              selectedCategory={equipmentCategory}
              onSelectCategory={handleSelectEquipmentCategory}
              detailCategory={equipmentDetailCategory}
              items={equipmentItems}
              isItemsLoading={isEquipmentItemsLoading}
              itemsError={equipmentItemsError}
              onViewCategory={handleViewEquipmentCategory}
              onBackToCategories={handleBackToEquipmentCategories}
              onAddNew={handleOpenAddEquipmentItem}
              onEdit={handleOpenEditEquipmentItem}
              onUnassign={handleOpenUnassignEquipment}
              onAddCategory={handleOpenAddCategory}
              onEditCategory={handleOpenEditCategory}
              onDeleteCategory={handleOpenDeleteCategory}
              statuses={equipmentStatuses}
              statusFilter={equipmentStatusFilter}
              onFilterStatus={handleFilterEquipmentStatus}
            />
          )}

          {isReplacementView && (
            <ReplacementsView
              replacements={replacements}
              isLoading={isReplacementsLoading}
              error={replacementsError}
              onRetry={handleRetryReplacements}
            />
          )}

          {isSsdUpgradeView && (
            <SsdUpgradesView
              upgrades={ssdUpgrades}
              isLoading={isSsdUpgradesLoading}
              error={ssdUpgradesError}
              onRetry={handleRetrySsdUpgrades}
            />
          )}

          {isSsdProcurementView && (
            <SsdProcurementView
              procurements={ssdProcurements}
              isLoading={isSsdProcurementLoading}
              error={ssdProcurementError}
              onRetry={handleRetrySsdProcurement}
            />
          )}

          {isAntivirusView && (
            <AntivirusView
              installs={antivirusInstalls}
              isLoading={isAntivirusLoading}
              error={antivirusError}
              onRetry={handleRetryAntivirus}
            />
          )}

          {isLicenseView && (
            <LicensesView
              licenses={licenses}
              isLoading={isLicensesLoading}
              error={licensesError}
              onRetry={handleRetryLicenses}
            />
          )}

          {isDepartmentsView && (
            <DepartmentsView
              canManage={canManageDepartments}
              canCreate={canCreateRecords}
              departments={departments}
              isLoading={isDepartmentsLoading}
              error={departmentsError}
              onRetry={handleRetryDepartments}
              onAddNew={handleOpenAddDepartment}
              onEdit={handleOpenEditDepartment}
              onDelete={handleOpenDeleteDepartment}
            />
          )}

          {isCloudRateView && (
            <CloudRatesView
              rates={cloudRates}
              isLoading={isCloudRatesLoading}
              error={cloudRatesError}
              onRetry={handleRetryCloudRates}
            />
          )}

          {isServerUsageView && (
            <ServerUsageView
              usage={serverUsage}
              isLoading={isServerUsageLoading}
              error={serverUsageError}
              onRetry={handleRetryServerUsage}
            />
          )}

          {isCloudUsageView && (
            <CloudUsageView
              usage={cloudUsage}
              isLoading={isCloudUsageLoading}
              error={cloudUsageError}
              onRetry={handleRetryCloudUsage}
            />
          )}

          {isAvailableStockView && (
            <AvailableStockView
              canManage={canManageStock}
              stock={availableStock}
              isLoading={isAvailableStockLoading}
              error={availableStockError}
              onRetry={handleRetryAvailableStock}
              onAssign={handleOpenAssignEquipment}
              onBorrow={handleOpenBorrowEquipment}
            />
          )}

          {isCurrentBorrowsView && (
            <CurrentBorrowsView
              canManage={canManageBorrows}
              loans={currentBorrows}
              isLoading={isCurrentBorrowsLoading}
              error={currentBorrowsError}
              onRetry={handleRetryCurrentBorrows}
              onReturn={handleOpenReturnEquipment}
            />
          )}

          {isBorrowHistoryView && (
            <BorrowHistoryView
              history={borrowHistory}
              isLoading={isBorrowHistoryLoading}
              error={borrowHistoryError}
              onRetry={handleRetryBorrowHistory}
              employees={assignEmployeeOptions}
              filters={borrowHistoryFilters}
              onFilterChange={handleBorrowHistoryFilterChange}
              onClearFilters={handleClearBorrowHistoryFilters}
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
            !isAvailableStockView &&
            !isCurrentBorrowsView &&
            !isBorrowHistoryView &&
            !isUsersView &&
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
                term={employeeSearchTerm}
                onTermChange={handleEmployeeSearchTermChange}
                onSubmit={handleEmployeeSearchSubmit}
                results={employeeSearchResults}
                isLoading={isEmployeeSearchLoading}
                error={employeeSearchError}
                hasSearched={hasSearchedEmployees}
                onViewDetail={handleViewEmployeeSearchDetail}
                onEdit={(group) => handleOpenEditEmployee(getEmployeeRecordFromSearchGroup(group))}
                onDelete={(group) => handleOpenDeleteEmployee(getEmployeeRecordFromSearchGroup(group))}
                canManage={canManageEmployees}
              />

              {/* Employee directory */}
              <EmployeeDirectoryTable
                canManage={canManageEmployees}
                canCreate={canCreateRecords}
                employees={paginatedEmployees}
                totalCount={sortedEmployees.length}
                sort={employeeSort}
                onSort={handleEmployeeSort}
                isLoading={isEmployeesLoading}
                error={employeesError}
                onRetry={handleRetryEmployees}
                page={employeePage}
                pageCount={employeePageCount}
                onPageChange={setEmployeePage}
                pageSize={EMPLOYEES_PAGE_SIZE}
                onViewDetail={handleViewEmployeeDetail}
                onAddNew={handleOpenAddEmployee}
                onEdit={handleOpenEditEmployee}
                onDelete={handleOpenDeleteEmployee}
              />
            </div>
          )}

          {isUsersView &&
            (canManageUsers ? (
              <UsersView
                users={users}
                pendingCount={pendingApprovalCount}
                isLoading={isUsersLoading}
                error={usersError}
                onRetry={handleRetryUsers}
                onApprove={handleApproveUser}
                onEditPermissions={handleOpenEditUserPermissions}
                onResetPassword={handleOpenResetPassword}
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

          {isMyActivityView && <MyActivityView entries={myActivityEntries} />}

          {isActivityLogView &&
            (canManageActivityLog ? (
              <ActivityLogView
                entries={filteredActivityLogEntries}
                totalCount={activityEntries.length}
                filters={activityLogFilters}
                onFilterChange={handleActivityLogFilterChange}
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
                entries={recycleBinEntries}
                isLoading={isRecycleBinLoading}
                error={recycleBinError}
                onRetry={handleRetryRecycleBin}
                typeFilter={recycleBinTypeFilter}
                onFilterChange={handleRecycleBinFilterChange}
                typeOptions={recycleBinTypeOptions}
                onRestore={handleRestoreRecycleBinItem}
                onDeleteForever={handleOpenDeleteRecycleBinItem}
                onPurgeAll={handleOpenPurgeRecycleBin}
                restoringId={restoringRecycleBinId}
                deletingId={deletingRecycleBinId}
                isPurging={isPurgingRecycleBin}
                actionError={recycleBinActionError}
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

      {employeeDetailTarget && (
        <EmployeeDetailModal
          employee={employeeDetailTarget}
          devices={employeeDetailDevices}
          isLoading={isEmployeeDetailLoading}
          error={employeeDetailError}
          onRetry={handleRetryEmployeeDetail}
          onClose={handleCloseEmployeeDetail}
          onUnassign={handleOpenUnassignEquipment}
          canManage={canManageEmployees}
        />
      )}

      <EquipmentFormModal
        isOpen={isEquipmentFormOpen}
        mode={equipmentFormMode}
        values={equipmentFormValues}
        onChange={handleEquipmentFormFieldChange}
        onSubmit={handleSubmitEquipmentForm}
        onClose={handleCloseEquipmentForm}
        isSubmitting={isSavingEquipment}
        error={equipmentFormError}
        departments={departments}
        statuses={equipmentStatuses}
        categoryOptions={equipmentFormCategoryOptions}
      />

      <AssignEquipmentModal
        isOpen={isAssignModalOpen}
        equipment={assignTarget}
        values={assignValues}
        onChange={handleAssignFieldChange}
        onSelectEmployee={handleAssignEmployeeSelect}
        onSubmit={handleSubmitAssignEquipment}
        onClose={handleCloseAssignEquipment}
        isSubmitting={isAssigning}
        error={assignError}
        employees={assignEmployeeOptions}
        departments={departments}
        statuses={equipmentStatuses}
      />

      <BorrowEquipmentModal
        isOpen={isBorrowModalOpen}
        equipment={borrowTarget}
        values={borrowValues}
        onChange={handleBorrowFieldChange}
        onSelectEmployee={handleBorrowEmployeeSelect}
        onSubmit={handleSubmitBorrowEquipment}
        onClose={handleCloseBorrowEquipment}
        isSubmitting={isBorrowing}
        error={borrowError}
        employees={assignEmployeeOptions}
      />

      <ReturnEquipmentModal
        isOpen={isReturnModalOpen}
        loan={returnTarget}
        values={returnValues}
        onChange={handleReturnFieldChange}
        onSubmit={handleSubmitReturnEquipment}
        onClose={handleCloseReturnEquipment}
        isSubmitting={isReturning}
        error={returnError}
      />

      <EmployeeFormModal
        isOpen={isEmployeeFormOpen}
        mode={employeeFormMode}
        values={employeeFormValues}
        onChange={handleEmployeeFormFieldChange}
        onSubmit={handleSubmitEmployeeForm}
        onClose={handleCloseEmployeeForm}
        isSubmitting={isSavingEmployee}
        error={employeeFormError}
        departments={departments}
      />

      <DepartmentFormModal
        isOpen={isDepartmentFormOpen}
        mode={departmentFormMode}
        values={departmentFormValues}
        onChange={handleDepartmentFormFieldChange}
        onSubmit={handleSubmitDepartmentForm}
        onClose={handleCloseDepartmentForm}
        isSubmitting={isSavingDepartment}
        error={departmentFormError}
      />

      <UserPermissionsModal
        isOpen={Boolean(userPermissionsTarget)}
        user={userPermissionsTarget}
        values={userPermissionValues}
        onChange={handleUserPermissionFieldChange}
        onSubmit={handleSubmitEditUserPermissions}
        onClose={handleCloseEditUserPermissions}
        isSubmitting={isSavingUserPermissions}
        error={userPermissionsError}
      />

      <ResetPasswordModal
        isOpen={Boolean(resetPasswordTarget)}
        user={resetPasswordTarget}
        password={resetPassword}
        confirmPassword={resetPasswordConfirm}
        onChangePassword={setResetPassword}
        onChangeConfirmPassword={setResetPasswordConfirm}
        onSubmit={handleSubmitResetPassword}
        onClose={handleCloseResetPassword}
        isSubmitting={isResettingPassword}
        error={resetPasswordError}
      />

      <CategoryFormModal
        isOpen={isCategoryFormOpen}
        mode={categoryFormMode}
        values={categoryFormValues}
        onChange={handleCategoryFormFieldChange}
        onSubmit={handleSubmitCategoryForm}
        onClose={handleCloseCategoryForm}
        isSubmitting={isSavingCategory}
        error={categoryFormError}
      />

      <ConfirmDialog
        isOpen={Boolean(employeeToDelete)}
        title="Delete this employee?"
        message={
          employeeToDelete
            ? `"${employeeToDelete.full_name}" will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete employee"
        onConfirm={handleConfirmDeleteEmployee}
        onCancel={handleCloseDeleteEmployee}
        isConfirming={isDeletingEmployee}
        error={deleteEmployeeError}
        blocked={deleteEmployeeBlocked}
        blockedActionLabel="Unassign devices"
        onBlockedAction={handleViewAssignedDevicesFromDelete}
      />

      <ConfirmDialog
        isOpen={Boolean(equipmentToUnassign)}
        title="Unassign this equipment?"
        message={
          equipmentToUnassign
            ? `"${getEquipmentDisplayName(equipmentToUnassign)}" will be removed from ${
                equipmentToUnassign.owner_name || "its current owner"
              } and returned to stock available as Working - IT Stock.`
            : ""
        }
        confirmLabel="Unassign"
        confirmingLabel="Unassigning..."
        onConfirm={handleConfirmUnassignEquipment}
        onCancel={handleCloseUnassignEquipment}
        isConfirming={isUnassigningEquipment}
        error={unassignEquipmentError}
      />

      <ConfirmDialog
        isOpen={Boolean(departmentToDelete)}
        title="Delete this department?"
        message={
          departmentToDelete
            ? `"${departmentToDelete.department_name}" will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete department"
        onConfirm={handleConfirmDeleteDepartment}
        onCancel={handleCloseDeleteDepartment}
        isConfirming={isDeletingDepartment}
        error={deleteDepartmentError}
      />

      <ConfirmDialog
        isOpen={Boolean(categoryToDelete)}
        title="Delete this category?"
        message={
          categoryToDelete
            ? `"${categoryToDelete.category_name || categoryToDelete.category}" will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete category"
        onConfirm={handleConfirmDeleteCategory}
        onCancel={handleCloseDeleteCategory}
        isConfirming={isDeletingCategory}
        error={deleteCategoryError}
      />

      <ConfirmDialog
        isOpen={Boolean(recycleBinItemToDelete)}
        title="Delete this item forever?"
        message="This will permanently remove it from the recycle bin. This cannot be undone."
        confirmLabel="Delete forever"
        onConfirm={handleConfirmDeleteRecycleBinItem}
        onCancel={handleCloseDeleteRecycleBinItem}
        isConfirming={Boolean(deletingRecycleBinId)}
        error={recycleBinActionError}
      />

      <ConfirmDialog
        isOpen={isPurgeRecycleBinOpen}
        title="Purge the entire recycle bin?"
        message={`${recycleBinEntries.length} item${recycleBinEntries.length === 1 ? "" : "s"} will be permanently deleted. This cannot be undone.`}
        confirmLabel="Purge all"
        onConfirm={handleConfirmPurgeRecycleBin}
        onCancel={handleClosePurgeRecycleBin}
        isConfirming={isPurgingRecycleBin}
        error={recycleBinActionError}
      />
    </div>
  );
}

export default Dashboard;
