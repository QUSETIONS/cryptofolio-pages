(function initDataTransferServiceModule() {
    function createDataTransferService(deps) {
        const {
            loadSnapshotsData,
            normalizeImportedAssets,
            normalizeImportedTransactions,
            normalizeImportedAlerts,
            normalizeImportedHistory,
            VALID_TRANSACTION_TYPES,
            VALID_ALERT_TYPES,
            COIN_INFO,
            MAX_ALERT_HISTORY,
            MAX_SNAPSHOT_POINTS,
            sanitizeText
        } = deps;

        function normalizePayload(payload) {
            const data = payload?.data || payload;
            if (!data || typeof data !== "object") {
                throw new Error("invalid");
            }
            const assets = normalizeImportedAssets(Array.isArray(data.assets) ? data.assets : [], COIN_INFO);
            const knownAssetIds = new Set(assets.items.map(item => Number(item.id)));
            const transactions = normalizeImportedTransactions(
                Array.isArray(data.transactions) ? data.transactions : [],
                knownAssetIds,
                COIN_INFO,
                sanitizeText
            );
            const alerts = normalizeImportedAlerts(
                Array.isArray(data.alertRules) ? data.alertRules : [],
                COIN_INFO,
                sanitizeText
            );
            const history = normalizeImportedHistory(
                Array.isArray(data.alertHistory) ? data.alertHistory : [],
                MAX_ALERT_HISTORY,
                sanitizeText
            );
            const snapshots = loadSnapshotsData(
                JSON.stringify(Array.isArray(data.snapshots) ? data.snapshots : []),
                MAX_SNAPSHOT_POINTS
            );
            const dropped = assets.dropped + transactions.dropped + alerts.dropped + history.dropped;
            return {
                assets: assets.items,
                snapshots,
                transactions: transactions.items.filter(tx => VALID_TRANSACTION_TYPES.includes(tx.type)),
                alertRules: alerts.items.filter(rule => VALID_ALERT_TYPES.includes(rule.type)),
                alertHistory: history.items,
                settings: data.settings || {},
                dropped
            };
        }

        function buildExportPayload(state) {
            return {
                exportedAt: new Date().toISOString(),
                version: 3,
                data: {
                    assets: state.assets,
                    snapshots: state.snapshots,
                    transactions: state.transactions,
                    alertRules: state.alertRules,
                    alertHistory: state.alertHistory,
                    settings: state.settings
                }
            };
        }

        return {
            normalizePayload,
            buildExportPayload
        };
    }

    window.AppDataTransferService = {
        createDataTransferService
    };
})();
