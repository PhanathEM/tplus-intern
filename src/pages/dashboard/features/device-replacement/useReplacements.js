import { useEffect, useState } from "react";
import {
  fetchReplacements,
  fetchReplaceableEquipment,
  submitReplacement,
} from "../../../../services/replacementService";
import { fetchAssignFormData, fetchAssignableEquipment } from "../../../../services/assignService";
import { fetchPartTypes } from "../../../../services/partTypeService";
import { submitPartReplacement } from "../../../../services/partReplacementService";
import { addPartStock, fetchAvailablePartStock } from "../../../../services/partStockService";
import { fetchStatuses } from "../../../../services/statusService";
import { REPLACEMENT_FILTERS_INITIAL_VALUES } from "../../dashboard.config";
import { buildPartStockPayload, normalizeEquipmentTableColumns } from "../../dashboard.utils";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";

const QUICK_ADD_FORM_INITIAL_VALUES = {
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

export function useReplacements({ isActive, user }) {
  // --- Replacement history -------------------------------------------

  const [replacements, setReplacements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);
  const [filters, setFilters] = useState(REPLACEMENT_FILTERS_INITIAL_VALUES);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchReplacements(filters)
      .then((data) => {
        if (!ignore) {
          setReplacements(Array.isArray(data?.replacements) ? data.replacements : []);
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
  }, [isActive, fetchToken, filters]);

  function handleRetry() {
    setIsLoading(true);
    setError(null);
    setFetchToken((value) => value + 1);
  }

  function resetForEntry() {
    setIsLoading(true);
    setError(null);
  }

  function handleFilterChange(key, value) {
    setIsLoading(true);
    setError(null);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  // Category reference data — shared by both lists' category filters.
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchAssignFormData()
      .then((data) => {
        if (!ignore) setCategories(Array.isArray(data?.categories) ? data.categories : []);
      })
      .catch(() => {
        if (!ignore) setCategories([]);
      });

    return () => {
      ignore = true;
    };
  }, [isActive]);

  // Page-level category selection — the page currently shows just this bar;
  // which section(s) it drives is still being worked out.
  const [selectedCategory, setSelectedCategory] = useState("All");

  function handleSelectCategory(value) {
    setIsReplaceableLoading(true);
    setReplaceableError(null);
    setSelectedCategory(value);
  }

  // Part types — fetched once on load for the "Replace a part" panel.
  const [partTypes, setPartTypes] = useState([]);

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

  // Statuses — used for the "old part status" field when replacing, and for
  // the "add to stock" shortcut's status dropdown.
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchStatuses()
      .then((data) => {
        if (ignore) return;
        const list = Array.isArray(data) ? data : [];
        setStatuses(
          list
            .filter((status) => status.is_active !== false)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        );
      })
      .catch(() => {
        if (!ignore) setStatuses([]);
      });

    return () => {
      ignore = true;
    };
  }, [isActive]);

  // --- Devices you can replace ----------------------------------------

  const [replaceableDevices, setReplaceableDevices] = useState([]);
  const [replaceableColumns, setReplaceableColumns] = useState([]);
  const [isReplaceableLoading, setIsReplaceableLoading] = useState(true);
  const [replaceableError, setReplaceableError] = useState(null);
  const [replaceableFetchToken, setReplaceableFetchToken] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchReplaceableEquipment({ category: selectedCategory })
      .then((data) => {
        if (!ignore) {
          setReplaceableDevices(Array.isArray(data?.equipment) ? data.equipment : []);
          setReplaceableColumns(normalizeEquipmentTableColumns(data));
          setReplaceableError(null);
        }
      })
      .catch((error) => {
        if (!ignore) setReplaceableError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsReplaceableLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isActive, replaceableFetchToken, selectedCategory]);

  function handleRetryReplaceable() {
    setIsReplaceableLoading(true);
    setReplaceableError(null);
    setReplaceableFetchToken((value) => value + 1);
  }

  // --- Replace dialog -----------------------------------------------------
  // One dialog, two tabs. The row already carries employee_id, equipment_id
  // and category_name, so neither tab needs to ask for those again.

  const [replaceDialogTarget, setReplaceDialogTarget] = useState(null);
  const [activeReplaceTab, setActiveReplaceTab] = useState("device");

  const [newDeviceOptions, setNewDeviceOptions] = useState([]);
  const [newDeviceColumns, setNewDeviceColumns] = useState([]);
  const [isNewDeviceOptionsLoading, setIsNewDeviceOptionsLoading] = useState(false);
  const [newDeviceOptionsError, setNewDeviceOptionsError] = useState(null);
  const [selectedNewDevice, setSelectedNewDevice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [selectedPartTypeId, setSelectedPartTypeId] = useState("");
  const [partAction, setPartAction] = useState("replace");
  const [partNewValue, setPartNewValue] = useState("");
  const [isSubmittingPart, setIsSubmittingPart] = useState(false);
  const [submitPartError, setSubmitPartError] = useState(null);

  // Fitting a part now requires picking a physical unit off the shelf
  // (from_stock_id) — see stock-required.md. Loaded fresh whenever the
  // selected part changes.
  const [availableStock, setAvailableStock] = useState([]);
  const [isAvailableStockLoading, setIsAvailableStockLoading] = useState(false);
  const [availableStockError, setAvailableStockError] = useState(null);
  const [selectedStockId, setSelectedStockId] = useState("");
  const [oldPartStatus, setOldPartStatus] = useState("");

  // "Add to stock" shortcut shown inline when the shelf is empty for the
  // selected part, so the admin isn't forced off the page to fix it.
  const [isQuickAddDialogOpen, setIsQuickAddDialogOpen] = useState(false);
  const [quickAddFormValues, setQuickAddFormValues] = useState(QUICK_ADD_FORM_INITIAL_VALUES);
  const [isSubmittingQuickAdd, setIsSubmittingQuickAdd] = useState(false);
  const [quickAddError, setQuickAddError] = useState(null);

  function loadAvailableStock(partTypeId) {
    setIsAvailableStockLoading(true);
    setAvailableStockError(null);

    return fetchAvailablePartStock(partTypeId)
      .then((data) => {
        setAvailableStock(Array.isArray(data?.stock) ? data.stock : []);
        setAvailableStockError(null);
      })
      .catch((error) => {
        setAvailableStockError(error.message || "Something went wrong.");
      })
      .finally(() => setIsAvailableStockLoading(false));
  }

  function handleRetryAvailableStock() {
    if (selectedPartTypeId) loadAvailableStock(selectedPartTypeId);
  }

  function handleSelectStock(stockId) {
    setSelectedStockId(stockId);
    // The picked stock line's own value *is* the new value being fitted —
    // no separate free-text entry needed once a line is chosen.
    const option = availableStock.find((item) => String(item.stock_id) === String(stockId));
    if (option?.part_value) setPartNewValue(option.part_value);
  }

  function handleSelectOldPartStatus(value) {
    setOldPartStatus(value);
  }

  function handleOpenQuickAddDialog(partTypeId) {
    setIsQuickAddDialogOpen(true);
    setQuickAddError(null);
    setQuickAddFormValues({ ...QUICK_ADD_FORM_INITIAL_VALUES, part_type_id: partTypeId ? String(partTypeId) : "" });
  }

  function handleCloseQuickAddDialog() {
    setIsQuickAddDialogOpen(false);
  }

  function handleQuickAddFormChange(field, value) {
    setQuickAddFormValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmitQuickAdd(event) {
    event.preventDefault();
    if (!quickAddFormValues.part_type_id || !quickAddFormValues.quantity || !quickAddFormValues.status) return;

    const partType = partTypes.find((item) => String(item.part_type_id) === String(quickAddFormValues.part_type_id));
    const { payload, error: validationError } = buildPartStockPayload(partType, quickAddFormValues);
    if (validationError) {
      setQuickAddError(validationError);
      return;
    }

    setIsSubmittingQuickAdd(true);
    setQuickAddError(null);

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
        setIsQuickAddDialogOpen(false);
        // The newly added line should show up (and be pickable) right away.
        loadAvailableStock(quickAddFormValues.part_type_id);
      })
      .catch((error) => {
        const data = error.response?.data;
        setQuickAddError(data?.error || error.message || "Could not add stock.");
      })
      .finally(() => setIsSubmittingQuickAdd(false));
  }

  function handleOpenReplaceDialog(device) {
    setReplaceDialogTarget(device);
    setActiveReplaceTab("device");

    setSelectedNewDevice(null);
    setSubmitError(null);
    setNewDeviceOptions([]);
    setIsNewDeviceOptionsLoading(true);

    setSelectedPartTypeId("");
    setPartAction("replace");
    setPartNewValue("");
    setSubmitPartError(null);
    setAvailableStock([]);
    setAvailableStockError(null);
    setIsAvailableStockLoading(false);
    setSelectedStockId("");
    setOldPartStatus("");

    fetchAssignableEquipment({ category: device.category_name })
      .then((data) => {
        setNewDeviceOptions(Array.isArray(data?.equipment) ? data.equipment : []);
        setNewDeviceColumns(normalizeEquipmentTableColumns(data));
        setNewDeviceOptionsError(null);
      })
      .catch((error) => setNewDeviceOptionsError(error.message || "Something went wrong."))
      .finally(() => setIsNewDeviceOptionsLoading(false));
  }

  function handleCloseReplaceDialog() {
    setReplaceDialogTarget(null);
  }

  function handleSwitchReplaceTab(tab) {
    setActiveReplaceTab(tab);
  }

  function handleSelectNewDevice(device) {
    setSelectedNewDevice(device);
  }

  function handleClearNewDevice() {
    setSelectedNewDevice(null);
  }

  function handleSubmitReplace(event) {
    event.preventDefault();
    if (!replaceDialogTarget || !selectedNewDevice) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      // The replaceable-equipment row carries the owner as owner_id, not
      // employee_id — the API's own field naming for /api/replacements is
      // employee_id, so translate it here rather than in every caller.
      employee_id: replaceDialogTarget.owner_id,
      old_equipment_id: replaceDialogTarget.equipment_id,
      new_equipment_id: selectedNewDevice.equipment_id,
      // Optional — default to true rather than asking the admin to tick
      // six boxes every time; nothing in the UI exposes these.
      old_bag: true,
      old_mouse: true,
      old_keyboard: true,
      new_bag: true,
      new_mouse: true,
      new_keyboard: true,
    };

    submitReplacement(payload)
      .then((data) => {
        logActivity({
          actor: user,
          action: "replace",
          module: ACTIVITY_MODULES.REPLACEMENT,
          entityId: data?.replacement_id,
          entityLabel: `${replaceDialogTarget.display_name} → ${selectedNewDevice.display_name}`,
          after: payload,
        });
        setReplaceDialogTarget(null);
        handleRetry();
        handleRetryReplaceable();
      })
      .catch((error) => {
        const data = error.response?.data;
        if (error.status === 409) {
          setSubmitError(
            data?.error ||
              (data?.current_owner
                ? `That device already belongs to ${data.current_owner}.`
                : "That device already belongs to someone.")
          );
        } else {
          setSubmitError(data?.error || error.message || "Could not replace the device.");
        }
      })
      .finally(() => setIsSubmitting(false));
  }

  function handleSelectPartType(value) {
    setSelectedPartTypeId(value);
    // A part swapped in might not be countable, so don't carry "add" over.
    setPartAction("replace");
    setPartNewValue("");
    setSelectedStockId("");
    setOldPartStatus("");
    setSubmitPartError(null);

    setAvailableStock([]);
    setAvailableStockError(null);
    if (value) loadAvailableStock(value);
  }

  function handleSelectPartAction(value) {
    setPartAction(value);
    setPartNewValue("");
    setSelectedStockId("");
  }

  function handlePartNewValueChange(value) {
    setPartNewValue(value);
  }

  function handleSubmitPartReplace(event) {
    event.preventDefault();
    if (!replaceDialogTarget || !selectedPartTypeId) return;

    const partType = partTypes.find((item) => String(item.part_type_id) === String(selectedPartTypeId));
    // "remove" takes the part out with nothing to type in; "add" always needs
    // an amount; "replace" only asks when the part actually tracks a value.
    const needsValue = partAction === "add" || (partAction === "replace" && partType?.tracks_value);
    if (needsValue && !partNewValue.trim()) return;
    // Fitting a part (replace/add) now has to come off the shelf — remove is
    // exempt since nothing is being installed. Replacing also asks what
    // condition the displaced part is in, since that's where it lands in stock.
    if (partAction !== "remove" && !selectedStockId) return;
    if (partAction === "replace" && !oldPartStatus) return;

    setIsSubmittingPart(true);
    setSubmitPartError(null);

    const payload = { part_type_id: Number(selectedPartTypeId), action: partAction };
    if (needsValue) payload.new_value = partNewValue.trim();
    if (partAction !== "remove") payload.from_stock_id = Number(selectedStockId);
    if (partAction === "replace") payload.old_part_status = oldPartStatus;

    const actionVerb = { replace: "replaced on", add: "added to", remove: "removed from" }[partAction];

    submitPartReplacement(replaceDialogTarget.equipment_id, payload)
      .then((data) => {
        logActivity({
          actor: user,
          action: "replace",
          module: ACTIVITY_MODULES.REPLACEMENT,
          entityId: replaceDialogTarget.equipment_id,
          entityLabel:
            data?.message || `${partType?.part_name || "Part"} ${actionVerb} ${replaceDialogTarget.display_name}`,
          after: payload,
        });
        setReplaceDialogTarget(null);
        handleRetryReplaceable();
      })
      .catch((error) => {
        const data = error.response?.data;
        if (error.status === 409) {
          // Someone else took the last one — refresh so the taken line drops
          // out of the picker instead of failing again on retry.
          setSubmitPartError(data?.error || "That stock line is gone. Pick another.");
          setSelectedStockId("");
          handleRetryAvailableStock();
        } else {
          setSubmitPartError(data?.error || error.message || "Could not replace the part.");
        }
      })
      .finally(() => setIsSubmittingPart(false));
  }

  return {
    replacements,
    isLoading,
    error,
    handleRetry,
    resetForEntry,
    filters,
    handleFilterChange,

    categories,
    selectedCategory,
    handleSelectCategory,
    partTypes,

    replaceableDevices,
    replaceableColumns,
    isReplaceableLoading,
    replaceableError,
    handleRetryReplaceable,

    replaceDialogTarget,
    handleOpenReplaceDialog,
    handleCloseReplaceDialog,
    activeReplaceTab,
    handleSwitchReplaceTab,

    newDeviceOptions,
    newDeviceColumns,
    isNewDeviceOptionsLoading,
    newDeviceOptionsError,
    selectedNewDevice,
    handleSelectNewDevice,
    handleClearNewDevice,
    handleSubmitReplace,
    isSubmitting,
    submitError,

    selectedPartTypeId,
    handleSelectPartType,
    partAction,
    handleSelectPartAction,
    partNewValue,
    handlePartNewValueChange,
    handleSubmitPartReplace,
    isSubmittingPart,
    submitPartError,

    statuses,
    availableStock,
    isAvailableStockLoading,
    availableStockError,
    handleRetryAvailableStock,
    selectedStockId,
    handleSelectStock,
    oldPartStatus,
    handleSelectOldPartStatus,

    isQuickAddDialogOpen,
    quickAddFormValues,
    isSubmittingQuickAdd,
    quickAddError,
    handleOpenQuickAddDialog,
    handleCloseQuickAddDialog,
    handleQuickAddFormChange,
    handleSubmitQuickAdd,
  };
}
