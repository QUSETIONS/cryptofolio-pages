(function initOrchestratorFeatureWiringModule() {
  function createFeatureWiring(deps) {
    const { settings, elements, tr, saveSettings, applyTheme } = deps;

    function toggleTheme() {
      applyTheme(settings.theme === "dark" ? "light" : "dark");
      saveSettings();
    }

    function updateLastUpdateTime() {
      const now = new Date();
      const timeStr = now.toLocaleTimeString(settings.locale || "en-US", {
        hour: "2-digit",
        minute: "2-digit"
      });
      if (elements?.lastUpdate) {
        elements.lastUpdate.textContent = `${tr("header.lastUpdatePrefix")}: ${timeStr}`;
      }
    }

    return {
      toggleTheme,
      updateLastUpdateTime
    };
  }

  window.AppOrchestratorFeatureWiring = {
    createFeatureWiring
  };
})();
