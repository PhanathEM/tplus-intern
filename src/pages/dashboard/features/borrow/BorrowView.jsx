import { useTranslation } from "react-i18next";
import { FiBox as Box } from "react-icons/fi";
import { EmptyState } from "../../components/SharedControls";
import { BorrowHistoryView, CurrentBorrowsView } from "./BorrowViews";
import { BorrowFormView } from "./BorrowFormView";

const TABS = ["Borrow", "Currently Borrowed", "Borrow History"];

function NotAvailable({ t }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <EmptyState icon={Box} title={t("Not available")} description={t("You don't have access to this.")} />
    </div>
  );
}

// One page hosting Currently Borrowed and Borrow History as tabs instead of
// two separate sidebar entries — each tab still only renders once its own
// permission is granted, same guard each had on its own.
export function BorrowView({
  activeTab,
  onTabChange,
  canBorrow,
  canViewCurrentBorrows,
  canViewBorrowHistory,
  borrowFormProps,
  currentBorrowsProps,
  borrowHistoryProps,
}) {
  const { t } = useTranslation();
  const canViewByTab = {
    Borrow: canBorrow,
    "Currently Borrowed": canViewCurrentBorrows,
    "Borrow History": canViewBorrowHistory,
  };

  return (
    <div className="space-y-6">
      <div className="px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          {/* The divider line sits behind the tabs (z-10 on the active one)
              instead of being a border that needs to color-match or overlap
              via negative margin — the active tab's opaque background just
              paints over the line naturally wherever they overlap. */}
          <div className="relative inline-flex items-stretch gap-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onTabChange(tab)}
                  className={`relative rounded-t-lg border px-5 py-2 text-[13px] font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${isActive
                    ? "z-10 -mb-px border-slate-200 border-b-transparent bg-white text-slate-900 dark:border-slate-800 dark:border-b-transparent dark:bg-slate-900 dark:text-white"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                    }`}
                >
                  {t(tab)}
                </button>
              );
            })}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>

      {!canViewByTab[activeTab] ? (
        <div className="px-4 pb-6 sm:px-6 lg:px-8">
          <NotAvailable t={t} />
        </div>
      ) : activeTab === "Borrow" ? (
        <BorrowFormView {...borrowFormProps} />
      ) : activeTab === "Currently Borrowed" ? (
        <CurrentBorrowsView {...currentBorrowsProps} />
      ) : (
        <BorrowHistoryView {...borrowHistoryProps} />
      )}
    </div>
  );
}
