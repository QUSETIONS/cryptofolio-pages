(function initOrchestratorViewRoutesModule() {
  function createViewRoutes(deps) {
    const {
      settings,
      elements,
      tr,
      saveSettings,
      applyRouteView,
      resolveRouteFromHash,
      validRoutes,
      defaultRoute,
      updateRouteDocumentTitle,
      onRouteEntered
    } = deps;

    function applyNavCollapsed(collapsed) {
      settings.navCollapsed = Boolean(collapsed);
      elements.appShell?.classList.toggle("nav-collapsed", settings.navCollapsed);
      if (elements.navCollapseBtn) {
        elements.navCollapseBtn.setAttribute("aria-expanded", String(!settings.navCollapsed));
        elements.navCollapseBtn.title = tr("button.navToggle");
      }
    }

    function closeMobileNav() {
      elements.appShell?.classList.remove("nav-open-mobile");
      elements.sideNavOverlay?.classList.add("hidden");
    }

    function toggleNavigationLayout() {
      const isMobile = window.matchMedia("(max-width: 980px)").matches;
      if (isMobile) {
        const isOpen = elements.appShell?.classList.contains("nav-open-mobile");
        elements.appShell?.classList.toggle("nav-open-mobile", !isOpen);
        elements.sideNavOverlay?.classList.toggle("hidden", isOpen);
        return;
      }
      applyNavCollapsed(!settings.navCollapsed);
      saveSettings();
    }

    function applyRoute(route) {
      const nextRoute = applyRouteView(route, validRoutes, defaultRoute, elements.routeLinks, ".view-section");
      updateRouteDocumentTitle(nextRoute);
      return nextRoute;
    }

    function handleHashRouteChange() {
      const route = resolveRouteFromHash(window.location.hash, validRoutes, defaultRoute);
      const appliedRoute = applyRoute(route);
      onRouteEntered?.(appliedRoute);
      if (window.matchMedia("(max-width: 980px)").matches) {
        closeMobileNav();
      }
      return appliedRoute;
    }

    return {
      applyNavCollapsed,
      closeMobileNav,
      toggleNavigationLayout,
      applyRoute,
      handleHashRouteChange
    };
  }

  window.AppOrchestratorViewRoutes = {
    createViewRoutes
  };
})();
