(function initAttributionRendererModule() {
    function buildAttributionSummary(result, helpers) {
        const { formatCurrency, formatPercent, t } = helpers;
        if (!result) return "";
        const topPositive = result.topPositive?.[0]?.symbol || "--";
        const topNegative = result.topNegative?.[0]?.symbol || "--";
        return `
            <div class="lab-summary-grid">
                <div class="risk-card">
                    <p class="risk-label">${t("attribution.summary.total")}</p>
                    <p class="risk-value ${result.totalContributionValue >= 0 ? "positive" : "negative"}">${result.totalContributionValue >= 0 ? "+" : ""}${formatCurrency(result.totalContributionValue)}</p>
                </div>
                <div class="risk-card">
                    <p class="risk-label">${t("attribution.summary.totalPct")}</p>
                    <p class="risk-value ${result.totalContributionPct >= 0 ? "positive" : "negative"}">${formatPercent(result.totalContributionPct)}</p>
                </div>
                <div class="risk-card">
                    <p class="risk-label">${t("attribution.summary.topPositive")}</p>
                    <p class="risk-value positive">${topPositive}</p>
                </div>
                <div class="risk-card">
                    <p class="risk-label">${t("attribution.summary.topNegative")}</p>
                    <p class="risk-value negative">${topNegative}</p>
                </div>
            </div>
            <p class="section-meta">${t("attribution.summary.volatility", { value: formatPercent(result.totalVolatilityContribution || 0) })}</p>
        `;
    }

    function buildAttributionRows(result, helpers) {
        const { formatCurrency, formatPercent, t } = helpers;
        if (!result || !Array.isArray(result.rows) || result.rows.length === 0) {
            return `<p class="section-meta">${t("attribution.empty")}</p>`;
        }
        const rows = result.rows.map(row => `
            <tr>
                <td>${row.symbol}</td>
                <td>${formatPercent(row.weightPct)}</td>
                <td>${formatPercent(row.periodReturnPct)}</td>
                <td class="${row.contributionValue >= 0 ? "positive" : "negative"}">${row.contributionValue >= 0 ? "+" : ""}${formatCurrency(row.contributionValue)}</td>
                <td class="${row.contributionPct >= 0 ? "positive" : "negative"}">${formatPercent(row.contributionPct)}</td>
                <td>${formatPercent(row.volatilityContribution)}</td>
            </tr>
        `).join("");
        return `
            <table class="lab-table">
                <thead>
                    <tr>
                        <th>${t("attribution.col.asset")}</th>
                        <th>${t("attribution.col.weight")}</th>
                        <th>${t("attribution.col.return")}</th>
                        <th>${t("attribution.col.pnl")}</th>
                        <th>${t("attribution.col.contrib")}</th>
                        <th>${t("attribution.col.vol")}</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    window.AppAttributionRenderer = {
        buildAttributionSummary,
        buildAttributionRows
    };
})();
