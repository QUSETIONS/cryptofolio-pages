(function initStorageModule() {
    function saveJSON(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function loadAssetsData(raw) {
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map(asset => ({
                ...asset,
                amount: Number(asset.amount),
                costPrice: Number(asset.costPrice)
            }))
            .filter(asset => asset && asset.coinId && Number.isFinite(asset.amount) && Number.isFinite(asset.costPrice));
    }

    function loadSnapshotsData(raw, maxPoints) {
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map(item => ({
                timestamp: Number(item.timestamp),
                value: Number(item.value)
            }))
            .filter(item => Number.isFinite(item.timestamp) && Number.isFinite(item.value))
            .slice(-maxPoints);
    }

    function loadTransactionsData(raw) {
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map(tx => ({
                id: Number(tx.id),
                assetId: Number(tx.assetId),
                coinId: tx.coinId,
                type: tx.type,
                amount: Number(tx.amount),
                price: Number(tx.price),
                fee: Number(tx.fee || 0),
                timestamp: Number(tx.timestamp)
            }))
            .filter(tx =>
                Number.isFinite(tx.id) &&
                Number.isFinite(tx.assetId) &&
                tx.coinId &&
                (tx.type === 'BUY' || tx.type === 'SELL') &&
                Number.isFinite(tx.amount) &&
                tx.amount > 0 &&
                Number.isFinite(tx.price) &&
                tx.price >= 0 &&
                Number.isFinite(tx.fee) &&
                Number.isFinite(tx.timestamp)
            )
            .sort((a, b) => a.timestamp - b.timestamp);
    }

    function loadSettingsData(raw) {
        const defaults = {
            costMethod: 'average',
            theme: 'light',
            performanceRange: '1D',
            locale: 'zh-CN',
            demoMode: false,
            lastDemoBackupAt: null,
            macroEnabled: true,
            macroWindow: '30D',
            macroRefreshIntervalSec: 300,
            macroAnalysisMode: 'brief',
            newsEnabled: true,
            newsTopic: 'all',
            newsSince: '24h',
            newsRefreshIntervalSec: 300,
            newsAnalysisMode: 'brief',
            newsPrefsVersion: 2,
            calendarEnabled: true,
            calendarWindow: '7d',
            calendarImportance: 'all',
            decisionMode: 'brief',
            strategyTargets: {},
            stressLastScenarioId: 'risk_off',
            attributionWindow: '24h',
            navCollapsed: false,
            petEnabled: true,
            petDismissed: false,
            petPosition: null
        };
        if (!raw) return defaults;
        const parsed = JSON.parse(raw);
        const next = { ...defaults };
        if (parsed && (parsed.costMethod === 'average' || parsed.costMethod === 'fifo')) {
            next.costMethod = parsed.costMethod;
        }
        if (parsed && (parsed.theme === 'light' || parsed.theme === 'dark')) {
            next.theme = parsed.theme;
        }
        if (parsed && ['1D', '1W', '1M', 'ALL'].includes(parsed.performanceRange)) {
            next.performanceRange = parsed.performanceRange;
        }
        if (parsed && ['en-US', 'zh-CN'].includes(parsed.locale)) {
            next.locale = parsed.locale;
        }
        if (parsed && typeof parsed.demoMode === 'boolean') {
            next.demoMode = parsed.demoMode;
        }
        if (parsed && parsed.lastDemoBackupAt != null && Number.isFinite(Number(parsed.lastDemoBackupAt))) {
            next.lastDemoBackupAt = Number(parsed.lastDemoBackupAt);
        }
        if (parsed && typeof parsed.macroEnabled === 'boolean') {
            next.macroEnabled = parsed.macroEnabled;
        }
        if (parsed && ['30D', '90D'].includes(parsed.macroWindow)) {
            next.macroWindow = parsed.macroWindow;
        }
        if (parsed && Number.isFinite(Number(parsed.macroRefreshIntervalSec))) {
            const value = Number(parsed.macroRefreshIntervalSec);
            next.macroRefreshIntervalSec = Math.min(1800, Math.max(60, value));
        }
        if (parsed && ['brief', 'pro'].includes(parsed.macroAnalysisMode)) {
            next.macroAnalysisMode = parsed.macroAnalysisMode;
        }
        if (parsed && typeof parsed.newsEnabled === 'boolean') {
            next.newsEnabled = parsed.newsEnabled;
        }
        if (parsed && ['all', 'macro', 'crypto', 'rates'].includes(parsed.newsTopic)) {
            next.newsTopic = parsed.newsTopic;
        }
        if (parsed && ['1h', '24h', '7d'].includes(parsed.newsSince)) {
            next.newsSince = parsed.newsSince;
        }
        if (parsed && Number.isFinite(Number(parsed.newsRefreshIntervalSec))) {
            const value = Number(parsed.newsRefreshIntervalSec);
            next.newsRefreshIntervalSec = Math.min(1800, Math.max(60, value));
        }
        if (parsed && ['brief', 'pro'].includes(parsed.newsAnalysisMode)) {
            next.newsAnalysisMode = parsed.newsAnalysisMode;
        }
        if (parsed && Number.isFinite(Number(parsed.newsPrefsVersion))) {
            next.newsPrefsVersion = Number(parsed.newsPrefsVersion);
        }
        if (parsed && typeof parsed.calendarEnabled === 'boolean') {
            next.calendarEnabled = parsed.calendarEnabled;
        }
        if (parsed && ['1d', '7d'].includes(parsed.calendarWindow)) {
            next.calendarWindow = parsed.calendarWindow;
        }
        if (parsed && ['all', 'high'].includes(parsed.calendarImportance)) {
            next.calendarImportance = parsed.calendarImportance;
        }
        if (parsed && ['brief', 'pro'].includes(parsed.decisionMode)) {
            next.decisionMode = parsed.decisionMode;
        }
        if (parsed && parsed.strategyTargets && typeof parsed.strategyTargets === 'object' && !Array.isArray(parsed.strategyTargets)) {
            const normalizedTargets = {};
            Object.entries(parsed.strategyTargets).forEach(([coinId, weight]) => {
                const value = Number(weight);
                if (Number.isFinite(value) && value >= 0) {
                    normalizedTargets[coinId] = value;
                }
            });
            next.strategyTargets = normalizedTargets;
        }
        if (parsed && typeof parsed.stressLastScenarioId === 'string' && parsed.stressLastScenarioId) {
            next.stressLastScenarioId = parsed.stressLastScenarioId;
        }
        if (parsed && ['24h', '7d'].includes(parsed.attributionWindow)) {
            next.attributionWindow = parsed.attributionWindow;
        }
        if (parsed && typeof parsed.navCollapsed === 'boolean') {
            next.navCollapsed = parsed.navCollapsed;
        }
        if (parsed && typeof parsed.petEnabled === 'boolean') {
            next.petEnabled = parsed.petEnabled;
        }
        if (parsed && typeof parsed.petDismissed === 'boolean') {
            next.petDismissed = parsed.petDismissed;
        }
        if (parsed && parsed.petPosition && Number.isFinite(Number(parsed.petPosition.x)) && Number.isFinite(Number(parsed.petPosition.y))) {
            next.petPosition = {
                x: Number(parsed.petPosition.x),
                y: Number(parsed.petPosition.y)
            };
        }
        if (!parsed || !Number.isFinite(Number(parsed.newsPrefsVersion))) {
            next.newsEnabled = true;
            next.newsPrefsVersion = 2;
        }
        return next;
    }

    function loadAlertRulesData(raw) {
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map(rule => ({
                id: Number(rule.id),
                type: rule.type,
                coinId: rule.coinId || '',
                threshold: Number(rule.threshold),
                enabled: Boolean(rule.enabled),
                createdAt: Number(rule.createdAt || Date.now())
            }))
            .filter(rule =>
                Number.isFinite(rule.id) &&
                ['PRICE_ABOVE', 'PRICE_BELOW', 'POSITION_ABOVE', 'DRAWDOWN_ABOVE'].includes(rule.type) &&
                Number.isFinite(rule.threshold)
            );
    }

    function loadAlertHistoryData(raw, maxItems) {
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map(item => ({
                id: Number(item.id),
                message: String(item.message || ''),
                timestamp: Number(item.timestamp)
            }))
            .filter(item => Number.isFinite(item.id) && Number.isFinite(item.timestamp) && item.message)
            .slice(-maxItems);
    }

    function normalizeImportedAssets(rawAssets, coinInfoMap) {
        if (!Array.isArray(rawAssets)) return { items: [], dropped: 0 };
        const items = [];
        let dropped = 0;
        rawAssets.forEach(asset => {
            const coinId = String(asset?.coinId || '');
            const amount = Number(asset?.amount);
            const costPrice = Number(asset?.costPrice);
            const id = Number(asset?.id || Date.now() + Math.floor(Math.random() * 100000));
            if (!coinInfoMap[coinId] || !Number.isFinite(amount) || amount < 0 || !Number.isFinite(costPrice) || costPrice < 0) {
                dropped += 1;
                return;
            }
            items.push({
                id,
                coinId,
                amount,
                costPrice,
                addedAt: asset?.addedAt || new Date().toISOString()
            });
        });
        return { items, dropped };
    }

    function normalizeImportedTransactions(rawTransactions, knownAssetIds, coinInfoMap, sanitizeText) {
        if (!Array.isArray(rawTransactions)) return { items: [], dropped: 0 };
        const clean = typeof sanitizeText === 'function' ? sanitizeText : value => String(value ?? '');
        const items = [];
        let dropped = 0;
        rawTransactions.forEach(tx => {
            const id = Number(tx?.id);
            const assetId = Number(tx?.assetId);
            const coinId = String(tx?.coinId || '');
            const type = String(tx?.type || '');
            const amount = Number(tx?.amount);
            const price = Number(tx?.price);
            const fee = Number(tx?.fee || 0);
            const timestamp = Number(tx?.timestamp || Date.now());
            if (
                !Number.isFinite(id) ||
                !knownAssetIds.has(assetId) ||
                !coinInfoMap[coinId] ||
                (type !== 'BUY' && type !== 'SELL') ||
                !Number.isFinite(amount) ||
                amount <= 0 ||
                !Number.isFinite(price) ||
                price < 0 ||
                !Number.isFinite(fee) ||
                !Number.isFinite(timestamp)
            ) {
                dropped += 1;
                return;
            }
            items.push({
                id,
                assetId,
                coinId,
                type,
                amount,
                price,
                fee,
                timestamp,
                note: clean(tx?.note || '', 512)
            });
        });
        items.sort((a, b) => a.timestamp - b.timestamp);
        return { items, dropped };
    }

    function normalizeImportedAlerts(rawRules, coinInfoMap, sanitizeText) {
        if (!Array.isArray(rawRules)) return { items: [], dropped: 0 };
        const clean = typeof sanitizeText === 'function' ? sanitizeText : value => String(value ?? '');
        const allowedTypes = new Set(['PRICE_ABOVE', 'PRICE_BELOW', 'POSITION_ABOVE', 'DRAWDOWN_ABOVE']);
        const items = [];
        let dropped = 0;
        rawRules.forEach(rule => {
            const id = Number(rule?.id);
            const type = String(rule?.type || '');
            const coinId = String(rule?.coinId || '');
            const threshold = Number(rule?.threshold);
            const enabled = Boolean(rule?.enabled);
            const createdAt = Number(rule?.createdAt || Date.now());
            const needsCoin = type !== 'DRAWDOWN_ABOVE';
            if (
                !Number.isFinite(id) ||
                !allowedTypes.has(type) ||
                (needsCoin && !coinInfoMap[coinId]) ||
                !Number.isFinite(threshold) ||
                threshold < 0 ||
                !Number.isFinite(createdAt)
            ) {
                dropped += 1;
                return;
            }
            items.push({
                id,
                type,
                coinId: needsCoin ? coinId : '',
                threshold,
                enabled,
                createdAt,
                note: clean(rule?.note || '', 512)
            });
        });
        return { items, dropped };
    }

    function normalizeImportedHistory(rawHistory, maxItems, sanitizeText) {
        if (!Array.isArray(rawHistory)) return { items: [], dropped: 0 };
        const clean = typeof sanitizeText === 'function' ? sanitizeText : value => String(value ?? '');
        const items = [];
        let dropped = 0;
        rawHistory.forEach(entry => {
            const id = Number(entry?.id);
            const timestamp = Number(entry?.timestamp);
            const message = clean(entry?.message || '', 512);
            if (!Number.isFinite(id) || !Number.isFinite(timestamp) || !message) {
                dropped += 1;
                return;
            }
            items.push({ id, timestamp, message });
        });
        return { items: items.slice(-maxItems), dropped };
    }

    window.AppStorage = {
        saveJSON,
        loadAssetsData,
        loadSnapshotsData,
        loadTransactionsData,
        loadSettingsData,
        loadAlertRulesData,
        loadAlertHistoryData,
        normalizeImportedAssets,
        normalizeImportedTransactions,
        normalizeImportedAlerts,
        normalizeImportedHistory
    };
})();
