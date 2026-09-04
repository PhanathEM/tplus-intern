import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  FiCalendar as Calendar,
  FiChevronLeft as ChevronLeft,
  FiChevronRight as ChevronRight,
  FiX as X,
} from "react-icons/fi";
import { formatDate } from "../dashboard.utils";
import { formInputClass } from "./SharedControls";

// One calendar, two pickers: DatePicker for a single day (Borrow's expected
// return date) and DateRangePicker for a from/to pair (Borrow History's
// filter). Everything above the two exports is shared between them.

// "YYYY-MM-DD" to a local Date. `new Date(string)` would read the value as UTC
// and land on the previous day in negative-offset timezones, so the parts are
// split out and handed to the local constructor instead.
function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Always six rows of seven, so the popover keeps one height as you page
// through months instead of jumping between five and six weeks.
function getCalendarDays(month) {
  const first = startOfMonth(month);
  const start = new Date(first);
  start.setDate(1 - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

// ISO date strings compare correctly as plain strings, so the range checks
// never need to build Date objects.
function isBetween(value, from, to) {
  return Boolean(from && to && value > from && value < to);
}

// The panel is portalled to <body> and positioned over the trigger, so a
// scrolling container (a modal body) or an overflow-hidden ancestor can't clip
// it. That costs the automatic re-anchoring an absolute panel gets, hence the
// scroll/resize listeners below.
function useAnchoredPanel(isOpen, onDismiss) {
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event) {
      if (triggerRef.current?.contains(event.target)) return;
      if (panelRef.current?.contains(event.target)) return;
      onDismiss();
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") onDismiss();
    }
    // A fixed panel can't follow its trigger, so scrolling closes it rather
    // than leaving it stranded mid-page. Capture catches inner scrollers too.
    function handleReflow() {
      onDismiss();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleReflow, true);
    window.addEventListener("resize", handleReflow);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleReflow, true);
      window.removeEventListener("resize", handleReflow);
    };
  }, [isOpen, onDismiss]);

  return { triggerRef, panelRef };
}

function useCalendarLabels() {
  const { i18n } = useTranslation();

  const weekdays = useMemo(() => {
    // 1 Sep 2024 was a Sunday, so this walks Sun-Sat in the active language.
    const sunday = new Date(2024, 8, 1);
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + index);
      return day.toLocaleDateString(i18n.language, { weekday: "short" });
    });
  }, [i18n.language]);

  function formatLong(value) {
    const date = parseDate(value);
    if (!date) return "";
    return date.toLocaleDateString(i18n.language, { day: "2-digit", month: "short", year: "numeric" });
  }

  function formatMonth(month) {
    return month.toLocaleDateString(i18n.language, { month: "long", year: "numeric" });
  }

  return { weekdays, formatLong, formatMonth };
}

const PANEL_CLASS =
  "overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:shadow-black/40 dark:ring-slate-700";

// Roughly what a panel measures: header + month nav + weekday row + six week
// rows + footer. Only used to decide which way to open, so an estimate taken
// before the panel exists is enough - no first-render flash.
const PANEL_ESTIMATED_HEIGHT = 430;

// Fixed coordinates over the trigger. A field near the bottom of the screen has
// no room to drop a calendar below it, so the panel opens upward instead of
// running off the viewport. z-index clears the modals, which sit at z-50.
function getPanelStyle(element, align) {
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const dropUp = spaceBelow < PANEL_ESTIMATED_HEIGHT && rect.top > spaceBelow;
  const style = { position: "fixed", zIndex: 60 };

  if (dropUp) style.bottom = window.innerHeight - rect.top + 8;
  else style.top = rect.bottom + 8;

  if (align === "right") style.right = window.innerWidth - rect.right;
  else style.left = rect.left;

  return style;
}

const SECONDARY_BUTTON_CLASS =
  "inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700";

const PRIMARY_BUTTON_CLASS =
  "inline-flex h-9 items-center rounded-lg bg-[#fddd1c] px-4 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400";

function PanelHeader({ title, onClose }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
      <h3 className="text-[17px] font-bold text-slate-950 dark:text-white">{title}</h3>
      <button
        type="button"
        onClick={onClose}
        aria-label={t("Close")}
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-slate-200 leading-none text-slate-500 outline-none transition hover:border-slate-300 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800"
      >
        <X size={15} className="block" />
      </button>
    </div>
  );
}

function MonthNav({ month, onMonthChange, formatMonth }) {
  const { t } = useTranslation();
  const arrowClass =
    "grid h-7 w-7 place-items-center rounded-full text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-400 dark:hover:bg-slate-800 dark:hover:text-slate-200";

  return (
    <div className="flex items-center justify-between px-5 pt-3">
      <button
        type="button"
        onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        aria-label={t("Previous month")}
        className={arrowClass}
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{formatMonth(month)}</span>
      <button
        type="button"
        onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        aria-label={t("Next month")}
        className={arrowClass}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function CalendarGrid({ month, weekdays, days, isSelected, isInRange, onSelectDay }) {
  const today = formatDate(new Date());

  return (
    <>
      <div className="grid grid-cols-7 px-4 pt-3 text-center text-[11px] font-semibold uppercase tracking-wide">
        {weekdays.map((label, index) => (
          <span
            key={label}
            className={index === 0 ? "text-rose-500 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1 px-4 pb-4 pt-2">
        {days.map((day) => {
          const value = formatDate(day);
          const selected = isSelected(value);
          const inRange = isInRange(value);
          const isCurrentMonth = day.getMonth() === month.getMonth();

          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelectDay(value)}
              className={`mx-auto grid h-8 w-8 place-items-center text-[13px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${selected
                ? "rounded-full bg-[#fddd1c] text-slate-900"
                : inRange
                  ? "rounded-lg bg-[#fddd1c]/25 text-slate-900 dark:text-slate-100"
                  : !isCurrentMonth
                    ? "rounded-full text-slate-300 dark:text-slate-600"
                    : value === today
                      ? "rounded-full text-slate-900 ring-1 ring-inset ring-[#fddd1c] hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                      : day.getDay() === 0
                        ? "rounded-full text-rose-500 hover:bg-slate-100 dark:text-rose-400 dark:hover:bg-slate-800"
                        : "rounded-full text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
            >
              {String(day.getDate()).padStart(2, "0")}
            </button>
          );
        })}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Single date
// ---------------------------------------------------------------------------

export function DatePicker({ id, value, onChange, placeholder }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(parseDate(value) || new Date()));
  const [panelStyle, setPanelStyle] = useState(null);
  const { triggerRef, panelRef } = useAnchoredPanel(isOpen, () => setIsOpen(false));
  const { weekdays, formatLong, formatMonth } = useCalendarLabels();
  const days = useMemo(() => getCalendarDays(month), [month]);

  function handleOpen() {
    setMonth(startOfMonth(parseDate(value) || new Date()));
    setPanelStyle(getPanelStyle(triggerRef.current, "left"));
    setIsOpen(true);
  }

  // One date needs no confirm step: picking a day is the whole interaction, so
  // it applies and closes straight away.
  function handleSelectDay(day) {
    onChange(day);
    setIsOpen(false);
  }

  return (
    <div ref={triggerRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
        className={`${formInputClass} flex items-center justify-between gap-2 text-left focus-visible:ring-2 focus-visible:ring-orange-400 ${value ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"
          }`}
      >
        <span className="truncate">{value ? formatLong(value) : placeholder || t("Select a date")}</span>
        <Calendar size={15} className="shrink-0 text-slate-400 dark:text-slate-500" />
      </button>

      {isOpen &&
        panelStyle &&
        createPortal(
          <div ref={panelRef} style={panelStyle} className={`${PANEL_CLASS} w-80`}>
            <PanelHeader title={t("Date")} onClose={() => setIsOpen(false)} />

          <MonthNav month={month} onMonthChange={setMonth} formatMonth={formatMonth} />

          <CalendarGrid
            month={month}
            weekdays={weekdays}
            days={days}
            isSelected={(day) => day === value}
            isInRange={() => false}
            onSelectDay={handleSelectDay}
          />

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className={SECONDARY_BUTTON_CLASS}
            >
              {t("Clear")}
            </button>
            <button
              type="button"
              onClick={() => handleSelectDay(formatDate(new Date()))}
              className={PRIMARY_BUTTON_CLASS}
            >
              {t("Today")}
            </button>
          </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Date range
// ---------------------------------------------------------------------------

export function DateRangePicker({ from, to, onApply }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from || "");
  const [draftTo, setDraftTo] = useState(to || "");
  const [month, setMonth] = useState(() => startOfMonth(parseDate(from) || new Date()));
  const [panelStyle, setPanelStyle] = useState(null);
  const { triggerRef, panelRef } = useAnchoredPanel(isOpen, () => setIsOpen(false));
  const { weekdays, formatLong, formatMonth } = useCalendarLabels();
  const days = useMemo(() => getCalendarDays(month), [month]);

  const triggerLabel =
    from || to ? `${from ? formatLong(from) : "…"} → ${to ? formatLong(to) : "…"}` : t("All dates");

  function handleOpen() {
    // Drafts start from whatever is currently applied, so dismissing without
    // confirming leaves the table's filter untouched.
    setDraftFrom(from || "");
    setDraftTo(to || "");
    setMonth(startOfMonth(parseDate(from) || new Date()));
    setPanelStyle(getPanelStyle(triggerRef.current, "right"));
    setIsOpen(true);
  }

  function handleSelectDay(value) {
    // A complete range (or no range yet) starts a new one; otherwise this click
    // closes the range, flipping the ends if it landed before the start.
    if (!draftFrom || draftTo) {
      setDraftFrom(value);
      setDraftTo("");
      return;
    }
    if (value < draftFrom) {
      setDraftTo(draftFrom);
      setDraftFrom(value);
      return;
    }
    setDraftTo(value);
  }

  const fieldClass =
    "flex h-9 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

  return (
    <div ref={triggerRef} className="relative">
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
        className="inline-flex h-9 max-w-64 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Calendar size={14} className="shrink-0 text-slate-400 dark:text-slate-500" />
        <span className="truncate">{triggerLabel}</span>
      </button>

      {isOpen &&
        panelStyle &&
        createPortal(
          <div ref={panelRef} style={panelStyle} className={`${PANEL_CLASS} w-96`}>
            <PanelHeader title={t("Date")} onClose={() => setIsOpen(false)} />

          <div className="flex items-center gap-2 border-y border-slate-100 px-5 py-3 dark:border-slate-800">
            <span className="text-[13px] text-slate-500 dark:text-slate-400">{t("From")}</span>
            <span className={fieldClass}>{formatLong(draftFrom) || "—"}</span>
            <span className="text-[13px] text-slate-500 dark:text-slate-400">{t("To")}</span>
            <span className={fieldClass}>{formatLong(draftTo) || "—"}</span>
          </div>

          <MonthNav month={month} onMonthChange={setMonth} formatMonth={formatMonth} />

          <CalendarGrid
            month={month}
            weekdays={weekdays}
            days={days}
            isSelected={(day) => day === draftFrom || day === draftTo}
            isInRange={(day) => isBetween(day, draftFrom, draftTo)}
            onSelectDay={handleSelectDay}
          />

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setDraftFrom("");
                setDraftTo("");
              }}
              className={SECONDARY_BUTTON_CLASS}
            >
              {t("Reset")}
            </button>
            <button
              type="button"
              onClick={() => {
                onApply(draftFrom, draftTo);
                setIsOpen(false);
              }}
              className={PRIMARY_BUTTON_CLASS}
            >
              {t("Confirm")}
            </button>
          </div>
          </div>,
          document.body
        )}
    </div>
  );
}
