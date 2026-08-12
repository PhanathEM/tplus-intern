import { useEffect, useState } from "react";
import { fetchSsdUpgrades } from "../../../../services/ssdUpgradeService";
import { normalizeRecordList } from "../../dashboard.utils";

export function useSsdUpgrades({ isActive }) {
  const [ssdUpgrades, setSsdUpgrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchSsdUpgrades()
      .then((data) => {
        if (!ignore) {
          setSsdUpgrades(normalizeRecordList(data));
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

  return { ssdUpgrades, isLoading, error, handleRetry, resetForEntry };
}
