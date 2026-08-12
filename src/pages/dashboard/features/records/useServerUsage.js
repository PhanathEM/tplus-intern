import { useEffect, useState } from "react";
import { fetchServerUsage } from "../../../../services/serverUsageService";
import { normalizeRecordList } from "../../dashboard.utils";

export function useServerUsage({ isActive }) {
  const [serverUsage, setServerUsage] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchServerUsage()
      .then((data) => {
        if (!ignore) {
          setServerUsage(normalizeRecordList(data));
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

  return { serverUsage, isLoading, error, handleRetry, resetForEntry };
}
