(function initDashboardPresenterModule() {
    function createDashboardPresenter(deps) {
        const {
            elements,
            animateTextNumber,
            setValueColorClass,
            formatters,
            t
        } = deps;

        function updateSummary(stats) {
            animateTextNumber(elements.totalValue, stats.totalValue, v => formatters.formatCurrency(v));
            animateTextNumber(elements.profitValue, stats.totalProfit, v => `${v >= 0 ? "+" : ""}${formatters.formatCurrency(v)}`);
            animateTextNumber(elements.profitPercent, stats.profitPercent, v => `(${formatters.formatPercent(v)})`);
            animateTextNumber(elements.totalCostValue, stats.totalCost, v => formatters.formatCurrency(v));
            animateTextNumber(elements.assetCountValue, stats.assetCount, v => String(Math.round(v)));
            animateTextNumber(elements.dailyPnlValue, stats.dailyPnl, v => `${v >= 0 ? "+" : ""}${formatters.formatCurrency(v)}`);
            animateTextNumber(elements.dailyPnlPercent, stats.dailyPnlPercent, v => formatters.formatPercent(v));
            setValueColorClass(elements.dailyPnlValue, stats.dailyPnl);
            setValueColorClass(elements.dailyPnlPercent, stats.dailyPnlPercent);
            elements.totalProfitLoss.className = `profit-loss ${stats.totalProfit >= 0 ? "positive" : "negative"}`;
        }

        function updateRisk(riskMetrics) {
            elements.maxDrawdownValue.textContent = `${riskMetrics.maxDrawdown.toFixed(2)}%`;
            elements.top1ConcentrationValue.textContent = `${riskMetrics.top1Concentration.toFixed(2)}%`;
            elements.top3ConcentrationValue.textContent = `${riskMetrics.top3Concentration.toFixed(2)}%`;
            elements.volatilityValue.textContent = `${riskMetrics.volatility.toFixed(2)}%`;
            if (elements.var95Value) elements.var95Value.textContent = `${riskMetrics.var95.toFixed(2)}%`;
            if (elements.drawdownBandText) {
                const bandKey = riskMetrics.drawdownBand === "High" ? "label.bandHigh" : riskMetrics.drawdownBand === "Medium" ? "label.bandMedium" : "label.bandLow";
                elements.drawdownBandText.textContent = t("risk.band", { band: t(bandKey) });
            }
        }

        function updateHero(stats, riskMetrics, enabledAlerts) {
            animateTextNumber(elements.heroTotalValue, stats.totalValue, v => formatters.formatCurrency(v));
            animateTextNumber(elements.heroAssetCount, stats.assetCount, v => String(Math.round(v)));
            animateTextNumber(elements.heroMaxDrawdown, riskMetrics.maxDrawdown, v => `${v.toFixed(2)}%`);
            animateTextNumber(elements.heroEnabledAlerts, enabledAlerts, v => String(Math.round(v)));
        }

        return {
            updateSummary,
            updateRisk,
            updateHero
        };
    }

    window.AppDashboardPresenter = {
        createDashboardPresenter
    };
})();
