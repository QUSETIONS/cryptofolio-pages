(function () {
  function getRouteFromHash(hash, validRoutes, defaultRoute) {
    const raw = hash || '';
    const normalized = raw.replace(/^#\/?/, '').trim().toLowerCase();
    if (!normalized) return defaultRoute;
    return validRoutes.includes(normalized) ? normalized : defaultRoute;
  }

  function applyRoute(route, validRoutes, defaultRoute, routeLinks, sectionSelector) {
    const activeRoute = validRoutes.includes(route) ? route : defaultRoute;
    document.querySelectorAll(sectionSelector).forEach(section => {
      const routes = (section.dataset.routes || '').split(/\s+/).filter(Boolean);
      const visible = routes.includes(activeRoute);
      section.classList.toggle('is-hidden', !visible);
    });

    routeLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.routeLink === activeRoute);
    });

    return activeRoute;
  }

  window.AppRouter = {
    getRouteFromHash,
    applyRoute
  };
})();
