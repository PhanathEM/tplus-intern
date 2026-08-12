import { useEffect, useState } from "react";
import { fetchReplacements } from "../../../../services/replacementService";
import { normalizeRecordList } from "../../dashboard.utils";

export function useReplacements({ isActive }) {
  const [replacements, setReplacements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchReplacements()
      .then((data) => {
        if (!ignore) {
          setReplacements(normalizeRecordList(data));
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

  return { replacements, isLoading, error, handleRetry, resetForEntry };
}
