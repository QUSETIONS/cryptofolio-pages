(function initOrchestratorRefreshJobsModule() {
  function createRefreshJobs(deps) {
    const {
      tr,
      showToast,
      refreshPriceData,
      handleSummaryRefresh,
      isRefreshingRef,
      pendingRefreshRef,
      elements,
      saveSettings,
      settings
    } = deps;

    async function handleNetworkStatusChange() {
      const offline = !navigator.onLine;
      document.body.classList.toggle("is-offline", offline);
      if (offline) {
        showToast(tr("toast.offlinePaused"), "warning");
        elements?.refreshBtn?.setAttribute("data-offline", "true");
        return;
      }

      elements?.refreshBtn?.removeAttribute("data-offline");
      showToast(tr("toast.onlineResume"), "success");
      try {
        const running = isRefreshingRef();
        if (!running) {
          await refreshPriceData();
          handleSummaryRefresh?.();
          return;
        }
        pendingRefreshRef(true);
      } catch (error) {
        console.error("[network] online refresh failed:", error);
        showToast(tr("toast.networkRefreshFailed"), "error");
      } finally {
        saveSettings?.();
      }
    }

    function persistRefreshInterval(value, fallbackValue = 300) {
      const normalized = Number(value);
      settings.newsRefreshIntervalSec = Number.isFinite(normalized) ? Math.max(60, Math.round(normalized)) : fallbackValue;
      saveSettings?.();
      return settings.newsRefreshIntervalSec;
    }

    return {
      handleNetworkStatusChange,
      persistRefreshInterval
    };
  }

  window.AppOrchestratorRefreshJobs = {
    createRefreshJobs
  };
})();
