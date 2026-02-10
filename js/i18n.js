(function initI18nModule() {
    const SUPPORTED_LOCALES = ["en-US", "zh-CN"];
    const DEFAULT_LOCALE = "en-US";

    const enMessages = window.AppI18nMessagesEn || {};
    const zhOverrides = window.AppI18nMessagesZh || {};

    const messages = {
        "en-US": { ...enMessages },
        "zh-CN": { ...enMessages, ...zhOverrides }
    };

    let currentLocale = DEFAULT_LOCALE;

    function normalizeLocale(locale) {
        return SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
    }

    function interpolate(template, params) {
        if (!params) return template;
        return String(template).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
            if (Object.prototype.hasOwnProperty.call(params, key)) {
                return String(params[key]);
            }
            return "";
        });
    }

    function t(key, params) {
        const localeMessages = messages[currentLocale] || messages[DEFAULT_LOCALE];
        const fallbackMessages = messages[DEFAULT_LOCALE];
        const template = localeMessages[key] || fallbackMessages[key] || key;
        return interpolate(template, params);
    }

    function setLocale(locale) {
        currentLocale = normalizeLocale(locale);
        document.documentElement.lang = currentLocale === "zh-CN" ? "zh-CN" : "en";
    }

    function getLocale() {
        return currentLocale;
    }

    function applyI18nToDom(root) {
        const scope = root || document;
        scope.querySelectorAll("[data-i18n]").forEach(node => {
            const key = node.getAttribute("data-i18n");
            if (!key) return;
            node.textContent = t(key);
        });
        scope.querySelectorAll("[data-i18n-placeholder]").forEach(node => {
            const key = node.getAttribute("data-i18n-placeholder");
            if (!key) return;
            node.setAttribute("placeholder", t(key));
        });
        scope.querySelectorAll("[data-i18n-title]").forEach(node => {
            const key = node.getAttribute("data-i18n-title");
            if (!key) return;
            node.setAttribute("title", t(key));
        });
    }

    window.AppI18n = {
        SUPPORTED_LOCALES,
        DEFAULT_LOCALE,
        messages,
        t,
        setLocale,
        getLocale,
        applyI18nToDom
    };
})();

