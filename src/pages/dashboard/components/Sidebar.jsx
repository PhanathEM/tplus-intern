import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { FiChevronDown as ChevronDown } from "react-icons/fi";
import { TbLayoutSidebar } from "react-icons/tb";
import tplusLogo from "../../../assets/tplus-logo.png";
import { navSections } from "../dashboard.config";
import { getVisibleNavSections } from "../../../lib/permissions";

function getBadgeConfig(badges, label, fallbackBadge) {
  const badge = badges?.[label] ?? fallbackBadge;
  if (!badge) return null;
  return typeof badge === "object" ? badge : { value: badge, tone: "default" };
}

function getBadgeClass(tone) {
  if (tone === "danger") return "bg-rose-500 text-white";
  if (tone === "warning") return "bg-amber-400 text-slate-950 dark:bg-amber-500 dark:text-slate-950";
  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
}

// Rendered into document.body via a portal instead of positioned inside the
// sidebar's own DOM — the sidebar's nav list scrolls (overflow-y-auto, which
// clips overflow-x too), so a tooltip positioned as a normal descendant gets
// cut off right at the sidebar's edge. Measuring the trigger's rect on
// hover and portaling out escapes that entirely.
function HoverTooltip({ label, rect }) {
  if (!rect) return null;

  const style = {
    top: rect.top + rect.height / 2,
    left: rect.right + 12,
    transform: "translateY(-50%)",
  };

  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-100 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg dark:bg-slate-700"
      style={style}
    >
      {label}
      <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-900 dark:border-r-slate-700" />
    </div>,
    document.body
  );
}

export function SidebarNavigation({ collapsed = false, activeView, onSelect, user, badges }) {
  const { t } = useTranslation();
  const [expandedLabels, setExpandedLabels] = useState(() => new Set());
  const [hoveredTooltip, setHoveredTooltip] = useState(null);

  const visibleSections = getVisibleNavSections(user, navSections);

  function showTooltip(label, el) {
    if (!collapsed || !el) return;
    setHoveredTooltip({ label, rect: el.getBoundingClientRect() });
  }

  function hideTooltip() {
    setHoveredTooltip(null);
  }

  return (
    <nav className={`scrollbar-thin flex-1 overflow-y-auto py-4 ${collapsed ? "px-3" : "px-4"}`}>
      {visibleSections.map((section, sectionIdx) => (
        <div key={section.label} className={sectionIdx === 0 ? "" : "mt-2"}>
          <div className="space-y-2">
            {section.items.map((item) => {
              const Icon = item.icon;
              const hasChildren = Boolean(item.children?.length);
              const isChildActive = hasChildren && item.children.some((child) => child.label === activeView);
              const isActive = item.label === activeView || isChildActive;
              const isExpanded = expandedLabels.has(item.label) || isChildActive;
              const badge = getBadgeConfig(badges, item.label, item.badge);

              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => {
                      if (hasChildren) {
                        setExpandedLabels((current) => {
                          const next = new Set(current);
                          if (next.has(item.label)) {
                            next.delete(item.label);
                          } else {
                            next.add(item.label);
                          }
                          return next;
                        });
                        return;
                      }
                      onSelect(item.label);
                    }}
                    onMouseEnter={(e) => showTooltip(t(item.label), e.currentTarget)}
                    onMouseLeave={hideTooltip}
                    onFocus={(e) => showTooltip(t(item.label), e.currentTarget)}
                    onBlur={hideTooltip}
                    aria-label={collapsed ? t(item.label) : undefined}
                    className={`group relative flex w-full items-center rounded-lg py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${collapsed ? "justify-center px-0" : "gap-3 px-3 text-left"
                      } ${isActive
                        ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                      }`}
                  >
                    <Icon className="shrink-0 text-[17px]" />
                    <span className={collapsed ? "sr-only" : "flex-1 truncate"}>{t(item.label)}</span>
                    {!collapsed && hasChildren && (
                      <ChevronDown
                        size={14}
                        className={`shrink-0 text-slate-500 transition-transform dark:text-slate-400 ${isExpanded ? "" : "-rotate-90"}`}
                      />
                    )}
                    {!collapsed && !hasChildren && badge && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getBadgeClass(badge.tone)}`}>
                        {badge.value}
                      </span>
                    )}
                    {collapsed && !hasChildren && badge && (
                      <span className={`absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${getBadgeClass(badge.tone)}`}>
                        {badge.value}
                      </span>
                    )}
                  </button>

                  {!collapsed && hasChildren && isExpanded && (
                    <div className="mt-0.5 space-y-0.5 pl-8">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildItemActive = child.label === activeView;
                        return (
                          <button
                            key={child.label}
                            type="button"
                            onClick={() => onSelect(child.label)}
                            className={`group relative flex w-full items-center gap-2.5 rounded-lg py-2 pl-2 pr-3 text-left text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${isChildItemActive
                              ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                              }`}
                          >
                            <ChildIcon className="shrink-0 text-sm" />
                            <span className="flex-1 truncate">{t(child.label)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {collapsed && hoveredTooltip && <HoverTooltip label={hoveredTooltip.label} rect={hoveredTooltip.rect} />}
    </nav>
  );
}

export function SidebarBrand({ collapsed, onToggleCollapse }) {
  const { t } = useTranslation();
  const [toggleTooltipRect, setToggleTooltipRect] = useState(null);
  const toggleLabel = collapsed ? t("Expand sidebar") : t("Collapse sidebar");

  return (
    <div
      className={`flex shrink-0 items-center ${collapsed ? "h-auto flex-col justify-center gap-2 px-3 py-3" : "h-16 justify-between px-4"
        }`}
    >
      <div className={`flex min-w-0 items-center ${collapsed ? "" : "gap-3"}`}>
        <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <img
            src={tplusLogo}
            alt="TPLUS"
            className="h-full w-full object-cover"
          />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[15px] font-semibold leading-tight text-slate-900 dark:text-white">TPLUS</p>
            <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">{t("Management System")}</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleCollapse}
        onMouseEnter={(e) => setToggleTooltipRect(e.currentTarget.getBoundingClientRect())}
        onMouseLeave={() => setToggleTooltipRect(null)}
        onFocus={(e) => setToggleTooltipRect(e.currentTarget.getBoundingClientRect())}
        onBlur={() => setToggleTooltipRect(null)}
        className="hidden shrink-0 rounded-md p-1.5 text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-offset-slate-900 xl:grid xl:place-items-center"
        aria-label={toggleLabel}
      >
        <TbLayoutSidebar size={19} />
      </button>
      {toggleTooltipRect && <HoverTooltip label={toggleLabel} rect={toggleTooltipRect} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
