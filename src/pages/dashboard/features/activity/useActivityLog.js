import { useEffect, useMemo, useState } from "react";
import { getActivityLog, subscribeActivityLog } from "../../../../lib/activityLog";

export function useActivityLog() {
  const [entries, setEntries] = useState(() => getActivityLog());
  const [filters, setFilters] = useState({ module: "All", action: "All" });

  useEffect(() => subscribeActivityLog(() => setEntries(getActivityLog())), []);

  const filteredEntries = useMemo(() => {
    const { module, action } = filters;

    return entries.filter((entry) => {
      if (module !== "All" && entry.module !== module) return false;
      if (action !== "All" && entry.action !== action) return false;
      return true;
    });
  }, [entries, filters]);

  function handleFilterChange(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return { entries, filters, filteredEntries, handleFilterChange };
}
