import { useState } from "react";
import { FiChevronDown as ChevronDown } from "react-icons/fi";
import { TbLayoutSidebar } from "react-icons/tb";
import tplusLogo from "../../../assets/tplus-logo.png";
import { navSections } from "../dashboard.config";
import { canAccessNavItem } from "../../../lib/permissions";

export function SidebarNavigation({ collapsed = false, activeView, onSelect, user }) {
  const [expandedLabels, setExpandedLabels] = useState(() => new Set());

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items
        .map((item) => {
          if (!item.children?.length) return item;

          const children = item.children.filter((child) => canAccessNavItem(user, child));
          return children.length > 0 ? { ...item, children } : null;
        })
        .filter((item) => item && canAccessNavItem(user, item)),
    }))
    .filter((section) => section.items.length > 0);

return (
    <nav className={`scrollbar-thin-dark flex-1 overflow-y-auto py-4 ${collapsed ? "px-3" : "px-4"}`}>
      {visibleSections.map((section, sectionIdx) => (
        <div key={section.label} className={sectionIdx === 0 ? "" : "mt-5"}>
          {!collapsed ? (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {section.label}
            </p>
          ) : (
            sectionIdx !== 0 && <div className="mx-2 mb-3 border-t border-white/10" />
          )}

<div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const hasChildren = Boolean(item.children?.length);
              const isChildActive = hasChildren && item.children.some((child) => child.label === activeView);
              const isActive = item.label === activeView || isChildActive;
              const isExpanded = expandedLabels.has(item.label) || isChildActive;

return (
                <div
                  key={item.label}
                  onMouseEnter={() => {
                    if (hasChildren && !collapsed) {
                      setExpandedLabels((current) => new Set(current).add(item.label));
                    }
                  }}
                  onMouseLeave={() => {
                    if (!hasChildren || collapsed) return;
                    if (isChildActive) return;
                    setExpandedLabels((current) => {
                      const next = new Set(current);
                      next.delete(item.label);
                      return next;
                    });
                  }}
                >
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
                    title={collapsed ? item.label : undefined}
                    className={`group relative flex w-full items-center rounded-lg py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${collapsed ? "justify-center px-0" : "gap-3 px-3 text-left"
                      } ${isActive
                        ? "bg-orange-500/15 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                      }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-0.75 -translate-y-1/2 rounded-r-full bg-orange-400" />
                    )}
                    <Icon
                      className={`shrink-0 text-[17px] ${isActive ? "text-orange-300" : ""}`}
                    />
                    <span className={collapsed ? "sr-only" : "flex-1 truncate"}>{item.label}</span>
                    {!collapsed && hasChildren && (
                      <ChevronDown
                        size={14}
                        className={`shrink-0 text-slate-500 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                      />
                    )}
                    {!collapsed && !hasChildren && item.badge && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-slate-200">
                        {item.badge}
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
                            className={`group relative flex w-full items-center gap-2.5 rounded-lg py-2 pl-2 pr-3 text-left text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${isChildItemActive
                              ? "bg-orange-500/15 text-white"
                              : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                              }`}
                          >
                            {isChildItemActive && (
                              <span className="absolute left-0 top-1/2 h-4 w-0.75 -translate-y-1/2 rounded-r-full bg-orange-400" />
                            )}
                            <ChildIcon
                              className={`shrink-0 text-sm ${isChildItemActive ? "text-orange-300" : ""}`}
                            />
                            <span className="flex-1 truncate">{child.label}</span>
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
    </nav>
  );
}

export function SidebarBrand({ collapsed, onToggleCollapse }) {
  return (
    <div
      className={`flex shrink-0 items-center border-b border-white/10 ${collapsed ? "h-auto flex-col justify-center gap-2 px-3 py-3" : "h-16 justify-between px-4"
        }`}
    >
      <div className={`flex min-w-0 items-center ${collapsed ? "" : "gap-3"}`}>
        <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10">
          <img
            src={tplusLogo}
            alt="TPLUS"
            className="h-full w-full object-cover"
          />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[15px] font-semibold leading-tight text-white">TPLUS</p>
            <p className="text-[11px] leading-tight text-slate-400">Management System</p>
          </div>
        )}
      </div>

<button
        type="button"
        onClick={onToggleCollapse}
        className="hidden shrink-0 rounded-md p-1.5 text-slate-400 outline-none transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 xl:grid xl:place-items-center"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <TbLayoutSidebar size={19} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
