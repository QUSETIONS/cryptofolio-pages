(function initNewsRendererModule() {
    function renderFeed(opts) {
        const {
            items,
            visibleCount,
            t,
            formatTime,
            escapeHtml,
            locale,
            quality
        } = opts;

        if (!Array.isArray(items) || items.length === 0) {
            return `<p class="section-meta">${t("news.empty")}</p>`;
        }

        const limited = items.slice(0, visibleCount);
        const rows = limited.map((item, index) => {
            const topicBadges = (item.topics || [])
                .slice(0, 3)
                .map(topic => `<span class="news-chip">${escapeHtml(t(`news.topic.${topic}`))}</span>`)
                .join("");
            const symbols = (item.symbols || [])
                .slice(0, 3)
                .map(symbol => `<button class="news-symbol-btn" data-news-jump-symbol="${escapeHtml(symbol)}" type="button">${escapeHtml(symbol)}</button>`)
                .join("");

            const cardClass = index === 0 ? "news-item featured" : "news-item standard";

            return `
                <article class="${cardClass}" data-news-item-id="${escapeHtml(item.id)}">
                    <div class="news-status-strip">
                        <span class="news-source">${escapeHtml(item.source)}</span>
                        <span class="news-published">${escapeHtml(formatTime(item.publishedAt, locale))}</span>
                        <span class="news-quality">${escapeHtml(t(`news.quality.${item.quality || quality}`))}</span>
                    </div>
                    <div class="news-item-head">
                        <a class="news-title" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>
                        <span class="news-sentiment news-${item.sentimentHint}">${escapeHtml(t(`news.sentiment.${item.sentimentHint}`))}</span>
                    </div>
                    <p class="news-summary">${escapeHtml(item.summary || t("news.noSummary"))}</p>
                    <div class="news-tags-row">
                        ${topicBadges}
                        ${symbols}
                    </div>
                </article>
            `;
        }).join("");

        return rows;
    }

    function buildBriefInsight(insight, t, formatPercent, escapeHtml, mode) {
        const riskList = (insight.keyRisks || []).slice(0, 2)
            .map(item => `<li>${escapeHtml(item)}</li>`)
            .join("");
        const limitation = (insight.limitations || []).slice(0, 1)
            .map(item => `<li>${escapeHtml(item)}</li>`)
            .join("");

        return `
            <div class="news-insight-card is-brief">
                <p class="news-insight-summary">${escapeHtml(insight.headlineSummary || insight.summary || "--")}</p>
                <div class="news-insight-kpis">
                    <span class="news-regime">${escapeHtml(t(`news.regime.${insight.regimeImpact || "balanced"}`))}</span>
                    <span class="news-confidence">${escapeHtml(t("news.confidence", { value: formatPercent((insight.confidence || 0) * 100) }))}</span>
                    <span class="news-mode">${escapeHtml(t(`news.mode.${mode}`))}</span>
                </div>
                <div class="news-brief-quick-take">
                    <p class="section-meta">${escapeHtml(t("news.brief.quickTake"))}</p>
                    <ul class="news-list">${riskList || `<li>${escapeHtml(t("news.none"))}</li>`}</ul>
                </div>
                <div class="news-insight-limitations">
                    <p class="section-meta">${escapeHtml(t("news.limitations"))}</p>
                    <ul class="news-list">${limitation || `<li>${escapeHtml(t("news.none"))}</li>`}</ul>
                </div>
            </div>
        `;
    }

    function buildProInsight(insight, insightMeta, timelineItems, t, formatPercent, formatTime, locale, escapeHtml, mode) {
        const risks = (insight.keyRisks || []).slice(0, 4);
        const assets = (insight.affectedAssets || []).slice(0, 4);
        const rowCount = Math.max(risks.length, assets.length, 2);
        const rows = Array.from({ length: rowCount }).map((_, idx) => {
            const risk = risks[idx] || t("news.none");
            const asset = assets[idx];
            const confidence = formatPercent((insight.confidence || 0) * 100);
            return `
                <tr>
                    <td>${escapeHtml(risk)}</td>
                    <td>${asset ? `<strong>${escapeHtml(asset.symbol)}</strong> - ${escapeHtml(asset.reason)}` : escapeHtml(t("news.none"))}</td>
                    <td>${escapeHtml(confidence)}</td>
                </tr>
            `;
        }).join("");

        const timeline = (timelineItems || []).slice(0, 5).map(item => `
            <li class="news-timeline-item">
                <span class="news-timeline-time">${escapeHtml(formatTime(item.publishedAt, locale))}</span>
                <span class="news-timeline-title">${escapeHtml(item.title)}</span>
                <span class="news-timeline-source">${escapeHtml(item.source || t("news.unknown"))}</span>
            </li>
        `).join("");

        const limitationList = (insight.limitations || []).slice(0, 3)
            .map(item => `<li>${escapeHtml(item)}</li>`)
            .join("");

        return `
            <div class="news-insight-card is-pro">
                <p class="news-insight-summary">${escapeHtml(insight.headlineSummary || insight.summary || "--")}</p>
                <div class="news-insight-kpis">
                    <span class="news-regime">${escapeHtml(t(`news.regime.${insight.regimeImpact || "balanced"}`))}</span>
                    <span class="news-confidence">${escapeHtml(t("news.confidence", { value: formatPercent((insight.confidence || 0) * 100) }))}</span>
                    <span class="news-mode">${escapeHtml(t(`news.mode.${mode}`))}</span>
                </div>
                <div class="news-pro-driver-matrix">
                    <p class="section-meta">${escapeHtml(t("news.pro.driverMatrix"))}</p>
                    <table class="news-pro-table">
                        <thead>
                            <tr>
                                <th>${escapeHtml(t("news.keyRisks"))}</th>
                                <th>${escapeHtml(t("news.affectedAssets"))}</th>
                                <th>${escapeHtml(t("news.insight.confidence"))}</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
                <div class="news-pro-evidence">
                    <p class="section-meta">${escapeHtml(t("news.pro.evidence"))}</p>
                    <div class="news-evidence-grid">
                        <span>${escapeHtml(t("news.pro.asOf"))}: ${escapeHtml(formatTime(insightMeta?.asOf || Date.now(), locale))}</span>
                        <span>${escapeHtml(t("news.qualityLabel", { value: t(`news.quality.${insightMeta?.quality || "stale"}`) }))}</span>
                        <span>${escapeHtml(t("news.pro.itemCount"))}: ${escapeHtml(String(insightMeta?.itemCount || 0))}</span>
                        <span>${escapeHtml(t("news.pro.sourceMix"))}: ${escapeHtml((insightMeta?.sources || []).join(", ") || t("news.unknown"))}</span>
                    </div>
                </div>
                <div class="news-pro-timeline">
                    <p class="section-meta">${escapeHtml(t("news.pro.timeline"))}</p>
                    <ul class="news-timeline-list">${timeline || `<li>${escapeHtml(t("news.none"))}</li>`}</ul>
                </div>
                <div class="news-insight-limitations">
                    <p class="section-meta">${escapeHtml(t("news.limitations"))}</p>
                    <ul class="news-list">${limitationList || `<li>${escapeHtml(t("news.none"))}</li>`}</ul>
                </div>
            </div>
        `;
    }

    function renderInsight(opts) {
        const { insight, t, formatPercent, formatTime, mode, escapeHtml, locale, insightMeta, timelineItems } = opts;
        if (!insight) {
            return `<p class="section-meta">${t("news.insight.empty")}</p>`;
        }

        if (mode === "pro") {
            return buildProInsight(
                insight,
                insightMeta,
                timelineItems,
                t,
                formatPercent,
                formatTime,
                locale,
                escapeHtml,
                mode
            );
        }

        return buildBriefInsight(insight, t, formatPercent, escapeHtml, mode);
    }

    window.AppNewsRenderer = {
        renderFeed,
        renderInsight
    };
})();
