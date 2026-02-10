(function initPortfolioDomainModule() {
    function buildTransactionsByAssetMap(transactions) {
        const txMap = new Map();
        transactions.forEach(tx => {
            if (!txMap.has(tx.assetId)) {
                txMap.set(tx.assetId, []);
            }
            txMap.get(tx.assetId).push(tx);
        });
        txMap.forEach(list => {
            list.sort((a, b) => a.timestamp - b.timestamp);
        });
        return txMap;
    }

    function calculateCostBasisByMethod(asset, method, relatedTransactions) {
        if (!relatedTransactions || relatedTransactions.length === 0) {
            return {
                amount: asset.amount,
                totalCost: asset.amount * asset.costPrice,
                avgCost: asset.costPrice
            };
        }

        if (method === 'fifo') {
            const buyLots = [];
            let buyFeesAcc = 0;

            relatedTransactions.forEach(tx => {
                if (tx.type === 'BUY') {
                    buyLots.push({
                        amount: tx.amount,
                        price: tx.price
                    });
                    buyFeesAcc += tx.fee;
                    return;
                }

                let remaining = tx.amount;
                while (remaining > 0 && buyLots.length > 0) {
                    const lot = buyLots[0];
                    const consumed = Math.min(lot.amount, remaining);
                    lot.amount -= consumed;
                    remaining -= consumed;
                    if (lot.amount <= 1e-12) {
                        buyLots.shift();
                    }
                }
            });

            const amount = buyLots.reduce((sum, lot) => sum + lot.amount, 0);
            const costWithoutFees = buyLots.reduce((sum, lot) => sum + lot.amount * lot.price, 0);
            const totalCost = Math.max(0, costWithoutFees + buyFeesAcc);
            return {
                amount,
                totalCost,
                avgCost: amount > 0 ? totalCost / amount : 0
            };
        }

        let amount = 0;
        let totalCost = 0;
        relatedTransactions.forEach(tx => {
            if (tx.type === 'BUY') {
                totalCost += tx.amount * tx.price + tx.fee;
                amount += tx.amount;
                return;
            }

            if (amount <= 0) return;
            const sellAmount = Math.min(tx.amount, amount);
            const avgCost = totalCost / amount;
            totalCost -= sellAmount * avgCost;
            totalCost = Math.max(0, totalCost - tx.fee);
            amount -= sellAmount;
        });

        return {
            amount,
            totalCost,
            avgCost: amount > 0 ? totalCost / amount : 0
        };
    }

    function calculatePortfolioStats(assets, priceData, getCostBasis) {
        let totalValue = 0;
        let totalCost = 0;
        let previousTotalValue = 0;
        let nonZeroAssetCount = 0;

        assets.forEach(asset => {
            const price = priceData[asset.coinId]?.usd || 0;
            const basis = getCostBasis(asset);
            const amount = basis.amount;
            const change24h = priceData[asset.coinId]?.usd_24h_change;
            totalValue += amount * price;
            totalCost += basis.totalCost;
            if (amount > 0) {
                nonZeroAssetCount += 1;
            }

            if (Number.isFinite(change24h) && change24h > -100) {
                const prevPrice = price / (1 + change24h / 100);
                previousTotalValue += amount * prevPrice;
            }
        });

        const totalProfit = totalValue - totalCost;
        const profitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
        const dailyPnl = totalValue - previousTotalValue;
        const dailyPnlPercent = previousTotalValue > 0 ? (dailyPnl / previousTotalValue) * 100 : 0;

        return {
            totalValue,
            totalCost,
            totalProfit,
            profitPercent,
            dailyPnl,
            dailyPnlPercent,
            assetCount: nonZeroAssetCount
        };
    }

    function calculateRiskMetrics(assets, priceData, snapshots, stats, getCostBasis) {
        const currentValues = assets
            .map(asset => {
                const basis = getCostBasis(asset);
                const price = priceData[asset.coinId]?.usd || 0;
                return {
                    coinId: asset.coinId,
                    value: basis.amount * price
                };
            })
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);

        const totalValue = stats.totalValue || 0;
        const top1Concentration = totalValue > 0 && currentValues[0] ? (currentValues[0].value / totalValue) * 100 : 0;
        const top3Value = currentValues.slice(0, 3).reduce((sum, item) => sum + item.value, 0);
        const top3Concentration = totalValue > 0 ? (top3Value / totalValue) * 100 : 0;

        const series = snapshots.map(point => point.value);
        if (stats.totalValue > 0) {
            series.push(stats.totalValue);
        }

        let peak = series[0] || 0;
        let maxDrawdown = 0;
        for (let i = 1; i < series.length; i++) {
            const value = series[i];
            if (value > peak) peak = value;
            if (peak > 0) {
                const drawdown = ((peak - value) / peak) * 100;
                if (drawdown > maxDrawdown) maxDrawdown = drawdown;
            }
        }

        let volatility = 0;
        let var95 = 0;
        let drawdownBand = "Low";
        if (series.length > 2) {
            const returns = [];
            for (let i = 1; i < series.length; i++) {
                const prev = series[i - 1];
                const curr = series[i];
                if (prev > 0) {
                    returns.push((curr - prev) / prev);
                }
            }
            if (returns.length > 1) {
                const mean = returns.reduce((sum, item) => sum + item, 0) / returns.length;
                const variance = returns.reduce((sum, item) => sum + Math.pow(item - mean, 2), 0) / returns.length;
                volatility = Math.sqrt(variance) * 100;
                const sortedReturns = [...returns].sort((a, b) => a - b);
                const varIndex = Math.max(0, Math.floor(sortedReturns.length * 0.05) - 1);
                var95 = Math.abs((sortedReturns[varIndex] || 0) * 100);
            }
        }

        if (maxDrawdown >= 15) {
            drawdownBand = "High";
        } else if (maxDrawdown >= 8) {
            drawdownBand = "Medium";
        }

        return {
            maxDrawdown,
            top1Concentration,
            top3Concentration,
            volatility,
            var95,
            drawdownBand
        };
    }

    window.AppPortfolioDomain = {
        buildTransactionsByAssetMap,
        calculateCostBasisByMethod,
        calculatePortfolioStats,
        calculateRiskMetrics
    };
})();
