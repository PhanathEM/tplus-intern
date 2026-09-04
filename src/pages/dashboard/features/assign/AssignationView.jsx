import { useTranslation } from "react-i18next";
import { AssignEquipmentView } from "./AssignView";
import { UnassignView } from "./UnassignView";

const TABS = ["Assign", "Unassign"];

// Two halves of the same job on one page: hand a device out, or take it back.
// Both were previously only reachable as row actions on the Equipments table.
export function AssignationView({ activeTab, onTabChange, assignProps, unassignProps }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="sticky top-14 z-20 bg-white px-4 pt-6 dark:bg-slate-950 sm:px-6 lg:px-8">
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
                    ? "z-10 border-slate-200 border-b-transparent bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
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

      {activeTab === "Assign" ? <AssignEquipmentView {...assignProps} /> : <UnassignView {...unassignProps} />}
    </div>
  );
}
