(function initEconCalendarRendererModule() {
    function renderEvents(opts) {
        const { events, t, formatTime, escapeHtml } = opts;
        if (!Array.isArray(events) || events.length === 0) {
            return `<p class="section-meta">${escapeHtml(t("calendar.empty"))}</p>`;
        }

        return events.map(item => `
            <article class="calendar-item calendar-${escapeHtml(item.importance)}">
                <div class="calendar-item-main">
                    <p class="calendar-title">${escapeHtml(item.title)}</p>
                    <p class="calendar-meta">${escapeHtml(item.country)} · ${escapeHtml(t(`calendar.importance.${item.importance}`))} · ${escapeHtml(formatTime(item.timestamp))}</p>
                    <p class="calendar-sub">${escapeHtml(t("calendar.consensus"))}: ${escapeHtml(item.consensus)} / ${escapeHtml(t("calendar.previous"))}: ${escapeHtml(item.previous)}</p>
                </div>
                <div class="calendar-assets">
                    ${(item.relatedAssets || []).map(asset => `<span class="news-chip">${escapeHtml(asset)}</span>`).join("")}
                </div>
            </article>
        `).join("");
    }

    window.AppEconCalendarRenderer = {
        renderEvents
    };
})();

