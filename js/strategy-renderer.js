(function initStrategyRendererModule() {
    function buildStrategyRows(result, helpers) {
        const {
            formatCurrency,
            formatPercent,
            formatNumber,
            t
        } = helpers;
        if (!result || !Array.isArray(result.rows) || result.rows.length === 0) {
            return `<p class="section-meta">${t("strategy.empty")}</p>`;
        }

        const rows = result.rows.map(row => {
            const actionClass = row.action === "BUY" ? "positive" : (row.action === "SELL" ? "negative" : "neutral");
            return `
                <tr>
                    <td>${row.symbol}</td>
                    <td>${formatPercent(row.currentPct)}</td>
                    <td>${formatPercent(row.targetPct)}</td>
                    <td class="${row.driftPct >= 0 ? "negative" : "positive"}">${formatPercent(row.driftPct)}</td>
                    <td class="${actionClass}">${row.action}</td>
                    <td class="${actionClass}">${row.deltaValue >= 0 ? "+" : ""}${formatCurrency(row.deltaValue)}</td>
                    <td class="${actionClass}">${row.deltaAmount >= 0 ? "+" : ""}${formatNumber(row.deltaAmount, 6)}</td>
                </tr>
            `;
        }).join("");

        return `
            <table class="lab-table">
                <thead>
                    <tr>
                        <th>${t("strategy.col.asset")}</th>
                        <th>${t("strategy.col.current")}</th>
                        <th>${t("strategy.col.target")}</th>
                        <th>${t("strategy.col.drift")}</th>
                        <th>${t("strategy.col.action")}</th>
                        <th>${t("strategy.col.deltaValue")}</th>
                        <th>${t("strategy.col.deltaAmount")}</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    function buildStrategySummary(summary, helpers) {
        const { formatPercent, formatCurrency, t } = helpers;
        if (!summary) return "";
        const warningText = (summary.warnings || []).length > 0
            ? (summary.warnings || []).map(code => t(`strategy.warning.${code}`)).join(" | ")
            : t("strategy.warning.none");
        return `
            <div class="lab-summary-grid">
                <div class="risk-card">
                    <p class="risk-label">${t("strategy.summary.beforeTop1")}</p>
                    <p class="risk-value neutral">${formatPercent(summary.beforeTop1)}</p>
                </div>
                <div class="risk-card">
                    <p class="risk-label">${t("strategy.summary.beforeTop3")}</p>
                    <p class="risk-value neutral">${formatPercent(summary.beforeTop3)}</p>
                </div>
                <div class="risk-card">
                    <p class="risk-label">${t("strategy.summary.afterTop1")}</p>
                    <p class="risk-value neutral">${formatPercent(summary.afterTop1)}</p>
                </div>
                <div class="risk-card">
                    <p class="risk-label">${t("strategy.summary.afterTop3")}</p>
                    <p class="risk-value neutral">${formatPercent(summary.afterTop3)}</p>
                </div>
            </div>
            <p class="section-meta">${t("strategy.summary.minTrade", { value: formatCurrency(summary.minTradeUsd || 0) })}</p>
            <p class="section-meta">${warningText}</p>
        `;
    }

    window.AppStrategyRenderer = {
        buildStrategyRows,
        buildStrategySummary
    };
})();
