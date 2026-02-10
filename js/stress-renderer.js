(function initStressRendererModule() {
    function buildStressSummary(result, helpers) {
        const { formatCurrency, formatPercent, t } = helpers;
        if (!result) return "";
        return `
            <div class="lab-summary-grid">
                <div class="risk-card">
                    <p class="risk-label">${t("stress.summary.current")}</p>
                    <p class="risk-value neutral">${formatCurrency(result.totalCurrent)}</p>
                </div>
                <div class="risk-card">
                    <p class="risk-label">${t("stress.summary.stressed")}</p>
                    <p class="risk-value neutral">${formatCurrency(result.totalStressed)}</p>
                </div>
                <div class="risk-card">
                    <p class="risk-label">${t("stress.summary.delta")}</p>
                    <p class="risk-value ${result.totalDelta >= 0 ? "positive" : "negative"}">${result.totalDelta >= 0 ? "+" : ""}${formatCurrency(result.totalDelta)}</p>
                </div>
                <div class="risk-card">
                    <p class="risk-label">${t("stress.summary.maxDrawdownApprox")}</p>
                    <p class="risk-value negative">${formatPercent(result.maxDrawdownApprox)}</p>
                </div>
            </div>
            <p class="section-meta">${t("stress.summary.note", { value: result.note || "--" })}</p>
            <p class="section-meta">${t("stress.disclaimer")}</p>
        `;
    }

    function buildStressRows(result, helpers) {
        const { formatCurrency, formatPercent, t } = helpers;
        if (!result || !Array.isArray(result.rows) || result.rows.length === 0) {
            return `<p class="section-meta">${t("stress.empty")}</p>`;
        }
        const rows = result.rows.map(row => `
            <tr>
                <td>${row.symbol}</td>
                <td>${formatPercent(row.shockPct)}</td>
                <td>${formatCurrency(row.currentValue)}</td>
                <td>${formatCurrency(row.stressedValue)}</td>
                <td class="${row.deltaValue >= 0 ? "positive" : "negative"}">${row.deltaValue >= 0 ? "+" : ""}${formatCurrency(row.deltaValue)}</td>
            </tr>
        `).join("");

        return `
            <table class="lab-table">
                <thead>
                    <tr>
                        <th>${t("stress.col.asset")}</th>
                        <th>${t("stress.col.shock")}</th>
                        <th>${t("stress.col.current")}</th>
                        <th>${t("stress.col.stressed")}</th>
                        <th>${t("stress.col.delta")}</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    window.AppStressRenderer = {
        buildStressSummary,
        buildStressRows
    };
})();
