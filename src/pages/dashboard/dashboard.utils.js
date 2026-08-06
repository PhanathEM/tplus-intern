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

// GET /api/equipment/views -> { views: [{ key, label, category, column_count, item_count, configured }] }
export function normalizeEquipmentViews(data) {
  const list = Array.isArray(data) ? data : Array.isArray(data?.views) ? data.views : [];
  return list
    .map((entry) => {
      if (typeof entry === "string") {
        return { slug: entry, categoryId: null, label: humanizeEquipmentView(entry), count: null, columnCount: null };
      }
      const slug = entry?.key || entry?.view || entry?.slug || "";
      if (!slug) return null;
      const label = entry.label || entry.category || humanizeEquipmentView(slug);
      const count = entry.item_count ?? entry.count ?? null;
      const columnCount = entry.configured === false ? 0 : entry.column_count ?? null;
      return { slug, categoryId: entry.category_id ?? null, label, count, columnCount };
    })
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// View columns / custom fields (per-category configuration)
// ---------------------------------------------------------------------------

// GET /api/view-columns -> { count, unconfigured, views: [{ category_id, view_key, category_name, column_count, item_count }] }
export function normalizeViewColumnsSummary(data) {
  const list = Array.isArray(data) ? data : Array.isArray(data?.views) ? data.views : [];
  return list
    .map((entry) => {
      if (typeof entry === "string") {
        return { slug: entry, categoryId: null, label: humanizeEquipmentView(entry), count: null, columnCount: null };
      }
      const slug = entry?.view_key || entry?.view || entry?.slug || "";
      const categoryId = entry?.category_id ?? entry?.categoryId ?? entry?.id ?? null;
      if (!slug && categoryId == null) return null;
      const label = entry.category_name || entry.name || entry.label || humanizeEquipmentView(slug);
      const count = entry.item_count ?? entry.count ?? null;
      const columnCount = entry.column_count ?? null;
      return { slug: slug || String(categoryId), categoryId, label, count, columnCount };
    })
    .filter(Boolean);
}

// GET /api/view-columns/available-fields -> { equipment_fields: [{field, suggested_header, data_type}], derived_fields: [{field, header}] }
export function normalizeAvailableFields(data) {
  const equipmentFields = Array.isArray(data?.equipment_fields) ? data.equipment_fields : [];
  const derivedFields = Array.isArray(data?.derived_fields) ? data.derived_fields : [];
  const list = Array.isArray(data) ? data : [...equipmentFields, ...derivedFields];

  return list
    .map((entry) => {
      const key = entry?.field || entry?.field_key || entry?.key || "";
      if (!key) return null;
      const label = entry.suggested_header || entry.header || entry.field_label || humanizeFieldKey(key);
      const rawType = String(entry?.data_type || entry?.field_type || "").toLowerCase();
      const type = rawType === "date" ? "date" : "text";
      return { id: null, key, label, type };
    })
    .filter(Boolean);
}

// GET /api/view-columns/{categoryId} -> { category_id, category_name, view_key, column_count, columns: [{view_column_id, field_name, header_text, sort_order}] }
export function normalizeViewColumns(data) {
  const list = Array.isArray(data) ? data : Array.isArray(data?.columns) ? data.columns : [];
  return list
    .map((entry) => {
      const key = entry?.field_name || entry?.field || entry?.key || "";
      if (!key) return null;
      const id = entry?.view_column_id ?? entry?.id ?? null;
      const label = entry?.header_text || entry?.label || humanizeFieldKey(key);
      return { id, key, label };
    })
    .filter(Boolean);
}

// GET /api/equipment/{view} -> { ..., columns: [{ field, header }], items: [...] }
export function normalizeEquipmentTableColumns(data) {
  const list = Array.isArray(data?.columns) ? data.columns : [];
  return list
    .map((entry) => {
      const key = entry?.field || entry?.key || "";
      if (!key) return null;
      return { key, label: entry?.header || humanizeFieldKey(key) };
    })
    .filter(Boolean);
}

// GET /api/custom-fields/{categoryId} -> { category_id, category_name, count, fields: [{field_id, field_key, field_label, field_type}] }
export function normalizeCustomFields(data) {
  const list = Array.isArray(data) ? data : Array.isArray(data?.fields) ? data.fields : [];
  return list
    .map((entry) => {
      const key = entry?.field_key || entry?.field_name || entry?.field || entry?.key || "";
      if (!key) return null;
      const id = entry?.field_id ?? entry?.id ?? null;
      const label = entry?.field_label || entry?.header_text || entry?.label || humanizeFieldKey(key);
      const rawType = String(entry?.field_type || entry?.type || "").toLowerCase();
      let type = "text";
      if (rawType === "date") type = "date";
      else if (["boolean", "yesno", "yes_no", "yes-no"].includes(rawType)) type = "yes-no-select";
      return { id, key, label, type };
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

function inferEquipmentFieldType(key) {
  return EQUIPMENT_FORM_FIELD_TYPES[key] || (key.endsWith("_date") ? "date" : "text");
}

export function getEquipmentFormFields(sampleRecord) {
  if (!sampleRecord || typeof sampleRecord !== "object") return null;
  return Object.keys(sampleRecord)
    .filter((key) => !key.startsWith("__") && !EQUIPMENT_FORM_EXCLUDED_KEYS.has(key))
    .map((key) => ({
      key,
      label: humanizeFieldKey(key),
      type: inferEquipmentFieldType(key),
    }));
}

// Build Add/Edit form fields from a category's configured table columns
// (the same list saved via the "Configure columns" picker), so the form
// always matches what was ticked there.
export function getEquipmentFormFieldsFromColumns(columns) {
  if (!Array.isArray(columns) || columns.length === 0) return null;
  return columns
    .filter((column) => !EQUIPMENT_FORM_EXCLUDED_KEYS.has(column.key))
    .map((column) => ({
      key: column.key,
      label: column.label || humanizeFieldKey(column.key),
      type: inferEquipmentFieldType(column.key),
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
