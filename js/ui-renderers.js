(function initUIRenderersModule() {
    function defaultEscapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function fallbackCoinInfo(coinId) {
        return {
            symbol: "UNK",
            name: "Unknown Asset",
            color: "#64748b",
            coinId: String(coinId || "unknown")
        };
    }

    function buildAssetsRows(options) {
        const {
            assets,
            coinInfoMap,
            priceData,
            getCostBasis,
            getCoinImageId,
            formatCurrency,
            formatNumber,
            formatPercent,
            summaryStats,
            escapeHtml,
            t
        } = options;
        const escape = typeof escapeHtml === "function" ? escapeHtml : defaultEscapeHtml;
        const tt = typeof t === "function" ? t : key => key;
        const iconFallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Ccircle cx='48' cy='48' r='46' fill='%23f97316'/%3E%3C/svg%3E";

        return assets.map(asset => {
            const coinInfo = coinInfoMap[asset.coinId] || fallbackCoinInfo(asset.coinId);
            const price = priceData[asset.coinId]?.usd || 0;
            const change24h = priceData[asset.coinId]?.usd_24h_change || 0;
            const basis = getCostBasis(asset);
            const holdingAmount = basis.amount;

            const currentValue = holdingAmount * price;
            const costValue = basis.totalCost;
            const profit = currentValue - costValue;
            const profitPercent = costValue > 0 ? (profit / costValue) * 100 : 0;
            const positionPercent = summaryStats.totalValue > 0 ? (currentValue / summaryStats.totalValue) * 100 : 0;
            const prevPrice = Number.isFinite(change24h) && change24h > -100 ? price / (1 + change24h / 100) : price;
            const contribution = holdingAmount * (price - prevPrice);

            const changeClass = change24h >= 0 ? 'positive' : 'negative';
            const profitClass = profit >= 0 ? 'positive' : 'negative';
            const changeArrow = change24h >= 0 ? '+' : '-';
            const contribClass = contribution >= 0 ? "positive" : "negative";
            const safeName = escape(coinInfo.name);
            const safeSymbol = escape(coinInfo.symbol);
            const safeCoinId = escape(asset.coinId);
            const imageId = Number(getCoinImageId(asset.coinId) || 1);

            return `
            <div class="asset-card" data-id="${asset.id}">
                <div class="asset-token-cell">
                    <img class="asset-icon"
                         src="https://assets.coingecko.com/coins/images/${imageId}/small/${safeCoinId === 'avalanche-2' ? 'avalanche' : safeCoinId}.png"
                         alt="${safeName}"
                         onerror="this.src='${iconFallback}'">
                    <div class="asset-info">
                        <div class="asset-name">${safeName}</div>
                        <div class="asset-symbol">${safeSymbol}</div>
                    </div>
                </div>
                <div class="asset-price-info">
                    <div class="current-price">${formatCurrency(price)}</div>
                </div>
                <div class="price-change ${changeClass}">
                    ${changeArrow} ${Math.abs(change24h).toFixed(2)}%
                </div>
                <div class="asset-amount-info">
                    <div class="asset-holdings">${formatNumber(holdingAmount)} ${safeSymbol}</div>
                </div>
                <div class="asset-cost-info">
                    <div class="asset-cost">${formatCurrency(costValue)}</div>
                </div>
                <div class="asset-value-info">
                    <div class="asset-value">${formatCurrency(profit)}</div>
                    <div class="asset-profit ${profitClass}">
                        ${profit >= 0 ? '+' : ''}${formatCurrency(profit)} (${formatPercent(profitPercent)}) / ${formatCurrency(currentValue)}
                    </div>
                </div>
                <div class="asset-position-info">
                    <div class="asset-position">${positionPercent.toFixed(2)}%</div>
                </div>
                <div class="asset-contrib-info">
                    <div class="asset-contrib ${contribClass}">${contribution >= 0 ? '+' : ''}${formatCurrency(contribution)}</div>
                </div>
                <div class="asset-actions">
                    <button class="edit-btn" data-action="edit" data-id="${asset.id}" title="${escape(tt('action.edit'))}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>
                        </svg>
                    </button>
                    <button class="delete-btn" data-action="delete" data-id="${asset.id}" title="${escape(tt('action.delete'))}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        }).join('');
    }

    function buildTransactionsRows(options) {
        const {
            transactions,
            coinInfoMap,
            formatCurrency,
            formatNumber,
            locale,
            escapeHtml,
            t
        } = options;
        const escape = typeof escapeHtml === "function" ? escapeHtml : defaultEscapeHtml;
        const tt = typeof t === "function" ? t : key => key;

        const sorted = [...transactions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
        return sorted.map(tx => {
            const coin = coinInfoMap[tx.coinId] || fallbackCoinInfo(tx.coinId);
            const typeClass = tx.type === 'BUY' ? 'buy' : 'sell';
            const typeText = tx.type === 'BUY' ? tt('tx.type.buy') : tt('tx.type.sell');
            const time = new Date(tx.timestamp).toLocaleString(locale || 'en-US');
            const safeSymbol = escape(coin.symbol);
            return `
            <div class="tx-item">
                <div class="tx-main">
                    <span class="tx-coin">${safeSymbol} ${typeText} ${formatNumber(tx.amount)} @ ${formatCurrency(tx.price)}</span>
                    <span class="tx-time">${escape(time)}</span>
                </div>
                <span class="tx-type ${typeClass}">${typeText}</span>
                <span>${formatCurrency(tx.amount * tx.price)}</span>
                <span>${escape(tt('tx.fee', { value: formatCurrency(tx.fee) }))}</span>
                <button class="tx-delete-btn" data-tx-id="${tx.id}">${escape(tt('tx.delete'))}</button>
            </div>
        `;
        }).join('');
    }

    function buildAlertRulesRows(options) {
        const {
            alertRules,
            formatRuleLabel,
            locale,
            escapeHtml,
            t
        } = options;
        const escape = typeof escapeHtml === "function" ? escapeHtml : defaultEscapeHtml;
        const tt = typeof t === "function" ? t : key => key;

        return [...alertRules]
            .sort((a, b) => b.createdAt - a.createdAt)
            .map(rule => `
            <div class="alert-rule-item">
                <div class="alert-rule-main">
                    <span class="alert-rule-title">${escape(formatRuleLabel(rule))}</span>
                    <span class="alert-rule-meta">${escape(tt('alert.created', { value: new Date(rule.createdAt).toLocaleString(locale || 'en-US') }))}</span>
                </div>
                <label class="alert-toggle">
                    <input type="checkbox" data-alert-toggle="${rule.id}" ${rule.enabled ? 'checked' : ''}>
                    ${escape(tt('alert.enabled'))}
                </label>
                <button class="alert-delete-btn" data-alert-delete="${rule.id}">${escape(tt('alert.delete'))}</button>
            </div>
        `)
            .join('');
    }

    function buildAlertHistoryRows(alertHistory, locale, escapeHtml) {
        const escape = typeof escapeHtml === "function" ? escapeHtml : defaultEscapeHtml;
        return [...alertHistory]
            .sort((a, b) => b.timestamp - a.timestamp)
            .map(item => `
            <div class="alert-history-item">
                <span>${escape(item.message)}</span>
                <span class="alert-history-time">${escape(new Date(item.timestamp).toLocaleString(locale || 'en-US'))}</span>
            </div>
        `)
            .join('');
    }

    window.AppUIRenderers = {
        buildAssetsRows,
        buildTransactionsRows,
        buildAlertRulesRows,
        buildAlertHistoryRows
    };
})();
