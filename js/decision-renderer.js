(function initDecisionRendererModule() {
    function renderDecisionCard(result, helpers) {
        const { t, formatPercent, escapeHtml, mode } = helpers;
        if (!result) {
            return `<p class="section-meta">${escapeHtml(t("decision.empty"))}</p>`;
        }
        const effectiveMode = mode === "pro" ? "pro" : "brief";
        const drivers = (result.drivers || []).slice(0, effectiveMode === "pro" ? 3 : 2);
        const limitations = (result.limitations || []).slice(0, effectiveMode === "pro" ? 2 : 1);

        return `
            <div class="decision-card decision-${escapeHtml(result.regime)}">
                <div class="decision-head">
                    <span class="macro-regime">${escapeHtml(t(`decision.regime.${result.regime}`))}</span>
                    <p class="macro-score">${escapeHtml(t("decision.score", { value: Number(result.score).toFixed(1) }))}</p>
                    <p class="section-meta">${escapeHtml(t(`decision.action.${result.actionLevel}`))}</p>
                    <p class="section-meta">${escapeHtml(t("decision.confidence", { value: formatPercent(result.confidence * 100) }))}</p>
                </div>
                <ul class="news-list">
                    ${drivers.map(item => `<li>${escapeHtml(t(`decision.driver.${item.label}`))}: ${escapeHtml(String(item.value))}</li>`).join("")}
                </ul>
                <p class="section-meta">${escapeHtml(t("decision.limitations"))}</p>
                <ul class="news-list">
                    ${limitations.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
                </ul>
            </div>
        `;
    }

    window.AppDecisionRenderer = {
        renderDecisionCard
    };
})();
