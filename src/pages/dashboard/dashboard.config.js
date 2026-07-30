import {
  FiActivity as Activity,
  FiBox as Box,
  FiCloud as Cloud,
  FiDollarSign as DollarSign,
  FiHardDrive as HardDrive,
  FiKey as Key,
  FiRefreshCw as RefreshCw,
  FiSearch as Search,
  FiShield as Shield,
  FiShoppingCart as ShoppingCart,
  FiUsers as Users,
  FiLayers as Layers,
} from "react-icons/fi";

export const navSections = [
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

export const navItemsByLabel = navSections
  .flatMap((section) => section.items)
  .flatMap((item) => (item.children ? [item, ...item.children] : [item]))
  .reduce((acc, item) => ({ ...acc, [item.label]: item }), {});

export const initialNotifications = [
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

export const equipmentItemColumns = [
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

export const replacementColumns = [
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
  { key: "date_expire", label: "Date Expire" },
  { key: "date_renewed", label: "Date Renewed" },
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

export const EQUIPMENT_CATEGORY_OPTIONS = ["Desktop", "Laptop", "PC"];

export const ADD_EQUIPMENT_TEXT_FIELDS = [
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

export const ADD_EQUIPMENT_INITIAL_VALUES = {
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

export const availableStockColumns = [
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

export const ASSIGN_EQUIPMENT_INITIAL_VALUES = {
  employee_id: "",
  assigned_date: "",
  computer_name: "",
  ip_address: "",
  location: "",
  department: "",
  status: "",
};

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

export const borrowHistoryColumns = [
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
