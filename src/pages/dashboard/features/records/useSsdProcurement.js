import { useEffect, useState } from "react";
import { fetchSsdProcurement } from "../../../../services/ssdProcurementService";
import { normalizeRecordList } from "../../dashboard.utils";

export function useSsdProcurement({ isActive }) {
  const [ssdProcurements, setSsdProcurements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchSsdProcurement()
      .then((data) => {
        if (!ignore) {
          setSsdProcurements(normalizeRecordList(data));
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

  function resetForEntry() {
    setIsLoading(true);
    setError(null);
  }

  return { ssdProcurements, isLoading, error, handleRetry, resetForEntry };
}
