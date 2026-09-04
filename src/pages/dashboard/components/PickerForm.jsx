import { useTranslation } from "react-i18next";
import { FiBox as Box, FiCheck as Check, FiSearch as Search, FiUser as UserIcon, FiX as X } from "react-icons/fi";
import { translateLabel } from "../../../lib/i18nLabel";

// Shared by the Assign and Borrow pages — both are "pick a device, pick an
// employee, confirm" forms, so the pickers, result rows and summary slots live
// here rather than being written twice.

// The step badge doubles as the progress indicator — it flips to a green check
// once that step has a selection, so the form shows how far along you are
// without needing a separate stepper above it. Exported on its own because the
// Summary panel is the last step but isn't a SectionCard.
export function StepBadge({ step, isComplete }) {
  return (
    <div
      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition ${isComplete
        ? "bg-emerald-500 text-white"
        : "bg-[#fddd1c] text-slate-900"
        }`}
    >
      {isComplete ? <Check size={14} className="block" /> : step}
    </div>
  );
}

export function SectionCard({ step, title, description, isComplete, children }) {
  return (
    <div className="rounded-xl bg-white py-5 dark:bg-slate-900">
      <div className="mb-4 flex items-start gap-3">
        <StepBadge step={step} isComplete={isComplete} />
        <div>
          <h3 className="text-[14px] font-semibold text-slate-950 dark:text-white">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// Same shape for both pickers, so the two steps read as a matched pair.
export function PickerSearch({ value, onChange, placeholder }) {
  return (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={15} />
      <input
        type="text"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm outline-none transition focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        >
          <X size={13} className="block" />
        </button>
      )}
    </div>
  );
}

// One scroll box for every list so loading / error / empty / results all look
// the same in either step.
export function PickerList({ isLoading, error, isEmpty, emptyText, children, t }) {
  return (
    <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-800">
      {isLoading ? (
        <p className="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500">{t("Searching...")}</p>
      ) : error ? (
        <p className="px-3 py-6 text-center text-xs text-rose-500 dark:text-rose-400">{error}</p>
      ) : isEmpty ? (
        <p className="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500">{emptyText}</p>
      ) : (
        <div className="space-y-0.5 p-1">{children}</div>
      )}
    </div>
  );
}

const RESULT_ROW_CLASS =
  "flex w-full items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left outline-none transition hover:border-slate-200 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 dark:hover:border-slate-700 dark:hover:bg-slate-800";

export function DeviceResultRow({ device, onSelect }) {
  const { t, i18n } = useTranslation();

  return (
    <button type="button" onClick={() => onSelect(device)} className={RESULT_ROW_CLASS}>
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <Box size={14} className="block" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-slate-900 dark:text-slate-100">
            {device.display_name || device.asset_code || "—"}
          </span>
          <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
            {[device.category_name, device.asset_code, device.location].filter(Boolean).join(" · ") || "—"}
          </span>
        </span>
      </div>
      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {device.status ? translateLabel(t, i18n, device.status) : "—"}
      </span>
    </button>
  );
}

export function EmployeeResultRow({ employee, isSelected, onSelect }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => onSelect(employee)}
      className={`${RESULT_ROW_CLASS} ${isSelected ? "border-orange-200 bg-orange-50 dark:border-orange-800/60 dark:bg-orange-500/10" : ""}`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <UserIcon size={14} className="block" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-slate-900 dark:text-slate-100">{employee.full_name}</span>
          <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
            {[employee.department_name || employee.department_code, employee.location].filter(Boolean).join(" · ") || "—"}
          </span>
        </span>
      </div>
      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {t("device_count", { count: employee.current_equipment_count ?? 0 })}
      </span>
    </button>
  );
}

// A made choice, shown in place of its picker with a way back out.
export function SelectedCard({ icon: Icon, title, detail, onClear, t }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50 px-3.5 py-2.5 dark:border-orange-800/60 dark:bg-orange-500/10">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-orange-600 dark:bg-slate-900 dark:text-orange-400">
          <Icon size={14} className="block" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{detail || "—"}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
      >
        <X size={13} className="block" />
        {t("Change")}
      </button>
    </div>
  );
}

// One line of the summary panel: filled once its step is done, otherwise a
// dashed placeholder naming what's still needed.
export function SummarySlot({ icon: Icon, label, title, placeholder }) {
  if (!title) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-slate-200 px-3 py-2.5 dark:border-slate-700">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-50 text-slate-300 dark:bg-slate-800 dark:text-slate-600">
          <Icon size={14} className="block" />
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">{placeholder}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        <Icon size={14} className="block" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
        <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      </div>
    </div>
  );
}
