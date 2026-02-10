(function initMacroScoringModule() {
    const DEFAULT_WEIGHTS = {
        trend: 0.25,
        breadth: 0.2,
        volatility: 0.2,
        concentration: 0.15,
        liquidity: 0.2
    };

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function seriesTrendPercent(series) {
        const points = series?.points || [];
        if (points.length < 2) return 0;
        const first = points[0].value;
        const last = points[points.length - 1].value;
        if (!Number.isFinite(first) || !Number.isFinite(last) || first === 0) return 0;
        return ((last - first) / first) * 100;
    }

    function seriesVolatilityPercent(series) {
        const points = series?.points || [];
        if (points.length < 3) return 0;
        const returns = [];
        for (let i = 1; i < points.length; i += 1) {
            const prev = points[i - 1].value;
            const curr = points[i].value;
            if (!Number.isFinite(prev) || !Number.isFinite(curr) || prev === 0) continue;
            returns.push((curr - prev) / prev);
        }
        if (returns.length === 0) return 0;
        const mean = returns.reduce((sum, item) => sum + item, 0) / returns.length;
        const variance = returns.reduce((sum, item) => sum + ((item - mean) ** 2), 0) / returns.length;
        return Math.sqrt(variance) * 100;
    }

    function factorScore(adapterResult) {
        const btc = adapterResult.seriesMap.crypto_btc;
        const sp500 = adapterResult.seriesMap.equity_sp500;
        const dxy = adapterResult.seriesMap.dollar_dxy;
        const rates = adapterResult.seriesMap.rates_ust10y;
        const gold = adapterResult.seriesMap.gold_xau;
        const factors = adapterResult.factors;

        const trendRaw = (seriesTrendPercent(btc) + seriesTrendPercent(sp500)) / 2;
        const trend = clamp(50 + trendRaw * 2, 0, 100);

        const breadthRaw = Number.isFinite(factors.marketCapChange24h) ? factors.marketCapChange24h : 0;
        const breadth = clamp(50 + breadthRaw * 4, 0, 100);

        const volatilityRaw = (seriesVolatilityPercent(btc) + seriesVolatilityPercent(sp500)) / 2;
        const volatility = clamp(100 - volatilityRaw * 8, 0, 100);

        const concentrationRaw = Number.isFinite(factors.btcDominance) ? factors.btcDominance : 55;
        const concentration = clamp(100 - Math.abs(concentrationRaw - 50) * 3, 0, 100);

        const liquidityRaw = Number.isFinite(factors.totalVolumeUsd) && Number.isFinite(factors.totalMarketCapUsd) && factors.totalMarketCapUsd > 0
            ? (factors.totalVolumeUsd / factors.totalMarketCapUsd) * 100
            : 0;
        const liquidity = clamp(liquidityRaw * 120, 0, 100);

        // Cross-asset risk drag: stronger dollar/rates and stronger gold usually imply tighter risk appetite.
        const dxyTrend = seriesTrendPercent(dxy);
        const ratesTrend = seriesTrendPercent(rates);
        const goldTrend = seriesTrendPercent(gold);
        const crossAssetDrag = clamp((dxyTrend + ratesTrend + goldTrend) * 1.2, -20, 20);

        return {
            trend,
            breadth,
            volatility,
            concentration,
            liquidity,
            crossAssetDrag
        };
    }

    function score(adapterResult, options = {}) {
        const weights = { ...DEFAULT_WEIGHTS, ...(options.weights || {}) };
        const factors = factorScore(adapterResult);
        const weighted =
            factors.trend * weights.trend +
            factors.breadth * weights.breadth +
            factors.volatility * weights.volatility +
            factors.concentration * weights.concentration +
            factors.liquidity * weights.liquidity -
            factors.crossAssetDrag;
        const totalScore = clamp(weighted, 0, 100);

        let regime = "BALANCED";
        if (totalScore >= 67) regime = "RISK_ON";
        if (totalScore <= 33) regime = "DEFENSIVE";

        const driverEntries = [
            { key: "trend", value: factors.trend - 50 },
            { key: "breadth", value: factors.breadth - 50 },
            { key: "volatility", value: factors.volatility - 50 },
            { key: "concentration", value: factors.concentration - 50 },
            { key: "liquidity", value: factors.liquidity - 50 }
        ];
        const topDrivers = driverEntries
            .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
            .slice(0, 3);

        const qualityPenalty = adapterResult.quality === "fresh" ? 0 : adapterResult.quality === "delayed" ? 0.15 : 0.3;
        const missingPenalty = Math.min(0.35, (adapterResult.warnings.length || 0) * 0.03);
        const confidence = clamp(1 - qualityPenalty - missingPenalty, 0, 1);

        return {
            regime,
            score: Number(totalScore.toFixed(2)),
            factors,
            topDrivers,
            warnings: adapterResult.warnings || [],
            confidence
        };
    }

    window.AppMacroScoring = {
        DEFAULT_WEIGHTS,
        score
    };
})();
