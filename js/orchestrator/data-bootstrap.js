(function initOrchestratorDataBootstrapModule() {
  function createDataBootstrap(deps) {
    const {
      saveJSON,
      loadAssetsData,
      loadSnapshotsData,
      loadTransactionsData,
      loadSettingsData,
      loadAlertRulesData,
      loadAlertHistoryData,
      storageKeys,
      limits,
      nextNumericId,
      showToast,
      tr,
      logError
    } = deps;

    function saveAssets(assets) {
      saveJSON(storageKeys.storage, assets);
    }

    function saveSnapshots(snapshots) {
      saveJSON(storageKeys.snapshots, snapshots);
    }

    function saveTransactions(transactions) {
      saveJSON(storageKeys.transactions, transactions);
    }

    function saveSettings(settings) {
      saveJSON(storageKeys.settings, settings);
    }

    function saveAlertRules(alertRules) {
      saveJSON(storageKeys.alertRules, alertRules);
    }

    function saveAlertHistory(alertHistory) {
      saveJSON(storageKeys.alertHistory, alertHistory);
    }

    function loadAssets(rawAssets, invalidateComputedCaches) {
      try {
        const parsed = loadAssetsData(rawAssets);
        invalidateComputedCaches();
        return parsed;
      } catch (error) {
        logError?.("[storage] load assets failed", error);
        showToast?.(tr("toast.invalidLocalData"), "error");
        invalidateComputedCaches();
        return [];
      }
    }

    function loadSnapshots(rawSnapshots) {
      try {
        return loadSnapshotsData(rawSnapshots, limits.maxSnapshotPoints);
      } catch (error) {
        logError?.("[storage] load snapshots failed", error);
        return [];
      }
    }

    function loadTransactions(rawTransactions, invalidateComputedCaches) {
      try {
        const parsed = loadTransactionsData(rawTransactions);
        invalidateComputedCaches();
        return parsed;
      } catch (error) {
        logError?.("[storage] load transactions failed", error);
        invalidateComputedCaches();
        return [];
      }
    }

    function loadSettings(rawSettings, currentSettings) {
      try {
        return { ...currentSettings, ...loadSettingsData(rawSettings) };
      } catch (error) {
        logError?.("[storage] load settings failed", error);
        return currentSettings;
      }
    }

    function loadAlertRules(rawRules) {
      try {
        return loadAlertRulesData(rawRules);
      } catch (error) {
        logError?.("[storage] load alert rules failed", error);
        return [];
      }
    }

    function loadAlertHistory(rawHistory) {
      try {
        return loadAlertHistoryData(rawHistory, limits.maxAlertHistory);
      } catch (error) {
        logError?.("[storage] load alert history failed", error);
        return [];
      }
    }

    function ensureTransactionBackfill(assets, transactions, saveTransactionsFn, invalidateComputedCaches) {
      let changed = false;
      assets.forEach(asset => {
        const hasTx = transactions.some(tx => tx.assetId === asset.id);
        if (hasTx || asset.amount <= 0) return;
        transactions.push({
          id: nextNumericId(),
          assetId: asset.id,
          coinId: asset.coinId,
          type: "BUY",
          amount: asset.amount,
          price: asset.costPrice,
          fee: 0,
          timestamp: Date.now()
        });
        changed = true;
      });

      if (changed) {
        saveTransactionsFn();
        invalidateComputedCaches();
      }
      return changed;
    }

    return {
      saveAssets,
      saveSnapshots,
      saveTransactions,
      saveSettings,
      saveAlertRules,
      saveAlertHistory,
      loadAssets,
      loadSnapshots,
      loadTransactions,
      loadSettings,
      loadAlertRules,
      loadAlertHistory,
      ensureTransactionBackfill
    };
  }

  window.AppOrchestratorDataBootstrap = {
    createDataBootstrap
  };
})();
