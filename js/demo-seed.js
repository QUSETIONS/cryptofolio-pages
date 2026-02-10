(function initDemoSeedModule() {
    const DAY_MS = 24 * 60 * 60 * 1000;

    function buildAssets(now) {
        return [
            { id: 101, coinId: "bitcoin", amount: 1.28, costPrice: 61200, addedAt: new Date(now - 80 * DAY_MS).toISOString() },
            { id: 102, coinId: "ethereum", amount: 11.4, costPrice: 2890, addedAt: new Date(now - 76 * DAY_MS).toISOString() },
            { id: 103, coinId: "solana", amount: 92, costPrice: 126, addedAt: new Date(now - 64 * DAY_MS).toISOString() },
            { id: 104, coinId: "binancecoin", amount: 25, costPrice: 545, addedAt: new Date(now - 68 * DAY_MS).toISOString() },
            { id: 105, coinId: "tether", amount: 8200, costPrice: 1, addedAt: new Date(now - 90 * DAY_MS).toISOString() },
            { id: 106, coinId: "ripple", amount: 6200, costPrice: 0.58, addedAt: new Date(now - 73 * DAY_MS).toISOString() },
            { id: 107, coinId: "cardano", amount: 9300, costPrice: 0.49, addedAt: new Date(now - 72 * DAY_MS).toISOString() },
            { id: 108, coinId: "dogecoin", amount: 22000, costPrice: 0.14, addedAt: new Date(now - 61 * DAY_MS).toISOString() },
            { id: 109, coinId: "polkadot", amount: 900, costPrice: 6.4, addedAt: new Date(now - 59 * DAY_MS).toISOString() },
            { id: 110, coinId: "avalanche-2", amount: 460, costPrice: 28, addedAt: new Date(now - 57 * DAY_MS).toISOString() }
        ];
    }

    function buildTransactions(now) {
        const tx = [];
        const pushTx = (id, assetId, coinId, type, amount, price, fee, daysAgo, hourOffset) => {
            tx.push({
                id,
                assetId,
                coinId,
                type,
                amount,
                price,
                fee,
                timestamp: now - (daysAgo * DAY_MS) + (hourOffset * 60 * 60 * 1000)
            });
        };

        let id = 10001;
        for (let d = 89; d >= 2; d -= 2) {
            pushTx(id++, 101, "bitcoin", "BUY", 0.03, 52000 + ((d % 7) * 900), 4.2, d, 2);
            pushTx(id++, 102, "ethereum", d % 10 === 0 ? "SELL" : "BUY", 0.45, 2400 + ((d % 11) * 62), 2.1, d, 3);
            pushTx(id++, 103, "solana", "BUY", 2 + (d % 3), 98 + ((d % 8) * 6), 0.6, d, 5);
            if (d % 4 === 0) {
                pushTx(id++, 106, "ripple", "SELL", 120 + (d % 50), 0.45 + ((d % 6) * 0.05), 0.8, d, 7);
            } else {
                pushTx(id++, 106, "ripple", "BUY", 160 + (d % 60), 0.4 + ((d % 5) * 0.06), 0.7, d, 7);
            }
            if (d % 6 === 0) {
                pushTx(id++, 110, "avalanche-2", "SELL", 4 + (d % 5), 22 + ((d % 7) * 1.8), 0.9, d, 8);
            } else {
                pushTx(id++, 110, "avalanche-2", "BUY", 5 + (d % 4), 20 + ((d % 6) * 2), 0.9, d, 8);
            }
        }

        pushTx(id++, 104, "binancecoin", "BUY", 8, 518, 1.2, 20, 2);
        pushTx(id++, 104, "binancecoin", "SELL", 3, 604, 1.2, 7, 4);
        pushTx(id++, 108, "dogecoin", "BUY", 3000, 0.12, 1.6, 16, 2);
        pushTx(id++, 108, "dogecoin", "SELL", 2000, 0.19, 1.7, 4, 5);
        pushTx(id++, 109, "polkadot", "BUY", 180, 5.8, 0.9, 11, 4);
        pushTx(id++, 109, "polkadot", "SELL", 100, 8.2, 0.9, 3, 2);
        pushTx(id++, 107, "cardano", "BUY", 1200, 0.42, 1.1, 12, 2);
        pushTx(id++, 107, "cardano", "SELL", 800, 0.79, 1.1, 5, 3);
        pushTx(id++, 105, "tether", "BUY", 3000, 1.0, 0.6, 30, 1);
        pushTx(id++, 105, "tether", "SELL", 1500, 1.0, 0.6, 9, 1);

        return tx.sort((a, b) => a.timestamp - b.timestamp).slice(-98);
    }

    function buildSnapshots(now) {
        const points = [];
        let value = 128000;
        for (let i = 29; i >= 0; i -= 1) {
            const drift = (i % 2 === 0 ? 1 : -1) * (420 + (i % 5) * 140);
            const recovery = i < 8 ? 900 : 0;
            value = Math.max(108000, value + drift + recovery);
            points.push({
                timestamp: now - i * DAY_MS,
                value: Math.round(value)
            });
        }
        return points;
    }

    function buildAlertRules(now) {
        return [
            { id: 701, type: "PRICE_ABOVE", coinId: "bitcoin", threshold: 100000, enabled: true, createdAt: now - 20 * DAY_MS },
            { id: 702, type: "PRICE_BELOW", coinId: "ethereum", threshold: 2600, enabled: true, createdAt: now - 18 * DAY_MS },
            { id: 703, type: "POSITION_ABOVE", coinId: "bitcoin", threshold: 42, enabled: true, createdAt: now - 16 * DAY_MS },
            { id: 704, type: "DRAWDOWN_ABOVE", coinId: "", threshold: 12, enabled: true, createdAt: now - 15 * DAY_MS }
        ];
    }

    function buildAlertHistory(now) {
        return [
            { id: 801, message: "Alert triggered: BTC price > $100,000.00", timestamp: now - 6 * DAY_MS + 2 * 60 * 60 * 1000 },
            { id: 802, message: "Alert triggered: max drawdown > 12.00%", timestamp: now - 5 * DAY_MS + 3 * 60 * 60 * 1000 },
            { id: 803, message: "Alert triggered: ETH price < $2,600.00", timestamp: now - 2 * DAY_MS + 5 * 60 * 60 * 1000 }
        ];
    }

    function loadRealisticSnapshotDemo() {
        const now = Date.now();
        return {
            exportedAt: new Date(now).toISOString(),
            version: 2,
            data: {
                assets: buildAssets(now),
                transactions: buildTransactions(now),
                snapshots: buildSnapshots(now),
                alertRules: buildAlertRules(now),
                alertHistory: buildAlertHistory(now),
                settings: {
                    costMethod: "average",
                    theme: "light",
                    performanceRange: "1M",
                    locale: "en-US",
                    demoMode: true,
                    macroEnabled: true,
                    macroWindow: "30D",
                    macroRefreshIntervalSec: 300,
                    macroAnalysisMode: "brief"
                }
            }
        };
    }

    window.AppDemoSeed = {
        loadRealisticSnapshotDemo
    };
})();
