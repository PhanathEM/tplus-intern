import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FiAlertTriangle as AlertTriangle,
  FiChevronDown as ChevronDown,
  FiChevronLeft as ChevronLeft,
  FiChevronRight as ChevronRight,
  FiMoreVertical as MoreVertical,
  FiSearch as Search,
} from "react-icons/fi";
import { getEmployeeDepartmentCode } from "../dashboard.utils";

const PAGE_ARROW_CLASS =
  "grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-600 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-900 dark:disabled:hover:border-slate-700";

// Always includes page 1, the last page, and one neighbor on each side of
// the current page; collapses any gap into a single "..." entry — e.g.
// current=2, total=8 -> [1, 2, 3, "...", 8].
function buildPageList(current, total) {
  const delta = 1;
  const range = [];
  for (let i = 1; i <= total; i += 1) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }

  const withGaps = [];
  let previous;
  range.forEach((page) => {
    if (previous != null) {
      withGaps.push(page - previous === 2 ? previous + 1 : page - previous !== 1 ? "..." : null);
    }
    withGaps.push(page);
    previous = page;
  });
  return withGaps.filter((entry) => entry !== null);
}

// Rounded numbered pages with a filled active page and ellipsis for gaps —
// the one pagination look used everywhere a list is paginated.
export function Pagination({ currentPage, pageCount, onPageChange }) {
  if (pageCount <= 1) return null;

  const pages = buildPageList(currentPage, pageCount);

  return (
    <nav className="flex items-center gap-1.5" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className={PAGE_ARROW_CLASS}
      >
        <ChevronLeft size={15} />
      </button>

      {pages.map((page, index) =>
        page === "..." ? (
          <span key={`gap-${index}`} className="grid h-8 w-8 place-items-center text-sm text-slate-400 dark:text-slate-500">
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${page === currentPage
              ? "bg-[#fddd1c] text-slate-900"
              : "border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              }`}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
        disabled={currentPage === pageCount}
        aria-label="Next page"
        className={PAGE_ARROW_CLASS}
      >
        <ChevronRight size={15} />
      </button>
    </nav>
  );
}

// Label whose letters roll upward on hover, each a beat behind the last.
// The text is rendered twice inside a clipped box — the resting copy leaves
// through the top while its duplicate arrives from below — so both copies are
// aria-hidden and a single sr-only span carries the real text.
// The trigger must carry `group/roll` for the hover to reach these.
export function RollingText({ text }) {
  const characters = [...text];

  function renderCharacters(isIncoming) {
    return characters.map((character, index) => (
      <span
        key={index}
        className={`inline-block transition-transform duration-300 ease-out ${isIncoming
          ? "translate-y-full group-hover/roll:translate-y-0"
          : "group-hover/roll:-translate-y-full"
          }`}
        style={{ transitionDelay: `${index * 25}ms` }}
      >
        {character === " " ? " " : character}
      </span>
    ));
  }

  return (
    <span className="relative inline-flex overflow-hidden">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex">
        {renderCharacters(false)}
      </span>
      <span aria-hidden="true" className="absolute inset-0 inline-flex">
        {renderCharacters(true)}
      </span>
    </span>
  );
}

// Portal-based so the menu isn't clipped by a scrolling table container.
// `items`: [{ icon, label, onClick, destructive? }] — pass `{ divider: true }`
// for a separator between groups (e.g. downloads vs. edit/delete).
export function RowActionsMenu({ items }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // Flip the menu above the trigger when there isn't room below (e.g. the
  // last row of a table near the bottom of the viewport) — height is
  // estimated from the item count rather than measured, since the menu
  // isn't mounted yet on the first open and measuring would need an extra
  // render pass (and a visible flash while it repositions).
  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dividerCount = items.filter((item) => item.divider).length;
    const rowCount = items.length - dividerCount;
    const estimatedHeight = 8 + rowCount * 36 + dividerCount * 9;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < estimatedHeight + 8 && spaceAbove > spaceBelow;
    const right = window.innerWidth - rect.right;

    setMenuStyle(
      openUpward ? { bottom: window.innerHeight - rect.top + 4, right } : { top: rect.bottom + 4, right }
    );
  }, [items]);

  useEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();

    function handlePointerDown(event) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  return (
    <div ref={buttonRef} className="inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((value) => !value);
        }}
        aria-label="Row actions"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen &&
        menuStyle &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", ...menuStyle }}
            className="z-50 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
          >
            {items.map((item, index) =>
              item.divider ? (
                <div key={`divider-${index}`} className="my-1 border-t border-slate-100 dark:border-slate-700" />
              ) : (
                <button
                  key={item.label}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    item.onClick();
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium outline-none transition ${item.destructive ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40" : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                >
                  <item.icon size={14} />
                  {item.label}
                </button>
              )
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

export function EmptyState({ icon: Icon = Search, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Icon size={18} />
      </div>
      <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

export function CategoryDropdown({ options, selected, onSelect, label = "Select" }) {
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
        className="inline-flex h-9 min-w-44 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selected === "All" ? `All ${label}` : selected}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-30 mt-2 min-w-52 max-w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800"
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
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-[13px] font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${option === selected ? "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
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
      <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

export const formInputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  confirmingLabel = "Deleting...",
  onConfirm,
  onCancel,
  isConfirming,
  error,
  blocked = false,
  blockedActionLabel,
  onBlockedAction,
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
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="px-6 py-5">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertTriangle size={18} />
          </div>
          <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{message}</p>
          {error && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          {blocked ? (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
              >
                Close
              </button>
              {blockedActionLabel && onBlockedAction && (
                <button
                  type="button"
                  onClick={onBlockedAction}
                  className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
                >
                  <RollingText text={blockedActionLabel} />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onCancel}
                disabled={isConfirming}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isConfirming}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"
              >
                {isConfirming ? confirmingLabel : confirmLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Radio-style list for picking one of a short, known set of options — no
// search box (same look as the stock-line picker in ReplacementView.jsx).
// Portal-based with fixed positioning so it isn't clipped by a dialog's own
// scrolling content area, the way an absolutely-positioned panel would be.
// `options`: [{ value, label }]
export function RadioSelect({ id, options, value, onSelect, placeholder = "Select...", disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuRect, setMenuRect] = useState(null);
  const containerRef = useRef(null);
  const menuRef = useRef(null);

  // How tall the menu would like to be if there's room; how little it'll
  // shrink to before it's unusable.
  const PREFERRED_MENU_HEIGHT = 224;
  const MIN_MENU_HEIGHT = 120;
  const VIEWPORT_MARGIN = 8;

  function updateMenuRect() {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - VIEWPORT_MARGIN;
    // Open upward only when there's truly not enough room below AND above
    // has more room to offer — otherwise keep the usual downward opening.
    const openUpward = spaceBelow < MIN_MENU_HEIGHT && spaceAbove > spaceBelow;
    const maxHeight = Math.max(MIN_MENU_HEIGHT, Math.min(PREFERRED_MENU_HEIGHT, openUpward ? spaceAbove : spaceBelow));
    setMenuRect({
      openUpward,
      top: openUpward ? undefined : rect.bottom + 4,
      bottom: openUpward ? window.innerHeight - rect.top + 4 : undefined,
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
  }

  useEffect(() => {
    if (!isOpen) return;

    updateMenuRect();

    function handlePointerDown(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateMenuRect);
    window.addEventListener("scroll", updateMenuRect, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateMenuRect);
      window.removeEventListener("scroll", updateMenuRect, true);
    };
  }, [isOpen]);

  const selectedOption = options.find((option) => String(option.value) === String(value));

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
      >
        <span className={`truncate ${selectedOption ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen &&
        menuRect &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: menuRect.top,
              bottom: menuRect.bottom,
              left: menuRect.left,
              width: menuRect.width,
            }}
            className="z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="overflow-y-auto p-1.5" style={{ maxHeight: menuRect.maxHeight }}>
              {options.map((option) => {
                const isSelected = String(option.value) === String(value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onSelect(option.value);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-slate-400 ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                  >
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${isSelected ? "border-slate-900 dark:border-white" : "border-slate-300 dark:border-slate-600"
                        }`}
                    >
                      {isSelected && <span className="h-2 w-2 rounded-full bg-slate-900 dark:bg-white" />}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
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
        <span className={`truncate ${selectedEmployee ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}>
          {selectedEmployee
            ? `${selectedEmployee.full_name}${selectedEmployee.position ? ` · ${selectedEmployee.position}` : ""}`
            : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-100 p-2 dark:border-slate-700">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                size={14}
              />
              <input
                type="text"
                autoFocus
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search employee name"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm outline-none transition focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-900 "
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5">
            {filteredEmployees.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-slate-400 dark:text-slate-500">No employees found</p>
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
                    className={`flex w-full flex-col items-start rounded-lg px-3 py-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${isSelected ? "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400" : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                  >
                    <span className="text-[13px] font-medium">{employee.full_name}</span>
                    {(employee.position || getEmployeeDepartmentCode(employee)) && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
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
