import { useEffect, useRef, useState } from "react";
import { canAccessDashboardView } from "../../../lib/permissions";
import { navItemsByLabel } from "../dashboard.config";
import {
  DASHBOARD_DEFAULT_VIEW,
  getDashboardTitle,
  getDashboardViewFromPath,
  getInitialDashboardView,
  syncDashboardPath,
} from "../dashboard.routes";

// Owns which dashboard view is active and keeps it in sync with the URL/title.
// Does NOT know about any individual feature's loading state — the
// composition root (dashboard.jsx) is responsible for resetting the
// entering feature via `selectViewRef`, since that needs every feature
// hook's `resetForEntry`, which this hook has no reason to depend on.
export function useDashboardRouting({ user, accessibleDashboardViews, firstAccessibleDashboardView, onSelectView }) {
  const initialView = getInitialDashboardView();
  const [activeView, setActiveViewState] = useState(initialView);
  const hasActiveViewAccess = accessibleDashboardViews.includes(activeView);

  // `onSelectView` closes over this render's resetMap/activeView, so the
  // effects below (which fire outside of React's render pass) always need
  // the latest version — kept in a ref owned entirely by this hook.
  const onSelectViewRef = useRef(onSelectView);
  useEffect(() => {
    onSelectViewRef.current = onSelectView;
  });

  function setActiveView(label, { updateUrl = true } = {}) {
    if (!navItemsByLabel[label]) return false;
    if (!canAccessDashboardView(user, label, navItemsByLabel)) return false;

    if (updateUrl) {
      syncDashboardPath(label);
    }
    setActiveViewState(label);
    return true;
  }

  useEffect(() => {
    if (hasActiveViewAccess || !firstAccessibleDashboardView) return;
    onSelectViewRef.current?.(firstAccessibleDashboardView);
  }, [firstAccessibleDashboardView, hasActiveViewAccess]);

  useEffect(() => {
    document.title = getDashboardTitle(activeView);
    syncDashboardPath(activeView, "replace");
  }, [activeView]);

  useEffect(() => {
    function handlePopState() {
      const view = getDashboardViewFromPath(window.location.pathname) || DASHBOARD_DEFAULT_VIEW;
      onSelectViewRef.current?.(view, { updateUrl: false });
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return {
    initialView,
    activeView,
    hasActiveViewAccess,
    setActiveView,
  };
}
