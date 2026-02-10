/**
 * CryptoFolio - 涓汉鍔犲瘑璐у竵璧勪骇杩借釜鍣?
 * 浣跨敤 CoinGecko API 鑾峰彇瀹炴椂浠锋牸
 */

// ============================================
// 閰嶇疆涓庡父閲?// ============================================
const {
    COINGECKO_API,
    STORAGE_KEY,
    SNAPSHOTS_KEY,
    TRANSACTIONS_KEY,
    SETTINGS_KEY,
    ALERT_RULES_KEY,
    ALERT_HISTORY_KEY,
    UPDATE_INTERVAL,
    SNAPSHOT_INTERVAL,
    MAX_SNAPSHOT_POINTS,
    MAX_ALERT_HISTORY,
    PRICE_FETCH_MIN_INTERVAL_MS,
    VALID_ROUTES,
    DEFAULT_ROUTE,
    COIN_INFO,
    VALID_ALERT_TYPES,
    VALID_TRANSACTION_TYPES
} = window.AppConfig;
const { createElements } = window.AppDom;
const { animateTextNumber, sanitizeText, escapeHtml } = window.AppUtils;
const {
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
} = window.AppStorage;
const {
    buildTransactionsByAssetMap,
    calculateCostBasisByMethod,
    calculatePortfolioStats: computePortfolioStats,
    calculateRiskMetrics: computeRiskMetrics
} = window.AppPortfolioDomain;
const {
    buildAssetsRows,
    buildTransactionsRows,
    buildAlertRulesRows,
    buildAlertHistoryRows
} = window.AppUIRenderers;
const {
    createAssetController,
    createTransactionController,
    createAlertController,
    createSettingsController
} = window.AppControllers;
const {
    getRouteFromHash: resolveRouteFromHash,
    applyRoute: applyRouteView
} = window.AppRouter;
const { createErrorChannel } = window.AppErrorChannel;
const { createTransactionFilters } = window.AppTransactionFilters;
const { createCommandPalette } = window.AppCommandPalette;
const { t, setLocale, getLocale, applyI18nToDom } = window.AppI18n;
const { loadRealisticSnapshotDemo } = window.AppDemoSeed;
const { createFormatters } = window.AppFormatters;
const { createConfirmDialog } = window.AppConfirmDialog;
const { createRefreshScheduler } = window.AppRefreshScheduler;
const { parse: parseMacroPayload } = window.AppMacroDataAdapter;
const { score: scoreMacroData } = window.AppMacroScoring;
const { explain: explainMacroState } = window.AppMacroExplainer;
const { createMacroIntel } = window.AppMacroIntel;
const { parse: parseNewsPayload } = window.AppNewsAdapter;
const { renderFeed: renderNewsFeed, renderInsight: renderNewsInsight } = window.AppNewsRenderer;
const { createNewsIntel } = window.AppNewsIntel;
const { parse: parseEconCalendarPayload } = window.AppEconCalendarAdapter;
const { renderEvents: renderEconEvents } = window.AppEconCalendarRenderer;
const { createEconCalendarIntel } = window.AppEconCalendarIntel;
const { computeDecision } = window.AppDecisionWorkspace;
const { renderDecisionCard } = window.AppDecisionRenderer;
const { evaluateRebalance } = window.AppStrategyLab;
const { buildStrategyRows, buildStrategySummary } = window.AppStrategyRenderer;
const { PRESETS: STRESS_PRESETS, getPresetById } = window.AppStressPresets;
const { runScenario } = window.AppStressTest;
const { buildStressSummary, buildStressRows } = window.AppStressRenderer;
const { computeAttribution } = window.AppRiskAttribution;
const { buildAttributionSummary, buildAttributionRows } = window.AppAttributionRenderer;
const { backupBeforeDemo, restoreFromDemoBackup, getDemoBackupMeta } = window.AppDemoStateBackup;
const { nextId, nextNumericId } = window.AppIdGenerator;
const { createDataTransferService } = window.AppDataTransferService;
const { createDashboardPresenter } = window.AppDashboardPresenter;
const { createChartManager } = window.AppChartManager;
const { createDataBootstrap } = window.AppOrchestratorDataBootstrap || { createDataBootstrap: null };
const { createViewRoutes } = window.AppOrchestratorViewRoutes || { createViewRoutes: null };
const { createFeatureWiring } = window.AppOrchestratorFeatureWiring || { createFeatureWiring: null };
const { createRefreshJobs } = window.AppOrchestratorRefreshJobs || { createRefreshJobs: null };
const { createErrorBoundary } = window.AppErrorBoundary;
const { createDemoAudit } = window.AppDemoAudit;
const { createDesktopPet } = window.AppDesktopPet || { createDesktopPet: null };
const STABLE_COIN_IDS = ['tether', 'usd-coin', 'dai', 'binance-usd'];
const ACTION_AUDIT_KEY = 'cryptofolio_action_audit_v1';

// ============================================
// 鐘舵€佺鐞?
// ============================================
let assets = [];
let priceData = {};
let portfolioChart = null;
let performanceChart = null;
let sparklineChart = null;
let snapshots = [];
let transactions = [];
let alertRules = [];
let alertHistory = [];
let alertActiveMap = {};
let isRefreshing = false;
let pendingRefresh = false;
let lastPriceFetchAt = 0;
let transactionsByAssetCache = null;
let costBasisCache = new Map();
let currentRoute = DEFAULT_ROUTE;
let assetController = null;
let transactionController = null;
let alertController = null;
let settingsController = null;
let commandPalette = null;
let transactionFilters = null;
let refreshScheduler = null;
let confirmDialog = null;
let dataTransferService = null;
let dashboardPresenter = null;
let chartManager = null;
let dataBootstrap = null;
let viewRoutes = null;
let featureWiring = null;
let refreshJobs = null;
let macroIntel = null;
let newsIntel = null;
let econCalendarIntel = null;
let errorBoundary = null;
let demoAudit = null;
let strategyResult = null;
let stressResult = null;
let attributionResult = null;
let desktopPet = null;
let labActionState = {
    strategy: 'idle',
    stress: 'idle'
};
let settings = {
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

// ============================================
// DOM 鍏冪礌
// ============================================
const elements = createElements();
const errorChannel = createErrorChannel(elements);
const {
    showToast,
    showErrorBanner,
    hideErrorBanner,
    setInlineError
} = errorChannel;
transactionFilters = createTransactionFilters();
const formatters = createFormatters(() => settings.locale || getLocale());
const formatCurrency = formatters.formatCurrency;
const formatNumber = formatters.formatNumber;
const formatPercent = formatters.formatPercent;
const formatTime = formatters.formatTime;

function ensureOrchestratorModules() {
    if (!dataBootstrap && typeof createDataBootstrap === 'function') {
        dataBootstrap = createDataBootstrap({
            saveJSON,
            loadAssetsData,
            loadSnapshotsData,
            loadTransactionsData,
            loadSettingsData,
            loadAlertRulesData,
            loadAlertHistoryData,
            storageKeys: {
                storage: STORAGE_KEY,
                snapshots: SNAPSHOTS_KEY,
                transactions: TRANSACTIONS_KEY,
                settings: SETTINGS_KEY,
                alertRules: ALERT_RULES_KEY,
                alertHistory: ALERT_HISTORY_KEY
            },
            limits: {
                maxSnapshotPoints: MAX_SNAPSHOT_POINTS,
                maxAlertHistory: MAX_ALERT_HISTORY
            },
            nextNumericId,
            showToast,
            tr,
            logError: (...args) => console.error(...args)
        });
    }

    if (!viewRoutes && typeof createViewRoutes === 'function') {
        viewRoutes = createViewRoutes({
            settings,
            elements,
            tr,
            saveSettings,
            applyRouteView,
            resolveRouteFromHash,
            validRoutes: VALID_ROUTES,
            defaultRoute: DEFAULT_ROUTE,
            updateRouteDocumentTitle,
            onRouteEntered: route => {
                currentRoute = route;
                if (route === 'strategy') {
                    buildStrategyTargetInputs();
                    evaluateStrategyLab();
                } else if (route === 'stress') {
                    renderStressPresets();
                    runStressTest();
                } else if (route === 'attribution') {
                    renderAttribution();
                }
            }
        });
    }

    if (!featureWiring && typeof createFeatureWiring === 'function') {
        featureWiring = createFeatureWiring({
            settings,
            elements,
            tr,
            saveSettings,
            applyTheme
        });
    }

    if (!refreshJobs && typeof createRefreshJobs === 'function') {
        refreshJobs = createRefreshJobs({
            tr,
            showToast,
            refreshPriceData: refreshData,
            handleSummaryRefresh: () => {
                updateSummary();
                renderAssets();
                renderTransactions();
            },
            isRefreshingRef: () => isRefreshing,
            pendingRefreshRef: value => {
                pendingRefresh = Boolean(value);
            },
            elements,
            saveSettings,
            settings
        });
    }
}

// ============================================
// 宸ュ叿鍑芥暟
// ============================================

function tr(key, params) {
    return t(key, params);
}

function applyLocale(locale) {
    settings.locale = locale === 'zh-CN' ? 'zh-CN' : 'en-US';
    setLocale(settings.locale);
    applyI18nToDom(document);
    updateRouteDocumentTitle(currentRoute || DEFAULT_ROUTE);
    if (elements.localeSelect) {
        elements.localeSelect.value = settings.locale;
    }
    if (elements.localeQuickToggleBtn) {
        elements.localeQuickToggleBtn.textContent = settings.locale === 'zh-CN' ? tr('button.languageEn') : tr('button.languageZh');
    }
}

function writeActionAudit(entry) {
    try {
        const previous = JSON.parse(localStorage.getItem(ACTION_AUDIT_KEY) || '[]');
        const next = Array.isArray(previous) ? previous.slice(-49) : [];
        next.push(entry);
        localStorage.setItem(ACTION_AUDIT_KEY, JSON.stringify(next));
    } catch (_error) {
        // ignore local audit write failures
    }
}

function markLabResultUpdated(action) {
    const targets = action === 'stress'
        ? [elements.stressResultSummary, elements.stressResultTable]
        : [elements.strategyResultSummary, elements.strategyResultTable];
    targets
        .filter(Boolean)
        .forEach(node => {
            node.classList.remove('lab-result-highlight');
            void node.offsetWidth;
            node.classList.add('lab-result-highlight');
        });
}

function setActionButtonRunning(button, isRunning) {
    if (!button) return;
    button.disabled = Boolean(isRunning);
    button.classList.toggle('is-running', Boolean(isRunning));
}

function setLabActionState(action, state, options = {}) {
    labActionState[action] = state;
    const button = action === 'strategy' ? elements.strategyEvaluateBtn : elements.stressRunBtn;
    const defaultLabel = action === 'strategy' ? tr('strategy.evaluate') : tr('stress.run');
    const statusNode = action === 'strategy' ? elements.strategyStatusText : elements.stressStatusText;
    if (statusNode) {
        if (state === 'validating') {
            statusNode.textContent = action === 'strategy' ? tr('strategy.status.validating') : tr('stress.status.validating');
            statusNode.className = 'lab-status-text is-running';
        } else if (state === 'running') {
            statusNode.textContent = action === 'strategy' ? tr('strategy.status.running') : tr('stress.status.running');
            statusNode.className = 'lab-status-text is-running';
        } else if (state === 'error') {
            const fallback = action === 'strategy' ? tr('strategy.status.error', { message: tr('error.checkInput') }) : tr('stress.status.error', { message: tr('error.checkInput') });
            statusNode.textContent = options.message
                ? (action === 'strategy'
                    ? tr('strategy.status.error', { message: options.message })
                    : tr('stress.status.error', { message: options.message }))
                : fallback;
            statusNode.className = 'lab-status-text is-error';
        } else if (state === 'empty') {
            statusNode.textContent = options.message || (action === 'strategy'
                ? tr('strategy.status.empty')
                : tr('stress.status.empty'));
            statusNode.className = 'lab-status-text is-empty';
        }
    }
    if (!button) return;
    if (state === 'running' || state === 'validating') {
        button.textContent = `${defaultLabel}...`;
        setActionButtonRunning(button, true);
        return;
    }
    setActionButtonRunning(button, false);
    button.textContent = defaultLabel;
    if ((state === 'error' || state === 'empty') && options.message) {
        showToast(options.message, 'error');
    }
}

function applyDemoMode(enabled) {
    settings.demoMode = Boolean(enabled);
    if (elements.demoModeToggle) {
        elements.demoModeToggle.checked = settings.demoMode;
    }
    if (elements.demoModeBadge) {
        elements.demoModeBadge.classList.toggle('hidden', !settings.demoMode);
    }
}

function updateRouteDocumentTitle(route) {
    const routeTitle = tr(`nav.${route}`);
    document.title = `${routeTitle} | CryptoFolio`;
}

function getApiBaseOrigin() {
    const forced = window.localStorage?.getItem('cryptofolio_api_base_origin');
    if (forced && /^https?:\/\//i.test(forced)) {
        return forced.replace(/\/+$/, '');
    }
    const host = window.location.hostname || '';
    if (host.endsWith('github.io')) {
        return 'https://crypto-portfolio-tracker-tan-nine.vercel.app';
    }
    return '';
}

function buildApiUrl(path) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const base = getApiBaseOrigin();
    return base ? `${base}${normalizedPath}` : normalizedPath;
}

async function fetchMacroSnapshot(windowKey) {
    const normalized = windowKey === '90D' ? '90D' : '30D';
    const response = await fetch(buildApiUrl(`/api/macro-snapshot?window=${normalized}`));
    if (!response.ok) throw new Error('macro_snapshot_failed');
    return response.json();
}

async function fetchNewsFeed(topic, since, limit, locale) {
    const normalizedTopic = ['all', 'macro', 'crypto', 'rates'].includes(topic) ? topic : 'all';
    const normalizedSince = ['1h', '24h', '7d'].includes(since) ? since : '24h';
    const normalizedLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(50, Number(limit))) : 20;
    const normalizedLocale = locale === 'zh-CN' ? 'zh-CN' : 'en-US';
    const query = new URLSearchParams({
        topic: normalizedTopic,
        since: normalizedSince,
        limit: String(normalizedLimit),
        locale: normalizedLocale
    });
    const response = await fetch(buildApiUrl(`/api/news-feed?${query.toString()}`));
    if (!response.ok) throw new Error('news_feed_failed');
    return response.json();
}

async function fetchNewsInsight(newsItems, locale, portfolioContext) {
    const response = await fetch(buildApiUrl('/api/news-insight'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            locale: locale === 'zh-CN' ? 'zh-CN' : 'en-US',
            newsItems: Array.isArray(newsItems) ? newsItems : [],
            portfolioContext: portfolioContext || {}
        })
    });
    if (!response.ok) throw new Error('news_insight_failed');
    return response.json();
}

async function fetchEconCalendar(windowKey, importance, locale) {
    const normalizedWindow = ['1d', '7d'].includes(windowKey) ? windowKey : '7d';
    const normalizedImportance = ['all', 'high'].includes(importance) ? importance : 'all';
    const normalizedLocale = locale === 'zh-CN' ? 'zh-CN' : 'en-US';
    const query = new URLSearchParams({
        window: normalizedWindow,
        importance: normalizedImportance,
        locale: normalizedLocale
    });
    const response = await fetch(buildApiUrl(`/api/econ-calendar?${query.toString()}`));
    if (!response.ok) throw new Error('econ_calendar_failed');
    return response.json();
}

/**
 * 鏇存柊鏈€鍚庢洿鏂版椂闂?
 */
function updateLastUpdateTime() {
    ensureOrchestratorModules();
    if (featureWiring?.updateLastUpdateTime) {
        featureWiring.updateLastUpdateTime();
        return;
    }
    const now = new Date();
    const timeStr = now.toLocaleTimeString(settings.locale || 'en-US', { hour: '2-digit', minute: '2-digit' });
    elements.lastUpdate.textContent = `${tr('header.lastUpdatePrefix')}: ${timeStr}`;
}

function invalidateComputedCaches() {
    transactionsByAssetCache = null;
    costBasisCache.clear();
}

function applyTheme(theme) {
    settings.theme = theme === 'dark' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', settings.theme);
    if (elements.themeToggleBtn) {
        elements.themeToggleBtn.textContent = settings.theme === 'dark' ? tr('button.light') : tr('button.dark');
        elements.themeToggleBtn.title = settings.theme === 'dark' ? tr('button.themeToLight') : tr('button.themeToDark');
    }
}

function applyNavCollapsed(collapsed) {
    ensureOrchestratorModules();
    if (viewRoutes?.applyNavCollapsed) {
        viewRoutes.applyNavCollapsed(collapsed);
        return;
    }
    settings.navCollapsed = Boolean(collapsed);
    elements.appShell?.classList.toggle('nav-collapsed', settings.navCollapsed);
}

function closeMobileNav() {
    ensureOrchestratorModules();
    if (viewRoutes?.closeMobileNav) {
        viewRoutes.closeMobileNav();
        return;
    }
    elements.appShell?.classList.remove('nav-open-mobile');
    elements.sideNavOverlay?.classList.add('hidden');
}

function toggleNavigationLayout() {
    ensureOrchestratorModules();
    if (viewRoutes?.toggleNavigationLayout) {
        viewRoutes.toggleNavigationLayout();
        return;
    }
    applyNavCollapsed(!settings.navCollapsed);
    saveSettings();
}

function toggleTheme() {
    ensureOrchestratorModules();
    if (featureWiring?.toggleTheme) {
        featureWiring.toggleTheme();
        return;
    }
    applyTheme(settings.theme === 'dark' ? 'light' : 'dark');
    saveSettings();
}

function getFilteredSnapshots() {
    const now = Date.now();
    const ranges = {
        '1D': 24 * 60 * 60 * 1000,
        '1W': 7 * 24 * 60 * 60 * 1000,
        '1M': 30 * 24 * 60 * 60 * 1000
    };
    if (settings.performanceRange === 'ALL') return [...snapshots];
    const windowMs = ranges[settings.performanceRange] || ranges['1D'];
    return snapshots.filter(point => now - point.timestamp <= windowMs);
}

function applyRoute(route) {
    ensureOrchestratorModules();
    if (viewRoutes?.applyRoute) {
        currentRoute = viewRoutes.applyRoute(route);
        return;
    }
    currentRoute = applyRouteView(route, VALID_ROUTES, DEFAULT_ROUTE, elements.routeLinks, '.view-section');
    updateRouteDocumentTitle(currentRoute);
}

function handleHashRouteChange() {
    ensureOrchestratorModules();
    if (viewRoutes?.handleHashRouteChange) {
        currentRoute = viewRoutes.handleHashRouteChange();
        return;
    }
    const route = resolveRouteFromHash(window.location.hash, VALID_ROUTES, DEFAULT_ROUTE);
    applyRoute(route);
}

// ============================================
// 鏈湴瀛樺偍
// ============================================

/**
 * 淇濆瓨璧勪骇鍒版湰鍦板瓨鍌?
 */
function saveAssets() {
    ensureOrchestratorModules();
    if (dataBootstrap?.saveAssets) return dataBootstrap.saveAssets(assets);
    saveJSON(STORAGE_KEY, assets);
}

function saveSnapshots() {
    ensureOrchestratorModules();
    if (dataBootstrap?.saveSnapshots) return dataBootstrap.saveSnapshots(snapshots);
    saveJSON(SNAPSHOTS_KEY, snapshots);
}

function saveTransactions() {
    ensureOrchestratorModules();
    if (dataBootstrap?.saveTransactions) return dataBootstrap.saveTransactions(transactions);
    saveJSON(TRANSACTIONS_KEY, transactions);
}

function saveSettings() {
    ensureOrchestratorModules();
    if (dataBootstrap?.saveSettings) return dataBootstrap.saveSettings(settings);
    saveJSON(SETTINGS_KEY, settings);
}

function saveAlertRules() {
    ensureOrchestratorModules();
    if (dataBootstrap?.saveAlertRules) return dataBootstrap.saveAlertRules(alertRules);
    saveJSON(ALERT_RULES_KEY, alertRules);
}

function saveAlertHistory() {
    ensureOrchestratorModules();
    if (dataBootstrap?.saveAlertHistory) return dataBootstrap.saveAlertHistory(alertHistory);
    saveJSON(ALERT_HISTORY_KEY, alertHistory);
}

/**
 * 浠庢湰鍦板瓨鍌ㄥ姞杞借祫浜?
 */
function loadAssets() {
    ensureOrchestratorModules();
    if (dataBootstrap?.loadAssets) {
        assets = dataBootstrap.loadAssets(localStorage.getItem(STORAGE_KEY), invalidateComputedCaches);
        return;
    }
    assets = loadAssetsData(localStorage.getItem(STORAGE_KEY));
    invalidateComputedCaches();
}

function loadSnapshots() {
    ensureOrchestratorModules();
    if (dataBootstrap?.loadSnapshots) {
        snapshots = dataBootstrap.loadSnapshots(localStorage.getItem(SNAPSHOTS_KEY));
        return;
    }
    snapshots = loadSnapshotsData(localStorage.getItem(SNAPSHOTS_KEY), MAX_SNAPSHOT_POINTS);
}

function loadTransactions() {
    ensureOrchestratorModules();
    if (dataBootstrap?.loadTransactions) {
        transactions = dataBootstrap.loadTransactions(localStorage.getItem(TRANSACTIONS_KEY), invalidateComputedCaches);
        return;
    }
    transactions = loadTransactionsData(localStorage.getItem(TRANSACTIONS_KEY));
    invalidateComputedCaches();
}

function loadSettings() {
    ensureOrchestratorModules();
    if (dataBootstrap?.loadSettings) {
        const mergedSettings = dataBootstrap.loadSettings(localStorage.getItem(SETTINGS_KEY), settings);
        Object.assign(settings, mergedSettings);
        saveSettings();
        return;
    }
    Object.assign(settings, loadSettingsData(localStorage.getItem(SETTINGS_KEY)));
    saveSettings();
}

function loadAlertRules() {
    ensureOrchestratorModules();
    if (dataBootstrap?.loadAlertRules) {
        alertRules = dataBootstrap.loadAlertRules(localStorage.getItem(ALERT_RULES_KEY));
        return;
    }
    alertRules = loadAlertRulesData(localStorage.getItem(ALERT_RULES_KEY));
}

function loadAlertHistory() {
    ensureOrchestratorModules();
    if (dataBootstrap?.loadAlertHistory) {
        alertHistory = dataBootstrap.loadAlertHistory(localStorage.getItem(ALERT_HISTORY_KEY));
        return;
    }
    alertHistory = loadAlertHistoryData(localStorage.getItem(ALERT_HISTORY_KEY), MAX_ALERT_HISTORY);
}

function ensureTransactionBackfill() {
    ensureOrchestratorModules();
    if (dataBootstrap?.ensureTransactionBackfill) {
        dataBootstrap.ensureTransactionBackfill(assets, transactions, saveTransactions, invalidateComputedCaches);
        return;
    }
}

// ============================================
// API 璋冪敤
// ============================================

/**
 * 鑾峰彇甯佺浠锋牸鏁版嵁
 */
async function fetchPrices() {
    const coinIds = [...new Set(assets.map(a => a.coinId))];
    if (coinIds.length === 0) {
        priceData = {};
        return priceData;
    }

    const now = Date.now();
    if (Object.keys(priceData).length > 0 && now - lastPriceFetchAt < PRICE_FETCH_MIN_INTERVAL_MS) {
        return priceData;
    }

    try {
        const response = await fetch(
            `${COINGECKO_API}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
        );
        
        if (!response.ok) throw new Error('API request failed');
        
        priceData = await response.json();
        lastPriceFetchAt = Date.now();
        updateLastUpdateTime();
        if (elements.marketStatus) {
            elements.marketStatus.textContent = tr('header.marketLive');
        }
        hideErrorBanner();
        return priceData;
    } catch (error) {
        console.error('[prices] fetch failed:', error);
        showToast(tr('toast.priceFailed'), 'error');
        showErrorBanner(tr('banner.marketUnavailable'));
        if (elements.marketStatus) {
            elements.marketStatus.textContent = tr('header.marketDegraded');
        }
        throw error;
    }
}

/**
 * 鑾峰彇甯佺鍥炬爣
 */
function getCoinIcon(coinId) {
    return `https://assets.coingecko.com/coins/images/${getCoinImageId(coinId)}/small/${coinId}.png`;
}

/**
 * CoinGecko鍥剧墖ID鏄犲皠
 */
function getCoinImageId(coinId) {
    const imageIds = {
        bitcoin: 1,
        ethereum: 279,
        tether: 325,
        binancecoin: 825,
        solana: 4128,
        ripple: 44,
        cardano: 975,
        dogecoin: 5,
        polkadot: 12171,
        'avalanche-2': 12559
    };
    return imageIds[coinId] || 1;
}

// ============================================
// 璧勪骇绠＄悊
// ============================================

/**
 * 娣诲姞鏂拌祫浜?
 */
function addAsset(coinId, amount, costPrice) {
    // 妫€鏌ユ槸鍚﹀凡瀛樺湪鐩稿悓甯佺
    const existingIndex = assets.findIndex(a => a.coinId === coinId);
    
    if (existingIndex !== -1) {
        // 鍚堝苟鎸佷粨锛氳绠楀姞鏉冨钩鍧囨垚鏈?
        const existing = assets[existingIndex];
        const totalAmount = existing.amount + amount;
        const totalCost = (existing.amount * existing.costPrice) + (amount * costPrice);
        
        assets[existingIndex] = {
            ...existing,
            amount: totalAmount,
            costPrice: totalCost / totalAmount
        };
        showToast(tr('toast.assetMerged', { symbol: COIN_INFO[coinId].symbol }));
        transactions.push({
            id: nextNumericId(),
            assetId: existing.id,
            coinId,
            type: 'BUY',
            amount,
            price: costPrice,
            fee: 0,
            timestamp: Date.now()
        });
    } else {
        const newId = nextNumericId();
        const transactionId = nextNumericId();
        assets.push({
            id: newId,
            coinId,
            amount,
            costPrice,
            addedAt: new Date().toISOString()
        });
        transactions.push({
            id: transactionId,
            assetId: newId,
            coinId,
            type: 'BUY',
            amount,
            price: costPrice,
            fee: 0,
            timestamp: Date.now()
        });
        showToast(tr('toast.assetAdded', { symbol: COIN_INFO[coinId].symbol }));
    }
    
    saveAssets();
    saveTransactions();
    invalidateComputedCaches();
}

/**
 * 鏇存柊璧勪骇
 */
function updateAsset(id, amount, costPrice) {
    const target = assets.find(asset => asset.id === id);
    if (!target) {
        showToast(tr('toast.invalidLocalData'), 'error');
        return false;
    }

    target.amount = amount;
    target.costPrice = costPrice;
    transactions = transactions.filter(tx => tx.assetId !== id);
    transactions.push({
        id: nextNumericId(),
        assetId: id,
        coinId: target.coinId,
        type: 'BUY',
        amount,
        price: costPrice,
        fee: 0,
        timestamp: Date.now()
    });
    saveAssets();
    saveTransactions();
    invalidateComputedCaches();
    showToast(tr('toast.assetUpdated', { symbol: COIN_INFO[target.coinId].symbol }));
    return true;
}

/**
 * 鍒犻櫎璧勪骇
 */
function removeAsset(id) {
    const index = assets.findIndex(a => a.id === id);
    if (index !== -1) {
        const asset = assets[index];
        assets.splice(index, 1);
        transactions = transactions.filter(tx => tx.assetId !== id);
        saveAssets();
        saveTransactions();
        invalidateComputedCaches();
        showToast(tr('toast.assetDeleted', { symbol: COIN_INFO[asset.coinId].symbol }));
    }
}

function setFormMode(mode, asset = null) {
    const isEdit = mode === 'edit';
    elements.submitBtn.textContent = isEdit ? tr('assets.form.save') : tr('assets.form.add');
    elements.cancelEditBtn.classList.toggle('hidden', !isEdit);

    if (!isEdit) {
        elements.editingIdInput.value = '';
        elements.coinSelect.disabled = false;
        elements.addAssetForm.reset();
        return;
    }

    elements.editingIdInput.value = String(asset.id);
    elements.coinSelect.value = asset.coinId;
    elements.coinSelect.disabled = true;
    elements.amountInput.value = String(asset.amount);
    elements.costPriceInput.value = String(asset.costPrice);
}

function getAssetTransactions(assetId) {
    if (!transactionsByAssetCache) {
        transactionsByAssetCache = buildTransactionsByAssetMap(transactions);
    }
    return transactionsByAssetCache.get(assetId) || [];
}

function calculateCostBasis(asset, method = settings.costMethod) {
    const cacheKey = `${method}:${asset.id}`;
    const cached = costBasisCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const related = getAssetTransactions(asset.id);
    const result = calculateCostBasisByMethod(asset, method, related);
    costBasisCache.set(cacheKey, result);
    return result;
}

function syncAssetWithTransactions(asset) {
    const basis = calculateCostBasis(asset, 'average');
    asset.amount = basis.amount;
    asset.costPrice = basis.avgCost;
}

function addTransaction(assetId, type, amount, price, fee) {
    const asset = assets.find(item => item.id === assetId);
    if (!asset) {
        showToast(tr('toast.invalidLocalData'), 'error');
        return false;
    }

    if (type === 'SELL' && amount > asset.amount + 1e-12) {
        showToast(tr('toast.invalidLocalData'), 'error');
        return false;
    }

    transactions.push({
        id: nextNumericId(),
        assetId,
        coinId: asset.coinId,
        type,
        amount,
        price,
        fee,
        timestamp: Date.now()
    });
    saveTransactions();

    invalidateComputedCaches();
    syncAssetWithTransactions(asset);
    saveAssets();
    return true;
}

function removeTransaction(id) {
    const index = transactions.findIndex(tx => tx.id === id);
    if (index === -1) return;
    const tx = transactions[index];
    transactions.splice(index, 1);
    saveTransactions();
    invalidateComputedCaches();

    const asset = assets.find(item => item.id === tx.assetId);
    if (asset) {
        syncAssetWithTransactions(asset);
        saveAssets();
    }
}

// ============================================
// UI 娓叉煋
// ============================================

/**
 * 娓叉煋璧勪骇鍒楄〃
 */
function renderAssets(showSkeleton = false) {
    if (showSkeleton && assets.length > 0) {
        const skeleton = Array.from({ length: Math.min(assets.length, 4) })
            .map(() => '<div class="skeleton-row"></div>')
            .join('');
        elements.assetsList.innerHTML = skeleton;
        elements.emptyState.style.display = 'none';
        if (elements.assetsTableHead) {
            elements.assetsTableHead.style.display = 'grid';
        }
        return;
    }

    if (assets.length === 0) {
        elements.emptyState.style.display = 'block';
        elements.assetsList.innerHTML = '';
        elements.assetsList.appendChild(elements.emptyState);
        if (elements.assetsTableHead) {
            elements.assetsTableHead.style.display = 'none';
        }
        return;
    }

    elements.emptyState.style.display = 'none';
    if (elements.assetsTableHead) {
        elements.assetsTableHead.style.display = 'grid';
    }
    const summaryStats = calculatePortfolioStats();
    const html = buildAssetsRows({
        assets,
        coinInfoMap: COIN_INFO,
        priceData,
        getCostBasis: calculateCostBasis,
        getCoinImageId,
        formatCurrency,
        formatNumber,
        formatPercent,
        summaryStats,
        escapeHtml,
        t: tr
    });

    elements.assetsList.innerHTML = html;
}

/**
 * 璁＄畻缁勫悎缁熻鏁版嵁
 */
function calculatePortfolioStats() {
    return computePortfolioStats(assets, priceData, calculateCostBasis);
}

function calculateRiskMetrics(stats) {
    return computeRiskMetrics(assets, priceData, snapshots, stats, calculateCostBasis);
}

function setValueColorClass(element, value) {
    element.classList.remove('positive', 'negative', 'neutral');
    if (value > 0) {
        element.classList.add('positive');
        return;
    }
    if (value < 0) {
        element.classList.add('negative');
        return;
    }
    element.classList.add('neutral');
}

function updateRiskSection(riskMetrics) {
    if (dashboardPresenter) {
        dashboardPresenter.updateRisk(riskMetrics);
    }
    elements.maxDrawdownValue.textContent = `${riskMetrics.maxDrawdown.toFixed(2)}%`;
    elements.top1ConcentrationValue.textContent = `${riskMetrics.top1Concentration.toFixed(2)}%`;
    elements.top3ConcentrationValue.textContent = `${riskMetrics.top3Concentration.toFixed(2)}%`;
    elements.volatilityValue.textContent = `${riskMetrics.volatility.toFixed(2)}%`;
    if (elements.var95Value) {
        elements.var95Value.textContent = `${riskMetrics.var95.toFixed(2)}%`;
    }
    if (elements.drawdownBandText) {
        let bandKey = 'label.bandLow';
        if (riskMetrics.drawdownBand === 'Medium') bandKey = 'label.bandMedium';
        if (riskMetrics.drawdownBand === 'High') bandKey = 'label.bandHigh';
        elements.drawdownBandText.textContent = tr('risk.band', { band: tr(bandKey) });
    }

    setValueColorClass(elements.maxDrawdownValue, riskMetrics.maxDrawdown);
    setValueColorClass(elements.top1ConcentrationValue, riskMetrics.top1Concentration - 35);
    setValueColorClass(elements.top3ConcentrationValue, riskMetrics.top3Concentration - 70);
    setValueColorClass(elements.volatilityValue, riskMetrics.volatility - 8);
    if (elements.var95Value) {
        setValueColorClass(elements.var95Value, 2 - riskMetrics.var95);
    }
}

function updateHeroPanel(stats, riskMetrics) {
    if (dashboardPresenter) {
        dashboardPresenter.updateHero(stats, riskMetrics, alertRules.filter(rule => rule.enabled).length);
    }
    if (!elements.heroTotalValue) return;
    animateTextNumber(elements.heroTotalValue, stats.totalValue, v => formatCurrency(v));
    animateTextNumber(elements.heroAssetCount, stats.assetCount, v => String(Math.round(v)));
    animateTextNumber(elements.heroMaxDrawdown, riskMetrics.maxDrawdown, v => `${v.toFixed(2)}%`);
    animateTextNumber(elements.heroEnabledAlerts, alertRules.filter(rule => rule.enabled).length, v => String(Math.round(v)));
    // Drawdown is inversed: higher value means worse.
    setValueColorClass(elements.heroMaxDrawdown, -riskMetrics.maxDrawdown);
}

function updateSettingsSummary() {
    if (!elements.settingsCostMethod) return;
    applyNavCollapsed(settings.navCollapsed);
    const methodText = settings.costMethod === 'fifo' ? tr('cost.fifo') : tr('cost.average');
    elements.settingsCostMethod.textContent = tr('label.current', { value: methodText });
    if (elements.settingsMacroMeta) {
        const modeText = settings.macroAnalysisMode === 'pro' ? tr('macro.modePro') : tr('macro.modeBrief');
        elements.settingsMacroMeta.textContent = tr('settings.macro.summary', {
            window: settings.macroWindow,
            mode: modeText
        });
    }
    if (elements.macroEnabledToggle) {
        elements.macroEnabledToggle.checked = Boolean(settings.macroEnabled);
    }
    if (elements.macroRefreshIntervalInput) {
        elements.macroRefreshIntervalInput.value = String(settings.macroRefreshIntervalSec);
    }
    if (elements.macroAnalysisModeSelect) {
        elements.macroAnalysisModeSelect.value = settings.macroAnalysisMode;
    }
    if (elements.macroWindowSwitch) {
        elements.macroWindowSwitch.querySelectorAll('button[data-macro-window]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.macroWindow === settings.macroWindow);
        });
    }
    if (elements.settingsDemoModeMeta) {
        const modeValue = settings.demoMode ? tr('settings.demo.on') : tr('settings.demo.off');
        elements.settingsDemoModeMeta.textContent = tr('settings.demo.mode.summary', { value: modeValue });
    }
    if (elements.settingsNewsMeta) {
        const modeText = settings.newsAnalysisMode === 'pro' ? tr('news.mode.pro') : tr('news.mode.brief');
        elements.settingsNewsMeta.textContent = tr('settings.news.summary', {
            topic: tr(`news.topic.${settings.newsTopic || 'all'}`),
            since: tr(`news.since.${settings.newsSince || '24h'}`),
            mode: modeText
        });
    }
    if (elements.newsEnabledToggle) {
        elements.newsEnabledToggle.checked = Boolean(settings.newsEnabled);
    }
    if (elements.newsRefreshIntervalInput) {
        elements.newsRefreshIntervalInput.value = String(settings.newsRefreshIntervalSec || 300);
    }
    if (elements.newsTopicSelect) {
        elements.newsTopicSelect.value = settings.newsTopic || 'all';
    }
    if (elements.newsSinceSelect) {
        elements.newsSinceSelect.value = settings.newsSince || '24h';
    }
    if (elements.newsAnalysisModeSelect) {
        elements.newsAnalysisModeSelect.value = settings.newsAnalysisMode || 'brief';
    }
    if (elements.petEnabledToggle) {
        elements.petEnabledToggle.checked = Boolean(settings.petEnabled);
    }
    desktopPet?.sync();
    if (elements.settingsCalendarMeta) {
        elements.settingsCalendarMeta.textContent = tr('settings.calendar.summary', {
            window: tr(`calendar.window.${settings.calendarWindow || '7d'}`),
            importance: tr(`calendar.importance.${settings.calendarImportance || 'all'}`)
        });
    }
    if (elements.calendarEnabledToggle) {
        elements.calendarEnabledToggle.checked = Boolean(settings.calendarEnabled);
    }
    if (elements.calendarWindowSelect) {
        elements.calendarWindowSelect.value = settings.calendarWindow || '7d';
    }
    if (elements.calendarImportanceSelect) {
        elements.calendarImportanceSelect.value = settings.calendarImportance || 'all';
    }
    if (elements.decisionModeSelect) {
        elements.decisionModeSelect.value = settings.decisionMode || 'brief';
    }
    if (elements.settingsLastBackupMeta) {
        const backupText = settings.lastDemoBackupAt ? formatTime(settings.lastDemoBackupAt) : '--';
        elements.settingsLastBackupMeta.textContent = tr('settings.demo.backup.summary', { value: backupText });
    }
    if (elements.demoAuditMeta && demoAudit) {
        const count = demoAudit.read().length;
        elements.demoAuditMeta.textContent = tr('settings.demo.audit.summary', { count });
    }
    if (elements.attributionWindowSelect) {
        elements.attributionWindowSelect.value = settings.attributionWindow || '24h';
    }
}

function buildStrategyTargetInputs() {
    if (!elements.strategyTargetsList) return;
    const stats = calculatePortfolioStats();
    const totalValue = stats.totalValue || 0;
    const byCoin = assets
        .map(asset => {
            const basis = calculateCostBasis(asset);
            const price = priceData[asset.coinId]?.usd || 0;
            return {
                coinId: asset.coinId,
                symbol: COIN_INFO[asset.coinId]?.symbol || 'UNK',
                value: basis.amount * price
            };
        })
        .filter(item => item.value > 0);
    const uniqueCoins = [...new Set(byCoin.map(item => item.coinId))];

    if (uniqueCoins.length === 0 || totalValue <= 0) {
        elements.strategyTargetsList.innerHTML = `<p class="section-meta">${tr('strategy.empty')}</p>`;
        return;
    }

    const html = uniqueCoins.map(coinId => {
        const symbol = COIN_INFO[coinId]?.symbol || 'UNK';
        const currentValue = byCoin.filter(item => item.coinId === coinId).reduce((sum, item) => sum + item.value, 0);
        const defaultWeight = (currentValue / totalValue) * 100;
        const savedWeight = Number(settings.strategyTargets?.[coinId]);
        const nextValue = Number.isFinite(savedWeight) ? savedWeight : defaultWeight;
        return `
            <div class="lab-target-item">
                <label>${escapeHtml(symbol)}</label>
                <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    data-strategy-target="${coinId}"
                    value="${nextValue.toFixed(2)}"
                />
            </div>
        `;
    }).join('');
    elements.strategyTargetsList.innerHTML = html;
}

function readStrategyTargetsFromInputs() {
    const targets = {};
    if (!elements.strategyTargetsList) return targets;
    elements.strategyTargetsList.querySelectorAll('input[data-strategy-target]').forEach(input => {
        const coinId = input.getAttribute('data-strategy-target');
        if (!coinId) return;
        const value = Number(input.value);
        if (Number.isFinite(value) && value >= 0) {
            targets[coinId] = value;
        }
    });
    return targets;
}

function evaluateStrategyLab() {
    const targets = readStrategyTargetsFromInputs();
    settings.strategyTargets = targets;
    saveSettings();

    const totalTarget = Object.values(targets).reduce((sum, value) => sum + value, 0);
    if (totalTarget <= 0) {
        elements.strategyResultSummary.innerHTML = `<p class="section-meta">${tr('strategy.error.totalRequired')}</p>`;
        elements.strategyResultTable.innerHTML = '';
        strategyResult = null;
        return { ok: false, errorCode: 'target_required' };
    }

    strategyResult = evaluateRebalance({
        assets,
        priceData,
        getCostBasis: calculateCostBasis,
        targetWeights: targets,
        constraints: {
            maxSingleAssetPct: Number(elements.strategyMaxSingleInput?.value || 40),
            minStablePct: Number(elements.strategyMinStableInput?.value || 15),
            minTradeUsd: Number(elements.strategyMinTradeInput?.value || 25)
        },
        coinInfoMap: COIN_INFO,
        stableCoinIds: STABLE_COIN_IDS
    });

    elements.strategyResultSummary.innerHTML = buildStrategySummary(strategyResult?.summary, {
        formatPercent,
        formatCurrency,
        t: tr
    });
    elements.strategyResultTable.innerHTML = buildStrategyRows(strategyResult, {
        formatCurrency,
        formatPercent,
        formatNumber,
        t: tr
    });
    if (elements.strategyStatusText) {
        elements.strategyStatusText.textContent = tr('strategy.status.success', {
            time: formatTime(Date.now()),
            count: strategyResult?.rows?.length || 0
        });
        elements.strategyStatusText.className = 'lab-status-text is-success';
    }
    markLabResultUpdated('strategy');
    return {
        ok: true,
        rowCount: strategyResult?.rows?.length || 0
    };
}

function parseCustomStressMap(raw) {
    if (!raw || !String(raw).trim()) return null;
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
        const byCoin = {};
        Object.entries(parsed).forEach(([coinId, shock]) => {
            const value = Number(shock);
            if (Number.isFinite(value)) {
                byCoin[String(coinId)] = value;
            }
        });
        return { byCoin };
    } catch (_error) {
        return null;
    }
}

function runStressTest() {
    let scenario = getPresetById(settings.stressLastScenarioId || 'risk_off');
    scenario = {
        ...scenario,
        label: tr(`stress.presetLabel.${scenario.id}`),
        note: tr(`stress.presetNote.${scenario.id}`)
    };
    const customShocks = parseCustomStressMap(elements.stressCustomJsonInput?.value || '');
    if (customShocks) {
        scenario = {
            id: 'custom',
            label: tr('stress.customLabel'),
            shocks: customShocks,
            note: tr('stress.customNote')
        };
    }

    stressResult = runScenario({
        assets,
        priceData,
        getCostBasis: calculateCostBasis,
        coinInfoMap: COIN_INFO,
        stableCoinIds: STABLE_COIN_IDS
    }, scenario);

    elements.stressResultSummary.innerHTML = buildStressSummary(stressResult, {
        formatCurrency,
        formatPercent,
        t: tr
    });
    elements.stressResultTable.innerHTML = buildStressRows(stressResult, {
        formatCurrency,
        formatPercent,
        t: tr
    });
    if (elements.stressStatusText) {
        const rowCount = stressResult?.rows?.length || 0;
        if (rowCount > 0) {
            elements.stressStatusText.textContent = tr('stress.status.success', {
                time: formatTime(Date.now()),
                count: rowCount
            });
            elements.stressStatusText.className = 'lab-status-text is-success';
        } else {
            elements.stressStatusText.textContent = tr('stress.status.empty');
            elements.stressStatusText.className = 'lab-status-text is-empty';
        }
    }
    markLabResultUpdated('stress');
    return {
        ok: true,
        rowCount: stressResult?.rows?.length || 0
    };
}

function renderStressPresets() {
    if (!elements.stressPresetSelect) return;
    elements.stressPresetSelect.innerHTML = STRESS_PRESETS.map(item =>
        `<option value="${item.id}">${escapeHtml(tr(`stress.presetLabel.${item.id}`))}</option>`
    ).join('');
    elements.stressPresetSelect.value = settings.stressLastScenarioId || 'risk_off';
}

function renderAttribution() {
    attributionResult = computeAttribution({
        assets,
        priceData,
        getCostBasis: calculateCostBasis,
        coinInfoMap: COIN_INFO,
        window: settings.attributionWindow || '24h'
    });
    elements.attributionSummary.innerHTML = buildAttributionSummary(attributionResult, {
        formatCurrency,
        formatPercent,
        t: tr
    });
    elements.attributionTable.innerHTML = buildAttributionRows(attributionResult, {
        formatCurrency,
        formatPercent,
        t: tr
    });
    if (elements.attributionStatusText) {
        const rowCount = attributionResult?.rows?.length || 0;
        if (rowCount > 0) {
            elements.attributionStatusText.textContent = tr('attribution.status.success', {
                time: formatTime(Date.now()),
                count: rowCount
            });
            elements.attributionStatusText.className = 'lab-status-text is-success';
        } else {
            elements.attributionStatusText.textContent = tr('attribution.status.empty');
            elements.attributionStatusText.className = 'lab-status-text is-empty';
        }
    }
}

function exportAnalysisSnapshot() {
    const snapshot = buildAnalysisSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cryptofolio-analysis-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(tr('strategy.exported'));
}

function buildAnalysisSnapshot() {
    return {
        timestamp: Date.now(),
        strategy: strategyResult,
        stress: stressResult,
        attribution: attributionResult,
        metadata: {
            locale: settings.locale || 'en-US',
            version: 'analysis-snapshot-v1'
        }
    };
}

function renderDecisionWorkspace() {
    if (!elements.strategyTargetsList) return;
    buildStrategyTargetInputs();
    evaluateStrategyLab();
    renderStressPresets();
    runStressTest();
    renderAttribution();
    renderDecisionSummaryCard();
}

function renderDecisionSummaryCard() {
    if (!elements.decisionWorkspaceCard) return;
    const result = computeDecision({
        macro: macroIntel?.getAnalysis?.(),
        news: newsIntel?.getAnalysis?.(),
        stress: stressResult ? {
            deltaPct: Number(stressResult.deltaPct || 0)
        } : null,
        calendar: econCalendarIntel?.getAnalysis?.()
    });
    elements.decisionWorkspaceCard.innerHTML = renderDecisionCard(result, {
        t: tr,
        formatPercent,
        escapeHtml,
        mode: settings.decisionMode || 'brief'
    });
}

function handlePerformanceRangeClick(e) {
    const btn = e.target.closest('button[data-range]');
    if (!btn) return;
    const range = btn.dataset.range;
    if (!['1D', '1W', '1M', 'ALL'].includes(range)) return;
    settings.performanceRange = range;
    saveSettings();
    renderPerformanceChart();
    renderTotalSparkline();
}

function exportAllData() {
    const payload = dataTransferService
        ? dataTransferService.buildExportPayload({ assets, snapshots, transactions, alertRules, alertHistory, settings })
        : {
            exportedAt: new Date().toISOString(),
            version: 1,
            data: { assets, snapshots, transactions, alertRules, alertHistory, settings }
        };
    payload.analysisSnapshot = buildAnalysisSnapshot();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cryptofolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(tr('toast.exported'));
}

function importDataPayload(payload, options = {}) {
    const normalized = dataTransferService
        ? dataTransferService.normalizePayload(payload)
        : (() => {
            const data = payload?.data || payload;
            if (!data || typeof data !== 'object') throw new Error('invalid');
            return {
                assets: Array.isArray(data.assets) ? data.assets : [],
                snapshots: Array.isArray(data.snapshots) ? data.snapshots : [],
                transactions: Array.isArray(data.transactions) ? data.transactions : [],
                alertRules: Array.isArray(data.alertRules) ? data.alertRules : [],
                alertHistory: Array.isArray(data.alertHistory) ? data.alertHistory : [],
                settings: data.settings || {},
                dropped: 0
            };
        })();
    const nextSettings = loadSettingsData(JSON.stringify(normalized.settings || {}));

    assets = normalized.assets;
    snapshots = normalized.snapshots;
    transactions = normalized.transactions;
    alertRules = normalized.alertRules;
    alertHistory = normalized.alertHistory;
    settings = { ...settings, ...nextSettings };
    const dropped = normalized.dropped;

    saveAssets();
    saveSnapshots();
    saveTransactions();
    saveAlertRules();
    saveAlertHistory();
    saveSettings();
    invalidateComputedCaches();
    applyLocale(settings.locale);
    applyTheme(settings.theme);
    applyDemoMode(settings.demoMode);
    elements.costMethodSelect.value = settings.costMethod;
    updateSettingsSummary();
    setInlineError('asset', '');

    const kept = assets.length + snapshots.length + transactions.length + alertRules.length + alertHistory.length;
    if (options.source === 'demo') {
        showToast(tr('toast.demoLoaded', {
            assets: assets.length,
            transactions: transactions.length,
            alerts: alertRules.length
        }));
    } else {
        showToast(tr('toast.importSummary', { kept, dropped }));
    }
}

function importAllDataFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const parsed = JSON.parse(String(reader.result || '{}'));
            importDataPayload(parsed, { source: 'file' });
            refreshData();
        } catch (error) {
            console.error('Import failed', error);
            setInlineError('asset', tr('error.importInvalid'));
            showToast(tr('toast.importFailed'), 'error');
        } finally {
            elements.importDataInput.value = '';
        }
    };
    reader.readAsText(file, 'utf-8');
}

async function loadDemoData() {
    const confirmed = await confirmDialog.confirm({
        title: tr('settings.demo.title'),
        message: tr('confirm.loadDemo'),
        confirmText: tr('button.loadDemo'),
        cancelText: tr('button.close'),
        tone: 'danger'
    });
    if (!confirmed) return;
    try {
        backupBeforeDemo({
            assets: [...assets],
            snapshots: [...snapshots],
            transactions: [...transactions],
            alertRules: [...alertRules],
            alertHistory: [...alertHistory],
            settings: { ...settings }
        });
        settings.lastDemoBackupAt = Date.now();
        saveSettings();
        updateSettingsSummary();
        const demoPayload = loadRealisticSnapshotDemo();
        importDataPayload(demoPayload, { source: 'demo' });
        if (demoAudit) {
            demoAudit.append('load_demo', `assets=${demoPayload?.data?.assets?.length || 0}`);
        }
        await refreshData();
    } catch (error) {
        console.error('Demo load failed', error);
        showToast(tr('toast.importFailed'), 'error');
    }
}

function restoreDemoData() {
    const backup = restoreFromDemoBackup();
    if (!backup) {
        showToast(tr('toast.importFailed'), 'error');
        return;
    }
    try {
        importDataPayload({ data: backup }, { source: 'file' });
        if (demoAudit) {
            demoAudit.append('restore_demo', `assets=${backup?.assets?.length || 0}`);
        }
        window.location.hash = '#/dashboard';
        applyRoute('dashboard');
        showToast(tr('toast.demoRestored'));
        void refreshData();
    } catch (error) {
        console.error('Demo restore failed', error);
        showToast(tr('toast.importFailed'), 'error');
    }
}

/**
 * 鏇存柊鎬昏鏁版嵁
 */
function updateSummary() {
    const stats = calculatePortfolioStats();
    if (dashboardPresenter) {
        dashboardPresenter.updateSummary(stats);
    }

    const totalValue = stats.totalValue;
    const totalProfit = stats.totalProfit;
    const profitPercent = stats.profitPercent;

    animateTextNumber(elements.totalValue, totalValue, v => formatCurrency(v));
    animateTextNumber(elements.profitValue, totalProfit, v => `${v >= 0 ? '+' : ''}${formatCurrency(v)}`);
    animateTextNumber(elements.profitPercent, profitPercent, v => `(${formatPercent(v)})`);
    animateTextNumber(elements.totalCostValue, stats.totalCost, v => formatCurrency(v));
    animateTextNumber(elements.assetCountValue, stats.assetCount, v => String(Math.round(v)));
    animateTextNumber(elements.dailyPnlValue, stats.dailyPnl, v => `${v >= 0 ? '+' : ''}${formatCurrency(v)}`);
    animateTextNumber(elements.dailyPnlPercent, stats.dailyPnlPercent, v => formatPercent(v));
    setValueColorClass(elements.dailyPnlValue, stats.dailyPnl);
    setValueColorClass(elements.dailyPnlPercent, stats.dailyPnlPercent);
    
    // 鏇存柊鐩堜簭鏍峰紡
    elements.totalProfitLoss.className = `profit-loss ${totalProfit >= 0 ? 'positive' : 'negative'}`;
    return stats;
}

/**
 * 娓叉煋楗煎浘
 */
function renderChart() {
    if (chartManager) {
        chartManager.renderPortfolioChart();
        return;
    }
    const ctx = document.getElementById('portfolioChart').getContext('2d');
    
    // 璁＄畻鍚勫竵绉嶅崰姣?
    const chartData = assets.map(asset => {
        const price = priceData[asset.coinId]?.usd || 0;
        const basis = calculateCostBasis(asset);
        const coin = COIN_INFO[asset.coinId] || { symbol: 'UNK', color: '#64748b' };
        return {
            label: coin.symbol,
            value: basis.amount * price,
            color: coin.color
        };
    }).filter(d => d.value > 0);
    
    if (portfolioChart) {
        portfolioChart.destroy();
    }
    
    if (chartData.length === 0) {
        return;
    }
    
    portfolioChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.map(d => d.label),
            datasets: [{
                data: chartData.map(d => d.value),
                backgroundColor: chartData.map(d => d.color),
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(18, 18, 26, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#a0a0b0',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percent = ((context.raw / total) * 100).toFixed(1);
                            return `${formatCurrency(context.raw)} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

function recordSnapshot(totalValue) {
    if (!Number.isFinite(totalValue)) return;
    const now = Date.now();
    const lastSnapshot = snapshots[snapshots.length - 1];
    if (lastSnapshot && now - lastSnapshot.timestamp < SNAPSHOT_INTERVAL) {
        return;
    }

    snapshots.push({
        timestamp: now,
        value: totalValue
    });

    if (snapshots.length > MAX_SNAPSHOT_POINTS) {
        snapshots = snapshots.slice(-MAX_SNAPSHOT_POINTS);
    }
    saveSnapshots();
}

function renderPerformanceChart() {
    if (chartManager) {
        chartManager.renderPerformanceChart();
        return;
    }
    const ctx = document.getElementById('performanceChart').getContext('2d');
    if (elements.rangeSwitch) {
        elements.rangeSwitch.querySelectorAll('.range-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.range === settings.performanceRange);
        });
    }
    if (performanceChart) {
        performanceChart.destroy();
    }

    const points = getFilteredSnapshots();
    if (points.length < 2) {
        return;
    }

    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: points.map(point => {
                const date = new Date(point.timestamp);
                return date.toLocaleTimeString(settings.locale || 'en-US', { hour: '2-digit', minute: '2-digit' });
            }),
            datasets: [{
                label: tr('summary.totalValue'),
                data: points.map(point => point.value),
                borderColor: '#ff7a33',
                backgroundColor: 'rgba(255, 122, 51, 0.18)',
                borderWidth: 2,
                fill: true,
                tension: 0.25,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: context => formatCurrency(context.raw)
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#a0a0b0',
                        maxTicksLimit: 8
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.06)'
                    }
                },
                y: {
                    ticks: {
                        color: '#a0a0b0',
                        callback: value => formatCurrency(value, 0)
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.06)'
                    }
                }
            }
        }
    });

}

function renderTotalSparkline() {
    if (chartManager) {
        chartManager.renderSparkline();
        return;
    }
    if (!elements.totalSparkline) return;
    const ctx = elements.totalSparkline.getContext('2d');
    if (sparklineChart) {
        sparklineChart.destroy();
    }
    const points = getFilteredSnapshots().slice(-24);
    if (points.length < 2) return;

    const first = points[0]?.value || 0;
    const last = points[points.length - 1]?.value || 0;
    const up = last >= first;
    const color = up ? '#10b981' : '#ef4444';
    const fill = up ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';

    sparklineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: points.map((_, index) => String(index)),
            datasets: [{
                data: points.map(p => p.value),
                borderColor: color,
                backgroundColor: fill,
                borderWidth: 1.8,
                fill: true,
                pointRadius: 0,
                tension: 0.25
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: { x: { display: false }, y: { display: false } }
        }
    });
}

function renderTransactionAssetOptions() {
    const currentValue = elements.txAssetSelect.value;
    const options = assets.map(asset => {
        const coin = COIN_INFO[asset.coinId];
        return `<option value="${asset.id}">${escapeHtml(coin?.symbol || 'UNK')} - ${escapeHtml(coin?.name || 'Unknown Asset')}</option>`;
    }).join('');

    elements.txAssetSelect.innerHTML = `<option value="">${escapeHtml(tr('placeholder.selectAsset'))}</option>${options}`;
    if (currentValue && assets.some(asset => String(asset.id) === currentValue)) {
        elements.txAssetSelect.value = currentValue;
    }

    if (elements.txFilterCoin) {
        const uniqueCoins = [...new Set(assets.map(asset => asset.coinId))];
        const currentFilter = transactionFilters.getState().coinId;
        const filterOptions = uniqueCoins
            .map(coinId => `<option value="${coinId}">${escapeHtml(COIN_INFO[coinId]?.symbol || coinId)}</option>`)
            .join('');
        elements.txFilterCoin.innerHTML = `<option value="ALL">${escapeHtml(tr('filter.allCoins'))}</option>${filterOptions}`;
        elements.txFilterCoin.value = uniqueCoins.includes(currentFilter) ? currentFilter : 'ALL';
        transactionFilters.setFromControls(elements);
    }

    const submitButton = elements.transactionForm.querySelector('button[type="submit"]');
    const hasAssets = assets.length > 0;
    elements.txAssetSelect.disabled = !hasAssets;
    elements.txAmount.disabled = !hasAssets;
    elements.txPrice.disabled = !hasAssets;
    elements.txFee.disabled = !hasAssets;
    elements.txType.disabled = !hasAssets;
    submitButton.disabled = !hasAssets;
}

function renderTransactions() {
    const filteredTransactions = getFilteredTransactions();
    if (filteredTransactions.length === 0) {
        const currentFilters = transactionFilters.getState();
        const hasFilter = currentFilters.coinId !== 'ALL' || currentFilters.type !== 'ALL' || currentFilters.range !== 'ALL';
        elements.txEmpty.textContent = hasFilter ? tr('tx.empty.filtered') : tr('tx.empty');
        elements.txList.innerHTML = '';
        elements.txList.appendChild(elements.txEmpty);
        return;
    }

    const html = buildTransactionsRows({
        transactions: filteredTransactions,
        coinInfoMap: COIN_INFO,
        formatCurrency,
        formatNumber,
        locale: settings.locale || 'en-US',
        escapeHtml,
        t: tr
    });
    elements.txList.innerHTML = html;
}

function getFilteredTransactions() {
    return transactionFilters.filterTransactions(transactions);
}

function handleTransactionFiltersChange() {
    transactionFilters.setFromControls(elements);
    renderTransactions();
}

function handleTransactionSubmit(e) {
    if (!transactionController) return;
    transactionController.handleTransactionSubmit(e);
}

function handleTransactionListClick(e) {
    if (!transactionController) return;
    transactionController.handleTransactionListClick(e);
}

function handleCostMethodChange(e) {
    if (!settingsController) return;
    settingsController.handleCostMethodChange(e);
}

function rerenderLocalizedViews() {
    if (elements.marketStatus) {
        const degraded = elements.errorBanner && !elements.errorBanner.classList.contains('hidden');
        elements.marketStatus.textContent = degraded ? tr('header.marketDegraded') : tr('header.marketLive');
    }
    updateLastUpdateTime();
    renderAssets();
    renderTransactionAssetOptions();
    renderTransactions();
    renderAlertCoinOptions();
    renderAlertRules();
    renderAlertHistory();
    renderDecisionWorkspace();
    updateSettingsSummary();
    renderPerformanceChart();
    renderTotalSparkline();
    macroIntel?.rerender();
    newsIntel?.rerender();
    econCalendarIntel?.rerender();
    renderDecisionSummaryCard();
}

function handleLocaleChange(e) {
    const locale = e?.target?.value || settings.locale;
    applyLocale(locale);
    saveSettings();
    rerenderLocalizedViews();
}

function handleQuickLocaleToggle() {
    const nextLocale = settings.locale === 'zh-CN' ? 'en-US' : 'zh-CN';
    applyLocale(nextLocale);
    saveSettings();
    rerenderLocalizedViews();
}

function handleMacroWindowClick(e) {
    const btn = e.target.closest('button[data-macro-window]');
    if (!btn) return;
    const value = btn.dataset.macroWindow === '90D' ? '90D' : '30D';
    if (settings.macroWindow === value) return;
    settings.macroWindow = value;
    saveSettings();
    updateSettingsSummary();
    void macroIntel?.refresh({ force: true });
}

function handleMacroAnalysisModeChange(e) {
    const nextMode = e?.target?.value === 'pro' ? 'pro' : 'brief';
    settings.macroAnalysisMode = nextMode;
    saveSettings();
    updateSettingsSummary();
    macroIntel?.rerender();
}

function handleMacroEnabledToggle(e) {
    settings.macroEnabled = Boolean(e?.target?.checked);
    saveSettings();
    updateSettingsSummary();
    void macroIntel?.refresh({ force: true });
}

function handleMacroRefreshIntervalChange(e) {
    const value = Number(e?.target?.value);
    settings.macroRefreshIntervalSec = Number.isFinite(value)
        ? Math.min(1800, Math.max(60, Math.round(value)))
        : 300;
    saveSettings();
    updateSettingsSummary();
    macroIntel?.rerender();
}

function handleMacroRefreshManual() {
    void macroIntel?.refresh({ force: true });
}

function handleNewsTopicChange(e) {
    const value = e?.target?.value;
    settings.newsTopic = ['all', 'macro', 'crypto', 'rates'].includes(value) ? value : 'all';
    saveSettings();
    updateSettingsSummary();
    void newsIntel?.refresh({ force: true });
}

function handleNewsSinceChange(e) {
    const value = e?.target?.value;
    settings.newsSince = ['1h', '24h', '7d'].includes(value) ? value : '24h';
    saveSettings();
    updateSettingsSummary();
    void newsIntel?.refresh({ force: true });
}

function handleNewsAnalysisModeChange(e) {
    settings.newsAnalysisMode = e?.target?.value === 'pro' ? 'pro' : 'brief';
    saveSettings();
    updateSettingsSummary();
    newsIntel?.rerender();
}

function handleNewsRefreshIntervalChange(e) {
    const value = Number(e?.target?.value);
    settings.newsRefreshIntervalSec = Number.isFinite(value)
        ? Math.min(1800, Math.max(60, Math.round(value)))
        : 300;
    saveSettings();
    updateSettingsSummary();
    newsIntel?.rerender();
}

function handleNewsEnabledToggle(e) {
    settings.newsEnabled = Boolean(e?.target?.checked);
    saveSettings();
    updateSettingsSummary();
    void newsIntel?.refresh({ force: true });
}

function handleNewsRefreshManual() {
    void newsIntel?.refresh({ force: true });
}

function handleCalendarWindowChange(e) {
    const value = e?.target?.value;
    settings.calendarWindow = ['1d', '7d'].includes(value) ? value : '7d';
    saveSettings();
    updateSettingsSummary();
    void econCalendarIntel?.refresh({ force: true });
}

function handleCalendarImportanceChange(e) {
    const value = e?.target?.value;
    settings.calendarImportance = ['all', 'high'].includes(value) ? value : 'all';
    saveSettings();
    updateSettingsSummary();
    void econCalendarIntel?.refresh({ force: true });
}

function handleCalendarEnabledToggle(e) {
    settings.calendarEnabled = Boolean(e?.target?.checked);
    saveSettings();
    updateSettingsSummary();
    void econCalendarIntel?.refresh({ force: true });
}

function handleCalendarRefreshManual() {
    void econCalendarIntel?.refresh({ force: true });
}

function handleDecisionModeChange(e) {
    settings.decisionMode = e?.target?.value === 'pro' ? 'pro' : 'brief';
    saveSettings();
    updateSettingsSummary();
    renderDecisionSummaryCard();
}

function handlePetEnabledToggle(e) {
    settings.petEnabled = Boolean(e?.target?.checked);
    settings.petDismissed = !settings.petEnabled;
    saveSettings();
    desktopPet?.sync();
}

function handleDesktopPetAction(action) {
    if (action === 'close') {
        settings.petEnabled = false;
        settings.petDismissed = true;
        if (elements.petEnabledToggle) {
            elements.petEnabledToggle.checked = false;
        }
        saveSettings();
        desktopPet?.sync();
        return;
    }
    if (action === 'news') {
        window.location.hash = '#/news';
        applyRoute('news');
        return;
    }
    if (action === 'stress') {
        window.location.hash = '#/stress';
        applyRoute('stress');
        return;
    }
    if (action === 'refresh') {
        refreshData();
    }
}

function getNewsPortfolioContext() {
    const stats = calculatePortfolioStats();
    const topAssets = assets
        .map(asset => {
            const coin = COIN_INFO[asset.coinId] || { symbol: 'UNK' };
            const basis = calculateCostBasis(asset);
            const price = priceData[asset.coinId]?.usd || 0;
            return {
                coinId: asset.coinId,
                symbol: coin.symbol,
                value: basis.amount * price
            };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    return {
        totalValue: stats.totalValue,
        assetCount: stats.assetCount,
        topAssets
    };
}

function mapSymbolToCoinId(symbol) {
    const needle = String(symbol || '').trim().toUpperCase();
    if (!needle) return null;
    const entries = Object.entries(COIN_INFO);
    const matched = entries.find(([, info]) => String(info?.symbol || '').toUpperCase() === needle);
    return matched ? matched[0] : null;
}

function handleNewsJumpToSymbol(symbol) {
    const coinId = mapSymbolToCoinId(symbol);
    if (!coinId) {
        showToast(tr('news.jumpUnavailable'));
        return;
    }
    window.location.hash = '#/assets';
    applyRoute('assets');
    if (elements.coinSelect) {
        elements.coinSelect.value = coinId;
        elements.coinSelect.focus();
    }
    showToast(tr('news.jumpToAsset', { symbol }));
}

function handleStrategyEvaluate() {
    if (labActionState.strategy === 'running' || labActionState.strategy === 'validating') return;
    const startedAt = Date.now();
    setLabActionState('strategy', 'validating');
    Promise.resolve().then(() => {
        setLabActionState('strategy', 'running');
        const result = evaluateStrategyLab();
        if (!result?.ok) {
            setLabActionState('strategy', 'error', { message: tr('strategy.error.totalRequired') });
            writeActionAudit({
                action: 'strategy_evaluate',
                startedAt,
                durationMs: Date.now() - startedAt,
                status: 'error',
                errorCode: result?.errorCode || 'unknown'
            });
            return;
        }
        if ((result?.rowCount || 0) === 0) {
            const message = tr('strategy.status.empty');
            setLabActionState('strategy', 'empty', { message });
            writeActionAudit({
                action: 'strategy_evaluate',
                startedAt,
                durationMs: Date.now() - startedAt,
                status: 'empty',
                errorCode: 'no_rows'
            });
            return;
        }
        setLabActionState('strategy', 'success');
        writeActionAudit({
            action: 'strategy_evaluate',
            startedAt,
            durationMs: Date.now() - startedAt,
            status: 'success',
            errorCode: null
        });
    }).catch(error => {
        setLabActionState('strategy', 'error', { message: error?.message || tr('error.checkInput') });
        writeActionAudit({
            action: 'strategy_evaluate',
            startedAt,
            durationMs: Date.now() - startedAt,
            status: 'error',
            errorCode: error?.name || 'exception'
        });
    });
}

function handleStrategyExport() {
    exportAnalysisSnapshot();
}

function handleStressPresetChange(e) {
    const nextPresetId = e?.target?.value || 'risk_off';
    settings.stressLastScenarioId = nextPresetId;
    saveSettings();
    handleStressRun();
}

function handleStressRun() {
    if (labActionState.stress === 'running' || labActionState.stress === 'validating') return;
    const startedAt = Date.now();
    setLabActionState('stress', 'validating');
    Promise.resolve().then(() => {
        setLabActionState('stress', 'running');
        const result = runStressTest();
        if ((result?.rowCount || 0) === 0) {
            const message = tr('stress.status.empty');
            setLabActionState('stress', 'empty', { message });
            writeActionAudit({
                action: 'stress_run',
                startedAt,
                durationMs: Date.now() - startedAt,
                status: 'empty',
                errorCode: 'no_rows'
            });
            return;
        }
        setLabActionState('stress', 'success');
        writeActionAudit({
            action: 'stress_run',
            startedAt,
            durationMs: Date.now() - startedAt,
            status: 'success',
            errorCode: null
        });
    }).catch(error => {
        setLabActionState('stress', 'error', { message: error?.message || tr('error.checkInput') });
        writeActionAudit({
            action: 'stress_run',
            startedAt,
            durationMs: Date.now() - startedAt,
            status: 'error',
            errorCode: error?.name || 'exception'
        });
    });
}

function handleAttributionWindowChange(e) {
    const value = e?.target?.value === '7d' ? '7d' : '24h';
    settings.attributionWindow = value;
    saveSettings();
    updateSettingsSummary();
    renderAttribution();
}

function handleAttributionRun() {
    renderAttribution();
}

function handleDemoModeToggle(e) {
    applyDemoMode(Boolean(e?.target?.checked));
    saveSettings();
    updateSettingsSummary();
    if (demoAudit) {
        demoAudit.append('toggle_demo_mode', settings.demoMode ? 'enabled' : 'disabled');
    }
}

function handleNetworkStatusChange() {
    refreshScheduler?.onNetworkChange();
    if (!navigator.onLine) {
        showErrorBanner(tr('banner.offlineMode'));
        showToast(tr('toast.offlineMode'), 'error');
        if (elements.marketStatus) {
            elements.marketStatus.textContent = tr('header.marketOffline');
        }
        return;
    }
    hideErrorBanner();
    if (elements.marketStatus) {
        elements.marketStatus.textContent = tr('header.marketLive');
    }
    showToast(tr('toast.onlineBack'));
}

function handleResetData() {
    if (!settingsController) return;
    settingsController.handleResetData();
}

function formatRuleLabel(rule) {
    if (rule.type === 'PRICE_ABOVE') {
        return tr('rule.priceAbove', {
            symbol: COIN_INFO[rule.coinId]?.symbol || rule.coinId,
            threshold: formatCurrency(rule.threshold)
        });
    }
    if (rule.type === 'PRICE_BELOW') {
        return tr('rule.priceBelow', {
            symbol: COIN_INFO[rule.coinId]?.symbol || rule.coinId,
            threshold: formatCurrency(rule.threshold)
        });
    }
    if (rule.type === 'POSITION_ABOVE') {
        return tr('rule.positionAbove', {
            symbol: COIN_INFO[rule.coinId]?.symbol || rule.coinId,
            threshold: rule.threshold.toFixed(2)
        });
    }
    return tr('rule.drawdownAbove', { threshold: rule.threshold.toFixed(2) });
}

function renderAlertCoinOptions() {
    const coinIds = [...new Set(assets.map(asset => asset.coinId))];
    const selected = elements.alertCoinSelect.value;
    const options = coinIds
        .map(coinId => `<option value="${coinId}">${escapeHtml(COIN_INFO[coinId]?.symbol || coinId)} - ${escapeHtml(COIN_INFO[coinId]?.name || 'Unknown Asset')}</option>`)
        .join('');
    elements.alertCoinSelect.innerHTML = `<option value="">${escapeHtml(tr('placeholder.selectCoin'))}</option>${options}`;
    if (selected && coinIds.includes(selected)) {
        elements.alertCoinSelect.value = selected;
    }
}

function renderAlertRules() {
    if (elements.heroEnabledAlerts) {
        elements.heroEnabledAlerts.textContent = String(alertRules.filter(rule => rule.enabled).length);
    }

    if (alertRules.length === 0) {
        elements.alertRulesList.innerHTML = '';
        elements.alertRulesList.appendChild(elements.alertEmpty);
        return;
    }

    const html = buildAlertRulesRows({
        alertRules,
        formatRuleLabel,
        locale: settings.locale || 'en-US',
        escapeHtml,
        t: tr
    });
    elements.alertRulesList.innerHTML = html;
}

function renderAlertHistory() {
    if (alertHistory.length === 0) {
        elements.alertHistory.innerHTML = '';
        return;
    }
    const html = buildAlertHistoryRows(alertHistory, settings.locale || 'en-US', escapeHtml);
    elements.alertHistory.innerHTML = html;
}

function updateAlertCoinAvailability() {
    const type = elements.alertType.value;
    const noCoinNeeded = type === 'DRAWDOWN_ABOVE';
    elements.alertCoinSelect.disabled = noCoinNeeded;
    if (noCoinNeeded) {
        elements.alertCoinSelect.value = '';
    }
}

function addAlertHistoryMessage(message) {
    alertHistory.push({
        id: nextNumericId(),
        message,
        timestamp: Date.now()
    });
    if (alertHistory.length > MAX_ALERT_HISTORY) {
        alertHistory = alertHistory.slice(-MAX_ALERT_HISTORY);
    }
    saveAlertHistory();
    renderAlertHistory();
}

function evaluateAlertRules(stats, riskMetrics) {
    const totalValue = stats.totalValue || 0;
    const currentPriceMap = {};
    const positionMap = {};
    assets.forEach(asset => {
        const basis = calculateCostBasis(asset);
        const price = priceData[asset.coinId]?.usd || 0;
        const value = basis.amount * price;
        currentPriceMap[asset.coinId] = price;
        positionMap[asset.coinId] = totalValue > 0 ? (value / totalValue) * 100 : 0;
    });

    alertRules.forEach(rule => {
        const isEnabled = rule.enabled;
        let matched = false;
        if (isEnabled) {
            if (rule.type === 'PRICE_ABOVE') {
                matched = (currentPriceMap[rule.coinId] || 0) > rule.threshold;
            } else if (rule.type === 'PRICE_BELOW') {
                matched = (currentPriceMap[rule.coinId] || 0) < rule.threshold;
            } else if (rule.type === 'POSITION_ABOVE') {
                matched = (positionMap[rule.coinId] || 0) > rule.threshold;
            } else if (rule.type === 'DRAWDOWN_ABOVE') {
                matched = riskMetrics.maxDrawdown > rule.threshold;
            }
        }

        const wasActive = Boolean(alertActiveMap[rule.id]);
        if (matched && !wasActive) {
            const message = tr('alert.triggered', { rule: formatRuleLabel(rule) });
            showToast(message, 'error');
            addAlertHistoryMessage(message);
        }
        alertActiveMap[rule.id] = matched;
    });
}

function handleAlertSubmit(e) {
    if (!alertController) return;
    alertController.handleAlertSubmit(e);
}

function handleAlertRulesClick(e) {
    if (!alertController) return;
    alertController.handleAlertRulesClick(e);
}

/**
 * 鍒锋柊鎵€鏈夋暟鎹?
 */
async function refreshData() {
    if (isRefreshing) {
        pendingRefresh = true;
        return;
    }
    isRefreshing = true;
    elements.refreshBtn.classList.add('loading');
    elements.refreshBtn.disabled = true;
    renderAssets(true);
    
    try {
        if (!navigator.onLine) {
            showErrorBanner(tr('banner.offlineMode'));
            if (elements.marketStatus) {
                elements.marketStatus.textContent = tr('header.marketOffline');
            }
            return;
        }
        await fetchPrices();
        renderAssets(false);
        renderTransactionAssetOptions();
        renderTransactions();
        renderAlertCoinOptions();
        const stats = updateSummary();
        const riskMetrics = calculateRiskMetrics(stats);
        updateRiskSection(riskMetrics);
        updateHeroPanel(stats, riskMetrics);
        if (stats.assetCount > 0) {
            recordSnapshot(stats.totalValue);
        }
        evaluateAlertRules(stats, riskMetrics);
        renderChart();
        renderPerformanceChart();
        renderTotalSparkline();
        renderDecisionWorkspace();
        await macroIntel?.refresh();
        await newsIntel?.refresh();
        await econCalendarIntel?.refresh({ silent: true });
        renderDecisionSummaryCard();
    } catch (error) {
        console.error('[refresh] data refresh failed:', error);
    } finally {
        elements.refreshBtn.classList.remove('loading');
        elements.refreshBtn.disabled = false;
        isRefreshing = false;
        if (pendingRefresh) {
            pendingRefresh = false;
            refreshData();
        }
    }
}

// ============================================
// 浜嬩欢澶勭悊
// ============================================

/**
 * 澶勭悊琛ㄥ崟鎻愪氦
 */
function handleFormSubmit(e) {
    if (!assetController) return;
    assetController.handleFormSubmit(e);
}

/**
 * 澶勭悊鍒犻櫎璧勪骇
 */
function handleDelete(id) {
    if (!assetController) return;
    assetController.handleDelete(id);
}

function handleEdit(id) {
    if (!assetController) return;
    assetController.handleEdit(id);
}

function handleAssetActionClick(e) {
    if (!assetController) return;
    assetController.handleAssetActionClick(e);
}

function handleEmptyStateCta() {
    if (!assetController) return;
    assetController.handleEmptyStateCta();
}

function getCommandItems() {
    return [
        {
            id: 'add-asset',
            label: tr('assets.form.add'),
            hint: tr('nav.assets'),
            run: () => {
                window.location.hash = '#/assets';
                applyRoute('assets');
                elements.coinSelect?.focus();
            }
        },
        {
            id: 'new-transaction',
            label: tr('tx.form.record'),
            hint: tr('nav.transactions'),
            run: () => {
                window.location.hash = '#/transactions';
                applyRoute('transactions');
                elements.txAssetSelect?.focus();
            }
        },
        ...VALID_ROUTES.map(route => ({
            id: `goto-${route}`,
            label: `${tr('nav.' + route)}`,
            hint: `Route: #/${route}`,
            run: () => {
                window.location.hash = `#/${route}`;
                applyRoute(route);
            }
        }))
    ];
}

function openCommandPalette() {
    if (!commandPalette) return;
    commandPalette.setItems(getCommandItems());
    commandPalette.setNoResultText(tr('command.noResult'));
    commandPalette.open();
}

function closeCommandPalette() {
    if (!commandPalette) return;
    commandPalette.close();
}

function initializeControllers() {
    assetController = createAssetController({
        elements,
        addAsset,
        updateAsset,
        removeAsset,
        getAssets: () => assets,
        setFormMode,
        refreshData,
        applyRoute,
        showToast,
        setInlineError,
        t: tr,
        confirmAction: message => confirmDialog.confirm({
            title: tr('assets.col.actions'),
            message,
            confirmText: tr('action.delete'),
            cancelText: tr('button.close'),
            tone: 'danger'
        })
    });

    transactionController = createTransactionController({
        elements,
        addTransaction,
        removeTransaction,
        refreshData,
        showToast,
        setInlineError,
        t: tr,
        confirmAction: message => confirmDialog.confirm({
            title: tr('transactions.title'),
            message,
            confirmText: tr('action.delete'),
            cancelText: tr('button.close'),
            tone: 'danger'
        })
    });

    alertController = createAlertController({
        elements,
        getAlertRules: () => alertRules,
        setAlertRules: nextRules => {
            alertRules = nextRules;
        },
        getAlertActiveMap: () => alertActiveMap,
        saveAlertRules,
        renderAlertRules,
        updateAlertCoinAvailability,
        refreshData,
        showToast,
        setInlineError,
        t: tr,
        confirmAction: message => confirmDialog.confirm({
            title: tr('alerts.title'),
            message,
            confirmText: tr('action.delete'),
            cancelText: tr('button.close'),
            tone: 'danger'
        })
    });

    settingsController = createSettingsController({
        elements,
        storageKeys: {
            assets: STORAGE_KEY,
            snapshots: SNAPSHOTS_KEY,
            transactions: TRANSACTIONS_KEY,
            settings: SETTINGS_KEY,
            alertRules: ALERT_RULES_KEY,
            alertHistory: ALERT_HISTORY_KEY
        },
        saveSettings,
        invalidateComputedCaches,
        applyTheme,
        updateSettingsSummary,
        setFormMode,
        refreshData,
        showToast,
        setCostMethod: method => {
            settings.costMethod = method;
        },
        t: tr,
        confirmAction: message => confirmDialog.confirm({
            title: tr('settings.title'),
            message,
            confirmText: tr('settings.reset'),
            cancelText: tr('button.close'),
            tone: 'danger'
        }),
        setLocale: applyLocale,
        setAfterResetState: () => {
            assets = [];
            priceData = {};
            snapshots = [];
            transactions = [];
            alertRules = [];
            alertHistory = [];
            alertActiveMap = {};
            Object.assign(settings, {
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
            });
            pendingRefresh = false;
            lastPriceFetchAt = 0;
            invalidateComputedCaches();
            transactionFilters.setState({ coinId: 'ALL', type: 'ALL', range: 'ALL' });
            setInlineError('asset', '');
            setInlineError('tx', '');
            setInlineError('alert', '');
            applyDemoMode(false);
        }
    });
}

function setupTestHooks() {
    const hasQueryFlag = window.location.search.includes('__test=1');
    const hasRuntimeFlag = window.__ENABLE_TEST_HOOKS__ === true;
    if (!hasQueryFlag && !hasRuntimeFlag) {
        return;
    }
    window.__APP_TEST_HOOKS__ = {
        seedState(nextState) {
            if (nextState.assets) assets = nextState.assets;
            if (nextState.transactions) transactions = nextState.transactions;
            if (nextState.snapshots) snapshots = nextState.snapshots;
            if (nextState.alertRules) alertRules = nextState.alertRules;
            if (nextState.alertHistory) alertHistory = nextState.alertHistory;
            if (nextState.settings) settings = { ...settings, ...nextState.settings };
            applyLocale(settings.locale);
            applyTheme(settings.theme);
            invalidateComputedCaches();
            renderAssets();
            renderTransactionAssetOptions();
            renderTransactions();
            renderAlertCoinOptions();
            renderAlertRules();
            renderAlertHistory();
            updateSummary();
            renderDecisionWorkspace();
        },
        getStateSnapshot() {
            return {
                assets: [...assets],
                transactions: [...transactions],
                snapshots: [...snapshots],
                alertRules: [...alertRules],
                alertHistory: [...alertHistory],
                settings: { ...settings },
                transactionFilters: transactionFilters.getState()
            };
        },
        triggerRefresh() {
            return refreshData();
        }
    };
}

// ============================================
// 鍒濆鍖?
// ============================================

async function init() {
    // 鍔犺浇鏈湴鏁版嵁
    loadAssets();
    loadSnapshots();
    loadTransactions();
    loadSettings();
    loadAlertRules();
    loadAlertHistory();
    demoAudit = createDemoAudit();
    applyNavCollapsed(settings.navCollapsed);
    applyLocale(settings.locale);
    applyDemoMode(settings.demoMode);
    ensureTransactionBackfill();
    dataTransferService = createDataTransferService({
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
    });
    dashboardPresenter = createDashboardPresenter({
        elements,
        animateTextNumber,
        setValueColorClass,
        formatters,
        t: tr
    });
    chartManager = createChartManager({
        getCoinImageId,
        formatCurrency,
        getFilteredSnapshots,
        getCostBasis: calculateCostBasis,
        getAssets: () => assets,
        getPriceData: () => priceData,
        coinInfoMap: COIN_INFO,
        getLocale: () => settings.locale || 'en-US'
    });
    macroIntel = createMacroIntel({
        elements,
        t: tr,
        localeGetter: () => settings.locale || 'en-US',
        showToast,
        fetchMacroSnapshot,
        parseMacroPayload,
        scoreMacroData,
        explainMacroState,
        getSettings: () => settings
    });
    newsIntel = createNewsIntel({
        elements,
        t: tr,
        localeGetter: () => settings.locale || 'en-US',
        showToast,
        fetchNewsFeed,
        fetchNewsInsight,
        parseNewsPayload,
        renderNewsFeed,
        renderNewsInsight,
        getSettings: () => settings,
        getPortfolioContext: getNewsPortfolioContext,
        escapeHtml,
        formatPercent,
        formatTime: (value, locale) => new Date(Number(value || Date.now())).toLocaleString(locale || settings.locale || 'en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        onJumpToSymbol: handleNewsJumpToSymbol
    });
    econCalendarIntel = createEconCalendarIntel({
        elements,
        t: tr,
        localeGetter: () => settings.locale || 'en-US',
        showToast,
        fetchEconCalendar,
        parseEconCalendarPayload,
        renderEconEvents,
        getSettings: () => settings,
        escapeHtml,
        formatTime: value => new Date(Number(value || Date.now())).toLocaleString(settings.locale || 'en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    });
    confirmDialog = createConfirmDialog(elements);
    confirmDialog.bind();
    errorBoundary = createErrorBoundary({
        showErrorBanner,
        showToast,
        t: tr
    });
    errorBoundary.bindGlobalListeners();
    initializeControllers();
    commandPalette = createCommandPalette({ elements });
    if (typeof createDesktopPet === 'function') {
        desktopPet = createDesktopPet({
            root: elements.desktopPet,
            body: elements.desktopPetBody,
            menu: elements.desktopPetMenu,
            isEnabled: () => Boolean(settings.petEnabled) && !window.matchMedia('(max-width: 980px)').matches,
            getPosition: () => settings.petPosition,
            onPositionChange: position => {
                settings.petPosition = position;
                saveSettings();
            },
            onAction: handleDesktopPetAction
        });
        desktopPet.bind();
    }
    setupTestHooks();

    const backupMeta = getDemoBackupMeta();
    if (backupMeta?.backupAt && !settings.lastDemoBackupAt) {
        settings.lastDemoBackupAt = backupMeta.backupAt;
        saveSettings();
    }
    
    // 缁戝畾浜嬩欢
    elements.addAssetForm.addEventListener('submit', handleFormSubmit);
    elements.refreshBtn.addEventListener('click', refreshData);
    elements.themeToggleBtn.addEventListener('click', toggleTheme);
    elements.navCollapseBtn?.addEventListener('click', toggleNavigationLayout);
    elements.sideNavOverlay?.addEventListener('click', closeMobileNav);
    elements.localeSelect?.addEventListener('change', handleLocaleChange);
    elements.demoModeToggle?.addEventListener('change', handleDemoModeToggle);
    elements.macroWindowSwitch?.addEventListener('click', handleMacroWindowClick);
    elements.macroAnalysisModeSelect?.addEventListener('change', handleMacroAnalysisModeChange);
    elements.macroEnabledToggle?.addEventListener('change', handleMacroEnabledToggle);
    elements.macroRefreshIntervalInput?.addEventListener('change', handleMacroRefreshIntervalChange);
    elements.macroRefreshBtn?.addEventListener('click', handleMacroRefreshManual);
    elements.newsTopicSelect?.addEventListener('change', handleNewsTopicChange);
    elements.newsSinceSelect?.addEventListener('change', handleNewsSinceChange);
    elements.newsAnalysisModeSelect?.addEventListener('change', handleNewsAnalysisModeChange);
    elements.newsRefreshIntervalInput?.addEventListener('change', handleNewsRefreshIntervalChange);
    elements.newsEnabledToggle?.addEventListener('change', handleNewsEnabledToggle);
    elements.newsRefreshBtn?.addEventListener('click', handleNewsRefreshManual);
    elements.petEnabledToggle?.addEventListener('change', handlePetEnabledToggle);
    elements.calendarWindowSelect?.addEventListener('change', handleCalendarWindowChange);
    elements.calendarImportanceSelect?.addEventListener('change', handleCalendarImportanceChange);
    elements.calendarEnabledToggle?.addEventListener('change', handleCalendarEnabledToggle);
    elements.calendarRefreshBtn?.addEventListener('click', handleCalendarRefreshManual);
    elements.decisionModeSelect?.addEventListener('change', handleDecisionModeChange);
    elements.strategyEvaluateBtn?.addEventListener('click', handleStrategyEvaluate);
    elements.strategyExportBtn?.addEventListener('click', handleStrategyExport);
    elements.stressPresetSelect?.addEventListener('change', handleStressPresetChange);
    elements.stressRunBtn?.addEventListener('click', handleStressRun);
    elements.attributionWindowSelect?.addEventListener('change', handleAttributionWindowChange);
    elements.attributionRunBtn?.addEventListener('click', handleAttributionRun);
    elements.localeQuickToggleBtn?.addEventListener('click', handleQuickLocaleToggle);
    elements.cancelEditBtn.addEventListener('click', () => setFormMode('add'));
    elements.assetsList.addEventListener('click', handleAssetActionClick);
    elements.emptyCtaBtn.addEventListener('click', handleEmptyStateCta);
    elements.transactionForm.addEventListener('submit', handleTransactionSubmit);
    elements.txList.addEventListener('click', handleTransactionListClick);
    elements.txFilterCoin?.addEventListener('change', handleTransactionFiltersChange);
    elements.txFilterType?.addEventListener('change', handleTransactionFiltersChange);
    elements.txFilterRange?.addEventListener('change', handleTransactionFiltersChange);
    elements.costMethodSelect.addEventListener('change', handleCostMethodChange);
    elements.rangeSwitch.addEventListener('click', handlePerformanceRangeClick);
    elements.alertForm.addEventListener('submit', handleAlertSubmit);
    elements.alertRulesList.addEventListener('click', handleAlertRulesClick);
    elements.alertType.addEventListener('change', updateAlertCoinAvailability);
    elements.resetDataBtn.addEventListener('click', handleResetData);
    elements.exportDataBtn.addEventListener('click', exportAllData);
    elements.importDataBtn.addEventListener('click', () => elements.importDataInput.click());
    elements.importDataInput.addEventListener('change', e => importAllDataFromFile(e.target.files?.[0]));
    elements.loadDemoDataBtn?.addEventListener('click', loadDemoData);
    elements.restoreDemoDataBtn?.addEventListener('click', restoreDemoData);
    elements.errorBannerClose.addEventListener('click', hideErrorBanner);
    elements.commandPaletteBtn?.addEventListener('click', openCommandPalette);
    commandPalette.bind();
    newsIntel?.bind();
    window.addEventListener('hashchange', handleHashRouteChange);
    window.addEventListener('resize', () => {
        if (!window.matchMedia('(max-width: 980px)').matches) {
            closeMobileNav();
        }
        desktopPet?.sync();
    });
    window.addEventListener('online', handleNetworkStatusChange);
    window.addEventListener('offline', handleNetworkStatusChange);
    
    // 鍒濆娓叉煋锛堟樉绀虹┖鐘舵€佹垨楠ㄦ灦灞忥級
    renderAssets();
    renderTransactionAssetOptions();
    renderTransactions();
    renderAlertCoinOptions();
    renderAlertRules();
    renderAlertHistory();
    applyI18nToDom(document);
    applyTheme(settings.theme);
    applyDemoMode(settings.demoMode);
    const initialStats = updateSummary();
    const initialRisk = calculateRiskMetrics(initialStats);
    updateRiskSection(initialRisk);
    updateHeroPanel(initialStats, initialRisk);
    updateSettingsSummary();
    renderPerformanceChart();
    renderTotalSparkline();
    renderDecisionWorkspace();
    await macroIntel.refresh({ force: true });
    await newsIntel.refresh({ force: true });
    await econCalendarIntel.refresh({ force: true });
    renderDecisionSummaryCard();
    elements.costMethodSelect.value = settings.costMethod;
    if (elements.localeSelect) {
        elements.localeSelect.value = settings.locale;
    }
    if (elements.rangeSwitch) {
        elements.rangeSwitch.querySelectorAll('.range-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.range === settings.performanceRange);
        });
    }
    updateAlertCoinAvailability();
    // Fetch prices and refresh view
    if (assets.length > 0) {
        await refreshData();
    } else {
        // 鍒濆鍖栫┖鍥捐〃
        renderChart();
    }

    setFormMode('add');

    if (!window.location.hash) {
        window.location.hash = `#/${DEFAULT_ROUTE}`;
    }
    applyRoute(resolveRouteFromHash(window.location.hash, VALID_ROUTES, DEFAULT_ROUTE));
    
    refreshScheduler = createRefreshScheduler({
        refresh: refreshData,
        intervalMs: UPDATE_INTERVAL,
        getHasAssets: () => assets.length > 0
    });
    refreshScheduler.start();
    document.addEventListener('visibilitychange', refreshScheduler.onVisibilityChange);
    window.addEventListener('online', refreshScheduler.onNetworkChange);
    window.addEventListener('offline', refreshScheduler.onNetworkChange);
    if (!navigator.onLine) {
        handleNetworkStatusChange();
    }
}

window.AppOrchestrator = {
    init
};











