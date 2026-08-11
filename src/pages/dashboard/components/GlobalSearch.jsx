import { useEffect, useRef, useState } from "react";
import {
  FiBox as Box,
  FiLayers as Layers,
  FiSearch as Search,
  FiUserCheck as UserCheck,
  FiUsers as Users,
} from "react-icons/fi";

const SECTION_META = {
  employees: { label: "Employees", icon: Users },
  departments: { label: "Departments", icon: Layers },
  equipment: { label: "Equipment", icon: Box },
  users: { label: "Users", icon: UserCheck },
};

const EMPTY_RESULTS = {
  employees: [],
  departments: [],
  equipment: [],
  users: [],
};

function joinDetail(parts) {
  return parts.filter(Boolean).join(" - ");
}

function getResultKey(type, item, index) {
  return [
    type,
    item.employee_id ??
      item.department_id ??
      item.equipment_id ??
      item.user_id ??
      item.owner_name ??
      item.full_name ??
      item.username ??
      index,
  ].join("-");
}

function getResultLabel(type, item) {
  if (type === "employees") {
    return item.owner_name || item.full_name || item.name || `Employee #${item.employee_id}`;
  }
  if (type === "departments") return item.department_name || item.department_code || "Department";
  if (type === "equipment") {
    return (
      item.computer_name ||
      item.device_model ||
      item.asset_code ||
      item.equipment_code ||
      `Equipment #${item.equipment_id}`
    );
  }
  if (type === "users") return item.full_name || item.username || "User";
  return "";
}

function getResultDetail(type, item) {
  if (type === "employees") {
    return joinDetail([
      item.employee_position || item.position,
      item.employee_department || item.department_code || item.department,
      item.employee_location || item.location,
      item.devices?.length ? `${item.devices.length} device${item.devices.length === 1 ? "" : "s"}` : null,
    ]);
  }
  if (type === "departments") return item.department_code;
  if (type === "equipment") {
    return joinDetail([
      item.category || item.category_name || item.device_type,
      item.asset_code || item.equipment_code || item.service_tag,
      item.owner_name,
    ]);
  }
  if (type === "users") return joinDetail([item.username, item.role]);
  return "";
}

export function GlobalSearch({
  value,
  onChange,
  results,
  isLoading,
  onSelect,
  autoFocus = false,
  placeholder = "Search employees, departments, equipment...",
  inputClassName,
  className = "w-full lg:w-72",
}) {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);
  const safeResults = results || EMPTY_RESULTS;

  useEffect(() => {
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setIsFocused(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const term = value.trim();
  const showDropdown = isFocused && term.length >= 2;
  const sectionKeys = Object.keys(SECTION_META).filter((key) => (safeResults[key] || []).length > 0);
  const hasAnyResults = sectionKeys.length > 0;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <label className="relative block">
        <span className="sr-only">Search</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          autoFocus={autoFocus}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className={
            inputClassName ||
            "h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
          }
        />
      </label>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {isLoading && !hasAnyResults ? (
            <div className="px-4 py-6 text-center text-[13px] text-slate-500">Searching...</div>
          ) : !hasAnyResults ? (
            <div className="px-4 py-6 text-center text-[13px] text-slate-500">No results for "{term}"</div>
          ) : (
            sectionKeys.map((key) => {
              const meta = SECTION_META[key];
              const Icon = meta.icon;
              return (
                <div key={key} className="border-b border-slate-50 py-1.5 last:border-b-0">
                  <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {meta.label}
                  </p>
                  {safeResults[key].map((item, index) => {
                    const detail = getResultDetail(key, item);
                    return (
                      <button
                        key={getResultKey(key, item, index)}
                        type="button"
                        onClick={() => {
                          setIsFocused(false);
                          onSelect(key, item);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left outline-none transition hover:bg-slate-50 focus-visible:bg-slate-50"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600">
                          <Icon size={14} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium text-slate-900">
                            {getResultLabel(key, item)}
                          </span>
                          {detail && <span className="block truncate text-[12px] text-slate-500">{detail}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
