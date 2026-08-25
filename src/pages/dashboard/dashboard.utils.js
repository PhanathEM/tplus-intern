import { FIELD_LABEL_OVERRIDES } from "./dashboard.config";

// Fields with a dedicated, purpose-built input (a dropdown with fixed
// choices, or a capacity picker for RAM/Hard Disk's Value) — everything
// else a part type's stock_columns lists renders as a plain generic input
// instead, typed off the custom-fields catalog.
const STOCK_COLUMN_WIDGETS = ["model_name", "model_number", "ram_type", "disk_type", "disk_interface", "part_value"];

// A part type's configured stock-columns list — which fields show on its
// Add/Edit Stock forms, set via the Part Type form's "Stock columns" picker
// (PUT /api/part-types/:id/stock-columns). Replaces the old hardcoded-by-
// part-name behavior; RAM/CPU/Hard Disk/Bag/Mouse/Keyboard are just the
// first parts configured this way, not special-cased in code anymore.
export function getStockColumns(partType) {
  return partType?.stock_columns || [];
}

export function hasStockColumn(partType, fieldName) {
  return getStockColumns(partType).some((column) => column.field_name === fieldName);
}

// Columns beyond the ones with a dedicated widget above — genuine custom
// fields (Color, Location, Storage...) rendered as generic text/number/
// date/boolean inputs. A part type carries these two separate lists:
// stock_columns (built-ins it's configured to show, plus any custom field
// that happened to save through that same endpoint) and custom_fields
// (custom fields actually attached server-side) — real data can land in
// either depending on how it was saved, so both are merged here, de-duped
// by key. The stock-columns catalog's custom_fields list fills in a type
// for anything only found via stock_columns (which carries no type itself).
export function getExtraStockColumns(partType, customFieldCatalog) {
  const catalogByKey = new Map((customFieldCatalog || []).map((field) => [field.field_key, field]));
  const fromStockColumns = getStockColumns(partType)
    .filter((column) => !STOCK_COLUMN_WIDGETS.includes(column.field_name))
    .map((column) => ({
      field_key: column.field_name,
      field_label: column.header_text,
      field_type: catalogByKey.get(column.field_name)?.field_type || "text",
    }));
  const fromCustomFields = (partType?.custom_fields || []).map((field) => ({
    field_key: field.field_key,
    field_label: field.field_label,
    field_type: field.field_type || "text",
  }));

  const merged = [...fromStockColumns];
  fromCustomFields.forEach((field) => {
    if (!merged.some((existing) => existing.field_key === field.field_key)) {
      merged.push(field);
    }
  });
  return merged;
}

// Shared by the Part Stock page's Add/Edit dialogs and Device Replacement's
// "add to stock" shortcut, so all three validate and shape the payload for
// POST/PUT /api/part-stock identically.
export function buildPartStockPayload(partType, formValues, customFieldCatalog) {
  const needsRamType = hasStockColumn(partType, "ram_type");
  const needsModelName = hasStockColumn(partType, "model_name");
  const needsModelNumber = hasStockColumn(partType, "model_number");
  const needsDiskType = hasStockColumn(partType, "disk_type");
  const needsDiskInterface = hasStockColumn(partType, "disk_interface");
  const needsValue = hasStockColumn(partType, "part_value");
  const extraColumns = getExtraStockColumns(partType, customFieldCatalog);

  if (needsRamType && !formValues.ram_type?.trim()) {
    return { error: "Please select RAM Type." };
  }
  if (needsModelName && !formValues.model_name?.trim()) {
    return { error: "Please enter Model Name." };
  }
  if (needsModelNumber && !formValues.model_number?.trim()) {
    return { error: "Please enter Model Number." };
  }
  if (needsDiskType && !formValues.disk_type?.trim()) {
    return { error: "Please enter Disk Type." };
  }
  if (needsDiskInterface && !formValues.disk_interface?.trim()) {
    return { error: "Please enter Disk Interface." };
  }
  if (needsValue && !formValues.part_value?.trim()) {
    return { error: "Please enter Value." };
  }

  const missingExtra = extraColumns.filter(
    (field) => field.field_type !== "boolean" && !String(formValues[field.field_key] ?? "").trim()
  );
  if (missingExtra.length > 0) {
    return { error: `Please enter ${missingExtra.map((field) => field.field_label).join(", ")}.` };
  }

  const payload = {
    part_type_id: Number(formValues.part_type_id),
    ram_type: needsRamType ? formValues.ram_type.trim() : null,
    model_name: needsModelName ? formValues.model_name.trim() : null,
    model_number: needsModelNumber ? formValues.model_number.trim() : null,
    disk_type: needsDiskType ? formValues.disk_type.trim() : null,
    disk_interface: needsDiskInterface ? formValues.disk_interface.trim() : null,
    part_value: needsValue ? formValues.part_value.trim() : "",
    quantity: Number(formValues.quantity),
    status: formValues.status,
    remark: (formValues.remark || "").trim(),
  };

  extraColumns.forEach((field) => {
    if (field.field_type === "boolean") {
      payload[field.field_key] = Boolean(formValues[field.field_key]);
    } else {
      const raw = (formValues[field.field_key] ?? "").toString().trim();
      payload[field.field_key] = raw || null;
    }
  });

  return { payload };
}

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

// Shared display-name fallback chain — used by Equipment's own views and by
// Borrow/Assign, which reference an equipment record without owning it.
export function getEquipmentDisplayName(item) {
  return (
    item?.device_name ||
    item?.name ||
    item?.computer_name ||
    [item?.device_type, item?.device_model].filter(Boolean).join(" - ") ||
    item?.asset_code ||
    item?.equipment_code ||
    item?.service_tag ||
    item?.serial_no ||
    `${item?.category || item?.category_name || "Equipment"} #${item?.equipment_id || ""}`.trim()
  );
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

// GET /api/equipment/{view} -> { ..., columns: [{ field, header, custom }], items: [...] }
// Custom fields are always included here too (tagged custom: true) alongside
// the category's configured standard columns.
export function normalizeEquipmentTableColumns(data) {
  const list = Array.isArray(data?.columns) ? data.columns : [];
  return list
    .map((entry) => {
      const key = entry?.field || entry?.key || "";
      if (!key) return null;
      return { key, label: entry?.header || humanizeFieldKey(key), custom: Boolean(entry?.custom) };
    })
    .filter(Boolean);
}

// GET /api/equipment/licenses -> { count, licenses: [{ license_id, product_name, ..., install_count }] }
export function normalizeEquipmentLicenseOptions(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.licenses)) return data.licenses;
  return [];
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
      const rawType = entry?.field_type || entry?.type || "text";
      const type = normalizeCustomFieldType(rawType);
      return { id, key, label, type, rawType };
    })
    .filter(Boolean);
}

function normalizeCustomFieldType(rawType) {
  const value = String(rawType || "").toLowerCase();
  if (value === "date") return "date";
  if (value === "number") return "number";
  if (["boolean", "yesno", "yes_no", "yes-no"].includes(value)) return "yes-no-select";
  return "text";
}

// GET /api/custom-fields/types -> { types: [{ value, label, input }] }
// `value` is kept as the backend's own raw type string (e.g. "boolean") since
// that's exactly what must be sent back in POST /api/custom-fields/{categoryId}.
export function normalizeCustomFieldTypes(data) {
  const list = Array.isArray(data) ? data : Array.isArray(data?.types) ? data.types : [];
  return list
    .map((entry) => {
      const value = entry?.value || entry?.type || "";
      if (!value) return null;
      return { value, label: entry?.label || humanizeFieldKey(value) };
    })
    .filter(Boolean);
}

const EQUIPMENT_FORM_EXCLUDED_KEYS = new Set([
  "equipment_id",
  "category",
  "status",
  "remark",
  "owner_id",
  // Derived from the equipment's assigned licenses (see software_licenses)
  // instead of being real, directly-editable columns — managed through the
  // "Software License" picker, not typed into the form.
  "license_names",
  "license_date_start",
  "license_date_expire",
  "license_status",
  "software_licenses",
]);

const EQUIPMENT_FORM_FIELD_TYPES = {
  department: "department-select",
  department_code: "department-select",
  windows_license: "yes-no-select",
  av_license: "yes-no-select",
  // The column is "owner_name" (a display string), but the API only accepts
  // an owner_id — the picker's value is the selected employee's id, renamed
  // to owner_id right before the request goes out (see handleSubmitForm).
  owner_name: "employee-select",
  server_type: "server-type-select",
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
  // Custom fields are excluded here even though the backend lists them
  // alongside standard columns — they must come from fetchCustomFields()
  // instead, which is the only source that carries their real field_id
  // (needed to delete/rename them later).
  const fields = columns
    .filter((column) => !column.custom && !EQUIPMENT_FORM_EXCLUDED_KEYS.has(column.key))
    .map((column) => ({
      key: column.key,
      label: column.label || humanizeFieldKey(column.key),
      type: inferEquipmentFieldType(column.key),
    }));
  return fields.length > 0 ? fields : null;
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
    if (key === "owner_name") {
      // The view list this form's source comes from only has owner_name (a
      // display string), not owner_id — left empty here and patched in once
      // a single-record fetch resolves the real id (see handleOpenEditItem).
      values.owner_name = source.owner_id != null ? String(source.owner_id) : "";
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

// Same column shaping the Equipment items table uses for its own display:
// auto-detect extra fields, drop internal/redundant ones, push remark to the
// end, number the rows. Shared with the bulk category export so what's
// downloaded always matches what's on screen for that category.
export function buildEquipmentDisplayColumns(items, baseColumns) {
  const filtered = getRecordColumns(items, baseColumns).filter(
    (column) =>
      !column.key.startsWith("__") &&
      column.key !== "software_licenses" &&
      column.key !== "category" &&
      column.key !== "equipment_id"
  );
  const remarkIndex = filtered.findIndex((column) => column.key === "remark");
  const reordered = [...filtered];
  if (remarkIndex !== -1) {
    const [remarkColumn] = reordered.splice(remarkIndex, 1);
    reordered.push(remarkColumn);
  }
  return [{ key: "_row_number", label: "No." }, ...reordered];
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
