import { useEffect, useState } from "react";
import { fetchEmployees } from "../../../../services/employeeService";
import { fetchPartTypes } from "../../../../services/partTypeService";
import { fetchPartStatuses } from "../../../../services/partStatusService";
import {
  createPartBorrow,
  deletePartBorrow,
  fetchAvailablePartBorrowStock,
  fetchCurrentPartBorrows,
  returnPartBorrow,
} from "../../../../services/partBorrowService";
import { PART_BORROW_INITIAL_VALUES, PART_RETURN_INITIAL_VALUES } from "../../dashboard.config";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";

export function usePartBorrow({ isActive, user }) {
  const [borrows, setBorrows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchCurrentPartBorrows()
      .then((data) => {
        if (ignore) return;
        setBorrows(Array.isArray(data?.borrowed) ? data.borrowed : Array.isArray(data) ? data : []);
        setError(null);
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

  // Options for the return dialog's "Return Status" field — admin-
  // configurable via GET /api/part-statuses, so this stays in sync without
  // a redeploy if the list ever changes. Fetched once (only the active
  // ones; that's the endpoint's default).
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

  function handleRetry() {
    setIsLoading(true);
    setError(null);
    setFetchToken((value) => value + 1);
  }

  function resetForEntry() {
    setIsLoading(true);
    setError(null);
  }

  // --- Borrow dialog ---------------------------------------------------

  const [isBorrowDialogOpen, setIsBorrowDialogOpen] = useState(false);
  const [borrowValues, setBorrowValues] = useState(PART_BORROW_INITIAL_VALUES);
  const [isSubmittingBorrow, setIsSubmittingBorrow] = useState(false);
  const [borrowError, setBorrowError] = useState(null);
  const [partTypes, setPartTypes] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);

  const [availableStock, setAvailableStock] = useState([]);
  const [isAvailableStockLoading, setIsAvailableStockLoading] = useState(false);
  const [availableStockError, setAvailableStockError] = useState(null);

  function loadAvailableStock(partTypeId) {
    setIsAvailableStockLoading(true);
    setAvailableStockError(null);

    return fetchAvailablePartBorrowStock(partTypeId)
      .then((data) => {
        setAvailableStock(Array.isArray(data?.stock) ? data.stock : Array.isArray(data) ? data : []);
        setAvailableStockError(null);
      })
      .catch((error) => {
        setAvailableStockError(error.message || "Something went wrong.");
      })
      .finally(() => setIsAvailableStockLoading(false));
  }

  function handleRetryAvailableStock() {
    if (borrowValues.part_type_id) loadAvailableStock(borrowValues.part_type_id);
  }

  function handleOpenBorrowDialog() {
    setIsBorrowDialogOpen(true);
    setBorrowValues({ ...PART_BORROW_INITIAL_VALUES, borrow_date: new Date().toISOString().slice(0, 10) });
    setBorrowError(null);
    setAvailableStock([]);
    setAvailableStockError(null);

    fetchPartTypes()
      .then((data) => {
        const list = Array.isArray(data?.part_types) ? data.part_types : [];
        setPartTypes(list.filter((partType) => partType.is_active !== false).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
      })
      .catch(() => setPartTypes([]));

    fetchEmployees()
      .then((data) => setEmployeeOptions(Array.isArray(data) ? data : []))
      .catch(() => setEmployeeOptions([]));
  }

  function handleCloseBorrowDialog() {
    setIsBorrowDialogOpen(false);
  }

  function handleBorrowFieldChange(key, value) {
    setBorrowValues((current) => ({ ...current, [key]: value }));
  }

  function handleSelectBorrowPartType(partTypeId) {
    setBorrowValues((current) => ({ ...current, part_type_id: partTypeId, stock_id: "" }));
    setAvailableStock([]);
    setAvailableStockError(null);
    if (partTypeId) loadAvailableStock(partTypeId);
  }

  function handleSelectBorrowStock(stockId) {
    setBorrowValues((current) => ({ ...current, stock_id: stockId }));
  }

  function handleSelectBorrowEmployee(employee) {
    setBorrowValues((current) => ({ ...current, borrower_id: String(employee.employee_id) }));
  }

  function handleSubmitBorrow(event) {
    event.preventDefault();

    if (!borrowValues.stock_id) {
      setBorrowError("Please select a stock line.");
      return;
    }
    if (!borrowValues.borrower_id) {
      setBorrowError("Please select a borrower.");
      return;
    }
    if (!borrowValues.borrow_date) {
      setBorrowError("Please set a borrow date.");
      return;
    }
    const quantity = Number(borrowValues.quantity);
    if (!quantity || quantity < 1) {
      setBorrowError("Please enter a valid quantity.");
      return;
    }

    setIsSubmittingBorrow(true);
    setBorrowError(null);

    const stockOption = availableStock.find((item) => String(item.stock_id) === String(borrowValues.stock_id));
    const partType = partTypes.find((item) => String(item.part_type_id) === String(borrowValues.part_type_id));

    // "Lender" (issued_by) is set server-side from whoever's logged in —
    // no field to send here.
    const payload = {
      stock_id: Number(borrowValues.stock_id),
      quantity,
      borrower_id: Number(borrowValues.borrower_id),
      borrow_date: borrowValues.borrow_date,
    };
    if (borrowValues.condition_on_borrow.trim()) payload.condition_on_borrow = borrowValues.condition_on_borrow;

    const borrowerEmployee = employeeOptions.find(
      (employee) => String(employee.employee_id) === String(borrowValues.borrower_id)
    );
    const itemLabel = `${partType?.part_name || "Part"}${stockOption?.part_value ? ` (${stockOption.part_value})` : ""}`;

    createPartBorrow(payload)
      .then((data) => {
        logActivity({
          actor: user,
          action: "borrow",
          module: ACTIVITY_MODULES.PART_BORROW,
          entityId: data?.borrow_id,
          entityLabel: `${itemLabel} x${quantity}`,
          // A human-readable snapshot for the Activity Log's "Details" panel —
          // not the raw API payload, which is just IDs (stock_id, borrower_id).
          after: {
            item: itemLabel,
            quantity,
            borrower: borrowerEmployee?.full_name || `Employee #${borrowValues.borrower_id}`,
            condition: payload.condition_on_borrow || "—",
            lender: user?.name || "—",
            date: payload.borrow_date,
          },
        });
        setIsBorrowDialogOpen(false);
        handleRetry();
      })
      .catch((error) => {
        const data = error.response?.data;
        if (error.status === 409) {
          setBorrowError(data?.error || "Not enough left in stock. Pick another line.");
          handleRetryAvailableStock();
        } else {
          setBorrowError(data?.error || error.message || "Could not create the borrow.");
        }
      })
      .finally(() => setIsSubmittingBorrow(false));
  }

  // --- Return dialog -----------------------------------------------------

  const [returnTarget, setReturnTarget] = useState(null);
  const [returnValues, setReturnValues] = useState(PART_RETURN_INITIAL_VALUES);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState(null);

  function handleOpenReturnDialog(borrow) {
    setReturnTarget(borrow);
    setReturnValues({ ...PART_RETURN_INITIAL_VALUES, return_date: new Date().toISOString().slice(0, 10) });
    setReturnError(null);
  }

  function handleCloseReturnDialog() {
    setReturnTarget(null);
  }

  function handleReturnFieldChange(key, value) {
    setReturnValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmitReturn(event) {
    event.preventDefault();
    if (!returnTarget) return;

    if (!returnValues.return_date) {
      setReturnError("Please set a return date.");
      return;
    }

    setIsSubmittingReturn(true);
    setReturnError(null);

    const payload = { return_date: returnValues.return_date, return_status: returnValues.return_status };
    if (returnValues.condition_on_return.trim()) payload.condition_on_return = returnValues.condition_on_return;

    returnPartBorrow(returnTarget.borrow_id, payload)
      .then(() => {
        logActivity({
          actor: user,
          action: "return",
          module: ACTIVITY_MODULES.PART_BORROW,
          entityId: returnTarget.borrow_id,
          entityLabel: returnTarget.part_name || `Borrow ${returnTarget.borrow_id}`,
          before: {
            item: returnTarget.part_name || "Part",
            quantity: returnTarget.quantity,
            borrower: returnTarget.borrower_name || "—",
            condition: payload.condition_on_return || "—",
            date: payload.return_date,
          },
        });
        setReturnTarget(null);
        handleRetry();
      })
      .catch((error) => setReturnError(error.response?.data?.error || error.message || "Something went wrong."))
      .finally(() => setIsSubmittingReturn(false));
  }

  // --- Delete / correct ---------------------------------------------------

  const [deletingBorrow, setDeletingBorrow] = useState(null);
  const [isDeletingBorrow, setIsDeletingBorrow] = useState(false);
  const [deleteBorrowError, setDeleteBorrowError] = useState(null);

  function handleOpenDeleteBorrow(borrow) {
    setDeletingBorrow(borrow);
    setDeleteBorrowError(null);
  }

  function handleCloseDeleteBorrow() {
    setDeletingBorrow(null);
  }

  function handleConfirmDeleteBorrow() {
    if (!deletingBorrow) return;

    setIsDeletingBorrow(true);
    setDeleteBorrowError(null);

    deletePartBorrow(deletingBorrow.borrow_id)
      .then(() => {
        logActivity({
          actor: user,
          action: "delete",
          module: ACTIVITY_MODULES.PART_BORROW,
          entityId: deletingBorrow.borrow_id,
          entityLabel: deletingBorrow.part_name || `Borrow ${deletingBorrow.borrow_id}`,
          before: {
            item: deletingBorrow.part_name || "Part",
            quantity: deletingBorrow.quantity,
            borrower: deletingBorrow.borrower_name || "—",
            condition: deletingBorrow.condition_on_borrow || "—",
            lender: deletingBorrow.issued_by || "—",
            date: deletingBorrow.borrow_date,
          },
        });
        setDeletingBorrow(null);
        handleRetry();
      })
      .catch((error) => setDeleteBorrowError(error.response?.data?.error || error.message || "Could not delete this record."))
      .finally(() => setIsDeletingBorrow(false));
  }

  return {
    borrows,
    isLoading,
    error,
    handleRetry,
    resetForEntry,
    partStatuses,

    isBorrowDialogOpen,
    borrowValues,
    isSubmittingBorrow,
    borrowError,
    partTypes,
    employeeOptions,
    handleOpenBorrowDialog,
    handleCloseBorrowDialog,
    handleBorrowFieldChange,
    handleSelectBorrowPartType,
    handleSelectBorrowStock,
    handleSelectBorrowEmployee,
    handleSubmitBorrow,

    availableStock,
    isAvailableStockLoading,
    availableStockError,
    handleRetryAvailableStock,

    returnTarget,
    returnValues,
    isSubmittingReturn,
    returnError,
    handleOpenReturnDialog,
    handleCloseReturnDialog,
    handleReturnFieldChange,
    handleSubmitReturn,

    deletingBorrow,
    isDeletingBorrow,
    deleteBorrowError,
    handleOpenDeleteBorrow,
    handleCloseDeleteBorrow,
    handleConfirmDeleteBorrow,
  };
}
