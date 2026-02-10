(function initRiskAttributionModule() {
    function toNumber(value, fallback = 0) {
        const next = Number(value);
        return Number.isFinite(next) ? next : fallback;
    }

    function computeAttribution(input) {
        const assets = Array.isArray(input?.assets) ? input.assets : [];
        const priceData = input?.priceData || {};
        const getCostBasis = typeof input?.getCostBasis === "function"
            ? input.getCostBasis
            : asset => ({ amount: Number(asset.amount || 0) });
        const coinInfoMap = input?.coinInfoMap || {};
        const windowKey = input?.window === "7d" ? "7d" : "24h";

        const rows = assets.map(asset => {
            const basis = getCostBasis(asset);
            const amount = toNumber(basis?.amount, 0);
            const price = toNumber(priceData[asset.coinId]?.usd, 0);
            const value = amount * price;
            const change24hPct = toNumber(priceData[asset.coinId]?.usd_24h_change, 0);
            const periodReturnPct = windowKey === "7d" ? (change24hPct * 7) : change24hPct;
            const contributionValue = value * (periodReturnPct / 100);
            return {
                coinId: asset.coinId,
                symbol: coinInfoMap[asset.coinId]?.symbol || "UNK",
                value,
                periodReturnPct,
                contributionValue
            };
        }).filter(row => row.value > 0);

        const totalValue = rows.reduce((sum, row) => sum + row.value, 0);
        rows.forEach(row => {
            row.weightPct = totalValue > 0 ? (row.value / totalValue) * 100 : 0;
            row.contributionPct = totalValue > 0 ? (row.contributionValue / totalValue) * 100 : 0;
            row.volatilityContribution = Math.abs(row.periodReturnPct) * (row.weightPct / 100);
        });
        rows.sort((a, b) => b.contributionValue - a.contributionValue);

        const totalContributionValue = rows.reduce((sum, row) => sum + row.contributionValue, 0);
        const totalContributionPct = totalValue > 0 ? (totalContributionValue / totalValue) * 100 : 0;
        const totalVolatilityContribution = rows.reduce((sum, row) => sum + row.volatilityContribution, 0);

        const positive = rows.filter(row => row.contributionValue >= 0);
        const negative = rows.filter(row => row.contributionValue < 0);
        return {
            window: windowKey,
            rows,
            totalValue,
            totalContributionValue,
            totalContributionPct,
            totalVolatilityContribution,
            topPositive: positive.slice(0, 3),
            topNegative: negative.slice(0, 3).sort((a, b) => a.contributionValue - b.contributionValue)
        };
    }

    window.AppRiskAttribution = {
        computeAttribution
    };
})();
