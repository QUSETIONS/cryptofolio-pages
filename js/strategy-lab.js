(function initStrategyLabModule() {
    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function toNumber(value, fallback = 0) {
        const next = Number(value);
        return Number.isFinite(next) ? next : fallback;
    }

    function normalizeTargets(targetWeights) {
        const entries = Object.entries(targetWeights || {})
            .map(([coinId, weight]) => [coinId, Math.max(0, toNumber(weight, 0))])
            .filter(([, weight]) => weight > 0);
        const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
        if (total <= 0) return {};
        const normalized = {};
        entries.forEach(([coinId, weight]) => {
            normalized[coinId] = (weight / total) * 100;
        });
        return normalized;
    }

    function getConcentrationFromWeights(weightMap) {
        const values = Object.values(weightMap || {}).sort((a, b) => b - a);
        return {
            top1: values[0] || 0,
            top3: values.slice(0, 3).reduce((sum, item) => sum + item, 0)
        };
    }

    function applyConstraints(targets, constraints, stableCoinIds) {
        const next = { ...targets };
        const warnings = [];
        const maxSingle = clamp(toNumber(constraints?.maxSingleAssetPct, 40), 5, 100);
        const minStable = clamp(toNumber(constraints?.minStablePct, 10), 0, 100);

        let overflow = 0;
        Object.keys(next).forEach(coinId => {
            if (next[coinId] > maxSingle) {
                overflow += next[coinId] - maxSingle;
                next[coinId] = maxSingle;
            }
        });
        if (overflow > 0) {
            warnings.push("max_single_applied");
            const growable = Object.keys(next).filter(coinId => next[coinId] < maxSingle);
            const totalGrowable = growable.reduce((sum, coinId) => sum + (maxSingle - next[coinId]), 0);
            if (totalGrowable > 0) {
                growable.forEach(coinId => {
                    const room = maxSingle - next[coinId];
                    next[coinId] += (room / totalGrowable) * overflow;
                });
            }
        }

        const stableSet = new Set(stableCoinIds || []);
        const stableWeight = Object.entries(next)
            .filter(([coinId]) => stableSet.has(coinId))
            .reduce((sum, [, weight]) => sum + weight, 0);
        if (stableWeight < minStable) {
            warnings.push("min_stable_applied");
            const delta = minStable - stableWeight;
            const nonStable = Object.keys(next).filter(coinId => !stableSet.has(coinId));
            const nonStableTotal = nonStable.reduce((sum, coinId) => sum + next[coinId], 0);
            if (nonStableTotal > 0) {
                nonStable.forEach(coinId => {
                    const reduceAmount = (next[coinId] / nonStableTotal) * delta;
                    next[coinId] = Math.max(0, next[coinId] - reduceAmount);
                });
                const firstStable = Object.keys(next).find(coinId => stableSet.has(coinId));
                if (firstStable) {
                    next[firstStable] += delta;
                }
            }
        }

        const finalTotal = Object.values(next).reduce((sum, value) => sum + value, 0);
        if (finalTotal > 0) {
            Object.keys(next).forEach(coinId => {
                next[coinId] = (next[coinId] / finalTotal) * 100;
            });
        }

        return { targets: next, warnings };
    }

    function evaluateRebalance(input) {
        const assets = Array.isArray(input?.assets) ? input.assets : [];
        const priceData = input?.priceData || {};
        const getCostBasis = typeof input?.getCostBasis === "function"
            ? input.getCostBasis
            : asset => ({ amount: Number(asset.amount || 0) });
        const coinInfoMap = input?.coinInfoMap || {};
        const stableCoinIds = input?.stableCoinIds || [];
        const constraints = input?.constraints || {};
        const minTradeUsd = Math.max(0, toNumber(constraints.minTradeUsd, 25));

        const currentByCoin = {};
        assets.forEach(asset => {
            const basis = getCostBasis(asset);
            const amount = toNumber(basis?.amount, 0);
            const price = toNumber(priceData[asset.coinId]?.usd, 0);
            const value = amount * price;
            if (value <= 0) return;
            currentByCoin[asset.coinId] = (currentByCoin[asset.coinId] || 0) + value;
        });
        const totalValue = Object.values(currentByCoin).reduce((sum, value) => sum + value, 0);
        if (totalValue <= 0) {
            return {
                totalValue: 0,
                rows: [],
                summary: {
                    beforeTop1: 0,
                    beforeTop3: 0,
                    afterTop1: 0,
                    afterTop3: 0,
                    warnings: ["empty_portfolio"],
                    minTradeUsd
                }
            };
        }

        const inputTargets = normalizeTargets(input?.targetWeights || {});
        const { targets, warnings } = applyConstraints(inputTargets, constraints, stableCoinIds);
        const coinIds = [...new Set([...Object.keys(currentByCoin), ...Object.keys(targets)])];

        const currentWeights = {};
        coinIds.forEach(coinId => {
            currentWeights[coinId] = ((currentByCoin[coinId] || 0) / totalValue) * 100;
        });
        const targetWeights = {};
        coinIds.forEach(coinId => {
            targetWeights[coinId] = toNumber(targets[coinId], 0);
        });

        const rows = coinIds.map(coinId => {
            const currentValue = currentByCoin[coinId] || 0;
            const targetPct = targetWeights[coinId] || 0;
            const currentPct = currentWeights[coinId] || 0;
            const targetValue = (targetPct / 100) * totalValue;
            const deltaValue = targetValue - currentValue;
            const price = toNumber(priceData[coinId]?.usd, 0);
            const deltaAmount = price > 0 ? deltaValue / price : 0;
            const action = deltaValue > 0 ? "BUY" : (deltaValue < 0 ? "SELL" : "HOLD");
            return {
                coinId,
                symbol: coinInfoMap[coinId]?.symbol || "UNK",
                currentPct,
                targetPct,
                driftPct: currentPct - targetPct,
                deltaValue,
                deltaAmount,
                action,
                hiddenByTradeThreshold: Math.abs(deltaValue) < minTradeUsd
            };
        }).filter(row => !row.hiddenByTradeThreshold)
            .sort((a, b) => Math.abs(b.deltaValue) - Math.abs(a.deltaValue));

        const before = getConcentrationFromWeights(currentWeights);
        const after = getConcentrationFromWeights(targetWeights);

        return {
            totalValue,
            rows,
            summary: {
                beforeTop1: before.top1,
                beforeTop3: before.top3,
                afterTop1: after.top1,
                afterTop3: after.top3,
                warnings,
                minTradeUsd
            }
        };
    }

    window.AppStrategyLab = {
        evaluateRebalance
    };
})();
