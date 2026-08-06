import { FIELD_LABEL_OVERRIDES } from "./dashboard.config";

export function normalizeRecordList(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return [data];
  return [];
}

export function extractEquipmentItems(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return normalizeRecordList(data);
}

export function getEmployeeDepartmentCode(employee) {
  return employee?.department_code || employee?.department || null;
}

const EMPLOYEE_DEVICE_RESULT_KEYS = [
  "equipment_id",
  "equipment_code",
  "asset_code",
  "computer_name",
  "device_model",
  "device_type",
  "device_status",
  "category",
  "manufacturer",
  "service_tag",
];

function hasEmployeeDeviceResult(record) {
  return EMPLOYEE_DEVICE_RESULT_KEYS.some((key) => {
    const value = record?.[key];
    return value !== undefined && value !== null && value !== "";
  });
}

// ---------------------------------------------------------------------------
// Equipment
// ---------------------------------------------------------------------------

const EQUIPMENT_VIEW_LABEL_OVERRIDES = { cctv: "CCTV", pc: "PC" };

export function slugifyEquipmentView(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "-");
}

export function humanizeEquipmentView(slug) {
  if (EQUIPMENT_VIEW_LABEL_OVERRIDES[slug]) return EQUIPMENT_VIEW_LABEL_OVERRIDES[slug];
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function normalizeEquipmentViews(data) {
  const list = Array.isArray(data) ? data : [];
  return list
    .map((entry) => {
      if (typeof entry === "string") {
        return { slug: entry, label: humanizeEquipmentView(entry), count: null };
      }
      const slug = entry?.view || entry?.slug || entry?.key || entry?.name || entry?.category || "";
      if (!slug) return null;
      const label = entry.label || humanizeEquipmentView(slug);
      const count = entry.total_items ?? entry.count ?? null;
      return { slug, label, count };
    })
    .filter(Boolean);
}

const EQUIPMENT_FORM_EXCLUDED_KEYS = new Set([
  "equipment_id",
  "category",
  "status",
  "remark",
  "owner_id",
  "owner_name",
]);

const EQUIPMENT_FORM_FIELD_TYPES = {
  department: "department-select",
  department_code: "department-select",
  windows_license: "yes-no-select",
  av_license: "yes-no-select",
};

export function getEquipmentFormFields(sampleRecord) {
  if (!sampleRecord || typeof sampleRecord !== "object") return null;
  return Object.keys(sampleRecord)
    .filter((key) => !key.startsWith("__") && !EQUIPMENT_FORM_EXCLUDED_KEYS.has(key))
    .map((key) => ({
      key,
      label: humanizeFieldKey(key),
      type: EQUIPMENT_FORM_FIELD_TYPES[key] || (key.endsWith("_date") ? "date" : "text"),
    }));
}

export function buildEquipmentFormValues(fields, source = {}) {
  const values = {
    category: source.category_name || source.category || "",
    status: source.status || source.status_name || "",
    remark: source.remark || "",
  };

  fields.forEach(({ key, type }) => {
    if (key === "department") {
      values.department = source.department_code || source.department || "";
      return;
    }
    if (type === "date") {
      values[key] = source[key] ? String(source[key]).slice(0, 10) : "";
      return;
    }
    values[key] = source[key] != null ? String(source[key]) : "";
  });

  return values;
}

export function getRecordColumns(records, baseColumns) {
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

export function groupEmployeeSearchResults(results) {
  const groups = new Map();
  results.forEach((item, index) => {
    const key = item.employee_id ?? item.owner_name ?? item.full_name ?? index;
    if (!groups.has(key)) {
      groups.set(key, {
        employee_id: item.employee_id,
        owner_name: item.owner_name ?? item.full_name ?? item.name,
        employee_position: item.employee_position ?? item.position,
        employee_department: item.employee_department ?? getEmployeeDepartmentCode(item),
        employee_location: item.employee_location ?? item.location,
        devices: [],
      });
    }
    if (hasEmployeeDeviceResult(item)) groups.get(key).devices.push(item);
  });
  return [...groups.values()];
}

export function humanizeFieldKey(key) {
  if (FIELD_LABEL_OVERRIDES[key]) return FIELD_LABEL_OVERRIDES[key];
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatFieldValue(value) {
  if (value === null || value === undefined || value === "") return "—";

if (typeof value === "string") {
    const isoMatch = value.match(/^\d{4}-\d{2}-\d{2}(?:T|$)/);
    if (isoMatch) {
      return isoMatch[0].slice(0, 10);
    }
  }

if (value instanceof Date) {
    return formatDate(value);
  }

return String(value);
}

export function formatDate(date) {
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
