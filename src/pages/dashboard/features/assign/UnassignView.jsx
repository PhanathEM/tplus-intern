import { useTranslation } from "react-i18next";
import {
  FiAlertTriangle as AlertTriangle,
  FiBox as Box,
  FiCheckCircle as CheckCircle,
  FiRefreshCw as RefreshCw,
  FiSearch as Search,
  FiUser as UserIcon,
  FiUserX as UserX,
  FiX as X,
} from "react-icons/fi";
import { ConfirmDialog, EmptyState, Pagination } from "../../components/SharedControls";
import { getEquipmentDisplayName } from "../../dashboard.utils";
import { translateLabel } from "../../../../lib/i18nLabel";

// A list rather than a picker form: unassigning is a one-click action per
// device, so searching the things people currently hold and acting on a row is
// faster than a two-step pick-then-confirm flow.
export function UnassignView({
  items = [],
  totalCount,
  isLoading,
  error,
  onRetry,
  search,
  onSearchChange,
  page,
  pageCount,
  onPageChange,
  target,
  isUnassigning,
  unassignError,
  successMessage,
  onOpenUnassign,
  onCloseUnassign,
  onConfirmUnassign,
}) {
  const { t, i18n } = useTranslation();

  return (
    <div className="px-4 pb-6 sm:px-6 lg:px-8">
      <div className="rounded-xl bg-white dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Assigned equipment")}</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                {t("item_count", { count: totalCount })}
              </p>
            )}
          </div>

          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
            <input
              type="text"
              autoComplete="off"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t("Search...")}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label={t("Clear search")}
                className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              >
                <X size={13} className="block" />
              </button>
            )}
          </div>
        </div>

        {successMessage && (
          <div className="mx-5 mb-3 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle size={16} className="mt-0.5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">{t("Loading...")}</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle size={18} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
            >
              <RefreshCw size={13} />
              {t("Retry")}
            </button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Box}
            title={t("Nothing is assigned")}
            description={search ? t("No equipment matches", { term: search }) : t("Assigned equipment will appear here.")}
          />
        ) : (
          <>
            <div className="divide-y divide-slate-50 px-2 dark:divide-slate-800/60">
              {items.map((item) => (
                <div
                  key={item.equipment_id}
                  className="group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <Box size={14} className="block" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-slate-900 dark:text-slate-100">
                        {getEquipmentDisplayName(item)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                        {[item.category_name || item.category, item.asset_code, item.status && translateLabel(t, i18n, item.status)]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <div className="hidden min-w-0 items-center gap-2 sm:flex">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <UserIcon size={13} className="block" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-slate-800 dark:text-slate-200">
                          {item.owner_name || "—"}
                        </span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                          {[item.owner_department, item.location].filter(Boolean).join(" · ") || "—"}
                        </span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenUnassign(item)}
                      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-rose-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                    >
                      <UserX size={13} className="block" />
                      {t("Unassign")}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {pageCount > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
                <Pagination currentPage={page} pageCount={pageCount} onPageChange={onPageChange} />
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(target)}
        title={t("Unassign this equipment?")}
        message={
          target
            ? t("unassign_confirm", {
              name: getEquipmentDisplayName(target),
              owner: target.owner_name || t("its owner"),
            })
            : ""
        }
        confirmLabel={t("Unassign")}
        confirmingLabel={t("Unassigning...")}
        isConfirming={isUnassigning}
        error={unassignError}
        onCancel={onCloseUnassign}
        onConfirm={onConfirmUnassign}
      />
    </div>
  );
}
