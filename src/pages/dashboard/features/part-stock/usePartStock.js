import { useEffect, useState } from "react";
import { addPartStock, deletePartStock, fetchPartStock, updatePartStock } from "../../../../services/partStockService";
import {
  createPartType,
  deletePartType,
  fetchPartTypeCategories,
  fetchPartTypeColumns,
  fetchPartTypes,
  updatePartType,
  updatePartTypeCategories,
} from "../../../../services/partTypeService";
import { fetchCategories } from "../../../../services/categoryService";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";
import { DEFAULT_PART_STOCK_STATUS } from "../../dashboard.config";
import { buildPartStockPayload } from "../../dashboard.utils";

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

  // Reference data for the Add/Edit Part Type form — fetched once.
  const [partTypeColumns, setPartTypeColumns] = useState([]);
  const [partTypeColumnsNote, setPartTypeColumnsNote] = useState("");
  const [allCategories, setAllCategories] = useState([]);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchPartTypeColumns()
      .then((data) => {
        if (ignore) return;
        setPartTypeColumns(Array.isArray(data?.columns) ? data.columns : []);
        setPartTypeColumnsNote(data?.note || "");
      })
      .catch(() => {
        if (!ignore) setPartTypeColumns([]);
      });

    fetchCategories()
      .then((data) => {
        if (!ignore) setAllCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!ignore) setAllCategories([]);
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

  function handleOpenAddPartType() {
    setPartTypeFormMode("add");
    setPartTypeFormTarget(null);
    setPartTypeFormValues(PART_TYPE_FORM_INITIAL_VALUES);
    setPartTypeFormError(null);
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
        return updatePartTypeCategories(partTypeId, partTypeFormValues.category_ids).then(() => data);
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

  function handleConfirmDeletePartType() {
    if (!partTypeToDelete) return;

    setIsDeletingPartType(true);
    setDeletePartTypeError(null);

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
      })
      .catch((error) => {
        const blocked = error.status === 409 || error.status === 400;
        setDeletePartTypeBlocked(blocked);
        setDeletePartTypeError(
          blocked
            ? error.response?.data?.error || "This part has replacement history — deactivate it instead of deleting."
            : error.response?.data?.error || error.message || "Could not delete this part type."
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

    const { payload, error: validationError } = buildPartStockPayload(partType, addFormValues);
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

    const { payload, error: validationError } = buildPartStockPayload(partType, {
      ...editFormValues,
      part_type_id: editStockTarget.part_type_id,
    });
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

  const [stockToDelete, setStockToDelete] = useState(null);
  const [isDeletingStock, setIsDeletingStock] = useState(false);
  const [deleteStockError, setDeleteStockError] = useState(null);
  const [deleteStockBlocked, setDeleteStockBlocked] = useState(false);

  function handleOpenDeleteStock(record) {
    setStockToDelete(record);
    setDeleteStockError(null);
    setDeleteStockBlocked(false);
  }

  function handleCloseDeleteStock() {
    setStockToDelete(null);
    setDeleteStockError(null);
    setDeleteStockBlocked(false);
  }

  function runDeleteStock(confirm) {
    if (!stockToDelete) return;

    setIsDeletingStock(true);
    setDeleteStockError(null);

    deletePartStock(stockToDelete.stock_id, { confirm })
      .then(() => {
        logActivity({
          actor: user,
          action: "delete",
          module: ACTIVITY_MODULES.PART_STOCK,
          entityId: stockToDelete.stock_id,
          entityLabel: `${stockToDelete.part_name || "Part"}${stockToDelete.part_value ? ` (${stockToDelete.part_value})` : ""}`,
          before: stockToDelete,
        });
        setStockToDelete(null);
        setDeleteStockBlocked(false);
        handleRetry();
      })
      .catch((error) => {
        const blocked = error.status === 409;
        setDeleteStockBlocked(blocked);
        setDeleteStockError(blocked ? error.response?.data?.error || "This line still has stock. Set the quantity to zero instead, or delete it anyway." : error.response?.data?.error || error.message || "Could not delete this stock line.");
      })
      .finally(() => setIsDeletingStock(false));
  }

  function handleConfirmDeleteStock() {
    runDeleteStock(false);
  }

  function handleDeleteStockAnyway() {
    runDeleteStock(true);
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

    partTypeColumns,
    partTypeColumnsNote,
    allCategories,
    isPartTypeFormOpen,
    partTypeFormMode,
    partTypeFormValues,
    isSavingPartType,
    partTypeFormError,
    isLoadingPartTypeCategories,
    handleOpenAddPartType,
    handleOpenEditPartType,
    handleClosePartTypeForm,
    handlePartTypeFormFieldChange,
    handleTogglePartTypeCategory,
    handleSubmitPartTypeForm,

    partTypeToDelete,
    isDeletingPartType,
    deletePartTypeError,
    deletePartTypeBlocked,
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

    stockToDelete,
    isDeletingStock,
    deleteStockError,
    deleteStockBlocked,
    handleOpenDeleteStock,
    handleCloseDeleteStock,
    handleConfirmDeleteStock,
    handleDeleteStockAnyway,
  };
}
