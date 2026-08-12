import { useEffect, useState } from "react";
import { createBorrow, fetchCurrentBorrows, returnBorrow } from "../../../../services/borrowService";
import { fetchEmployees } from "../../../../services/employeeService";
import { getEquipmentDisplayName } from "../../dashboard.utils";
import { BORROW_EQUIPMENT_INITIAL_VALUES, RETURN_EQUIPMENT_INITIAL_VALUES } from "../../dashboard.config";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";

export function useCurrentBorrows({ isActive, user, onBorrowsLoaded, onBorrowed, onReturned }) {
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null);
  const [returnValues, setReturnValues] = useState(RETURN_EQUIPMENT_INITIAL_VALUES);
  const [isReturning, setIsReturning] = useState(false);
  const [returnError, setReturnError] = useState(null);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [borrowTarget, setBorrowTarget] = useState(null);
  const [borrowValues, setBorrowValues] = useState(BORROW_EQUIPMENT_INITIAL_VALUES);
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [borrowError, setBorrowError] = useState(null);
  const [employeeOptions, setEmployeeOptions] = useState([]);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchCurrentBorrows()
      .then((data) => {
        const records = Array.isArray(data?.borrowed) ? data.borrowed : [];
        if (!ignore) {
          setLoans(records);
          onBorrowsLoaded?.(records);
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
  }, [isActive, fetchToken, onBorrowsLoaded]);

  function handleRetry() {
    setIsLoading(true);
    setError(null);
    setFetchToken((value) => value + 1);
  }

  function resetForEntry() {
    setIsLoading(true);
    setError(null);
  }

  function handleOpenReturn(loan) {
    setReturnTarget(loan);
    setReturnValues(RETURN_EQUIPMENT_INITIAL_VALUES);
    setReturnError(null);
    setIsReturnModalOpen(true);
  }

  function handleCloseReturn() {
    setIsReturnModalOpen(false);
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

    setIsReturning(true);
    setReturnError(null);

    const payload = { return_date: returnValues.return_date };
    if (returnValues.condition_on_return.trim()) {
      payload.condition_on_return = returnValues.condition_on_return;
    }

    returnBorrow(returnTarget.borrow_id, payload)
      .then(() => {
        logActivity({
          actor: user,
          action: "return",
          module: ACTIVITY_MODULES.BORROW,
          entityId: returnTarget.borrow_id,
          entityLabel:
            returnTarget.computer_name ||
            returnTarget.asset_code ||
            returnTarget.equipment_code ||
            `Borrow ${returnTarget.borrow_id}`,
          before: returnTarget,
          after: payload,
        });
        setIsReturnModalOpen(false);
        handleRetry();
        onReturned?.();
      })
      .catch((error) => setReturnError(error.message || "Something went wrong."))
      .finally(() => setIsReturning(false));
  }

  function handleOpenBorrow(item) {
    setBorrowTarget(item);
    setBorrowValues(BORROW_EQUIPMENT_INITIAL_VALUES);
    setBorrowError(null);
    setIsBorrowModalOpen(true);

    fetchEmployees()
      .then((data) => setEmployeeOptions(Array.isArray(data) ? data : []))
      .catch(() => setEmployeeOptions([]));
  }

  function handleCloseBorrow() {
    setIsBorrowModalOpen(false);
  }

  function handleBorrowFieldChange(key, value) {
    setBorrowValues((current) => ({ ...current, [key]: value }));
  }

  function handleBorrowEmployeeSelect(employee) {
    setBorrowValues((current) => ({ ...current, employee_id: String(employee.employee_id) }));
  }

  function handleSubmitBorrow(event) {
    event.preventDefault();
    if (!borrowTarget) return;

    if (!borrowValues.employee_id) {
      setBorrowError("Please select an employee.");
      return;
    }
    if (!borrowValues.expected_return_date) {
      setBorrowError("Please set an expected return date.");
      return;
    }

    setIsBorrowing(true);
    setBorrowError(null);

    const payload = {
      equipment_id: borrowTarget.equipment_id,
      borrower_id: Number(borrowValues.employee_id),
      expected_return_date: borrowValues.expected_return_date,
    };
    if (borrowValues.purpose.trim()) payload.purpose = borrowValues.purpose;
    if (borrowValues.condition_on_borrow.trim()) payload.condition_on_borrow = borrowValues.condition_on_borrow;
    if (borrowValues.remark.trim()) payload.remark = borrowValues.remark;

    createBorrow(payload)
      .then(() => {
        logActivity({
          actor: user,
          action: "borrow",
          module: ACTIVITY_MODULES.BORROW,
          entityId: borrowTarget.equipment_id,
          entityLabel: getEquipmentDisplayName(borrowTarget),
          after: payload,
        });
        setIsBorrowModalOpen(false);
        onBorrowed?.();
      })
      .catch((error) => setBorrowError(error.message || "Something went wrong."))
      .finally(() => setIsBorrowing(false));
  }

  return {
    loans,
    isLoading,
    error,
    handleRetry,
    resetForEntry,
    isReturnModalOpen,
    returnTarget,
    returnValues,
    isReturning,
    returnError,
    handleOpenReturn,
    handleCloseReturn,
    handleReturnFieldChange,
    handleSubmitReturn,
    isBorrowModalOpen,
    borrowTarget,
    borrowValues,
    isBorrowing,
    borrowError,
    employeeOptions,
    handleOpenBorrow,
    handleCloseBorrow,
    handleBorrowFieldChange,
    handleBorrowEmployeeSelect,
    handleSubmitBorrow,
  };
}
