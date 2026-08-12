import { useEffect, useState } from "react";
import { fetchBorrowHistory } from "../../../../services/borrowService";
import { fetchEmployees } from "../../../../services/employeeService";
import { BORROW_HISTORY_INITIAL_FILTERS } from "../../dashboard.config";

export function useBorrowHistory({ isActive }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);
  const [filters, setFilters] = useState(BORROW_HISTORY_INITIAL_FILTERS);
  const [employeeOptions, setEmployeeOptions] = useState([]);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchEmployees()
      .then((data) => {
        if (!ignore) setEmployeeOptions(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!ignore) setEmployeeOptions([]);
      });

    return () => {
      ignore = true;
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchBorrowHistory(filters)
      .then((data) => {
        if (!ignore) {
          setHistory(Array.isArray(data?.history) ? data.history : []);
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

  function handleClearFilters() {
    setIsLoading(true);
    setError(null);
    setFilters(BORROW_HISTORY_INITIAL_FILTERS);
  }

  return {
    history,
    isLoading,
    error,
    handleRetry,
    resetForEntry,
    employeeOptions,
    filters,
    handleFilterChange,
    handleClearFilters,
  };
}
