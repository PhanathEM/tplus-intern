import { useEffect, useState } from "react";
import { fetchReplacements } from "../../../../services/replacementService";
import { fetchAssignFormData } from "../../../../services/assignService";
import { fetchEquipmentByCategory } from "../../../../services/equipmentService";
import { fetchPartTypes } from "../../../../services/partTypeService";
import { submitPartReplacement } from "../../../../services/partReplacementService";
import { addPartStock, fetchAvailablePartStock } from "../../../../services/partStockService";
import { DEFAULT_PART_STOCK_STATUS, REPLACEMENT_FILTERS_INITIAL_VALUES } from "../../dashboard.config";
import { buildPartStockPayload, getRecordColumns } from "../../dashboard.utils";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";

// Both device lists are category-driven (their columns come straight from
// the API), but the admin wants a fixed reading order regardless of category
// — some columns dropped entirely, everything else in a fixed sequence.
// Columns a category doesn't have (e.g. Server's ip_address) just get
// skipped; columns not listed here (a brand-new category's own fields) fall
// in at the end rather than disappearing.
function buildColumnOrderer(hiddenKeys, orderedKeys) {
  const priorityIndex = new Map(orderedKeys.map((key, index) => [key, index]));
  return function orderColumns(columns) {
    const visible = columns.filter((column) => !hiddenKeys.includes(column.key));
    return [...visible].sort((a, b) => {
      const aIndex = priorityIndex.has(a.key) ? priorityIndex.get(a.key) : orderedKeys.length;
      const bIndex = priorityIndex.has(b.key) ? priorityIndex.get(b.key) : orderedKeys.length;
      return aIndex - bIndex;
    });
  };
}

// "Devices you can replace" — these have an owner, so it leads. The raw
// /api/equipment record also carries a bunch of internal bookkeeping fields
// (ids, booleans, borrow tracking) the old curated /replaceable endpoint
// never surfaced — drop those here instead.
const orderReplaceableColumns = buildColumnOrderer(
  [
    "equipment_id",
    "received_date",
    "category_id",
    "status_id",
    "department_id",
    "owner_id",
    "is_assignable",
    "is_borrowable",
    "current_borrow_id",
    "current_borrower",
    "borrowed_on",
    "due_back",
    "category_name",
  ],
  [
    "owner_name",
    "device_type",
    "computer_name",
    "asset_code",
    "cpu",
    "ram",
    "hd",
    "windows_license",
    "av_license",
    "status",
    "bag",
    "mouse",
    "keyboard",
    "owner_position",
    "owner_department",
    "location",
    "service_tag",
    "purchase_date",
    "remark",
  ]
);

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
  const [filters, setFilters] = useState(REPLACEMENT_FILTERS_INITIAL_VALUES);

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

  // There's no "All categories" tab in the history filter either, so default
  // to the first real category once the list loads rather than an explicit
  // "All" sentinel.
  const effectiveFilters = {
    ...filters,
    category: filters.category || categories[0]?.category_name || "",
  };

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchReplacements(effectiveFilters)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, fetchToken, filters, categories]);

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
      .then((data) => {
        if (ignore) return;
        const owned = (Array.isArray(data) ? data : []).filter((item) => item.owner_id != null);
        setReplaceableDevices(owned);
        setReplaceableColumns(orderReplaceableColumns(getRecordColumns(owned, [])));
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
    // no separate free-text entry needed once a line is chosen. Stock stores
    // it with a unit ("16 GB") for display, but the device's own field is a
    // bare number ("4"), so strip the unit before it becomes new_value —
    // otherwise "add" can't add "16 GB" to "4" server-side.
    const option = availableStock.find((item) => String(item.stock_id) === String(stockId));
    if (option?.part_value) {
      const numericValue = parseFloat(option.part_value);
      setPartNewValue(Number.isNaN(numericValue) ? option.part_value : String(numericValue));
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
    if (needsValue) payload.new_value = partNewValue.trim();
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
    filters: effectiveFilters,
    handleFilterChange,

    categories,
    selectedCategory,
    handleSelectCategory,
    partTypes,

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
