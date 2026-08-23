import { FiActivity as ActivityIcon, FiBell as Bell } from "react-icons/fi";
import { EmptyState } from "../../components/SharedControls";

const TONE_DOT_CLASS = {
  danger: "bg-rose-500",
  warning: "bg-amber-500",
};

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

const CARD_COLORS = [
  { bg: "bg-indigo-950", text: "text-indigo-600" },
  { bg: "bg-emerald-500", text: "text-emerald-600" },
  { bg: "bg-sky-500", text: "text-sky-600" },
  { bg: "bg-amber-400", text: "text-amber-600" },
  { bg: "bg-pink-500", text: "text-pink-600" },
  { bg: "bg-violet-500", text: "text-violet-600" },
  { bg: "bg-rose-500", text: "text-rose-600" },
  { bg: "bg-teal-500", text: "text-teal-600" },
  { bg: "bg-fuchsia-500", text: "text-fuchsia-600" },
  { bg: "bg-blue-500", text: "text-blue-600" },
];

function StatCard({ item, count, isLoading, onSelect, colorIndex }) {
  const Icon = item.icon;
  const color = CARD_COLORS[colorIndex % CARD_COLORS.length];
  const hasCount = typeof count === "number" && count > 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(item.label)}
      className="group flex items-center gap-5 rounded-2xl border border-slate-200 bg-white px-6 py-6 text-left outline-none transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/30 dark:focus-visible:ring-offset-slate-900"
    >
      <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-xl ${color.bg} text-white`}>
        <Icon size={30} />
      </div>
      <div className="min-w-0">
        <p className={`text-[15px] font-medium leading-tight ${color.text} dark:brightness-125`}>{item.label}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-slate-950 dark:text-white">
          {hasCount ? count.toLocaleString() : isLoading ? "…" : "—"}
        </p>
      </div>
    </button>
  );
}

function NotificationsPanel({ notifications, onOpenNotification }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h3 className="text-[15px] font-semibold text-slate-950 dark:text-white">Notifications</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {notifications.length}
        </span>
      </div>
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="All clear" description="No alerts need your attention right now." />
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

function formatRelativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function RecentActivityPanel({ entries }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h3 className="text-[15px] font-semibold text-slate-950 dark:text-white">Your recent activity</h3>
      </div>
      {entries.length === 0 ? (
        <EmptyState
          icon={ActivityIcon}
          title="Nothing yet"
          description="Things you add, edit, or delete will show up here."
        />
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {entries.slice(0, 6).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-slate-800 dark:text-slate-200">
                  <span className="font-semibold text-slate-950 dark:text-white">{ACTION_LABELS[entry.action] || entry.action}</span>{" "}
                  {entry.module} · {entry.entityLabel || `#${entry.entityId ?? "—"}`}
                </p>
              </div>
              <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{formatRelativeTime(entry.timestamp)}</span>
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
}) {
  const cards = navSections.flatMap((section) =>
    section.items.flatMap((item) => (item.children?.length ? item.children : [item]))
  );

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {cards.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <EmptyState
            icon={ActivityIcon}
            title="No pages assigned"
            description="Ask an admin to add permissions to this account."
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {cards.map((item, index) => (
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
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <NotificationsPanel notifications={notifications} onOpenNotification={onOpenNotification} />
        <RecentActivityPanel entries={recentActivity} />
      </div>
    </div>
  );
}
