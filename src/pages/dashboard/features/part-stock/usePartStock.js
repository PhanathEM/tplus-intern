import { useEffect, useState } from "react";
import { addPartStock, deletePartStock, fetchPartStock, updatePartStock } from "../../../../services/partStockService";
import { fetchPartTypes } from "../../../../services/partTypeService";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";
import { DEFAULT_PART_STOCK_STATUS } from "../../dashboard.config";
import { buildPartStockPayload } from "../../dashboard.utils";

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

  // Part types drive the card grid — fetched once, same list Device
  // Replacement's "Replace a part" tab uses.
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
      .then(() => {
        logActivity({
          actor: user,
          action: "update",
          module: ACTIVITY_MODULES.PART_STOCK,
          entityId: editStockTarget.stock_id,
          entityLabel: `${editStockTarget.part_name || "Part"}${payload.part_value ? ` (${payload.part_value})` : ""}`,
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
