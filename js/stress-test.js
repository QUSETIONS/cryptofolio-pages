(function initStressTestModule() {
    function toNumber(value, fallback = 0) {
        const next = Number(value);
        return Number.isFinite(next) ? next : fallback;
    }

    function classifyAsset(coinId, stableCoinIds) {
        if ((stableCoinIds || []).includes(coinId)) return "stable";
        if (coinId === "bitcoin") return "btc";
        if (coinId === "ethereum") return "eth";
        return "alt";
    }

    function resolveShockPct(coinId, shocks, stableCoinIds) {
        const byCoin = shocks?.byCoin || {};
        if (Object.prototype.hasOwnProperty.call(byCoin, coinId)) {
            return toNumber(byCoin[coinId], 0);
        }
        const group = classifyAsset(coinId, stableCoinIds);
        const groups = shocks?.groups || {};
        if (group === "stable" && Number.isFinite(Number(groups.stable))) return toNumber(groups.stable, 0);
        if (group === "alt" && Number.isFinite(Number(groups.alt))) return toNumber(groups.alt, 0);
        if (Number.isFinite(Number(groups.market))) return toNumber(groups.market, 0);
        return 0;
    }

    function runScenario(portfolio, scenario) {
        const assets = Array.isArray(portfolio?.assets) ? portfolio.assets : [];
        const priceData = portfolio?.priceData || {};
        const getCostBasis = typeof portfolio?.getCostBasis === "function"
            ? portfolio.getCostBasis
            : asset => ({ amount: Number(asset.amount || 0) });
        const coinInfoMap = portfolio?.coinInfoMap || {};
        const stableCoinIds = portfolio?.stableCoinIds || [];
        const shocks = scenario?.shocks || {};

        const rows = assets.map(asset => {
            const basis = getCostBasis(asset);
            const amount = toNumber(basis?.amount, 0);
            const price = toNumber(priceData[asset.coinId]?.usd, 0);
            const currentValue = amount * price;
            const shockPct = resolveShockPct(asset.coinId, shocks, stableCoinIds);
            const stressedValue = currentValue * (1 + shockPct / 100);
            const deltaValue = stressedValue - currentValue;
            return {
                coinId: asset.coinId,
                symbol: coinInfoMap[asset.coinId]?.symbol || "UNK",
                currentValue,
                shockPct,
                stressedValue,
                deltaValue
            };
        }).filter(row => row.currentValue > 0)
            .sort((a, b) => a.deltaValue - b.deltaValue);

        const totalCurrent = rows.reduce((sum, row) => sum + row.currentValue, 0);
        const totalStressed = rows.reduce((sum, row) => sum + row.stressedValue, 0);
        const totalDelta = totalStressed - totalCurrent;
        const pnlPct = totalCurrent > 0 ? (totalDelta / totalCurrent) * 100 : 0;
        const maxDrawdownApprox = Math.max(0, -pnlPct);

        const topLoss = rows.slice(0, 3);
        const topGain = [...rows].reverse().slice(0, 3);
        return {
            scenarioId: scenario?.id || "custom",
            scenarioLabel: scenario?.label || "Custom",
            note: scenario?.note || "",
            totalCurrent,
            totalStressed,
            totalDelta,
            pnlPct,
            maxDrawdownApprox,
            rows,
            topLoss,
            topGain
        };
    }

    window.AppStressTest = {
        runScenario
    };
})();
