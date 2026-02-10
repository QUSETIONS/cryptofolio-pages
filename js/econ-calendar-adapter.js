(function initEconCalendarAdapterModule() {
    function normalizeQuality(value) {
        return ["fresh", "delayed", "stale", "partial"].includes(value) ? value : "stale";
    }

    function normalizeWindow(value) {
        return value === "1d" ? "1d" : "7d";
    }

    function normalizeImportance(value) {
        return value === "high" ? "high" : "all";
    }

    function parse(payload) {
        const rawEvents = Array.isArray(payload?.events) ? payload.events : [];
        const events = rawEvents
            .map(item => {
                const ts = Number(item?.timestamp || 0);
                if (!Number.isFinite(ts) || ts <= 0) return null;
                return {
                    id: String(item?.id || `event-${ts}`),
                    title: String(item?.title || "").trim(),
                    country: String(item?.country || "US").trim().toUpperCase(),
                    timestamp: ts,
                    importance: ["high", "medium", "low"].includes(item?.importance) ? item.importance : "medium",
                    consensus: String(item?.consensus || "--"),
                    previous: String(item?.previous || "--"),
                    category: String(item?.category || "macro"),
                    relatedAssets: Array.isArray(item?.relatedAssets) ? item.relatedAssets.slice(0, 6).map(v => String(v)) : []
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.timestamp - b.timestamp);

        return {
            ok: Boolean(payload?.ok),
            updatedAt: Number(payload?.updatedAt || Date.now()),
            quality: normalizeQuality(payload?.quality),
            locale: payload?.locale === "zh-CN" ? "zh-CN" : "en-US",
            window: normalizeWindow(payload?.window),
            importance: normalizeImportance(payload?.importance),
            sources: Array.isArray(payload?.sources) ? payload.sources.filter(Boolean).map(String) : [],
            events
        };
    }

    window.AppEconCalendarAdapter = {
        parse
    };
})();

