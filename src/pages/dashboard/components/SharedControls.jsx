import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertTriangle as AlertTriangle,
  FiChevronDown as ChevronDown,
  FiSearch as Search,
} from "react-icons/fi";
import { getEmployeeDepartmentCode } from "../dashboard.utils";

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-400">
        <Icon size={18} />
      </div>
      <p className="text-[13px] font-semibold text-slate-700">{title}</p>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
}

export function CategoryDropdown({ options, selected, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

useEffect(() => {
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="inline-flex h-9 min-w-44 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selected}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

{isOpen && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-30 mt-2 max-h-72 w-52 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={option === selected}
              onClick={() => {
                onSelect(option);
                setIsOpen(false);
              }}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-[13px] font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${option === selected ? "bg-orange-50 text-orange-700" : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FormField({ label, htmlFor, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

export const formInputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  isConfirming,
  error,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

if (!isOpen) return null;

return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onCancel}
        aria-label="Close"
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="px-6 py-5">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-600">
            <AlertTriangle size={18} />
          </div>
          <h2 className="text-[15px] font-semibold text-slate-950">{title}</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{message}</p>
          {error && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700">
              {error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConfirming ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EmployeeSelectDropdown({ employees, selectedId, onSelect, disabled, placeholder = "Select employee" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

useEffect(() => {
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

 const selectedEmployee = employees.find(
    (employee) => String(employee.employee_id) === String(selectedId)
  );

 const filteredEmployees = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter((employee) => employee.full_name?.toLowerCase().includes(term));
  }, [employees, query]);

return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        disabled={disabled}
        className={`${formInputClass} flex items-center justify-between text-left disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span className={`truncate ${selectedEmployee ? "text-slate-900" : "text-slate-400"}`}>
          {selectedEmployee
            ? `${selectedEmployee.full_name}${selectedEmployee.position ? ` · ${selectedEmployee.position}` : ""}`
            : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

{isOpen && (
        <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                type="text"
                autoFocus
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search employee name"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5">
            {filteredEmployees.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-slate-400">No employees found</p>
            ) : (
              filteredEmployees.map((employee) => {
                const isSelected = String(employee.employee_id) === String(selectedId);
                return (
                  <button
                    key={employee.employee_id}
                    type="button"
                    onClick={() => {
                      onSelect(employee);
                      setQuery("");
                      setIsOpen(false);
                    }}
                    className={`flex w-full flex-col items-start rounded-lg px-3 py-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${isSelected ? "bg-orange-50 text-orange-700" : "text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    <span className="text-[13px] font-medium">{employee.full_name}</span>
                    {(employee.position || getEmployeeDepartmentCode(employee)) && (
                      <span className="text-xs text-slate-400">
                        {[employee.position, getEmployeeDepartmentCode(employee)].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
