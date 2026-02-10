(function initPresentationFormattersModule() {
    function createFormatters(getLocale) {
        function resolveLocale() {
            try {
                const locale = getLocale();
                if (locale === "zh-CN" || locale === "en-US") return locale;
            } catch (_error) {
                // no-op
            }
            return "en-US";
        }

        function formatCurrency(value, decimals = 2) {
            return new Intl.NumberFormat(resolveLocale(), {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(value);
        }

        function formatNumber(value, decimals = 4) {
            return new Intl.NumberFormat(resolveLocale(), {
                minimumFractionDigits: 0,
                maximumFractionDigits: decimals
            }).format(value);
        }

        function formatPercent(value) {
            const sign = value >= 0 ? "+" : "";
            return `${sign}${Number(value).toFixed(2)}%`;
        }

        function formatTime(timestamp, options = {}) {
            return new Date(timestamp).toLocaleString(resolveLocale(), options);
        }

        return {
            formatCurrency,
            formatNumber,
            formatPercent,
            formatTime
        };
    }

    window.AppFormatters = {
        createFormatters
    };
})();
