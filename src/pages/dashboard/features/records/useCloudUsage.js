import { useEffect, useState } from "react";
import { fetchCloudUsage } from "../../../../services/cloudUsageService";
import { normalizeRecordList } from "../../dashboard.utils";

export function useCloudUsage({ isActive }) {
  const [cloudUsage, setCloudUsage] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchCloudUsage()
      .then((data) => {
        if (!ignore) {
          setCloudUsage(normalizeRecordList(data));
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

  return { cloudUsage, isLoading, error, handleRetry, resetForEntry };
}
