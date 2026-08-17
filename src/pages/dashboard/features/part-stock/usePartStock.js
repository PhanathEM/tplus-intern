import { useEffect, useState } from "react";
import { addPartStock, deletePartStock, fetchPartStock, updatePartStock } from "../../../../services/partStockService";
import { fetchPartTypes } from "../../../../services/partTypeService";
import { fetchStatuses } from "../../../../services/statusService";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";

const ADD_FORM_INITIAL_VALUES = {
  part_type_id: "",
  ram_type: "",
  part_value: "",
  model_name: "",
  model_number: "",
  disk_type: "",
  disk_interface: "",
  quantity: "1",
  status: "",
  remark: "",
};

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
        setPartTypes(list.filter((partType) => partType.is_active !== false).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
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
        setStatuses(list.filter((status) => status.is_active !== false).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
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

    if (!addFormValues.part_type_id || !addFormValues.quantity || !addFormValues.status) {
      return;
    }

    const partType = partTypes.find((item) => String(item.part_type_id) === String(addFormValues.part_type_id));

    const normalizedPartName = partType?.part_name?.trim().toLowerCase();

    const isRam = normalizedPartName === "ram";

    const isCpu = normalizedPartName === "cpu";

    const isHardDisk = normalizedPartName === "hard disk";

    const isBag = normalizedPartName === "bag";

    const isMouse = normalizedPartName === "mouse";

    const isKeyboard = normalizedPartName === "keyboard";

    const needsModelName = isCpu || isBag || isMouse || isKeyboard;

    const needsModelNumber = isBag || isMouse || isKeyboard;

    if (isRam && !addFormValues.ram_type?.trim()) {
      setAddError("Please select RAM Type.");
      return;
    }

    if (needsModelName && !addFormValues.model_name?.trim()) {
      setAddError("Please enter Model Name.");
      return;
    }

    if (needsModelNumber && !addFormValues.model_number?.trim()) {
      setAddError("Please enter Model Number.");
      return;
    }

    if (isHardDisk && (!addFormValues.disk_type?.trim() || !addFormValues.disk_interface?.trim())) {
      setAddError("Please enter Disk Type and Disk Interface.");
      return;
    }

    setIsSubmittingAdd(true);
    setAddError(null);

    const payload = {
      part_type_id: Number(addFormValues.part_type_id),

      ram_type: isRam ? addFormValues.ram_type.trim() : null,

      model_name: needsModelName ? addFormValues.model_name.trim() : null,

      model_number: needsModelNumber ? addFormValues.model_number.trim() : null,

      disk_type: isHardDisk ? addFormValues.disk_type.trim() : null,

      disk_interface: isHardDisk ? addFormValues.disk_interface.trim() : null,

      part_value: partType?.tracks_value ? addFormValues.part_value.trim() : "",

      quantity: Number(addFormValues.quantity),

      status: addFormValues.status,

      remark: addFormValues.remark.trim(),
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
      status: fullRecord.status || "",
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
    if (!editStockTarget || !editFormValues.quantity || !editFormValues.status) return;

    const partType = partTypes.find((item) => String(item.part_type_id) === String(editStockTarget.part_type_id));
    const normalizedPartName = partType?.part_name?.trim().toLowerCase();
    const isRam = normalizedPartName === "ram";
    const isCpu = normalizedPartName === "cpu";
    const isHardDisk = normalizedPartName === "hard disk";
    const isBag = normalizedPartName === "bag";
    const isMouse = normalizedPartName === "mouse";
    const isKeyboard = normalizedPartName === "keyboard";
    const needsModelName = isCpu || isBag || isMouse || isKeyboard;
    const needsModelNumber = isBag || isMouse || isKeyboard;

    if (isRam && !editFormValues.ram_type?.trim()) {
      setEditError("Please select RAM Type.");
      return;
    }

    if (needsModelName && !editFormValues.model_name?.trim()) {
      setEditError("Please enter Model Name.");
      return;
    }

    if (needsModelNumber && !editFormValues.model_number?.trim()) {
      setEditError("Please enter Model Number.");
      return;
    }

    if (isHardDisk && (!editFormValues.disk_type?.trim() || !editFormValues.disk_interface?.trim())) {
      setEditError("Please enter Disk Type and Disk Interface.");
      return;
    }

    setIsSubmittingEdit(true);
    setEditError(null);

    const payload = {
      ram_type: isRam ? editFormValues.ram_type.trim() : null,
      model_name: needsModelName ? editFormValues.model_name.trim() : null,
      model_number: needsModelNumber ? editFormValues.model_number.trim() : null,
      disk_type: isHardDisk ? editFormValues.disk_type.trim() : null,
      disk_interface: isHardDisk ? editFormValues.disk_interface.trim() : null,
      part_value: partType?.tracks_value ? editFormValues.part_value.trim() : "",
      quantity: Number(editFormValues.quantity),
      status: editFormValues.status,
      remark: editFormValues.remark.trim(),
    };

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
    statuses,

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
