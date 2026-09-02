import { useTranslation } from "react-i18next";
import { FiBox as Box } from "react-icons/fi";
import { EmptyState } from "../../components/SharedControls";
import { UsersView } from "../users/UserViews";
import { ActivityLogView } from "../activity/ActivityViews";
import { RecycleBinView } from "../recycle-bin/RecycleBinViews";

const TABS = [
  { key: "Users", canManageKey: "canManageUsers" },
  { key: "Activity Log", canManageKey: "canManageActivityLog" },
  { key: "Recycle Bin", canManageKey: "canManageRecycleBin" },
];

function NotAvailable({ t }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <EmptyState icon={Box} title={t("Not available")} description={t("This page is admin-only.")} />
    </div>
  );
}

// One page hosting Users, Activity Log, and Recycle Bin as tabs instead of
// three separate sidebar entries — each tab still only renders once its own
// permission (canManageUsers/canManageActivityLog/canManageRecycleBin) is
// granted, same guard each used to have on its own.
export function SettingsView({
  activeTab,
  onTabChange,
  canManageUsers,
  canManageActivityLog,
  canManageRecycleBin,
  usersProps,
  activityLogProps,
  recycleBinProps,
}) {
  const { t } = useTranslation();
  const canManageByTab = { Users: canManageUsers, "Activity Log": canManageActivityLog, "Recycle Bin": canManageRecycleBin };

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
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange(tab.key)}
                  className={`relative rounded-t-lg border px-5 py-2 text-[13px] font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${isActive
                    ? "z-10 border-slate-200 border-b-transparent bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                    }`}
                >
                  {t(tab.key)}
                </button>
              );
            })}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>

      {!canManageByTab[activeTab] ? (
        <div className="px-4 pb-6 sm:px-6 lg:px-8">
          <NotAvailable t={t} />
        </div>
      ) : activeTab === "Users" ? (
        <UsersView {...usersProps} />
      ) : activeTab === "Activity Log" ? (
        <ActivityLogView {...activityLogProps} />
      ) : (
        <RecycleBinView {...recycleBinProps} />
      )}
    </div>
  );
}
