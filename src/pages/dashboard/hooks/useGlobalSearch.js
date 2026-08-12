import { useEffect, useRef, useState } from "react";
import { searchEmployees } from "../../../services/employeeService";
import { fetchDepartments } from "../../../services/departmentService";
import { fetchUsers } from "../../../services/userService";
import { fetchEquipmentByCategory } from "../../../services/equipmentService";
import { hasPermission, PERMISSIONS } from "../../../lib/permissions";
import { groupEmployeeSearchResults } from "../dashboard.utils";

function createEmptyResults() {
  return {
    employees: [],
    departments: [],
    equipment: [],
    users: [],
  };
}

// Independently re-fetches and filters each category rather than reusing
// other hooks' already-loaded lists — a deliberate existing product decision
// (search must work across categories the user hasn't visited yet), not
// something this pass unifies.
export function useGlobalSearch({ user, onSelectView, onSelectEmployee, onSelectEquipmentCategory }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(createEmptyResults);
  const [isLoading, setIsLoading] = useState(false);
  const equipmentCacheRef = useRef(null);

  function handleQueryChange(nextQuery) {
    setQuery(nextQuery);
    if (nextQuery.trim().length < 2) {
      setResults(createEmptyResults());
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;

    let ignore = false;
    const lowerTerm = term.toLowerCase();

    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);

      const jobs = [];

      if (hasPermission(user, PERMISSIONS.EMPLOYEE)) {
        jobs.push(
          searchEmployees(term)
            .then((data) => ({
              key: "employees",
              items: groupEmployeeSearchResults(Array.isArray(data) ? data : []).slice(0, 5),
            }))
            .catch(() => ({ key: "employees", items: [] }))
        );
      }

      if (hasPermission(user, PERMISSIONS.DEPARTMENTS)) {
        jobs.push(
          fetchDepartments()
            .then((data) => ({
              key: "departments",
              items: (Array.isArray(data) ? data : [])
                .filter((department) =>
                  `${department.department_name || ""} ${department.department_code || ""}`
                    .toLowerCase()
                    .includes(lowerTerm)
                )
                .slice(0, 5),
            }))
            .catch(() => ({ key: "departments", items: [] }))
        );
      }

      if (hasPermission(user, PERMISSIONS.USERS)) {
        jobs.push(
          fetchUsers()
            .then((data) => {
              const list = Array.isArray(data) ? data : data?.users;
              return {
                key: "users",
                items: (Array.isArray(list) ? list : [])
                  .filter((candidate) =>
                    `${candidate.full_name || ""} ${candidate.username || ""}`.toLowerCase().includes(lowerTerm)
                  )
                  .slice(0, 5),
              };
            })
            .catch(() => ({ key: "users", items: [] }))
        );
      }

      if (hasPermission(user, PERMISSIONS.EQUIPMENT)) {
        const equipmentPromise = equipmentCacheRef.current
          ? Promise.resolve(equipmentCacheRef.current)
          : fetchEquipmentByCategory("", "All")
              .then((data) => {
                const list = Array.isArray(data) ? data : [];
                equipmentCacheRef.current = list;
                return list;
              })
              .catch(() => []);

        jobs.push(
          equipmentPromise.then((list) => ({
            key: "equipment",
            items: list
              .filter((item) =>
                `${item.computer_name || ""} ${item.asset_code || item.equipment_code || ""} ${item.service_tag || ""} ${item.device_model || ""
                  } ${item.owner_name || ""}`
                  .toLowerCase()
                  .includes(lowerTerm)
              )
              .slice(0, 5),
          }))
        );
      }

      Promise.all(jobs)
        .then((jobResults) => {
          if (ignore) return;
          const next = createEmptyResults();
          jobResults.forEach(({ key, items }) => {
            next[key] = items;
          });
          setResults(next);
        })
        .finally(() => {
          if (!ignore) setIsLoading(false);
        });
    }, 350);

    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [query, user]);

  function handleSelectResult(type, item) {
    setQuery("");
    setResults(createEmptyResults());
    setIsLoading(false);

    if (type === "employees") {
      onSelectView?.("Employee");
      onSelectEmployee?.(item);
    } else if (type === "departments") {
      onSelectView?.("Departments");
    } else if (type === "equipment") {
      onSelectView?.("All Equipment");
      onSelectEquipmentCategory?.(item.category || item.category_name);
    } else if (type === "users") {
      onSelectView?.("Users");
    }
  }

  return {
    query,
    results,
    isLoading,
    handleQueryChange,
    handleSelectResult,
  };
}
