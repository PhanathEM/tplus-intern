import { useEffect, useState } from "react";
import { fetchAntivirusInstalls } from "../../../../services/antivirusService";
import { normalizeRecordList } from "../../dashboard.utils";

export function useAntivirus({ isActive }) {
  const [antivirusInstalls, setAntivirusInstalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchAntivirusInstalls()
      .then((data) => {
        if (!ignore) {
          setAntivirusInstalls(normalizeRecordList(data));
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

  return { antivirusInstalls, isLoading, error, handleRetry, resetForEntry };
}
