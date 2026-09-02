import { useTranslation } from "react-i18next";
import { FiActivity as ActivityIcon, FiBell as Bell, FiPieChart as PieChartIcon } from "react-icons/fi";
import { EmptyState } from "../../components/SharedControls";
import { DonutChart, DonutLegend } from "./charts";

const TONE_DOT_CLASS = {
  danger: "bg-rose-500",
  warning: "bg-amber-500",
};

// A distinct solid gradient per stat card — picked per label where it reads
// naturally (Recycle Bin = slate, etc.), falling back to a cycling palette
// for any card not listed here.
const CARD_GRADIENT_BY_LABEL = {
  Employees: "from-violet-500 to-purple-600",
  Departments: "from-sky-400 to-blue-600",
  Equipments: "from-amber-400 to-orange-500",
  "Currently Borrowed": "from-teal-400 to-emerald-600",
  "Borrow History": "from-indigo-400 to-indigo-600",
  "Device Replacement": "from-rose-400 to-rose-600",
  "Software License": "from-emerald-400 to-emerald-600",
  "Server Usage": "from-cyan-400 to-sky-600",
  Users: "from-fuchsia-400 to-pink-600",
  "Activity Log": "from-orange-400 to-orange-600",
  "Recycle Bin": "from-slate-500 to-slate-700",
};

const FALLBACK_CARD_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-sky-400 to-blue-600",
  "from-amber-400 to-orange-500",
  "from-teal-400 to-emerald-600",
  "from-rose-400 to-rose-600",
];

function getCardGradientClass(label, index) {
  return CARD_GRADIENT_BY_LABEL[label] || FALLBACK_CARD_GRADIENTS[index % FALLBACK_CARD_GRADIENTS.length];
}

// Administration-only pages — not useful as a "count" stat on the home
// overview, so they're left off this grid even for accounts that can see
// those pages via the sidebar.
const HOME_STAT_EXCLUDED_LABELS = ["Users", "Activity Log", "Recycle Bin"];

const ACTION_LABELS = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  approve: "Approved",
  reset_password: "Password reset",
  assign: "Assigned",
  unassign: "Unassigned",
  borrow: "Borrowed",
  return: "Returned",
};

function StatCard({ item, count, isLoading, onSelect, colorIndex }) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const hasCount = typeof count === "number";

  return (
    <button
      type="button"
      onClick={() => onSelect(item.label)}
      className={`group flex items-center gap-4 rounded-2xl bg-linear-to-br px-6 py-6 text-left shadow-sm outline-none transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${getCardGradientClass(item.label, colorIndex)}`}
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/20 text-white">
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums text-white">
          {hasCount ? count.toLocaleString() : isLoading ? "…" : "0"}
        </p>
        <p className="mt-1 text-[13px] font-medium leading-tight text-white/80">{t(item.label)}</p>
      </div>
    </button>
  );
}

function InsightPanel({ title, icon: Icon, isLoading, isEmpty, emptyMessage, children }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        {Icon && <Icon className="text-slate-400 dark:text-slate-500" size={16} />}
        <h3 className="text-[13px] font-semibold text-slate-950 dark:text-white">{title}</h3>
      </div>
      {isLoading ? (
        <p className="py-8 text-center text-[13px] text-slate-400 dark:text-slate-500">{t("Loading...")}</p>
      ) : isEmpty ? (
        <p className="py-8 text-center text-[13px] text-slate-400 dark:text-slate-500">{emptyMessage}</p>
      ) : (
        children
      )}
    </div>
  );
}

function EquipmentStatusPanel({ statusBreakdown, isLoading, t }) {
  return (
    <InsightPanel
      title={t("Equipment by Status")}
      icon={PieChartIcon}
      isLoading={isLoading}
      isEmpty={statusBreakdown.length === 0}
      emptyMessage={t("No equipment data yet.")}
    >
      <div className="flex items-center gap-5">
        <DonutChart data={statusBreakdown} />
        <div className="min-w-0 flex-1">
          <DonutLegend data={statusBreakdown} />
        </div>
      </div>
    </InsightPanel>
  );
}

function CategoryOccupancyPanel({ categoryOccupancy, isLoading, t }) {
  return (
    <InsightPanel
      title={t("Equipment In Use by Category")}
      icon={ActivityIcon}
      isLoading={isLoading}
      isEmpty={categoryOccupancy.length === 0}
      emptyMessage={t("No equipment data yet.")}
    >
      <ul className="space-y-4">
        {categoryOccupancy.map((category) => (
          <li key={category.label}>
            <div className="mb-1.5 flex items-center justify-between text-[13px]">
              <span className="font-medium text-slate-700 dark:text-slate-300">{category.label}</span>
              <span className="text-slate-400 dark:text-slate-500">
                {category.occupied} {t("of")} {category.total}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-orange-400 dark:bg-orange-500"
                style={{ width: `${category.percent}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </InsightPanel>
  );
}

function NotificationsPanel({ notifications, onOpenNotification }) {
  const { t } = useTranslation();
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h3 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Notifications")}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {notifications.length}
        </span>
      </div>
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title={t("All clear")} description={t("No alerts need your attention right now.")} />
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {notifications.slice(0, 6).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenNotification(item)}
              className="flex w-full items-start gap-3 px-5 py-3 text-left outline-none transition hover:bg-slate-50 focus-visible:bg-slate-50 dark:hover:bg-slate-800/60 dark:focus-visible:bg-slate-800/60"
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  item.unread ? TONE_DOT_CLASS[item.tone] || "bg-orange-500" : "bg-transparent"
                }`}
              />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-slate-950 dark:text-white">{item.title}</p>
                <p className="mt-0.5 truncate text-[13px] text-slate-500 dark:text-slate-400">{item.detail}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(value, t) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return t("Just now");
  if (minutes < 60) return t("m ago", { value: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t("h ago", { value: hours });
  const days = Math.round(hours / 24);
  return t("d ago", { value: days });
}

function RecentActivityPanel({ entries }) {
  const { t } = useTranslation();
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h3 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Your recent activity")}</h3>
      </div>
      {entries.length === 0 ? (
        <EmptyState
          icon={ActivityIcon}
          title={t("Nothing yet")}
          description={t("Things you add, edit, or delete will show up here.")}
        />
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {entries.slice(0, 6).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-slate-800 dark:text-slate-200">
                  <span className="font-semibold text-slate-950 dark:text-white">{t(ACTION_LABELS[entry.action] || entry.action)}</span>{" "}
                  {t(entry.module)} · {entry.entityLabel || `#${entry.entityId ?? "—"}`}
                </p>
              </div>
              <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{formatRelativeTime(entry.timestamp, t)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DashboardHomeView({
  navSections,
  stats,
  isStatsLoading,
  onSelectView,
  notifications,
  onOpenNotification,
  recentActivity,
  statusBreakdown = [],
  categoryOccupancy = [],
  isInsightsLoading = false,
}) {
  const { t } = useTranslation();
  const cards = navSections
    .flatMap((section) => section.items.flatMap((item) => (item.children?.length ? item.children : [item])))
    .filter((item) => !HOME_STAT_EXCLUDED_LABELS.includes(item.label));

  // A card sitting at 0 is just noise — only keep ones with something to
  // show. Shown as-is while still loading so the grid doesn't flash empty
  // before the real counts arrive.
  const visibleCards = isStatsLoading
    ? cards
    : cards.filter((item) => {
        const count = stats[item.label];
        return typeof count === "number" && count > 0;
      });

  // These two panels are built from equipment data specifically — only
  // worth showing to accounts that actually have that page, so a
  // viewer-only account doesn't see permanently-empty charts.
  const hasEquipmentAccess = cards.some((item) => item.label === "Equipments");

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {cards.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <EmptyState
            icon={ActivityIcon}
            title={t("No pages assigned")}
            description={t("Ask an admin to add permissions to this account.")}
          />
        </div>
      ) : visibleCards.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {visibleCards.map((item, index) => (
            <StatCard
              key={item.label}
              item={item}
              count={stats[item.label]}
              isLoading={isStatsLoading}
              onSelect={onSelectView}
              colorIndex={index}
            />
          ))}
        </div>
      ) : null}

      {hasEquipmentAccess && (
        <div className="grid gap-4 lg:grid-cols-2">
          <EquipmentStatusPanel statusBreakdown={statusBreakdown} isLoading={isInsightsLoading} t={t} />
          <CategoryOccupancyPanel categoryOccupancy={categoryOccupancy} isLoading={isInsightsLoading} t={t} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <NotificationsPanel notifications={notifications} onOpenNotification={onOpenNotification} />
        <RecentActivityPanel entries={recentActivity} />
      </div>
    </div>
  );
}
