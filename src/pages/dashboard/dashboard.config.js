import {
  FiActivity as Activity,
  FiBox as Box,
  FiClock as Clock,
  FiCloud as Cloud,
  FiDollarSign as DollarSign,
  FiHardDrive as HardDrive,
  FiHome as Home,
  FiKey as Key,
  FiRefreshCw as RefreshCw,
  FiSearch as Search,
  FiShield as Shield,
  FiShoppingCart as ShoppingCart,
  FiSliders as Sliders,
  FiTrash2 as Trash2,
  FiUsers as Users,
  FiUserCheck as UserCheck,
  FiUserPlus as UserPlus,
  FiLayers as Layers,
} from "react-icons/fi";
import { PERMISSIONS } from "../../lib/permissions";

export const navSections = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", icon: Home }],
  },
  {
    label: "Workforce",
    items: [
      { label: "Employee", icon: Users, permission: PERMISSIONS.EMPLOYEE },
      { label: "Departments", icon: Layers, permission: PERMISSIONS.DEPARTMENTS },
    ],
  },
  {
    label: "Hardware",
    items: [
      {
        label: "Equipment",
        icon: Box,
        children: [
          { label: "All Equipment", icon: Box, permission: PERMISSIONS.EQUIPMENT },
          { label: "Assign", icon: UserPlus, permission: PERMISSIONS.ASSIGN_EQUIPMENT, adminOnly: true },
          { label: "Currently Borrowed", icon: RefreshCw, permission: PERMISSIONS.CURRENTLY_BORROWED },
          { label: "Borrow History", icon: Search, permission: PERMISSIONS.BORROW_HISTORY },
        ],
      },
      {
        label: "Replacement",
        icon: RefreshCw,
        children: [
          { label: "Stock of Replace a Part", icon: Box, permission: PERMISSIONS.PART_STOCK },
          { label: "Device Replacement", icon: RefreshCw, permission: PERMISSIONS.DEVICE_REPLACEMENT },
        ],
      },
      { label: "SSD Upgrade", icon: HardDrive, permission: PERMISSIONS.SSD_UPGRADE },
      { label: "SSD Procurement", icon: ShoppingCart, permission: PERMISSIONS.SSD_PROCUREMENT },
    ],
  },
  {
    label: "Software & Security",
    items: [
      { label: "Antivirus Install", icon: Shield, permission: PERMISSIONS.ANTIVIRUS_INSTALL },
      { label: "Software License", icon: Key, permission: PERMISSIONS.LICENSE },
    ],
  },
  {
    label: "Cloud",
    items: [
      { label: "Cloud Rate", icon: DollarSign, permission: PERMISSIONS.CLOUD_RATE },
      { label: "Cloud Usage", icon: Cloud, permission: PERMISSIONS.CLOUD_USAGE },
    ],
  },
  {
    label: "Operations",
    items: [{ label: "Service Usage", icon: Activity, permission: PERMISSIONS.SERVICE_USAGE }],
  },
  {
    label: "Account",
    items: [{ label: "My Activity", icon: Clock }],
  },
  {
    label: "Administration",
    items: [
      { label: "Users", icon: UserCheck, permission: PERMISSIONS.USERS, adminOnly: true },
      {
        label: "Activity Log",
        icon: Activity,
        permission: PERMISSIONS.ACTIVITY_LOG,
        adminOnly: true,
      },
      {
        label: "Recycle Bin",
        icon: Trash2,
        permission: PERMISSIONS.RECYCLE_BIN,
        adminOnly: true,
      },
      {
        label: "Status",
        icon: Sliders,
        permission: PERMISSIONS.EQUIPMENT_STATUS,
        adminOnly: true,
      },
    ],
  },
];

export const navItemsByLabel = navSections
  .flatMap((section) => section.items)
  .flatMap((item) => (item.children ? [item, ...item.children] : [item]))
  .reduce((acc, item) => ({ ...acc, [item.label]: item }), {});

export const userPermissionSections = navSections
  .map((section) => ({
    label: section.label,
    permissions: section.items
      .flatMap((item) => (item.children ? item.children : [item]))
      .filter((item) => item.permission)
      .map((item) => ({ value: item.permission, label: item.label })),
  }))
  .filter((section) => section.permissions.length > 0);

export const replacementColumns = [
  { key: "replacement_id", label: "Replacement ID" },
  { key: "employee_name", label: "Employee" },
  { key: "employee_position", label: "Position" },
  { key: "employee_department", label: "Department" },
  { key: "old_computer_name", label: "Old Computer Name" },
  { key: "old_asset_code", label: "Old Asset Code" },
  { key: "old_category", label: "Old Category" },
  { key: "old_device_status", label: "Old Device Status" },
  { key: "old_bag", label: "Old Bag" },
  { key: "old_mouse", label: "Old Mouse" },
  { key: "old_keyboard", label: "Old Keyboard" },
  { key: "new_asset_code", label: "New Asset Code" },
  { key: "new_category", label: "New Category" },
  { key: "new_owner_location", label: "New Owner Location" },
  { key: "new_bag", label: "New Bag" },
  { key: "new_mouse", label: "New Mouse" },
  { key: "new_keyboard", label: "New Keyboard" },
  { key: "replacement_date", label: "Replacement Date" },
];

export const REPLACEMENT_FILTERS_INITIAL_VALUES = {
  category: "All",
  q: "",
};

// Shared between the Device Replacement dialog's part-value input and the
// Stock page's "Add to stock" form, so both offer the same fixed options.
export const RAM_CAPACITY_OPTIONS = ["2 GB", "4 GB", "8 GB", "16 GB", "32 GB", "64 GB", "128 GB", "256 GB"];
export const HD_CAPACITY_OPTIONS = [
  "500 GB",
  "1000 GB (1 TB)",
  "2000 GB (2 TB)",
  "4000 GB (4 TB)",
  "8000 GB (8 TB)",
  "12000 GB (12 TB)",
  "16000 GB (16 TB)",
  "20000 GB (20 TB)",
  "24000 GB (24 TB)",
  "26000 GB (26 TB)",
];

export const departmentColumns = [
  { key: "department_id", label: "Department ID" },
  { key: "department_code", label: "Department Code" },
  { key: "department_name", label: "Department Name" },
  { key: "employee_count", label: "Employees" },
  { key: "equipment_count", label: "Equipment" },
];

export const ssdUpgradeColumns = [
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

export const partStockColumns = [
  { key: "stock_id", label: "Stock ID" },
  { key: "part_name", label: "Part" },
  { key: "is_countable", label: "Countable" },
  { key: "part_value", label: "Value" },
  { key: "quantity", label: "Quantity" },
  { key: "status", label: "Status" },
  { key: "location", label: "Location" },
  { key: "remark", label: "Remark" },
  { key: "updated_at", label: "Last Updated" },
];

export const ssdProcurementColumns = [
  { key: "procurement_id", label: "Procurement ID" },
  { key: "model_name", label: "Model Name" },
  { key: "qty", label: "Quantity" },
  { key: "decision", label: "Decision" },
];

export const antivirusColumns = [
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

export const licenseColumns = [
  { key: "license_id", label: "License ID" },
  { key: "product_name", label: "Product Name" },
  { key: "product_type", label: "Product Type" },
  { key: "date_start", label: "Date Start" },
  { key: "date_expire", label: "Date Expire" },
  { key: "license_type", label: "License Type" },
  { key: "status", label: "Status" },
  { key: "remark", label: "Remark" },
];

export const cloudRateColumns = [
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

export const serverUsageColumns = [
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

export const cloudUsageColumns = [
  { key: "usage_id", label: "Usage ID" },
  { key: "item_name", label: "Item Name" },
  { key: "unit", label: "Unit" },
  { key: "unit_cost", label: "Unit Cost" },
  { key: "usage_month", label: "Usage Month" },
  { key: "quantity", label: "Quantity" },
  { key: "amount", label: "Amount" },
];

export const EQUIPMENT_VIEWS = [
  { slug: "cctv", label: "CCTV" },
  { slug: "laptop", label: "Laptop" },
  { slug: "desktop", label: "Desktop" },
  { slug: "pc", label: "PC" },
  { slug: "monitor", label: "Monitor" },
  { slug: "network-device", label: "Network Device" },
  { slug: "access-control", label: "Access Control" },
  { slug: "server", label: "Server" },
  { slug: "accessory", label: "Accessory" },
];

// Used only when no sample record exists yet to infer a category's own fields from
// (e.g. the "All Equipments" tab, or a brand-new category with no items).
export const EQUIPMENT_FORM_FALLBACK_FIELDS = [
  { key: "device_type", label: "Device Type", type: "text" },
  { key: "device_model", label: "Device Model", type: "text" },
  { key: "manufacturer", label: "Manufacturer", type: "text" },
  { key: "asset_code", label: "Asset Code", type: "text" },
  { key: "service_tag", label: "Service Tag", type: "text" },
  { key: "serial_no", label: "Serial No", type: "text" },
  { key: "product_id", label: "Product ID", type: "text" },
  { key: "mac_address", label: "MAC Address", type: "text" },
  { key: "ip_address", label: "IP Address", type: "text" },
  { key: "os_type", label: "OS Type", type: "text" },
  { key: "os_version", label: "OS Version", type: "text" },
  { key: "cpu", label: "CPU", type: "text" },
  { key: "ram", label: "RAM", type: "text" },
  { key: "hd", label: "HD", type: "text" },
  { key: "location", label: "Location", type: "text" },
  { key: "department", label: "Department", type: "department-select" },
  { key: "windows_license", label: "Windows License", type: "yes-no-select" },
  { key: "av_license", label: "AV License", type: "yes-no-select" },
  { key: "purchase_date", label: "Purchase Date", type: "date" },
  { key: "received_date", label: "Received Date", type: "date" },
];

export const BORROW_EQUIPMENT_INITIAL_VALUES = {
  employee_id: "",
  expected_return_date: "",
  purpose: "",
  condition_on_borrow: "",
  remark: "",
};

export const currentBorrowColumns = [
  { key: "borrow_id", label: "Borrow ID" },
  { key: "category_name", label: "Category" },
  { key: "device_model", label: "Device Model" },
  { key: "computer_name", label: "Computer Name" },
  { key: "asset_code", label: "Asset Code" },
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

export const borrowHistoryColumns = [
  { key: "borrow_id", label: "Borrow ID" },
  { key: "category_name", label: "Category" },
  { key: "device_model", label: "Device Model" },
  { key: "computer_name", label: "Computer Name" },
  { key: "asset_code", label: "Asset Code" },
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

export const BORROW_HISTORY_INITIAL_FILTERS = {
  borrower_id: "",
  from: "",
  to: "",
};

export const RETURN_EQUIPMENT_INITIAL_VALUES = {
  return_date: "",
  condition_on_return: "",
};

export const EMPLOYEE_FORM_INITIAL_VALUES = {
  full_name: "",
  position: "",
  department: "",
  location: "",
  staff_code: "",
  phone: "",
  sex: "",
};

export const EMPLOYEES_PAGE_SIZE = 8;

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export const FIELD_LABEL_OVERRIDES = {
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
