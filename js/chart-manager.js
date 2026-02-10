(function initChartManagerModule() {
    function createChartManager(deps) {
        const {
            getCoinImageId,
            formatCurrency,
            getFilteredSnapshots,
            getCostBasis,
            getAssets,
            getPriceData,
            coinInfoMap,
            getLocale
        } = deps;
        let portfolioChart = null;
        let performanceChart = null;
        let sparklineChart = null;

        function renderPortfolioChart() {
            const canvas = document.getElementById("portfolioChart");
            if (!canvas || typeof Chart === "undefined") return;
            const ctx = canvas.getContext("2d");
            const chartData = getAssets().map(asset => {
                const price = getPriceData()[asset.coinId]?.usd || 0;
                const basis = getCostBasis(asset);
                const coin = coinInfoMap[asset.coinId] || { symbol: "UNK", color: "#64748b" };
                return { label: coin.symbol, value: basis.amount * price, color: coin.color };
            }).filter(item => item.value > 0);
            if (portfolioChart) portfolioChart.destroy();
            if (chartData.length === 0) return;
            portfolioChart = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: chartData.map(i => i.label),
                    datasets: [{ data: chartData.map(i => i.value), backgroundColor: chartData.map(i => i.color), borderWidth: 0 }]
                },
                options: { responsive: true, maintainAspectRatio: true, cutout: "70%", plugins: { legend: { display: false } } }
            });
        }

        function renderPerformanceChart() {
            const canvas = document.getElementById("performanceChart");
            if (!canvas || typeof Chart === "undefined") return;
            const ctx = canvas.getContext("2d");
            if (performanceChart) performanceChart.destroy();
            const points = getFilteredSnapshots();
            if (points.length < 2) return;
            performanceChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: points.map(point => new Date(point.timestamp).toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" })),
                    datasets: [{ data: points.map(point => point.value), borderColor: "#ff7a33", backgroundColor: "rgba(255,122,51,0.18)", fill: true, pointRadius: 0, tension: 0.25 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => formatCurrency(c.raw) } } } }
            });
        }

        function renderSparkline() {
            const canvas = document.getElementById("totalSparkline");
            if (!canvas || typeof Chart === "undefined") return;
            const ctx = canvas.getContext("2d");
            if (sparklineChart) sparklineChart.destroy();
            const points = getFilteredSnapshots().slice(-24);
            if (points.length < 2) return;
            const first = points[0].value;
            const last = points[points.length - 1].value;
            const up = last >= first;
            sparklineChart = new Chart(ctx, {
                type: "line",
                data: { labels: points.map((_, i) => String(i)), datasets: [{ data: points.map(p => p.value), borderColor: up ? "#10b981" : "#ef4444", backgroundColor: up ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", fill: true, pointRadius: 0, tension: 0.25 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }
            });
        }

        return {
            renderPortfolioChart,
            renderPerformanceChart,
            renderSparkline,
            _debugGetCoinImageId: getCoinImageId
        };
    }

    window.AppChartManager = {
        createChartManager
    };
})();
