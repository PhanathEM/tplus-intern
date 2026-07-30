import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiBell as Bell,
  FiBox as Box,
  FiChevronDown as ChevronDown,
  FiLogOut as LogOut,
  FiMenu as Menu,
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
  initialNotifications,
  navItemsByLabel,
} from "./dashboard.config";
import { getEmployeeDepartmentCode, normalizeRecordList } from "./dashboard.utils";
import { ConfirmDialog, EmptyState } from "./components/SharedControls";
import { SidebarBrand, SidebarNavigation } from "./components/Sidebar";
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

function Dashboard({ user, onLogout }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("Employee");
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuCloseTimeout = useRef(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [equipmentCategories, setEquipmentCategories] = useState([]);
  const [equipmentCategory, setEquipmentCategory] = useState("All");
  const [isEquipmentLoading, setIsEquipmentLoading] = useState(false);
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
  const [departments, setDepartments] = useState([]);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState(null);
  const [departmentsFetchToken, setDepartmentsFetchToken] = useState(0);
  const [replacements, setReplacements] = useState([]);
  const [isReplacementsLoading, setIsReplacementsLoading] = useState(false);
  const [replacementsError, setReplacementsError] = useState(null);
  const [replacementsFetchToken, setReplacementsFetchToken] = useState(0);
  const [ssdUpgrades, setSsdUpgrades] = useState([]);
  const [isSsdUpgradesLoading, setIsSsdUpgradesLoading] = useState(false);
  const [ssdUpgradesError, setSsdUpgradesError] = useState(null);
  const [ssdUpgradesFetchToken, setSsdUpgradesFetchToken] = useState(0);
  const [ssdProcurements, setSsdProcurements] = useState([]);
  const [isSsdProcurementLoading, setIsSsdProcurementLoading] = useState(false);
  const [ssdProcurementError, setSsdProcurementError] = useState(null);
  const [ssdProcurementFetchToken, setSsdProcurementFetchToken] = useState(0);
  const [antivirusInstalls, setAntivirusInstalls] = useState([]);
  const [isAntivirusLoading, setIsAntivirusLoading] = useState(false);
  const [antivirusError, setAntivirusError] = useState(null);
  const [antivirusFetchToken, setAntivirusFetchToken] = useState(0);
  const [licenses, setLicenses] = useState([]);
  const [isLicensesLoading, setIsLicensesLoading] = useState(false);
  const [licensesError, setLicensesError] = useState(null);
  const [licensesFetchToken, setLicensesFetchToken] = useState(0);
  const [cloudRates, setCloudRates] = useState([]);
  const [isCloudRatesLoading, setIsCloudRatesLoading] = useState(false);
  const [cloudRatesError, setCloudRatesError] = useState(null);
  const [cloudRatesFetchToken, setCloudRatesFetchToken] = useState(0);
  const [serverUsage, setServerUsage] = useState([]);
  const [isServerUsageLoading, setIsServerUsageLoading] = useState(false);
  const [serverUsageError, setServerUsageError] = useState(null);
  const [serverUsageFetchToken, setServerUsageFetchToken] = useState(0);
  const [cloudUsage, setCloudUsage] = useState([]);
  const [isCloudUsageLoading, setIsCloudUsageLoading] = useState(false);
  const [cloudUsageError, setCloudUsageError] = useState(null);
  const [cloudUsageFetchToken, setCloudUsageFetchToken] = useState(0);
  const [availableStock, setAvailableStock] = useState([]);
  const [isAvailableStockLoading, setIsAvailableStockLoading] = useState(false);
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
  const [isCurrentBorrowsLoading, setIsCurrentBorrowsLoading] = useState(false);
  const [currentBorrowsError, setCurrentBorrowsError] = useState(null);
  const [currentBorrowsFetchToken, setCurrentBorrowsFetchToken] = useState(0);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null);
  const [returnValues, setReturnValues] = useState(RETURN_EQUIPMENT_INITIAL_VALUES);
  const [isReturning, setIsReturning] = useState(false);
  const [returnError, setReturnError] = useState(null);
  const [borrowHistory, setBorrowHistory] = useState([]);
  const [isBorrowHistoryLoading, setIsBorrowHistoryLoading] = useState(false);
  const [borrowHistoryError, setBorrowHistoryError] = useState(null);
  const [borrowHistoryFetchToken, setBorrowHistoryFetchToken] = useState(0);
  const [borrowHistoryFilters, setBorrowHistoryFilters] = useState(BORROW_HISTORY_INITIAL_FILTERS);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [employeeSearchResults, setEmployeeSearchResults] = useState([]);
  const [isEmployeeSearchLoading, setIsEmployeeSearchLoading] = useState(false);
  const [employeeSearchError, setEmployeeSearchError] = useState(null);
  const [hasSearchedEmployees, setHasSearchedEmployees] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(true);
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

  const [isDepartmentFormOpen, setIsDepartmentFormOpen] = useState(false);
  const [departmentFormMode, setDepartmentFormMode] = useState("add");
  const [departmentFormTarget, setDepartmentFormTarget] = useState(null);
  const [departmentFormValues, setDepartmentFormValues] = useState({ department_code: "", department_name: "" });
  const [isSavingDepartment, setIsSavingDepartment] = useState(false);
  const [departmentFormError, setDepartmentFormError] = useState(null);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [isDeletingDepartment, setIsDeletingDepartment] = useState(false);
  const [deleteDepartmentError, setDeleteDepartmentError] = useState(null);
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
  const displayName = user?.name || "Admin User";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const hasUnreadNotifications = notifications.some((item) => item.unread);

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

    const req = categoryFormMode === "edit" && id ? updateCategory(id, payload) : createCategory(payload);

    req
      .then(() => {
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

    const request =
      departmentFormMode === "edit"
        ? updateDepartment(departmentFormTarget.department_id, payload)
        : createDepartment(payload);

    request
      .then(() => {
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
        setDepartmentToDelete(null);
        handleRetryDepartments();
      })
      .catch((error) => setDeleteDepartmentError(error.message || "Something went wrong."))
      .finally(() => setIsDeletingDepartment(false));
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

    const request =
      employeeFormMode === "edit"
        ? updateEmployee(employeeFormTarget.employee_id, payload)
        : createEmployee(payload);

    request
      .then(() => {
        setIsEmployeeFormOpen(false);
        handleRetryEmployees();
      })
      .catch((error) => setEmployeeFormError(error.message || "Something went wrong."))
      .finally(() => setIsSavingEmployee(false));
  }

  function handleOpenDeleteEmployee(employee) {
    setEmployeeToDelete(employee);
    setDeleteEmployeeError(null);
  }

  function handleCloseDeleteEmployee() {
    setEmployeeToDelete(null);
  }

  function handleConfirmDeleteEmployee() {
    if (!employeeToDelete) return;

    setIsDeletingEmployee(true);
    setDeleteEmployeeError(null);

    deleteEmployee(employeeToDelete.employee_id)
      .then(() => {
        setEmployeeToDelete(null);
        handleRetryEmployees();
      })
      .catch((error) => setDeleteEmployeeError(error.message || "Something went wrong."))
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

  function handleSelectView(label) {
    if (label === "Equipment" && label !== activeView) {
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
    setActiveView(label);
    setIsMobileSidebarOpen(false);
  }

  function handleMarkAllNotificationsRead() {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
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

  const activeNavItem = navItemsByLabel[activeView];
  const isEmployeeView = activeView === "Employee";
  const isDepartmentsView = activeView === "Departments";
  const isEquipmentView = activeView === "Equipment";
  const isReplacementView = activeView === "Device Replacement";
  const isSsdUpgradeView = activeView === "SSD Upgrade";
  const isSsdProcurementView = activeView === "SSD Procurement";
  const isAntivirusView = activeView === "Antivirus Install";
  const isLicenseView = activeView === "License";
  const isCloudRateView = activeView === "Cloud Rate";
  const isServerUsageView = activeView === "Service Usage";
  const isCloudUsageView = activeView === "Cloud Usage";
  const isAvailableStockView = activeView === "Stock Available";
  const isCurrentBorrowsView = activeView === "Currently Borrowed";
  const isBorrowHistoryView = activeView === "Borrow History";

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

    let ignore = false;

    fetchEquipmentStatuses()
      .then((data) => {
        if (!ignore) setEquipmentStatuses(Array.isArray(data) ? data : []);
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
        if (!ignore) {
          setLicenses(normalizeRecordList(data));
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
        if (!ignore) {
          setAvailableStock(Array.isArray(data?.equipment) ? data.equipment : []);
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
        if (!ignore) {
          setCurrentBorrows(Array.isArray(data?.borrowed) ? data.borrowed : []);
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
      .then((data) => setEquipmentStatuses(Array.isArray(data) ? data : []))
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
      .then((data) => setEquipmentStatuses(Array.isArray(data) ? data : []))
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

    const request =
      equipmentFormMode === "edit"
        ? updateEquipment(equipmentFormTarget.equipment_id, payload)
        : createEquipment(payload);

    request
      .then(() => {
        setIsEquipmentFormOpen(false);
        handleRetryEquipment();
        if (equipmentDetailCategory) {
          handleViewEquipmentCategory(equipmentDetailCategory, equipmentStatusFilter);
        }
      })
      .catch((error) => setEquipmentFormError(error.message || "Something went wrong."))
      .finally(() => setIsSavingEquipment(false));
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
        setIsReturnModalOpen(false);
        handleRetryCurrentBorrows();
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
      .then((data) => setEquipmentStatuses(Array.isArray(data) ? data : []))
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
        setIsAssignModalOpen(false);
        handleRetryAvailableStock();
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
        setIsBorrowModalOpen(false);
        handleRetryAvailableStock();
      })
      .catch((error) => setBorrowError(error.message || "Something went wrong."))
      .finally(() => setIsBorrowing(false));
  }

  function handleViewEquipmentCategory(category, status = "All") {
    setEquipmentDetailCategory(category);
    setEquipmentStatusFilter(status);
    setIsEquipmentItemsLoading(true);
    setEquipmentItemsError(null);

    fetchEquipmentByCategory(category, status)
      .then((data) => setEquipmentItems(Array.isArray(data) ? data : []))
      .catch((error) => setEquipmentItemsError(error.message || "Something went wrong."))
      .finally(() => setIsEquipmentItemsLoading(false));
  }

  function handleFilterEquipmentStatus(status) {
    handleViewEquipmentCategory(equipmentDetailCategory, status);
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
              <SidebarNavigation activeView={activeView} onSelect={handleSelectView} />
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
          <SidebarNavigation collapsed={isSidebarCollapsed} activeView={activeView} onSelect={handleSelectView} />
        </aside>


        {/* Main content */}
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
              {isMobileSearchOpen ? (
                <div className="flex flex-1 items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      autoFocus
                      type="search"
                      placeholder="Search users, assets, requests"
                      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
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

                  <label className="relative hidden w-72 shrink-0 lg:block">
                    <span className="sr-only">Search</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                      placeholder="Search users, assets, requests"
                      type="search"
                    />
                  </label>

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
                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                      )}
                    </button>

                    {isNotificationsOpen && (
                      <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                          <p className="text-sm font-semibold text-slate-950">Notifications</p>
                          <button
                            type="button"
                            onClick={handleMarkAllNotificationsRead}
                            className="rounded text-xs font-semibold text-orange-600 outline-none transition hover:text-orange-700 focus-visible:ring-2 focus-visible:ring-orange-400"
                          >
                            Mark all as read
                          </button>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
                          ) : (
                            notifications.map((item) => (
                              <div key={item.id} className="flex gap-3 border-b border-slate-50 px-4 py-3 last:border-b-0">
                                <span
                                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.unread ? "bg-orange-500" : "bg-transparent"
                                    }`}
                                />
                                <div className="min-w-0">
                                  <p className="text-[13px] font-semibold text-slate-950">{item.title}</p>
                                  <p className="mt-0.5 text-[13px] text-slate-500">{item.detail}</p>
                                  <p className="mt-1 text-[11px] text-slate-400">{item.time}</p>
                                </div>
                              </div>
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
                          <p className="truncate text-xs text-slate-500">System admin</p>
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

          {isEquipmentView && (
            <EquipmentView
              categories={equipmentCategories}
              isLoading={isEquipmentLoading}
              error={equipmentError}
              onRetry={handleRetryEquipment}
              selectedCategory={equipmentCategory}
              onSelectCategory={setEquipmentCategory}
              detailCategory={equipmentDetailCategory}
              items={equipmentItems}
              isItemsLoading={isEquipmentItemsLoading}
              itemsError={equipmentItemsError}
              onViewCategory={handleViewEquipmentCategory}
              onBackToCategories={handleBackToEquipmentCategories}
              onAddNew={handleOpenAddEquipmentItem}
              onEdit={handleOpenEditEquipmentItem}
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

          {!isEmployeeView &&
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
            !isBorrowHistoryView && (
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
              />

              {/* Employee directory */}
              <EmployeeDirectoryTable
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
    </div>
  );
}

export default Dashboard;
