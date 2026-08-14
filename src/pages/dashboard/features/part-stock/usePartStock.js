import { useEffect, useState } from "react";
import { addPartStock, deletePartStock, fetchPartStock, updatePartStockQuantity } from "../../../../services/partStockService";
import { fetchPartTypes } from "../../../../services/partTypeService";
import { fetchStatuses } from "../../../../services/statusService";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";

const ADD_FORM_INITIAL_VALUES = { part_type_id: "", part_value: "", quantity: "1", status: "" };

export function usePartStock({ isActive, user }) {
  const [stock, setStock] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);

  const [partTypes, setPartTypes] = useState([]);
  const [selectedPartTypeId, setSelectedPartTypeId] = useState(null);
  const [statuses, setStatuses] = useState([]);

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
        setPartTypes(
          list
            .filter((partType) => partType.is_active !== false)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        );
      })
      .catch(() => {
        if (!ignore) setPartTypes([]);
      });

    return () => {
      ignore = true;
    };
  }, [isActive]);

  // Statuses feed the "Add to stock" status dropdown — the same list the
  // rest of the app uses for equipment status.
  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchStatuses()
      .then((data) => {
        if (ignore) return;
        const list = Array.isArray(data) ? data : [];
        setStatuses(
          list.filter((status) => status.is_active !== false).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        );
      })
      .catch(() => {
        if (!ignore) setStatuses([]);
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
    if (!addFormValues.part_type_id || !addFormValues.quantity || !addFormValues.status) return;

    const partType = partTypes.find((item) => String(item.part_type_id) === String(addFormValues.part_type_id));

    setIsSubmittingAdd(true);
    setAddError(null);

    const payload = {
      part_type_id: Number(addFormValues.part_type_id),
      part_value: partType?.tracks_value ? addFormValues.part_value.trim() : "",
      quantity: Number(addFormValues.quantity),
      status: addFormValues.status,
    };

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

  // --- Edit quantity ----------------------------------------------------

  const [editingStockId, setEditingStockId] = useState(null);
  const [editQuantityValue, setEditQuantityValue] = useState("");
  const [isSavingQuantity, setIsSavingQuantity] = useState(false);
  const [editQuantityError, setEditQuantityError] = useState(null);

  function handleStartEditQuantity(record) {
    setEditingStockId(record.stock_id);
    setEditQuantityValue(String(record.quantity ?? ""));
    setEditQuantityError(null);
  }

  function handleCancelEditQuantity() {
    setEditingStockId(null);
    setEditQuantityError(null);
  }

  function handleEditQuantityChange(value) {
    setEditQuantityValue(value);
  }

  function handleSaveEditQuantity() {
    if (editingStockId == null || editQuantityValue.trim() === "") return;

    const record = stock.find((item) => item.stock_id === editingStockId);
    const nextQuantity = Number(editQuantityValue);

    setIsSavingQuantity(true);
    setEditQuantityError(null);

    updatePartStockQuantity(editingStockId, nextQuantity)
      .then(() => {
        logActivity({
          actor: user,
          action: "update",
          module: ACTIVITY_MODULES.PART_STOCK,
          entityId: editingStockId,
          entityLabel: `${record?.part_name || "Part"} quantity`,
          before: { quantity: record?.quantity },
          after: { quantity: nextQuantity },
        });
        setEditingStockId(null);
        handleRetry();
      })
      .catch((error) => {
        const data = error.response?.data;
        setEditQuantityError(data?.error || error.message || "Could not update quantity.");
      })
      .finally(() => setIsSavingQuantity(false));
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
        setDeleteStockError(
          blocked
            ? error.response?.data?.error ||
                "This line still has stock. Set the quantity to zero instead, or delete it anyway."
            : error.response?.data?.error || error.message || "Could not delete this stock line."
        );
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
    statuses,

    isAddDialogOpen,
    addFormValues,
    isSubmittingAdd,
    addError,
    handleOpenAddDialog,
    handleCloseAddDialog,
    handleAddFormChange,
    handleSubmitAdd,

    editingStockId,
    editQuantityValue,
    isSavingQuantity,
    editQuantityError,
    handleStartEditQuantity,
    handleCancelEditQuantity,
    handleEditQuantityChange,
    handleSaveEditQuantity,

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
