import { useEffect, useState } from "react";
import { addPartStock, deletePartStock, fetchPartStock, updatePartStock } from "../../../../services/partStockService";
import { fetchPartStatuses } from "../../../../services/partStatusService";
import {
  createPartCustomField,
  createPartType,
  deletePartType,
  fetchPartCustomFieldTypes,
  fetchPartTypeCategories,
  fetchPartTypeStockColumns,
  fetchPartTypes,
  fetchStockColumnOptions,
  updatePartType,
  updatePartTypeCategories,
  updatePartTypeStockColumns,
} from "../../../../services/partTypeService";
import { fetchCategories } from "../../../../services/categoryService";
import { deleteCustomField, fetchAllCustomFields } from "../../../../services/equipmentService";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";
import { DEFAULT_PART_STOCK_STATUS } from "../../dashboard.config";
import { buildPartStockPayload, getExtraStockColumns, normalizeCustomFields, normalizeCustomFieldTypes } from "../../dashboard.utils";

// Quantity/Status/Remark/Last Updated/Active are already always present on
// the Add/Edit Stock forms — not offered again as tickable stock columns.
const ALWAYS_PRESENT_STOCK_FIELDS = ["quantity", "status", "remark", "updated_at", "is_active"];

function slugifyFieldLabel(label) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

const PART_TYPE_FORM_INITIAL_VALUES = {
  part_name: "",
  description: "",
  equipment_column: "",
  tracks_value: false,
  is_countable: false,
  category_ids: [],
};

const ADD_FORM_INITIAL_VALUES = {
  part_type_id: "",
  ram_type: "",
  part_value: "",
  model_name: "",
  model_number: "",
  disk_type: "",
  disk_interface: "",
  quantity: "1",
  status: DEFAULT_PART_STOCK_STATUS,
  remark: "",
};

export function usePartStock({ isActive, user }) {
  const [stock, setStock] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);

  const [partTypes, setPartTypes] = useState([]);
  const [selectedPartTypeId, setSelectedPartTypeId] = useState(null);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchPartStock()
      .then((data) => {
        if (!ignore) {
          setStock(Array.isArray(data?.stock) ? data.stock : []);
          setError(null);
        }
      })
      .catch((error) => {
        if (!ignore) setError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isActive, fetchToken]);

  // Part types drive the card grid — also refetched by handleRetry() so
  // create/edit/delete of a part type refreshes the grid.
  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchPartTypes()
      .then((data) => {
        if (ignore) return;
        const list = Array.isArray(data?.part_types) ? data.part_types : [];
        setPartTypes(list.filter((partType) => partType.is_active !== false).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
      })
      .catch(() => {
        if (!ignore) setPartTypes([]);
      });

    return () => {
      ignore = true;
    };
  }, [isActive, fetchToken]);

  // Options for the Edit Stock form's status field — admin-configurable via
  // GET /api/part-statuses, so this stays in sync without a redeploy if the
  // list ever changes. Fetched once (only the active ones; that's the
  // endpoint's default).
  const [partStatuses, setPartStatuses] = useState([]);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchPartStatuses()
      .then((data) => {
        if (!ignore) setPartStatuses(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!ignore) setPartStatuses([]);
      });

    return () => {
      ignore = true;
    };
  }, [isActive]);

  // Reference data for the Add/Edit Part Type form — fetched once.
  const [allCategories, setAllCategories] = useState([]);
  const [partCustomFieldTypes, setPartCustomFieldTypes] = useState([]);
  // The "Stock columns" picker's full catalog: built-in part_stock fields
  // (model_name, location, ram_type...) plus reusable custom fields —
  // combined, this is what an admin ticks to build a part's stock form.
  const [stockColumnBuiltInOptions, setStockColumnBuiltInOptions] = useState([]);
  const [stockColumnCustomFieldOptions, setStockColumnCustomFieldOptions] = useState([]);
  // Equipment's own custom fields (a separate system) — looked up only to
  // clean up whichever one a deleted part type's equipment_column pointed
  // at (e.g. "Webcam"/"Mouse Model"). Real equipment table columns like
  // "ram"/"cpu" simply won't be found in here, so nothing happens for those.
  const [equipmentCustomFields, setEquipmentCustomFields] = useState([]);

  function loadStockColumnOptions() {
    return fetchStockColumnOptions().then((data) => {
      const fields = Array.isArray(data?.fields) ? data.fields : [];
      setStockColumnBuiltInOptions(fields.filter((field) => !ALWAYS_PRESENT_STOCK_FIELDS.includes(field.field)));
      setStockColumnCustomFieldOptions(Array.isArray(data?.custom_fields) ? data.custom_fields : []);
    });
  }

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchCategories()
      .then((data) => {
        if (!ignore) setAllCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!ignore) setAllCategories([]);
      });

    fetchPartCustomFieldTypes()
      .then((data) => {
        if (!ignore) setPartCustomFieldTypes(normalizeCustomFieldTypes(data));
      })
      .catch(() => {
        if (!ignore) setPartCustomFieldTypes([]);
      });

    loadStockColumnOptions().catch(() => {
      if (!ignore) {
        setStockColumnBuiltInOptions([]);
        setStockColumnCustomFieldOptions([]);
      }
    });

    fetchAllCustomFields()
      .then((data) => {
        if (!ignore) setEquipmentCustomFields(normalizeCustomFields(data));
      })
      .catch(() => {
        if (!ignore) setEquipmentCustomFields([]);
      });

    return () => {
      ignore = true;
    };
  }, [isActive]);

  function handleRetry() {
    setIsLoading(true);
    setError(null);
    setFetchToken((value) => value + 1);
  }

  function resetForEntry() {
    setIsLoading(true);
    setError(null);
  }

  function handleSelectPart(partTypeId) {
    setSelectedPartTypeId((current) => (String(current) === String(partTypeId) ? null : partTypeId));
  }

  // --- Part types (create/edit/delete the catalog of replaceable parts) ---

  const [isPartTypeFormOpen, setIsPartTypeFormOpen] = useState(false);
  const [partTypeFormMode, setPartTypeFormMode] = useState("add");
  const [partTypeFormTarget, setPartTypeFormTarget] = useState(null);
  const [partTypeFormValues, setPartTypeFormValues] = useState(PART_TYPE_FORM_INITIAL_VALUES);
  const [isSavingPartType, setIsSavingPartType] = useState(false);
  const [partTypeFormError, setPartTypeFormError] = useState(null);
  const [isLoadingPartTypeCategories, setIsLoadingPartTypeCategories] = useState(false);
  // The currently-ticked stock columns for whichever part type is open in
  // the form — {field, header} pairs, saved as a whole via
  // PUT /api/part-types/:id/stock-columns on submit.
  const [selectedStockColumns, setSelectedStockColumns] = useState([]);
  const [isLoadingStockColumns, setIsLoadingStockColumns] = useState(false);
  const [stockColumnsError, setStockColumnsError] = useState(null);

  function handleOpenAddPartType() {
    setPartTypeFormMode("add");
    setPartTypeFormTarget(null);
    setPartTypeFormValues(PART_TYPE_FORM_INITIAL_VALUES);
    setPartTypeFormError(null);
    setSelectedStockColumns([]);
    setStockColumnsError(null);
    setIsPartTypeFormOpen(true);
  }

  function handleOpenEditPartType(partType) {
    setPartTypeFormMode("edit");
    setPartTypeFormTarget(partType);
    setPartTypeFormError(null);
    setPartTypeFormValues({
      part_name: partType.part_name || "",
      description: partType.description || "",
      equipment_column: partType.equipment_column || "",
      tracks_value: Boolean(partType.tracks_value),
      is_countable: Boolean(partType.is_countable),
      category_ids: [],
    });
    setIsPartTypeFormOpen(true);
    setIsLoadingPartTypeCategories(true);
    setStockColumnsError(null);
    setIsLoadingStockColumns(true);

    // A field can be attached via either list server-side — custom_fields is
    // already on the part type object passed in (no extra fetch needed) —
    // stock_columns comes back from its own endpoint and gets merged in.
    const attachedCustomFields = (partType.custom_fields || []).map((field) => ({
      field: field.field_key,
      header: field.field_label,
    }));
    setSelectedStockColumns(attachedCustomFields);

    fetchPartTypeStockColumns(partType.part_type_id)
      .then((data) => {
        const columns = Array.isArray(data?.columns) ? data.columns : [];
        setSelectedStockColumns((current) => {
          const merged = [...current];
          columns.forEach((column) => {
            if (!merged.some((existing) => existing.field === column.field_name)) {
              merged.push({ field: column.field_name, header: column.header_text });
            }
          });
          return merged;
        });
      })
      .catch((error) => {
        setStockColumnsError(error.message || "Could not load this part's stock columns.");
      })
      .finally(() => setIsLoadingStockColumns(false));

    fetchPartTypeCategories(partType.part_type_id)
      .then((data) => {
        const linkedIds = (data?.categories || [])
          .filter((category) => category.is_linked)
          .map((category) => category.category_id);
        setPartTypeFormValues((current) => ({ ...current, category_ids: linkedIds }));
      })
      .catch(() => {
        // Categories are secondary to the core fields — a failed lookup just
        // leaves the picker empty rather than blocking the whole form.
      })
      .finally(() => setIsLoadingPartTypeCategories(false));
  }

  function handleClosePartTypeForm() {
    setIsPartTypeFormOpen(false);
    setPartTypeFormTarget(null);
  }

  function handlePartTypeFormFieldChange(field, value) {
    setPartTypeFormValues((current) => ({ ...current, [field]: value }));
  }

  function handleTogglePartTypeCategory(categoryId) {
    setPartTypeFormValues((current) => {
      const isSelected = current.category_ids.includes(categoryId);
      return {
        ...current,
        category_ids: isSelected
          ? current.category_ids.filter((id) => id !== categoryId)
          : [...current.category_ids, categoryId],
      };
    });
  }

  // Toggling a built-in or custom field on/off just updates the local
  // selection — the whole list is saved in one PUT once the part type form
  // is submitted (see handleSubmitPartTypeForm below), no per-field call.
  function handleToggleStockColumn(field, header) {
    setSelectedStockColumns((current) =>
      current.some((column) => column.field === field)
        ? current.filter((column) => column.field !== field)
        : [...current, { field, header }]
    );
  }

  // Creates a new shared custom field definition (visible to every part
  // type going forward) and ticks it into this part's selection.
  function handleAddCustomField(label, type) {
    const key = slugifyFieldLabel(label);
    if (stockColumnBuiltInOptions.some((option) => option.field === key)) {
      return Promise.reject(new Error(`"${label}" is already a built-in field — no need to add it.`));
    }

    return createPartCustomField({ field_label: label, field_type: type }).then((data) => {
      const field = data?.field || data;
      const fieldKey = field?.field_key || key;
      const fieldLabel = field?.field_label || label;
      setStockColumnCustomFieldOptions((current) =>
        current.some((option) => option.field_key === fieldKey)
          ? current
          : [...current, { field_key: fieldKey, field_label: fieldLabel, field_type: type }]
      );
      setSelectedStockColumns((current) => [...current, { field: fieldKey, header: fieldLabel }]);
    });
  }

  function handleSubmitPartTypeForm(event) {
    event.preventDefault();

    if (!partTypeFormValues.part_name.trim()) {
      setPartTypeFormError("Please enter a part name.");
      return;
    }

    setIsSavingPartType(true);
    setPartTypeFormError(null);

    const payload = {
      part_name: partTypeFormValues.part_name.trim(),
      description: partTypeFormValues.description.trim(),
      equipment_column: partTypeFormValues.equipment_column || null,
      tracks_value: partTypeFormValues.tracks_value,
      is_countable: partTypeFormValues.is_countable,
    };

    const isEdit = partTypeFormMode === "edit";
    const request = isEdit ? updatePartType(partTypeFormTarget.part_type_id, payload) : createPartType(payload);

    request
      .then((data) => {
        // Both create and update wrap the record as { part_type: {...} }.
        const partTypeId = isEdit ? partTypeFormTarget.part_type_id : data?.part_type?.part_type_id;
        const categoriesPromise = updatePartTypeCategories(partTypeId, partTypeFormValues.category_ids);
        const columnsPromise = updatePartTypeStockColumns(
          partTypeId,
          selectedStockColumns.map((column) => ({ field: column.field, header: column.header }))
        );
        return Promise.all([categoriesPromise, columnsPromise]).then(() => data);
      })
      .then((data) => {
        logActivity({
          actor: user,
          action: isEdit ? "update" : "create",
          module: ACTIVITY_MODULES.PART_STOCK,
          entityId: isEdit ? partTypeFormTarget.part_type_id : data?.part_type?.part_type_id,
          entityLabel: payload.part_name,
          before: isEdit ? partTypeFormTarget : null,
          after: payload,
        });
        setIsPartTypeFormOpen(false);
        setPartTypeFormTarget(null);
        setSelectedStockColumns([]);
        handleRetry();
      })
      .catch((error) => {
        const data = error.response?.data;
        setPartTypeFormError(data?.error || error.message || "Could not save this part type.");
      })
      .finally(() => setIsSavingPartType(false));
  }

  const [partTypeToDelete, setPartTypeToDelete] = useState(null);
  const [isDeletingPartType, setIsDeletingPartType] = useState(false);
  const [deletePartTypeError, setDeletePartTypeError] = useState(null);
  const [deletePartTypeBlocked, setDeletePartTypeBlocked] = useState(false);

  function handleOpenDeletePartType(partType) {
    setPartTypeToDelete(partType);
    setDeletePartTypeError(null);
    setDeletePartTypeBlocked(false);
  }

  function handleCloseDeletePartType() {
    setPartTypeToDelete(null);
    setDeletePartTypeError(null);
    setDeletePartTypeBlocked(false);
  }

  // If this part type's equipment_column points at an Equipment custom
  // field (not a real table column like "ram"/"cpu"), deleting the part
  // deletes that field too — otherwise it's left behind, orphaned, showing
  // all-N/A columns on every device in categories that had it.
  const linkedEquipmentField = partTypeToDelete
    ? equipmentCustomFields.find((field) => field.key === partTypeToDelete.equipment_column)
    : null;

  function handleConfirmDeletePartType() {
    if (!partTypeToDelete) return;

    setIsDeletingPartType(true);
    setDeletePartTypeError(null);
    const fieldToClean = linkedEquipmentField;

    deletePartType(partTypeToDelete.part_type_id)
      .then(() => {
        logActivity({
          actor: user,
          action: "delete",
          module: ACTIVITY_MODULES.PART_STOCK,
          entityId: partTypeToDelete.part_type_id,
          entityLabel: partTypeToDelete.part_name,
          before: partTypeToDelete,
        });
        setPartTypeToDelete(null);
        handleRetry();

        if (fieldToClean) {
          deleteCustomField(fieldToClean.id, true).catch(() => {
            // Best-effort cleanup — the part type itself is already gone,
            // so a failure here just leaves the orphaned field behind.
          });
        }
      })
      .catch((error) => {
        // Backend doesn't yet clean up part_type_custom_field rows before
        // deleting a part type, so a part with custom fields attached fails
        // with a raw SQL foreign-key error instead of a clean 409 — treat
        // that the same as the (already-handled) replacement-history block.
        const rawMessage = error.response?.data?.error || error.message || "";
        const isForeignKeyConflict = /REFERENCE constraint|FOREIGN KEY constraint/i.test(rawMessage);
        const blocked = error.status === 409 || error.status === 400 || isForeignKeyConflict;
        setDeletePartTypeBlocked(blocked);
        setDeletePartTypeError(
          blocked
            ? isForeignKeyConflict
              ? "This part still has custom fields or replacement history linked to it — deactivate it instead of deleting."
              : rawMessage || "This part has replacement history — deactivate it instead of deleting."
            : rawMessage || "Could not delete this part type."
        );
      })
      .finally(() => setIsDeletingPartType(false));
  }

  // Fallback for the delete-blocked case — hides the part from the picker
  // without touching its replacement history.
  function handleDeactivatePartTypeInstead() {
    if (!partTypeToDelete) return;

    setIsDeletingPartType(true);
    setDeletePartTypeError(null);

    updatePartType(partTypeToDelete.part_type_id, { is_active: false })
      .then(() => {
        logActivity({
          actor: user,
          action: "update",
          module: ACTIVITY_MODULES.PART_STOCK,
          entityId: partTypeToDelete.part_type_id,
          entityLabel: partTypeToDelete.part_name,
          before: partTypeToDelete,
          after: { is_active: false },
        });
        setPartTypeToDelete(null);
        setDeletePartTypeBlocked(false);
        handleRetry();
      })
      .catch((error) => {
        setDeletePartTypeError(error.response?.data?.error || error.message || "Could not deactivate this part type.");
      })
      .finally(() => setIsDeletingPartType(false));
  }


  // --- Add to stock ---------------------------------------------------

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addFormValues, setAddFormValues] = useState(ADD_FORM_INITIAL_VALUES);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState(null);

  function handleOpenAddDialog(partTypeId) {
    setIsAddDialogOpen(true);
    setAddError(null);
    setAddFormValues({ ...ADD_FORM_INITIAL_VALUES, part_type_id: partTypeId ? String(partTypeId) : "" });
  }

  function handleCloseAddDialog() {
    setIsAddDialogOpen(false);
  }

  function handleAddFormChange(field, value) {
    setAddFormValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmitAdd(event) {
    event.preventDefault();

    if (!addFormValues.part_type_id || !addFormValues.quantity) {
      return;
    }

    const partType = partTypes.find((item) => String(item.part_type_id) === String(addFormValues.part_type_id));

    const { payload, error: validationError } = buildPartStockPayload(partType, addFormValues, stockColumnCustomFieldOptions);
    if (validationError) {
      setAddError(validationError);
      return;
    }

    setIsSubmittingAdd(true);
    setAddError(null);

    addPartStock(payload)
      .then((data) => {
        logActivity({
          actor: user,
          action: "create",
          module: ACTIVITY_MODULES.PART_STOCK,
          entityId: data?.stock_id,
          entityLabel: `${partType?.part_name || "Part"}${payload.part_value ? ` (${payload.part_value})` : ""} x${payload.quantity}`,
          after: payload,
        });

        setIsAddDialogOpen(false);
        handleRetry();
      })
      .catch((error) => {
        const data = error.response?.data;

        setAddError(data?.error || error.message || "Could not add stock.");
      })
      .finally(() => setIsSubmittingAdd(false));
  }

  // --- Edit stock ---------------------------------------------------------

  const [editStockTarget, setEditStockTarget] = useState(null);
  const [editFormValues, setEditFormValues] = useState(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  function handleOpenEditDialog(record) {
    // The row passed in comes from the display list, which has fields like
    // part_type_id stripped for a cleaner table — look up the full record so
    // the dialog can tell what part this actually is (RAM, Hard Disk, ...).
    const fullRecord = stock.find((item) => item.stock_id === record.stock_id) || record;
    const partType = partTypes.find((item) => String(item.part_type_id) === String(fullRecord.part_type_id));
    const dynamicFieldValues = Object.fromEntries(
      getExtraStockColumns(partType, stockColumnCustomFieldOptions).map((field) => [
        field.field_key,
        fullRecord[field.field_key] ?? "",
      ])
    );
    setEditStockTarget(fullRecord);
    setEditError(null);
    setEditFormValues({
      ram_type: fullRecord.ram_type || "",
      model_name: fullRecord.model_name || "",
      model_number: fullRecord.model_number || "",
      disk_type: fullRecord.disk_type || "",
      disk_interface: fullRecord.disk_interface || "",
      part_value: fullRecord.part_value || "",
      quantity: String(fullRecord.quantity ?? ""),
      status: fullRecord.status || DEFAULT_PART_STOCK_STATUS,
      remark: fullRecord.remark || "",
      ...dynamicFieldValues,
    });
  }

  function handleCloseEditDialog() {
    setEditStockTarget(null);
    setEditFormValues(null);
  }

  function handleEditFormChange(field, value) {
    setEditFormValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmitEdit(event) {
    event.preventDefault();
    if (!editStockTarget || !editFormValues.quantity) return;

    const partType = partTypes.find((item) => String(item.part_type_id) === String(editStockTarget.part_type_id));

    const { payload, error: validationError } = buildPartStockPayload(
      partType,
      { ...editFormValues, part_type_id: editStockTarget.part_type_id },
      stockColumnCustomFieldOptions
    );
    if (validationError) {
      setEditError(validationError);
      return;
    }
    // A stock line's part never changes via edit — only carried along above
    // so the shared validator/payload builder has what it needs.
    delete payload.part_type_id;

    setIsSubmittingEdit(true);
    setEditError(null);

    updatePartStock(editStockTarget.stock_id, payload)
      .then((data) => {
        // An edit that makes this line identical to an existing one (same
        // value/type/status) gets merged into that line instead of erroring
        // — the id we sent may not be the id that survives, so use whatever
        // the API actually settled on rather than assuming it's unchanged.
        const resolvedStockId = data?.stock?.stock_id ?? editStockTarget.stock_id;
        logActivity({
          actor: user,
          action: "update",
          module: ACTIVITY_MODULES.PART_STOCK,
          entityId: resolvedStockId,
          entityLabel: `${editStockTarget.part_name || "Part"}${payload.part_value ? ` (${payload.part_value})` : ""}${
            data?.merged ? " — merged into an existing line" : ""
          }`,
          before: editStockTarget,
          after: payload,
        });
        setEditStockTarget(null);
        setEditFormValues(null);
        handleRetry();
      })
      .catch((error) => {
        const data = error.response?.data;
        setEditError(data?.error || error.message || "Could not update stock.");
      })
      .finally(() => setIsSubmittingEdit(false));
  }

  // --- Delete -------------------------------------------------------------

  const [deletingStockId, setDeletingStockId] = useState(null);

  // No confirmation step — clicking Delete on a stock line deletes it right
  // away, quantity-in-stock included (confirm: true always).
  function handleDeleteStock(record) {
    setDeletingStockId(record.stock_id);

    deletePartStock(record.stock_id, { confirm: true })
      .then(() => {
        logActivity({
          actor: user,
          action: "delete",
          module: ACTIVITY_MODULES.PART_STOCK,
          entityId: record.stock_id,
          entityLabel: `${record.part_name || "Part"}${record.part_value ? ` (${record.part_value})` : ""}`,
          before: record,
        });
        handleRetry();
      })
      .catch((error) => {
        window.alert(error.response?.data?.error || error.message || "Could not delete this stock line.");
      })
      .finally(() => setDeletingStockId(null));
  }

  return {
    stock,
    isLoading,
    error,
    handleRetry,
    resetForEntry,
    partTypes,
    selectedPartTypeId,
    handleSelectPart,
    partStatuses,

    allCategories,
    isPartTypeFormOpen,
    partTypeFormMode,
    partTypeFormValues,
    isSavingPartType,
    partTypeFormError,
    isLoadingPartTypeCategories,
    stockColumnBuiltInOptions,
    stockColumnCustomFieldOptions,
    partCustomFieldTypes,
    selectedStockColumns,
    isLoadingStockColumns,
    stockColumnsError,
    handleOpenAddPartType,
    handleOpenEditPartType,
    handleClosePartTypeForm,
    handlePartTypeFormFieldChange,
    handleTogglePartTypeCategory,
    handleToggleStockColumn,
    handleAddCustomField,
    handleSubmitPartTypeForm,

    partTypeToDelete,
    isDeletingPartType,
    deletePartTypeError,
    deletePartTypeBlocked,
    linkedEquipmentField,
    handleOpenDeletePartType,
    handleCloseDeletePartType,
    handleConfirmDeletePartType,
    handleDeactivatePartTypeInstead,

    isAddDialogOpen,
    addFormValues,
    isSubmittingAdd,
    addError,
    handleOpenAddDialog,
    handleCloseAddDialog,
    handleAddFormChange,
    handleSubmitAdd,

    editStockTarget,
    editFormValues,
    isSubmittingEdit,
    editError,
    handleOpenEditDialog,
    handleCloseEditDialog,
    handleEditFormChange,
    handleSubmitEdit,

    deletingStockId,
    handleDeleteStock,
  };
}
