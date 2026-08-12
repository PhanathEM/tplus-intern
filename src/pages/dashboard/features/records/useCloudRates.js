import { useEffect, useState } from "react";
import { fetchCloudRates } from "../../../../services/cloudRateService";
import { normalizeRecordList } from "../../dashboard.utils";

export function useCloudRates({ isActive }) {
  const [cloudRates, setCloudRates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchCloudRates()
      .then((data) => {
        if (!ignore) {
          setCloudRates(normalizeRecordList(data));
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

  return { cloudRates, isLoading, error, handleRetry, resetForEntry };
}
