(function initMacroDataAdapterModule() {
    const REQUIRED_SERIES = [
        "crypto_btc",
        "equity_sp500",
        "dollar_dxy",
        "rates_ust10y",
        "gold_xau"
    ];

    function sanitizePoints(points) {
        if (!Array.isArray(points)) return [];
        return points
            .map(item => ({
                ts: Number(item?.ts),
                value: Number(item?.value)
            }))
            .filter(item => Number.isFinite(item.ts) && Number.isFinite(item.value))
            .sort((a, b) => a.ts - b.ts);
    }

    function parse(payload) {
        if (!payload || typeof payload !== "object") {
            return {
                valid: false,
                quality: "stale",
                warnings: ["invalid_payload"],
                window: "30D",
                updatedAt: Date.now(),
                seriesMap: {},
                factors: {
                    totalMarketCapUsd: null,
                    totalVolumeUsd: null,
                    marketCapChange24h: null,
                    btcDominance: null
                },
                sources: []
            };
        }

        const windowKey = payload.window === "90D" ? "90D" : "30D";
        const quality = ["fresh", "delayed", "stale", "partial"].includes(payload.quality)
            ? payload.quality
            : "stale";
        const warnings = [];
        if (quality === "partial") warnings.push("partial_data");
        if (quality === "delayed" || quality === "stale") warnings.push("stale_data");

        const seriesMap = {};
        const rawSeries = Array.isArray(payload.series) ? payload.series : [];
        rawSeries.forEach(item => {
            const id = String(item?.id || "");
            if (!id) return;
            const points = sanitizePoints(item.points);
            if (points.length === 0) return;
            seriesMap[id] = {
                id,
                label: String(item?.label || id),
                category: String(item?.category || "unknown"),
                source: String(item?.source || "unknown"),
                points
            };
        });

        REQUIRED_SERIES.forEach(id => {
            if (!seriesMap[id]) warnings.push(`missing_${id}`);
        });

        const factors = {
            totalMarketCapUsd: Number(payload?.factors?.totalMarketCapUsd),
            totalVolumeUsd: Number(payload?.factors?.totalVolumeUsd),
            marketCapChange24h: Number(payload?.factors?.marketCapChange24h),
            btcDominance: Number(payload?.factors?.btcDominance)
        };
        Object.keys(factors).forEach(key => {
            if (!Number.isFinite(factors[key])) {
                factors[key] = null;
                warnings.push(`missing_${key}`);
            }
        });

        return {
            valid: true,
            quality,
            warnings: [...new Set(warnings)],
            window: windowKey,
            updatedAt: Number(payload.updatedAt) || Date.now(),
            seriesMap,
            factors,
            sources: Array.isArray(payload.sources) ? payload.sources.map(String) : []
        };
    }

    window.AppMacroDataAdapter = {
        REQUIRED_SERIES,
        parse
    };
})();
