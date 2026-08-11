import { useEffect } from "react";
import {
  FiAlertTriangle as AlertTriangle,
  FiPlusCircle as PlusCircle,
  FiRefreshCw as RefreshCw,
  FiSliders as Sliders,
  FiX as X,
} from "react-icons/fi";
import { EmptyState, FormField, formInputClass } from "../../components/SharedControls";

function BooleanPill({ value }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        value ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

export function StatusesView({
  statuses,
  isLoading,
  error,
  onRetry,
  showInactive,
  onToggleShowInactive,
  onAddNew,
  onEdit,
  onDelete,
  canManage = true,
}) {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">Equipment statuses</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500">
                {statuses.length} status{statuses.length === 1 ? "" : "es"}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => onToggleShowInactive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-orange-400"
              />
              Show hidden
            </label>
            <button
              type="button"
              onClick={onRetry}
              disabled={isLoading}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
            {canManage && (
              <button
                type="button"
                onClick={onAddNew}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <PlusCircle size={15} />
                Add Status
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500">Loading statuses...</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700">Couldn&apos;t load statuses</p>
            <p className="text-xs text-slate-500">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        ) : statuses.length === 0 ? (
          <EmptyState icon={Sliders} title="No statuses found" description="Equipment statuses will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[13px]">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Status Name</th>
                  <th className="px-5 py-3 font-semibold">Description</th>
                  <th className="px-5 py-3 font-semibold">Has Owner</th>
                  <th className="px-5 py-3 font-semibold">Assignable</th>
                  <th className="px-5 py-3 font-semibold">Borrowable</th>
                  <th className="px-5 py-3 font-semibold">Sort</th>
                  <th className="px-5 py-3 font-semibold">In Use</th>
                  <th className="px-5 py-3 font-semibold">Active</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {statuses.map((status) => (
                  <tr key={status.status_id} className={`transition hover:bg-slate-50/70 ${status.is_active ? "" : "opacity-60"}`}>
                    <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-950">
                      {status.status_name}
                    </td>
                    <td className="max-w-72 truncate px-5 py-3.5 text-slate-600" title={status.description || ""}>
                      {status.description || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <BooleanPill value={Boolean(status.has_owner)} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <BooleanPill value={Boolean(status.is_assignable)} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <BooleanPill value={Boolean(status.is_borrowable)} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{status.sort_order ?? "—"}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{status.equipment_count ?? 0}</td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          status.is_active ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {status.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      {canManage && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(status)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(status)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 outline-none transition hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function StatusFormModal({ isOpen, mode, values, onChange, onSubmit, onClose, isSubmitting, error }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const isEdit = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">{isEdit ? "Edit status" : "Add status"}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {isEdit ? "Update this status's details." : "Create a new equipment status."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField label="Status Name *" htmlFor="status-name">
                  <input
                    id="status-name"
                    type="text"
                    required
                    autoComplete="off"
                    value={values.status_name}
                    onChange={(e) => onChange("status_name", e.target.value)}
                    className={formInputClass}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField label="Description" htmlFor="status-description">
                  <textarea
                    id="status-description"
                    rows={2}
                    value={values.description}
                    onChange={(e) => onChange("description", e.target.value)}
                    className={`${formInputClass} h-auto min-h-16 py-2`}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

              <FormField label="Sort Order" htmlFor="status-sort-order">
                <input
                  id="status-sort-order"
                  type="number"
                  value={values.sort_order}
                  onChange={(e) => onChange("sort_order", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="Visibility" htmlFor="status-is-active">
                <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                  <input
                    id="status-is-active"
                    type="checkbox"
                    checked={values.is_active}
                    onChange={(e) => onChange("is_active", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-orange-400"
                    disabled={isSubmitting}
                  />
                  {values.is_active ? "Active (shown in dropdowns)" : "Hidden"}
                </label>
              </FormField>

              <div className="sm:col-span-2 space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={values.has_owner}
                    onChange={(e) => onChange("has_owner", e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-orange-400"
                    disabled={isSubmitting}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">Has owner</span>
                    <span className="block text-xs text-slate-500">
                      Devices with this status normally belong to a person (e.g. "Working/Using").
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={values.is_assignable}
                    onChange={(e) => onChange("is_assignable", e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-orange-400"
                    disabled={isSubmitting}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">Assignable</span>
                    <span className="block text-xs text-slate-500">
                      Devices with this status can be given to a person on the Assign page. Turn this off for
                      fixed/installed items like wall-mounted cameras.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={values.is_borrowable}
                    onChange={(e) => onChange("is_borrowable", e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-orange-400"
                    disabled={isSubmitting}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">Borrowable</span>
                    <span className="block text-xs text-slate-500">
                      Devices with this status can be lent out temporarily.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
