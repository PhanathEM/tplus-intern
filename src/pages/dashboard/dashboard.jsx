import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiActivity as Activity,
  FiAlertTriangle as AlertTriangle,
  FiBell as Bell,
  FiBox as Box,
  FiChevronDown as ChevronDown,
  FiChevronUp as ChevronUp,
  FiCloud as Cloud,
  FiDollarSign as DollarSign,
  FiHardDrive as HardDrive,
  FiKey as Key,
  FiLogOut as LogOut,
  FiMenu as Menu,
  FiPlusCircle as PlusCircle,
  FiRefreshCw as RefreshCw,
  FiSearch as Search,
  FiSettings as Settings,
  FiShield as Shield,
  FiShoppingCart as ShoppingCart,
  FiUser as UserIcon,
  FiUsers as Users,
  FiLayers as Layers,
  FiX as X,
} from "react-icons/fi";
import { TbLayoutSidebar } from "react-icons/tb";
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

// ---------------------------------------------------------------------------
// Design tokens (kept local so the whole thing stays a single-file artifact)
// ---------------------------------------------------------------------------
// Base neutral:  slate
// Accent:        orange (trust / enterprise, used sparingly — nav, primary CTA, focus)
// Semantic:      emerald (good), amber (attention), rose (risk), sky (info)

const navSections = [
  {
    label: "Workforce",
    items: [
      { label: "Employee", icon: Users },
      { label: "Departments", icon: Layers },
    ],
  },
  {
    label: "Hardware",
    items: [
      {
        label: "Equipment",
        icon: Box,
        children: [
          { label: "Stock Available", icon: Box },
          { label: "Currently Borrowed", icon: RefreshCw },
          { label: "Borrow History", icon: Search },
        ],
      },
      { label: "Device Replacement", icon: RefreshCw },
      { label: "SSD Upgrade", icon: HardDrive },
      { label: "SSD Procurement", icon: ShoppingCart },
    ],
  },
  {
    label: "Software & Security",
    items: [
      { label: "Antivirus Install", icon: Shield },
      { label: "License", icon: Key },
    ],
  },
  {
    label: "Cloud",
    items: [
      { label: "Cloud Rate", icon: DollarSign },
      { label: "Cloud Usage", icon: Cloud },
    ],
  },
  {
    label: "Operations",
    items: [{ label: "Service Usage", icon: Activity }],
  },
];

const navItemsByLabel = navSections
  .flatMap((section) => section.items)
  .flatMap((item) => (item.children ? [item, ...item.children] : [item]))
  .reduce((acc, item) => ({ ...acc, [item.label]: item }), {});

const initialNotifications = [
  {
    id: "ntf-1",
    title: "Unusual sign-in detected",
    detail: "New device login from Phnom Penh, KH",
    time: "5 min ago",
    unread: true,
  },
  {
    id: "ntf-2",
    title: "SSD upgrade approved",
    detail: "Procurement approved 12 units",
    time: "1 hr ago",
    unread: true,
  },
  {
    id: "ntf-3",
    title: "Weekly report ready",
    detail: "Asset compliance report generated",
    time: "Yesterday",
    unread: false,
  },
];

const equipmentItemColumns = [
  { key: "equipment_id", label: "Equipment ID" },
  { key: "category", label: "Category" },
  { key: "device_type", label: "Device Type" },
  { key: "device_model", label: "Device Model" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "computer_name", label: "Computer Name" },
  { key: "equipment_code", label: "Equipment Code" },
  { key: "service_tag", label: "Service Tag" },
  { key: "serial_no", label: "Serial No" },
  { key: "product_id", label: "Product ID" },
  { key: "mac_address", label: "MAC Address" },
  { key: "ip_address", label: "IP Address" },
  { key: "os_type", label: "OS Type" },
  { key: "os_version", label: "OS Version" },
  { key: "cpu", label: "CPU" },
  { key: "ram", label: "RAM" },
  { key: "hd", label: "HD" },
  { key: "windows_license", label: "Windows License" },
  { key: "av_license", label: "AV License" },
  { key: "location", label: "Location" },
  { key: "department", label: "Department" },
  { key: "status", label: "Status" },
  { key: "purchase_date", label: "Purchase Date" },
  { key: "received_date", label: "Received Date" },
  { key: "assigned_date", label: "Assigned Date" },
  { key: "owner_id", label: "Owner ID" },
  { key: "owner_name", label: "Owner Name" },
  { key: "remark", label: "Remark" },
];

const replacementColumns = [
  { key: "replacement_id", label: "Replacement ID" },
  { key: "employee_id", label: "Employee ID" },
  { key: "owner_name", label: "Owner Name" },
  { key: "owner_department", label: "Owner Department" },
  { key: "old_computer_name", label: "Old Computer Name" },
  { key: "old_device_model", label: "Old Device Model" },
  { key: "old_service_tag", label: "Old Service Tag" },
  { key: "old_asset_code", label: "Old Asset Code" },
  { key: "old_device_status", label: "Old Device Status" },
  { key: "old_device_location", label: "Old Device Location" },
  { key: "old_bag", label: "Old Bag" },
  { key: "old_mouse", label: "Old Mouse" },
  { key: "old_keyboard", label: "Old Keyboard" },
  { key: "new_computer_name", label: "New Computer Name" },
  { key: "new_device_model", label: "New Device Model" },
  { key: "new_service_tag", label: "New Service Tag" },
  { key: "new_asset_code", label: "New Asset Code" },
  { key: "new_bag", label: "New Bag" },
  { key: "new_mouse", label: "New Mouse" },
  { key: "new_keyboard", label: "New Keyboard" },
  { key: "new_owner_location", label: "New Owner Location" },
  { key: "replacement_date", label: "Replacement Date" },
];

const departmentColumns = [
  { key: "department_id", label: "Department ID" },
  { key: "department_code", label: "Department Code" },
  { key: "department_name", label: "Department Name" },
  { key: "employee_count", label: "Employees" },
  { key: "equipment_count", label: "Equipment" },
];

const ssdUpgradeColumns = [
  { key: "upgrade_id", label: "Upgrade ID" },
  { key: "employee_id", label: "Employee ID" },
  { key: "owner_name", label: "Owner Name" },
  { key: "owner_department", label: "Owner Department" },
  { key: "owner_location", label: "Owner Location" },
  { key: "equipment_id", label: "Equipment ID" },
  { key: "computer_name", label: "Computer Name" },
  { key: "device_model", label: "Device Model" },
  { key: "asset_code", label: "Asset Code" },
  { key: "charge_cable_needed", label: "Charge Cable Needed" },
  { key: "replace_status", label: "Replace Status" },
  { key: "ssd_capacity", label: "SSD Capacity" },
  { key: "ssd_equipment_code", label: "SSD Equipment Code" },
  { key: "remark", label: "Remark" },
];

const ssdProcurementColumns = [
  { key: "procurement_id", label: "Procurement ID" },
  { key: "model_name", label: "Model Name" },
  { key: "qty", label: "Quantity" },
  { key: "decision", label: "Decision" },
];

const antivirusColumns = [
  { key: "install_id", label: "Install ID" },
  { key: "equipment_id", label: "Equipment ID" },
  { key: "owner_name", label: "Owner Name" },
  { key: "computer_name", label: "Computer Name" },
  { key: "device_model", label: "Device Model" },
  { key: "asset_code", label: "Asset Code" },
  { key: "antivirus_status", label: "Antivirus Status" },
  { key: "windows_server_license", label: "Windows Server License" },
  { key: "plan_date", label: "Plan Date" },
  { key: "due_date", label: "Due Date" },
  { key: "completed_date", label: "Completed Date" },
  { key: "remark", label: "Remark" },
];

const licenseColumns = [
  { key: "license_id", label: "License ID" },
  { key: "product_name", label: "Product Name" },
  { key: "product_type", label: "Product Type" },
  { key: "date_expire", label: "Date Expire" },
  { key: "date_renewed", label: "Date Renewed" },
  { key: "status", label: "Status" },
  { key: "remark", label: "Remark" },
];

const cloudRateColumns = [
  { key: "rate_id", label: "Rate ID" },
  { key: "item_name", label: "Item Name" },
  { key: "unit", label: "Unit" },
  { key: "capacity", label: "Capacity" },
  { key: "price_type", label: "Price Type" },
  { key: "unit_price", label: "Unit Price" },
  { key: "total_price_month", label: "Total Price / Month" },
  { key: "total_price_year", label: "Total Price / Year" },
  { key: "year", label: "Year" },
];

const serverUsageColumns = [
  { key: "usage_id", label: "Usage ID" },
  { key: "equipment_id", label: "Equipment ID" },
  { key: "owner_name", label: "Owner Name" },
  { key: "computer_name", label: "Computer Name" },
  { key: "device_model", label: "Device Model" },
  { key: "platform", label: "Platform" },
  { key: "device_location", label: "Device Location" },
  { key: "mac_address", label: "MAC Address" },
  { key: "ip_address", label: "IP Address" },
  { key: "os_type", label: "OS Type" },
  { key: "os_version", label: "OS Version" },
  { key: "windows_license_active", label: "Windows License Active" },
  { key: "sql_version", label: "SQL Version" },
  { key: "sql_license_active", label: "SQL License Active" },
  { key: "cpu_core_total", label: "CPU Core Total" },
  { key: "cpu_usage_pct", label: "CPU Usage %" },
  { key: "memory_gb_total", label: "Memory GB Total" },
  { key: "memory_usage_pct", label: "Memory Usage %" },
  { key: "hdd_gb_total", label: "HDD GB Total" },
  { key: "hdd_usage_gb", label: "HDD Usage GB" },
  { key: "antivirus_status", label: "Antivirus Status" },
  { key: "reinstall_antivirus", label: "Reinstall Antivirus" },
  { key: "service_date", label: "Service Date" },
  { key: "service_running", label: "Service Running" },
  { key: "status_check", label: "Status Check" },
  { key: "owner_id", label: "Owner ID" },
  { key: "remark", label: "Remark" },
];

const cloudUsageColumns = [
  { key: "usage_id", label: "Usage ID" },
  { key: "item_name", label: "Item Name" },
  { key: "unit", label: "Unit" },
  { key: "unit_cost", label: "Unit Cost" },
  { key: "usage_month", label: "Usage Month" },
  { key: "quantity", label: "Quantity" },
  { key: "amount", label: "Amount" },
];

const EQUIPMENT_CATEGORY_OPTIONS = ["Desktop", "Laptop", "PC"];

const ADD_EQUIPMENT_TEXT_FIELDS = [
  { key: "device_type", label: "Device Type" },
  { key: "device_model", label: "Device Model" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "equipment_code", label: "Equipment Code" },
  { key: "service_tag", label: "Service Tag" },
  { key: "serial_no", label: "Serial No" },
  { key: "product_id", label: "Product ID" },
  { key: "mac_address", label: "MAC Address" },
  { key: "ip_address", label: "IP Address" },
  { key: "os_type", label: "OS Type" },
  { key: "os_version", label: "OS Version" },
  { key: "cpu", label: "CPU" },
  { key: "ram", label: "RAM" },
  { key: "hd", label: "HD" },
];

const ADD_EQUIPMENT_INITIAL_VALUES = {
  category: "",
  device_type: "",
  device_model: "",
  manufacturer: "",
  equipment_code: "",
  service_tag: "",
  serial_no: "",
  product_id: "",
  mac_address: "",
  ip_address: "",
  os_type: "",
  os_version: "",
  cpu: "",
  ram: "",
  hd: "",
  windows_license: "",
  av_license: "",
  purchase_date: "",
  received_date: "",
  department: "",
  status: "",
  remark: "",
};

const availableStockColumns = [
  { key: "equipment_id", label: "Equipment ID" },
  { key: "category", label: "Category" },
  { key: "device_type", label: "Device Type" },
  { key: "device_model", label: "Device Model" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "computer_name", label: "Computer Name" },
  { key: "equipment_code", label: "Equipment Code" },
  { key: "service_tag", label: "Service Tag" },
  { key: "mac_address", label: "MAC Address" },
  { key: "ip_address", label: "IP Address" },
  { key: "cpu", label: "CPU" },
  { key: "ram", label: "RAM" },
  { key: "hd", label: "HD" },
  { key: "location", label: "Location" },
  { key: "department", label: "Department" },
  { key: "status", label: "Status" },
  { key: "purchase_date", label: "Purchase Date" },
  { key: "received_date", label: "Received Date" },
  { key: "remark", label: "Remark" },
];

const ASSIGN_EQUIPMENT_INITIAL_VALUES = {
  employee_id: "",
  assigned_date: "",
  computer_name: "",
  ip_address: "",
  location: "",
  department: "",
  status: "",
};

const BORROW_EQUIPMENT_INITIAL_VALUES = {
  employee_id: "",
  expected_return_date: "",
  purpose: "",
  condition_on_borrow: "",
  remark: "",
};

const currentBorrowColumns = [
  { key: "borrow_id", label: "Borrow ID" },
  { key: "category_name", label: "Category" },
  { key: "device_model", label: "Device Model" },
  { key: "computer_name", label: "Computer Name" },
  { key: "equipment_code", label: "Equipment Code" },
  { key: "service_tag", label: "Service Tag" },
  { key: "borrower_name", label: "Borrower" },
  { key: "borrower_department", label: "Department" },
  { key: "borrow_date", label: "Borrow Date" },
  { key: "expected_return_date", label: "Expected Return" },
  { key: "days_out", label: "Days Out" },
  { key: "is_overdue", label: "Overdue" },
  { key: "condition_on_borrow", label: "Condition on Borrow" },
  { key: "purpose", label: "Purpose" },
  { key: "remark", label: "Remark" },
];

const borrowHistoryColumns = [
  { key: "borrow_id", label: "Borrow ID" },
  { key: "category_name", label: "Category" },
  { key: "device_model", label: "Device Model" },
  { key: "computer_name", label: "Computer Name" },
  { key: "equipment_code", label: "Equipment Code" },
  { key: "borrower_name", label: "Borrower" },
  { key: "borrower_department", label: "Department" },
  { key: "loan_status", label: "Status" },
  { key: "borrow_date", label: "Borrow Date" },
  { key: "expected_return_date", label: "Expected Return" },
  { key: "return_date", label: "Return Date" },
  { key: "condition_on_borrow", label: "Condition (Borrow)" },
  { key: "condition_on_return", label: "Condition (Return)" },
  { key: "purpose", label: "Purpose" },
  { key: "remark", label: "Remark" },
];

const BORROW_HISTORY_INITIAL_FILTERS = {
  borrower_id: "",
  from: "",
  to: "",
};

const RETURN_EQUIPMENT_INITIAL_VALUES = {
  return_date: "",
  condition_on_return: "",
};

const EMPLOYEE_FORM_INITIAL_VALUES = {
  full_name: "",
  position: "",
  department: "",
  location: "",
  staff_code: "",
  phone: "",
  sex: "",
};

const EMPLOYEES_PAGE_SIZE = 8;

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-400">
        <Icon size={18} />
      </div>
      <p className="text-[13px] font-semibold text-slate-700">{title}</p>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
}

function normalizeRecordList(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return [data];
  return [];
}

function getEmployeeDepartmentCode(employee) {
  return employee?.department_code || employee?.department || null;
}

// ---------------------------------------------------------------------------
// Equipment
// ---------------------------------------------------------------------------

function CategoryDropdown({ options, selected, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="inline-flex h-9 min-w-44 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selected}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-30 mt-2 max-h-72 w-52 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={option === selected}
              onClick={() => {
                onSelect(option);
                setIsOpen(false);
              }}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-[13px] font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${option === selected ? "bg-orange-50 text-orange-700" : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FormField({ label, htmlFor, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

const formInputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  isConfirming,
  error,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onCancel}
        aria-label="Close"
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="px-6 py-5">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-600">
            <AlertTriangle size={18} />
          </div>
          <h2 className="text-[15px] font-semibold text-slate-950">{title}</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{message}</p>
          {error && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700">
              {error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConfirming ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function EquipmentFormModal({
  isOpen,
  mode,
  values,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
  departments,
  statuses,
  categoryOptions,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const isEdit = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">
              {isEdit ? "Edit equipment" : "Add new equipment"}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {isEdit ? "Update this item's details." : "New items start unassigned in stock."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Category *" htmlFor="add-equipment-category">
                <select
                  id="add-equipment-category"
                  required
                  autoComplete="off"
                  value={values.category}
                  onChange={(e) => onChange("category", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              {ADD_EQUIPMENT_TEXT_FIELDS.map((field) => (
                <FormField key={field.key} label={field.label} htmlFor={`add-equipment-${field.key}`}>
                  <input
                    id={`add-equipment-${field.key}`}
                    type="text"
                    autoComplete="off"
                    value={values[field.key]}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    className={formInputClass}
                    disabled={isSubmitting}
                  />
                </FormField>
              ))}

              <FormField label="Department" htmlFor="add-equipment-department">
                <select
                  id="add-equipment-department"
                  autoComplete="off"
                  value={values.department}
                  onChange={(e) => onChange("department", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                >
                  <option value="">—</option>
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_code}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Status" htmlFor="add-equipment-status">
                <select
                  id="add-equipment-status"
                  autoComplete="off"
                  value={values.status}
                  onChange={(e) => onChange("status", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                >
                  <option value="">—</option>
                  {statuses.map((status) => (
                    <option key={status.status_id} value={status.status_name}>
                      {status.status_name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Windows License" htmlFor="add-equipment-windows_license">
                <select
                  id="add-equipment-windows_license"
                  autoComplete="off"
                  value={values.windows_license}
                  onChange={(e) => onChange("windows_license", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                >
                  <option value="">—</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </FormField>

              <FormField label="AV License" htmlFor="add-equipment-av_license">
                <select
                  id="add-equipment-av_license"
                  autoComplete="off"
                  value={values.av_license}
                  onChange={(e) => onChange("av_license", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                >
                  <option value="">—</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </FormField>

              <FormField label="Purchase Date" htmlFor="add-equipment-purchase_date">
                <input
                  id="add-equipment-purchase_date"
                  type="date"
                  autoComplete="off"
                  value={values.purchase_date}
                  onChange={(e) => onChange("purchase_date", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="Received Date" htmlFor="add-equipment-received_date">
                <input
                  id="add-equipment-received_date"
                  type="date"
                  autoComplete="off"
                  value={values.received_date}
                  onChange={(e) => onChange("received_date", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>

            <div className="mt-4">
              <FormField label="Remark" htmlFor="add-equipment-remark">
                <textarea
                  id="add-equipment-remark"
                  rows={3}
                  autoComplete="off"
                  value={values.remark}
                  onChange={(e) => onChange("remark", e.target.value)}
                  className={`${formInputClass} h-auto resize-none py-2`}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add equipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmployeeSelectDropdown({ employees, selectedId, onSelect, disabled, placeholder = "Select employee" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const selectedEmployee = employees.find(
    (employee) => String(employee.employee_id) === String(selectedId)
  );

  const filteredEmployees = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter((employee) => employee.full_name?.toLowerCase().includes(term));
  }, [employees, query]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        disabled={disabled}
        className={`${formInputClass} flex items-center justify-between text-left disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span className={`truncate ${selectedEmployee ? "text-slate-900" : "text-slate-400"}`}>
          {selectedEmployee
            ? `${selectedEmployee.full_name}${selectedEmployee.position ? ` · ${selectedEmployee.position}` : ""}`
            : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                type="text"
                autoFocus
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search employee name"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5">
            {filteredEmployees.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-slate-400">No employees found</p>
            ) : (
              filteredEmployees.map((employee) => {
                const isSelected = String(employee.employee_id) === String(selectedId);
                return (
                  <button
                    key={employee.employee_id}
                    type="button"
                    onClick={() => {
                      onSelect(employee);
                      setQuery("");
                      setIsOpen(false);
                    }}
                    className={`flex w-full flex-col items-start rounded-lg px-3 py-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${isSelected ? "bg-orange-50 text-orange-700" : "text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    <span className="text-[13px] font-medium">{employee.full_name}</span>
                    {(employee.position || getEmployeeDepartmentCode(employee)) && (
                      <span className="text-xs text-slate-400">
                        {[employee.position, getEmployeeDepartmentCode(employee)].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AssignEquipmentModal({
  isOpen,
  equipment,
  values,
  onChange,
  onSelectEmployee,
  onSubmit,
  onClose,
  isSubmitting,
  error,
  employees,
  departments,
  statuses,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen || !equipment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">Assign equipment</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {[equipment.category, equipment.device_type, equipment.device_model].filter(Boolean).join(" · ") ||
                `Equipment ${equipment.equipment_id}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField label="Employee *" htmlFor="assign-employee_id">
                  <EmployeeSelectDropdown
                    employees={employees}
                    selectedId={values.employee_id}
                    onSelect={onSelectEmployee}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

              <FormField label="Assigned Date" htmlFor="assign-assigned_date">
                <input
                  id="assign-assigned_date"
                  type="date"
                  autoComplete="off"
                  value={values.assigned_date}
                  onChange={(e) => onChange("assigned_date", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="Computer Name" htmlFor="assign-computer_name">
                <input
                  id="assign-computer_name"
                  type="text"
                  autoComplete="off"
                  value={values.computer_name}
                  onChange={(e) => onChange("computer_name", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="IP Address" htmlFor="assign-ip_address">
                <input
                  id="assign-ip_address"
                  type="text"
                  autoComplete="off"
                  value={values.ip_address}
                  onChange={(e) => onChange("ip_address", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="Location" htmlFor="assign-location">
                <input
                  id="assign-location"
                  type="text"
                  autoComplete="off"
                  value={values.location}
                  onChange={(e) => onChange("location", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="Department" htmlFor="assign-department">
                <select
                  id="assign-department"
                  autoComplete="off"
                  value={values.department}
                  onChange={(e) => onChange("department", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                >
                  <option value="">—</option>
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_code}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Status" htmlFor="assign-status">
                <select
                  id="assign-status"
                  autoComplete="off"
                  value={values.status}
                  onChange={(e) => onChange("status", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                >
                  <option value="">Keep current status</option>
                  {statuses.map((status) => (
                    <option key={status.status_id} value={status.status_name}>
                      {status.status_name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Assigning..." : "Assign equipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BorrowEquipmentModal({
  isOpen,
  equipment,
  values,
  onChange,
  onSelectEmployee,
  onSubmit,
  onClose,
  isSubmitting,
  error,
  employees,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen || !equipment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">Borrow equipment</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {[equipment.category, equipment.device_type, equipment.device_model].filter(Boolean).join(" · ") ||
                `Equipment ${equipment.equipment_id}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField label="Employee *" htmlFor="borrow-employee_id">
                  <EmployeeSelectDropdown
                    employees={employees}
                    selectedId={values.employee_id}
                    onSelect={onSelectEmployee}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

              <FormField label="Expected Return Date *" htmlFor="borrow-expected_return_date">
                <input
                  id="borrow-expected_return_date"
                  type="date"
                  required
                  autoComplete="off"
                  value={values.expected_return_date}
                  onChange={(e) => onChange("expected_return_date", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="Condition on Borrow" htmlFor="borrow-condition_on_borrow">
                <input
                  id="borrow-condition_on_borrow"
                  type="text"
                  autoComplete="off"
                  value={values.condition_on_borrow}
                  onChange={(e) => onChange("condition_on_borrow", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Purpose" htmlFor="borrow-purpose">
                  <input
                    id="borrow-purpose"
                    type="text"
                    autoComplete="off"
                    value={values.purpose}
                    onChange={(e) => onChange("purpose", e.target.value)}
                    className={formInputClass}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField label="Remark" htmlFor="borrow-remark">
                  <textarea
                    id="borrow-remark"
                    rows={3}
                    autoComplete="off"
                    value={values.remark}
                    onChange={(e) => onChange("remark", e.target.value)}
                    className={`${formInputClass} h-auto resize-none py-2`}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Borrowing..." : "Borrow equipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReturnEquipmentModal({ isOpen, loan, values, onChange, onSubmit, onClose, isSubmitting, error }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen || !loan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">Return equipment</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {[loan.category_name, loan.device_model, loan.computer_name].filter(Boolean).join(" · ") ||
                `Equipment ${loan.equipment_id}`}{" "}
              · borrowed by {loan.borrower_name || `#${loan.borrower_id}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <FormField label="Return Date *" htmlFor="return-return_date">
                <input
                  id="return-return_date"
                  type="date"
                  required
                  autoComplete="off"
                  value={values.return_date}
                  onChange={(e) => onChange("return_date", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="Condition on Return" htmlFor="return-condition_on_return">
                <input
                  id="return-condition_on_return"
                  type="text"
                  autoComplete="off"
                  value={values.condition_on_return}
                  onChange={(e) => onChange("condition_on_return", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Returning..." : "Mark as returned"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EquipmentItemsTable({
  category,
  items,
  isLoading,
  error,
  onRetry,
  onBack,
  statusOptions,
  statusFilter,
  onFilterStatus,
  onEdit,
}) {
  const columns = useMemo(() => getRecordColumns(items, equipmentItemColumns), [items]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <ChevronDown size={14} className="rotate-90 text-slate-500" />
              Back to categories
            </button>
            <h2 className="text-[15px] font-semibold text-slate-950">{category}</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500">
                {items.length} item{items.length === 1 ? "" : "s"}
                {statusFilter !== "All" && ` · ${statusFilter}`}
              </p>
            )}
          </div>
          <CategoryDropdown options={statusOptions} selected={statusFilter} onSelect={onFilterStatus} />
        </div>

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500">Loading equipment...</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700">Couldn&apos;t load equipment</p>
            <p className="text-xs text-slate-500">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={Box} title="No equipment found" description="This category has no items." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[13px]">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                      {column.label}
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item, index) => (
                  <tr key={item.equipment_id ?? index} className="transition hover:bg-slate-50/70">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 text-slate-600 ${column.key === "remark" ? "min-w-72 whitespace-normal" : "whitespace-nowrap"
                          }`}
                      >
                        <RecordCellValue value={item[column.key]} />
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EquipmentView({
  categories,
  isLoading,
  error,
  onRetry,
  selectedCategory,
  onSelectCategory,
  detailCategory,
  items,
  isItemsLoading,
  itemsError,
  onViewCategory,
  onBackToCategories,
  onAddNew,
  onEdit,
  statuses,
  statusFilter,
  onFilterStatus,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}) {
  const statusOptions = useMemo(() => ["All", ...statuses.map((item) => item.status_name)], [statuses]);

  const categoryOptions = useMemo(
    () => ["All", ...categories.map((item) => item.category)],
    [categories]
  );

  const filteredCategories = useMemo(
    () =>
      selectedCategory === "All"
        ? categories
        : categories.filter((item) => item.category === selectedCategory),
    [categories, selectedCategory]
  );

  const totals = useMemo(
    () =>
      filteredCategories.reduce(
        (acc, item) => ({
          totalItems: acc.totalItems + item.total_items,
          noOwner: acc.noOwner + item.no_owner,
          hasOwner: acc.hasOwner + item.has_owner,
        }),
        { totalItems: 0, noOwner: 0, hasOwner: 0 }
      ),
    [filteredCategories]
  );

  if (detailCategory) {
    return (
      <EquipmentItemsTable
        category={detailCategory}
        items={items}
        isLoading={isItemsLoading}
        error={itemsError}
        onRetry={() => onViewCategory(detailCategory, statusFilter)}
        onBack={onBackToCategories}
        statusOptions={statusOptions}
        statusFilter={statusFilter}
        onFilterStatus={onFilterStatus}
        onEdit={onEdit}
      />
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">Equipment by category</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500">
                {filteredCategories.length} categor{filteredCategories.length === 1 ? "y" : "ies"} ·{" "}
                {totals.totalItems} items · {totals.hasOwner} assigned · {totals.noOwner} unassigned
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <PlusCircle size={15} />
              Add New Item
            </button>
            <button
              type="button"
              onClick={onAddCategory}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <PlusCircle size={15} />
              Add New Category
            </button>
            <CategoryDropdown options={categoryOptions} selected={selectedCategory} onSelect={onSelectCategory} />
          </div>
        </div>

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500">Loading equipment categories...</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700">Couldn&apos;t load equipment data</p>
            <p className="text-xs text-slate-500">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <EmptyState icon={Box} title="No equipment found" description="No items match the selected category." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[13px]">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Total items</th>
                  <th className="px-5 py-3 font-semibold">No owner</th>
                  <th className="px-5 py-3 font-semibold">Has owner</th>
                  <th className="px-5 py-3 font-semibold">Ownership</th>
                  <th className="px-5 py-3 font-semibold text-right">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCategories.map((item) => {
                  const ownedPct =
                    item.total_items === 0 ? 0 : Math.round((item.has_owner / item.total_items) * 100);
                  return (
                    <tr key={item.category} className="transition hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-950">
                        {item.category}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{item.total_items}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{item.no_owner}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{item.has_owner}</td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${ownedPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{ownedPct}%</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onViewCategory(item.category)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                          >
                            View All Items
                            <ChevronDown size={12} className="-rotate-90" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditCategory(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteCategory(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 outline-none transition hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Operational record tables
// ---------------------------------------------------------------------------

function getRecordColumns(records, baseColumns) {
  const knownKeys = new Set(baseColumns.map((column) => column.key));
  const extraKeys = [];

  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (!knownKeys.has(key) && !extraKeys.includes(key)) {
        extraKeys.push(key);
      }
    }
  }

  return [
    ...baseColumns,
    ...extraKeys.map((key) => ({ key, label: humanizeFieldKey(key) })),
  ];
}

function RecordCellValue({ value }) {
  if (typeof value === "boolean") {
    return (
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${value ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
          }`}
      >
        {value ? "Yes" : "No"}
      </span>
    );
  }

  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400">N/A</span>;
  }

  return <span>{String(value)}</span>;
}

function RecordsTableView({
  records,
  columnsConfig,
  title,
  recordLabel,
  loadingText,
  errorTitle,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  rowKey,
  isLoading,
  error,
  onRetry,
  headerActions,
  renderRowActions,
}) {
  const columns = useMemo(() => getRecordColumns(records, columnsConfig), [records, columnsConfig]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">{title}</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500">
                {records.length} {recordLabel}{records.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {headerActions}
            <button
              type="button"
              onClick={onRetry}
              disabled={isLoading}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500">{loadingText}</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700">{errorTitle}</p>
            <p className="text-xs text-slate-500">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        ) : records.length === 0 ? (
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[13px]">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                      {column.label}
                    </th>
                  ))}
                  {renderRowActions && <th className="whitespace-nowrap px-4 py-3 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.map((record, index) => (
                  <tr key={rowKey(record, index)} className="transition hover:bg-slate-50/70">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 text-slate-600 ${column.key === "remark" ? "min-w-72 whitespace-normal" : "whitespace-nowrap"
                          }`}
                      >
                        <RecordCellValue value={record[column.key]} />
                      </td>
                    ))}
                    {renderRowActions && (
                      <td className="whitespace-nowrap px-4 py-3 text-right">{renderRowActions(record)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ReplacementsView({ replacements, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={replacements}
      columnsConfig={replacementColumns}
      title="Device replacements"
      recordLabel="replacement"
      loadingText="Loading replacements..."
      errorTitle="Couldn't load replacements"
      emptyIcon={RefreshCw}
      emptyTitle="No replacements found"
      emptyDescription="Replacement records will appear here."
      rowKey={(replacement, index) => replacement.replacement_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

function SsdUpgradesView({ upgrades, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={upgrades}
      columnsConfig={ssdUpgradeColumns}
      title="SSD upgrades"
      recordLabel="SSD upgrade"
      loadingText="Loading SSD upgrades..."
      errorTitle="Couldn't load SSD upgrades"
      emptyIcon={HardDrive}
      emptyTitle="No SSD upgrades found"
      emptyDescription="SSD upgrade records will appear here."
      rowKey={(upgrade, index) => upgrade.upgrade_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

function SsdProcurementView({ procurements, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={procurements}
      columnsConfig={ssdProcurementColumns}
      title="SSD procurement"
      recordLabel="procurement"
      loadingText="Loading SSD procurement..."
      errorTitle="Couldn't load SSD procurement"
      emptyIcon={ShoppingCart}
      emptyTitle="No SSD procurement found"
      emptyDescription="SSD procurement records will appear here."
      rowKey={(procurement, index) => procurement.procurement_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

function AntivirusView({ installs, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={installs}
      columnsConfig={antivirusColumns}
      title="Antivirus installs"
      recordLabel="install"
      loadingText="Loading antivirus installs..."
      errorTitle="Couldn't load antivirus installs"
      emptyIcon={Shield}
      emptyTitle="No antivirus installs found"
      emptyDescription="Antivirus install records will appear here."
      rowKey={(install, index) => install.install_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

function LicensesView({ licenses, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={licenses}
      columnsConfig={licenseColumns}
      title="Licenses"
      recordLabel="license"
      loadingText="Loading licenses..."
      errorTitle="Couldn't load licenses"
      emptyIcon={Key}
      emptyTitle="No licenses found"
      emptyDescription="License records will appear here."
      rowKey={(license, index) => license.license_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

function CloudRatesView({ rates, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={rates}
      columnsConfig={cloudRateColumns}
      title="Cloud rates"
      recordLabel="rate"
      loadingText="Loading cloud rates..."
      errorTitle="Couldn't load cloud rates"
      emptyIcon={DollarSign}
      emptyTitle="No cloud rates found"
      emptyDescription="Cloud rate records will appear here."
      rowKey={(rate, index) => rate.rate_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

function ServerUsageView({ usage, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={usage}
      columnsConfig={serverUsageColumns}
      title="Service usage"
      recordLabel="usage"
      loadingText="Loading service usage..."
      errorTitle="Couldn't load service usage"
      emptyIcon={Activity}
      emptyTitle="No service usage found"
      emptyDescription="Service usage records will appear here."
      rowKey={(record, index) => record.usage_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

function CloudUsageView({ usage, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={usage}
      columnsConfig={cloudUsageColumns}
      title="Cloud usage"
      recordLabel="usage record"
      loadingText="Loading cloud usage..."
      errorTitle="Couldn't load cloud usage"
      emptyIcon={Cloud}
      emptyTitle="No cloud usage found"
      emptyDescription="Cloud usage records will appear here."
      rowKey={(record, index) => record.usage_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

function DepartmentsView({ departments, isLoading, error, onRetry, onAddNew, onEdit, onDelete }) {
  return (
    <RecordsTableView
      records={departments}
      columnsConfig={departmentColumns}
      title="Departments"
      recordLabel="department"
      loadingText="Loading departments..."
      errorTitle="Couldn't load departments"
      emptyIcon={Users}
      emptyTitle="No departments found"
      emptyDescription="Department records will appear here."
      rowKey={(department, index) => department.department_id ?? department.department_code ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      headerActions={
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <PlusCircle size={14} />
          Add Department
        </button>
      }
      renderRowActions={(department) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(department)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(department)}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 outline-none transition hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Delete
          </button>
        </div>
      )}
    />
  );
}

function AvailableStockView({ stock, isLoading, error, onRetry, onAssign, onBorrow }) {
  return (
    <RecordsTableView
      records={stock}
      columnsConfig={availableStockColumns}
      title="Stock available"
      recordLabel="item"
      loadingText="Loading available stock..."
      errorTitle="Couldn't load available stock"
      emptyIcon={Box}
      emptyTitle="No available stock"
      emptyDescription="Unassigned equipment will appear here."
      rowKey={(item, index) => item.equipment_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      renderRowActions={(item) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onAssign(item)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Assign
          </button>
          <button
            type="button"
            onClick={() => onBorrow(item)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Borrow
          </button>
        </div>
      )}
    />
  );
}

function CurrentBorrowsView({ loans, isLoading, error, onRetry, onReturn }) {
  return (
    <RecordsTableView
      records={loans}
      columnsConfig={currentBorrowColumns}
      title="Currently borrowed"
      recordLabel="loan"
      loadingText="Loading current loans..."
      errorTitle="Couldn't load current loans"
      emptyIcon={RefreshCw}
      emptyTitle="Nothing borrowed"
      emptyDescription="Equipment currently on loan will appear here."
      rowKey={(loan, index) => loan.borrow_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      renderRowActions={(loan) => (
        <button
          type="button"
          onClick={() => onReturn(loan)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Return
        </button>
      )}
    />
  );
}

function BorrowHistoryView({
  history,
  isLoading,
  error,
  onRetry,
  employees,
  filters,
  onFilterChange,
  onClearFilters,
}) {
  const columns = useMemo(() => getRecordColumns(history, borrowHistoryColumns), [history]);
  const hasActiveFilters = Boolean(filters.borrower_id || filters.from || filters.to);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">Borrow history</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500">
                {history.length} record{history.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onRetry}
            disabled={isLoading}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
          <div className="w-56">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Borrower</label>
            <EmployeeSelectDropdown
              employees={employees}
              selectedId={filters.borrower_id}
              onSelect={(employee) => onFilterChange("borrower_id", String(employee.employee_id))}
              placeholder="All employees"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600" htmlFor="history-from">
              From
            </label>
            <input
              id="history-from"
              type="date"
              autoComplete="off"
              value={filters.from}
              onChange={(e) => onFilterChange("from", e.target.value)}
              className={formInputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600" htmlFor="history-to">
              To
            </label>
            <input
              id="history-to"
              type="date"
              autoComplete="off"
              value={filters.to}
              onChange={(e) => onFilterChange("to", e.target.value)}
              className={formInputClass}
            />
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              Clear filters
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500">Loading borrow history...</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700">Couldn&apos;t load borrow history</p>
            <p className="text-xs text-slate-500">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        ) : history.length === 0 ? (
          <EmptyState icon={Search} title="No borrow history" description="Loan records will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[13px]">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map((record, index) => (
                  <tr key={record.borrow_id ?? index} className="transition hover:bg-slate-50/70">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 text-slate-600 ${column.key === "remark" ? "min-w-72 whitespace-normal" : "whitespace-nowrap"
                          }`}
                      >
                        {column.key === "loan_status" ? (
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${record.loan_status === "Returned"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                              }`}
                          >
                            {record.loan_status}
                          </span>
                        ) : (
                          <RecordCellValue value={record[column.key]} />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Employee search
// ---------------------------------------------------------------------------

function groupEmployeeSearchResults(results) {
  const groups = new Map();
  for (const item of results) {
    const key = item.employee_id ?? item.owner_name;
    if (!groups.has(key)) {
      groups.set(key, {
        employee_id: item.employee_id,
        owner_name: item.owner_name,
        employee_position: item.employee_position,
        employee_department: item.employee_department,
        employee_location: item.employee_location,
        devices: [],
      });
    }
    groups.get(key).devices.push(item);
  }
  return [...groups.values()];
}

function EmployeeSearchPanel({
  term,
  onTermChange,
  onSubmit,
  results,
  isLoading,
  error,
  hasSearched,
  onViewDetail,
}) {
  const employeeGroups = useMemo(() => groupEmployeeSearchResults(results), [results]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-950">Employee lookup</h2>
          <p className="mt-0.5 text-[13px] text-slate-500">Search by name to see assigned equipment</p>
        </div>
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="search"
              value={term}
              onChange={(e) => onTermChange(e.target.value)}
              placeholder="Search employee name"
              className="h-9 w-56 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !term.trim()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Search
          </button>
        </form>
      </div>

      {!hasSearched ? (
        <EmptyState
          icon={Search}
          title="Search for an employee"
          description="Results show the equipment assigned to them."
        />
      ) : isLoading ? (
        <div className="px-5 py-10 text-center text-[13px] text-slate-500">Searching...</div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500">
            <AlertTriangle size={18} />
          </div>
          <p className="text-[13px] font-semibold text-slate-700">Search failed</p>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      ) : employeeGroups.length === 0 ? (
        <EmptyState icon={UserIcon} title="No matches" description="No employee matches that name." />
      ) : (
        <div className="divide-y divide-slate-100">
          {employeeGroups.map((group) => (
            <div key={group.employee_id ?? group.owner_name} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                    <UserIcon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{group.owner_name || "Unknown"}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {[group.employee_position, group.employee_department, group.employee_location]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {group.devices.length} device{group.devices.length === 1 ? "" : "s"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onViewDetail(group)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    View Detail
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-2 pl-12">
                {group.devices.map((device, idx) => (
                  <div
                    key={device.equipment_id ?? idx}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-slate-800">
                        {[device.category, device.device_type].filter(Boolean).join(" · ") || "—"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {device.computer_name ||
                          [device.manufacturer, device.device_model].filter(Boolean).join(" ") ||
                          device.asset_code ||
                          device.service_tag ||
                          "—"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${device.device_status === "Operational"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                        }`}
                    >
                      {device.device_status || "Unknown"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmployeeFormModal({
  isOpen,
  mode,
  values,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
  departments,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const isEdit = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">
              {isEdit ? "Edit employee" : "Add new employee"}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {isEdit ? "Update this employee's details." : "Add a new employee to the directory."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField label="Full Name *" htmlFor="employee-full_name">
                  <input
                    id="employee-full_name"
                    type="text"
                    required
                    autoComplete="off"
                    value={values.full_name}
                    onChange={(e) => onChange("full_name", e.target.value)}
                    className={formInputClass}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

              <FormField label="Position" htmlFor="employee-position">
                <input
                  id="employee-position"
                  type="text"
                  autoComplete="off"
                  value={values.position}
                  onChange={(e) => onChange("position", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="Department" htmlFor="employee-department">
                <select
                  id="employee-department"
                  autoComplete="off"
                  value={values.department}
                  onChange={(e) => onChange("department", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                >
                  <option value="">—</option>
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_code}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Location" htmlFor="employee-location">
                <input
                  id="employee-location"
                  type="text"
                  autoComplete="off"
                  value={values.location}
                  onChange={(e) => onChange("location", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="Staff Code" htmlFor="employee-staff_code">
                <input
                  id="employee-staff_code"
                  type="text"
                  autoComplete="off"
                  value={values.staff_code}
                  onChange={(e) => onChange("staff_code", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="Phone" htmlFor="employee-phone">
                <input
                  id="employee-phone"
                  type="text"
                  autoComplete="off"
                  value={values.phone}
                  onChange={(e) => onChange("phone", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="Sex" htmlFor="employee-sex">
                <input
                  id="employee-sex"
                  type="text"
                  autoComplete="off"
                  value={values.sex}
                  onChange={(e) => onChange("sex", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DepartmentFormModal({
  isOpen,
  mode,
  values,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const isEdit = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">
              {isEdit ? "Edit department" : "Add new department"}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {isEdit ? "Update this department's details." : "Create a new department."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                {error}
              </div>
            )}
            <div className="grid gap-4">
              <FormField label="Department Code *" htmlFor="department-code">
                <input
                  id="department-code"
                  type="text"
                  required
                  autoComplete="off"
                  value={values.department_code}
                  onChange={(e) => onChange("department_code", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
              <FormField label="Department Name *" htmlFor="department-name">
                <input
                  id="department-name"
                  type="text"
                  required
                  autoComplete="off"
                  value={values.department_name}
                  onChange={(e) => onChange("department_name", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add department"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoryFormModal({
  isOpen,
  mode,
  values,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const isEdit = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">
              {isEdit ? "Edit category" : "Add new category"}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {isEdit ? "Update this category's details." : "Create a new category."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                {error}
              </div>
            )}
            <div className="grid gap-4">
              <FormField label="Category Name *" htmlFor="category-name">
                <input
                  id="category-name"
                  type="text"
                  required
                  autoComplete="off"
                  value={values.category_name}
                  onChange={(e) => onChange("category_name", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="Description" htmlFor="category-description">
                <input
                  id="category-description"
                  type="text"
                  autoComplete="off"
                  value={values.description}
                  onChange={(e) => onChange("description", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmployeeDirectoryTable({
  employees,
  totalCount,
  sort,
  onSort,
  isLoading,
  error,
  onRetry,
  page,
  pageCount,
  onPageChange,
  pageSize,
  onViewDetail,
  onAddNew,
  onEdit,
  onDelete,
}) {
  const columns = [
    { key: "full_name", label: "Name" },
    { key: "position", label: "Position" },
    { key: "department_code", label: "Department" },
    { key: "location", label: "Location" },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-950">Employee directory</h2>
          {!isLoading && !error && (
            <p className="mt-0.5 text-[13px] text-slate-500">{totalCount} employees</p>
          )}
        </div>
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <PlusCircle size={15} />
          Add New Employee
        </button>
      </div>

      {isLoading ? (
        <div className="px-5 py-10 text-center text-[13px] text-slate-500">Loading employees...</div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500">
            <AlertTriangle size={18} />
          </div>
          <p className="text-[13px] font-semibold text-slate-700">Couldn&apos;t load employees</p>
          <p className="text-xs text-slate-500">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      ) : employees.length === 0 ? (
        <EmptyState icon={Users} title="No employees found" description="The employee directory is empty." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[13px]">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  {columns.map((column) => {
                    const isActive = sort.key === column.key;
                    const SortIcon = isActive && sort.direction === "desc" ? ChevronDown : ChevronUp;
                    return (
                      <th key={column.key} className="px-5 py-3 font-semibold">
                        <button
                          type="button"
                          onClick={() => onSort(column.key)}
                          className="inline-flex items-center gap-1 rounded outline-none transition hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                        >
                          {column.label}
                          <SortIcon size={12} className={isActive ? "text-slate-700" : "text-slate-300"} />
                        </button>
                      </th>
                    );
                  })}
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees.map((employee) => (
                  <tr key={employee.employee_id} className="transition hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-950">
                      {employee.full_name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{employee.position || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                      {getEmployeeDepartmentCode(employee) || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{employee.location || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onViewDetail(employee)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                          View Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(employee)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(employee)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 outline-none transition hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-[13px] text-slate-500">
              <span>
                Showing {(page - 1) * pageSize + 1}
                {"–"}
                {Math.min(page * pageSize, totalCount)} of {totalCount}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-transparent"
                >
                  Previous
                </button>
                <span className="tabular-nums text-slate-400">
                  {page} / {pageCount}
                </span>
                <button
                  type="button"
                  disabled={page === pageCount}
                  onClick={() => onPageChange(Math.min(pageCount, page + 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-transparent"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const FIELD_LABEL_OVERRIDES = {
  employee_id: "Employee ID",
  equipment_id: "Equipment ID",
  owner_name: "Owner Name",
  ip_address: "IP Address",
  mac_address: "MAC Address",
  cpu: "CPU",
  ram: "RAM",
  hd: "HD",
  os_type: "OS Type",
  os_version: "OS Version",
  server_os_type: "Server OS Type",
  server_os_version: "Server OS Version",
  av_license: "AV License",
};

function humanizeFieldKey(key) {
  if (FIELD_LABEL_OVERRIDES[key]) return FIELD_LABEL_OVERRIDES[key];
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatFieldValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function EmployeeDetailModal({ employee, devices, isLoading, error, onRetry, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label="Close detail"
      />
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">{employee.full_name || "Employee"}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {[employee.position, getEmployeeDepartmentCode(employee), employee.location].filter(Boolean).join(" · ") ||
                "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="py-10 text-center text-[13px] text-slate-500">Loading details...</div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500">
                <AlertTriangle size={18} />
              </div>
              <p className="text-[13px] font-semibold text-slate-700">Couldn&apos;t load details</p>
              <p className="text-xs text-slate-500">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <RefreshCw size={13} />
                Retry
              </button>
            </div>
          ) : devices.length === 0 ? (
            <EmptyState
              icon={Box}
              title="No equipment records"
              description="This employee has no equipment assigned."
            />
          ) : (
            <div className="space-y-5">
              {devices.map((device, idx) => (
                <div key={device.equipment_id ?? idx} className="rounded-xl border border-slate-100">
                  <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
                    <p className="text-[13px] font-semibold text-slate-800">
                      {[device.category, device.device_type].filter(Boolean).join(" · ") || `Equipment ${idx + 1}`}
                    </p>
                  </div>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2.5 p-4 sm:grid-cols-2">
                    {Object.entries(device).map(([key, value]) => (
                      <div key={key} className="min-w-0">
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          {humanizeFieldKey(key)}
                        </dt>
                        <dd className="mt-0.5 truncate text-[13px] text-slate-800" title={formatFieldValue(value)}>
                          {formatFieldValue(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function SidebarNavigation({ collapsed = false, activeView, onSelect }) {
  const [expandedLabels, setExpandedLabels] = useState(() => new Set());

  return (
    <nav className={`scrollbar-thin-dark flex-1 overflow-y-auto py-4 ${collapsed ? "px-3" : "px-4"}`}>
      {navSections.map((section, sectionIdx) => (
        <div key={section.label} className={sectionIdx === 0 ? "" : "mt-5"}>
          {!collapsed ? (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {section.label}
            </p>
          ) : (
            sectionIdx !== 0 && <div className="mx-2 mb-3 border-t border-white/10" />
          )}

          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.label === activeView;
              const hasChildren = Boolean(item.children?.length);
              const isChildActive = hasChildren && item.children.some((child) => child.label === activeView);
              const isExpanded = expandedLabels.has(item.label) || isChildActive;

              return (
                <div
                  key={item.label}
                  onMouseEnter={() => {
                    if (hasChildren && !collapsed) {
                      setExpandedLabels((current) => new Set(current).add(item.label));
                    }
                  }}
                  onMouseLeave={() => {
                    if (!hasChildren || collapsed) return;
                    if (isChildActive) return;
                    setExpandedLabels((current) => {
                      const next = new Set(current);
                      next.delete(item.label);
                      return next;
                    });
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(item.label)}
                    title={collapsed ? item.label : undefined}
                    className={`group relative flex w-full items-center rounded-lg py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${collapsed ? "justify-center px-0" : "gap-3 px-3 text-left"
                      } ${isActive
                        ? "bg-orange-500/15 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                      }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-0.75 -translate-y-1/2 rounded-r-full bg-orange-400" />
                    )}
                    <Icon
                      className={`shrink-0 text-[17px] ${isActive ? "text-orange-300" : ""}`}
                    />
                    <span className={collapsed ? "sr-only" : "flex-1 truncate"}>{item.label}</span>
                    {!collapsed && hasChildren && (
                      <ChevronDown
                        size={14}
                        className={`shrink-0 text-slate-500 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                      />
                    )}
                    {!collapsed && !hasChildren && item.badge && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-slate-200">
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {!collapsed && hasChildren && isExpanded && (
                    <div className="mt-0.5 space-y-0.5 pl-8">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildItemActive = child.label === activeView;
                        return (
                          <button
                            key={child.label}
                            type="button"
                            onClick={() => onSelect(child.label)}
                            className={`group relative flex w-full items-center gap-2.5 rounded-lg py-2 pl-2 pr-3 text-left text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${isChildItemActive
                              ? "bg-orange-500/15 text-white"
                              : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                              }`}
                          >
                            {isChildItemActive && (
                              <span className="absolute left-0 top-1/2 h-4 w-0.75 -translate-y-1/2 rounded-r-full bg-orange-400" />
                            )}
                            <ChildIcon
                              className={`shrink-0 text-sm ${isChildItemActive ? "text-orange-300" : ""}`}
                            />
                            <span className="flex-1 truncate">{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarBrand({ collapsed, onToggleCollapse }) {
  return (
    <div
      className={`flex shrink-0 items-center border-b border-white/10 ${collapsed ? "h-auto flex-col justify-center gap-2 px-3 py-3" : "h-16 justify-between px-4"
        }`}
    >
      <div className={`flex min-w-0 items-center ${collapsed ? "" : "gap-3"}`}>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-orange-500 text-white">
          <Shield className="text-lg" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[15px] font-semibold leading-tight text-white">TPLUS</p>
            <p className="text-[11px] leading-tight text-slate-400">Management System</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleCollapse}
        className="hidden shrink-0 rounded-md p-1.5 text-slate-400 outline-none transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 xl:grid xl:place-items-center"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <TbLayoutSidebar size={19} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function Dashboard({ user, onLogout }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("Employee");
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
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

                  <div className="relative hidden sm:block" ref={profileMenuRef}>
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
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-slate-950 text-xs font-semibold text-white">
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