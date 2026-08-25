import { useEffect, useState } from "react";
import { fetchAssignFormData } from "../../../../services/assignService";
import { fetchEquipmentByCategory } from "../../../../services/equipmentService";
import { fetchPartTypes, fetchStockColumnOptions } from "../../../../services/partTypeService";
import { fetchPartReplacements, submitPartReplacement } from "../../../../services/partReplacementService";
import { addPartStock, fetchAvailablePartStock } from "../../../../services/partStockService";
import { DEFAULT_PART_STOCK_STATUS } from "../../dashboard.config";
import { buildPartStockPayload } from "../../dashboard.utils";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";

// Fixed set for "Devices you can replace" — matches whatever the admin
// asked for, independent of Equipment's own per-category configured columns.
const REPLACEABLE_DEVICE_COLUMNS = [
  { key: "device_name", label: "Device Name" },
  { key: "owner_name", label: "Owner" },
  { key: "platform", label: "Platform" },
  { key: "asset_code", label: "Asset Code" },
  { key: "cpu", label: "CPU" },
  { key: "ram", label: "RAM" },
  { key: "hd", label: "HDD" },
  { key: "device_model", label: "Device Model" },
  { key: "serial_no", label: "Serial Number" },
];

const QUICK_ADD_FORM_INITIAL_VALUES = {
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

export function useReplacements({ isActive, user }) {
  // --- Replacement history -------------------------------------------

  const [replacements, setReplacements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);

  // Category reference data — used by the "Devices you can replace" list's
  // category bar. Device Replacement History has no category filter anymore.
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

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchPartReplacements()
      .then((data) => {
        if (!ignore) {
          setReplacements(Array.isArray(data?.replacements) ? data.replacements : Array.isArray(data) ? data : []);
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

  function handleRetry() {
    setIsLoading(true);
    setError(null);
    setFetchToken((value) => value + 1);
  }

  // "Device Replacement" and "Device Replacement History" share this same
  // `isActive` flag (it's true for either), so switching between just those
  // two doesn't flip isActive and won't re-run the fetch effect on its own —
  // bump fetchToken here too so entering either page always refetches.
  function resetForEntry() {
    setIsLoading(true);
    setError(null);
    setFetchToken((value) => value + 1);
  }

  // Page-level category selection — there's no "All categories" tab, so
  // default to the first real category once the list loads rather than an
  // explicit "All" sentinel.
  const [selectedCategoryOverride, setSelectedCategoryOverride] = useState("");
  const selectedCategory = selectedCategoryOverride || categories[0]?.category_name || "";

  function handleSelectCategory(value) {
    setIsReplaceableLoading(true);
    setReplaceableError(null);
    setSelectedCategoryOverride(value);
  }

  // --- Devices you can replace ----------------------------------------
  // The backend intentionally removed /api/replacements/replaceable — the
  // device picker now reads straight off the same equipment list the
  // Equipment page uses, filtered client-side down to devices with an owner
  // (the only ones a part/whole replacement makes sense for).

  const [replaceableDevices, setReplaceableDevices] = useState([]);
  const [replaceableColumns, setReplaceableColumns] = useState([]);
  const [isReplaceableLoading, setIsReplaceableLoading] = useState(true);
  const [replaceableError, setReplaceableError] = useState(null);
  const [replaceableFetchToken, setReplaceableFetchToken] = useState(0);
  const [replaceableSearch, setReplaceableSearch] = useState("");

  useEffect(() => {
    if (!isActive || !selectedCategory) return;

    let ignore = false;

    fetchEquipmentByCategory(selectedCategory)
      .then((listData) => {
        if (ignore) return;
        const owned = (Array.isArray(listData) ? listData : []).filter((item) => item.owner_id != null);
        setReplaceableDevices(owned);
        setReplaceableColumns(REPLACEABLE_DEVICE_COLUMNS);
        setReplaceableError(null);
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

  // The API behind this list has no search param anymore — filter client-side.
  function handleReplaceableSearchChange(value) {
    setReplaceableSearch(value);
  }

  const filteredReplaceableDevices = (() => {
    const term = replaceableSearch.trim().toLowerCase();
    if (!term) return replaceableDevices;
    return replaceableDevices.filter((device) =>
      replaceableColumns.some((column) => String(device[column.key] ?? "").toLowerCase().includes(term))
    );
  })();

  // --- Replace dialog -----------------------------------------------------
  // Whole-device replacement was removed (product decision) — this is just
  // the "Replace a part" flow now. The row already carries employee_id,
  // equipment_id and category_name, so the form doesn't need to ask again.

  const [replaceDialogTarget, setReplaceDialogTarget] = useState(null);

  // Part types depend on the selected device's category — fetched fresh each
  // time the dialog opens for a device (the backend filters by category_id).
  const [partTypes, setPartTypes] = useState([]);
  // The stock-columns catalog's custom_fields list — needed to know a
  // configured column's type (text/number/date/boolean) when it's not one
  // of the built-ins with a dedicated widget. Fetched once.
  const [stockColumnCustomFieldOptions, setStockColumnCustomFieldOptions] = useState([]);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchStockColumnOptions()
      .then((data) => {
        if (!ignore) setStockColumnCustomFieldOptions(Array.isArray(data?.custom_fields) ? data.custom_fields : []);
      })
      .catch(() => {
        if (!ignore) setStockColumnCustomFieldOptions([]);
      });

    return () => {
      ignore = true;
    };
  }, [isActive]);

  useEffect(() => {
    const categoryId = replaceDialogTarget?.category_id;
    if (!isActive || !categoryId) return;

    let ignore = false;

    fetchPartTypes(categoryId)
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
  }, [isActive, replaceDialogTarget]);

  const [selectedPartTypeId, setSelectedPartTypeId] = useState("");
  const [partAction, setPartAction] = useState("replace");
  const [partNewValue, setPartNewValue] = useState("");
  // Only meaningful for "replace" — an "add" doesn't displace an old part.
  // The API rejects anything other than the two OLD_PART_STATUS_OPTIONS values.
  const [oldPartStatus, setOldPartStatus] = useState("");
  const [isSubmittingPart, setIsSubmittingPart] = useState(false);
  const [submitPartError, setSubmitPartError] = useState(null);

  // Fitting a part now requires picking a physical unit off the shelf
  // (from_stock_id) — see stock-required.md. Loaded fresh whenever the
  // selected part changes.
  const [availableStock, setAvailableStock] = useState([]);
  const [isAvailableStockLoading, setIsAvailableStockLoading] = useState(false);
  const [availableStockError, setAvailableStockError] = useState(null);
  const [selectedStockId, setSelectedStockId] = useState("");

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
    // no separate free-text entry needed once a line is chosen. A quantity
    // part (RAM, HD) stores it with a unit ("16 GB") for display, but the
    // device's own field is a bare number ("16"), so strip the unit —
    // otherwise "add" can't add "16 GB" to "4" server-side. A model-based
    // part (CPU, Bag, Mouse, Keyboard) has no part_value at all — its
    // identity lives in model_name/model_number/etc. instead.
    const option = availableStock.find((item) => String(item.stock_id) === String(stockId));
    if (option?.part_value) {
      const numericValue = parseFloat(option.part_value);
      setPartNewValue(Number.isNaN(numericValue) ? option.part_value : String(numericValue));
    } else {
      const bits = [option?.ram_type, option?.model_name, option?.model_number, option?.disk_type, option?.disk_interface].filter(
        (value) => value && String(value).trim()
      );
      setPartNewValue(bits.join(" · "));
    }
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
    if (!quickAddFormValues.part_type_id || !quickAddFormValues.quantity) return;

    const partType = partTypes.find((item) => String(item.part_type_id) === String(quickAddFormValues.part_type_id));
    const { payload, error: validationError } = buildPartStockPayload(
      partType,
      quickAddFormValues,
      stockColumnCustomFieldOptions
    );
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
    setPartTypes([]);

    setSelectedPartTypeId("");
    setPartAction("replace");
    setPartNewValue("");
    setOldPartStatus("");
    setSubmitPartError(null);
    setAvailableStock([]);
    setAvailableStockError(null);
    setIsAvailableStockLoading(false);
    setSelectedStockId("");
  }

  function handleCloseReplaceDialog() {
    setReplaceDialogTarget(null);
  }

  function handleSelectPartType(value) {
    setSelectedPartTypeId(value);
    setPartAction("replace");
    setPartNewValue("");
    setOldPartStatus("");
    setSelectedStockId("");
    setSubmitPartError(null);

    setAvailableStock([]);
    setAvailableStockError(null);
    if (value) loadAvailableStock(value);
  }

  function handleSelectPartAction(value) {
    setPartAction(value);
    setPartNewValue("");
    setOldPartStatus("");
    setSelectedStockId("");
  }

  function handlePartNewValueChange(value) {
    setPartNewValue(value);
  }

  function handleSelectOldPartStatus(value) {
    setOldPartStatus(value);
  }

  function handleSubmitPartReplace(event) {
    event.preventDefault();
    if (!replaceDialogTarget || !selectedPartTypeId) return;

    const partType = partTypes.find((item) => String(item.part_type_id) === String(selectedPartTypeId));
    // "add" always needs a value (what's being added); "replace" only needs
    // one when the part actually tracks a value. Both install a physical
    // unit off the shelf, so both need a stock pick.
    const needsValue = partAction === "add" || (partAction === "replace" && Boolean(partType?.tracks_value));
    if (needsValue && !partNewValue.trim()) return;
    if (!selectedStockId) return;
    // Only "replace" displaces an old part, so only it needs to say what
    // condition that old part came out in.
    if (partAction === "replace" && !oldPartStatus) return;

    setIsSubmittingPart(true);
    setSubmitPartError(null);

    const payload = {
      part_type_id: Number(selectedPartTypeId),
      action: partAction,
      from_stock_id: Number(selectedStockId),
    };
    // Send whatever value the picked stock line carries, even for parts that
    // don't "track a value" (CPU, Bag, Mouse, Keyboard) — otherwise history
    // records the swap happened but not what it changed to.
    if (partNewValue.trim()) payload.new_value = partNewValue.trim();
    if (partAction === "replace") payload.old_part_status = oldPartStatus;

    const actionVerb = { replace: "replaced on", add: "added to" }[partAction];

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

    categories,
    selectedCategory,
    handleSelectCategory,
    partTypes,
    stockColumnCustomFieldOptions,

    replaceableDevices: filteredReplaceableDevices,
    replaceableColumns,
    isReplaceableLoading,
    replaceableError,
    handleRetryReplaceable,
    replaceableSearch,
    handleReplaceableSearchChange,

    replaceDialogTarget,
    handleOpenReplaceDialog,
    handleCloseReplaceDialog,

    selectedPartTypeId,
    handleSelectPartType,
    partAction,
    handleSelectPartAction,
    partNewValue,
    handlePartNewValueChange,
    oldPartStatus,
    handleSelectOldPartStatus,
    handleSubmitPartReplace,
    isSubmittingPart,
    submitPartError,

    availableStock,
    isAvailableStockLoading,
    availableStockError,
    handleRetryAvailableStock,
    selectedStockId,
    handleSelectStock,

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
