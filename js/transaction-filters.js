(function initTransactionFiltersModule() {
    function createTransactionFilters(initialState) {
        let state = {
            coinId: "ALL",
            type: "ALL",
            range: "ALL",
            ...(initialState || {})
        };

        function setState(nextState) {
            state = {
                ...state,
                ...(nextState || {})
            };
        }

        function getState() {
            return { ...state };
        }

        function setFromControls(elements) {
            setState({
                coinId: elements.txFilterCoin?.value || "ALL",
                type: elements.txFilterType?.value || "ALL",
                range: elements.txFilterRange?.value || "ALL"
            });
            return getState();
        }

        function getFromTimestamp(now = Date.now()) {
            if (state.range === "7D") return now - 7 * 24 * 60 * 60 * 1000;
            if (state.range === "30D") return now - 30 * 24 * 60 * 60 * 1000;
            if (state.range === "90D") return now - 90 * 24 * 60 * 60 * 1000;
            return 0;
        }

        function filterTransactions(transactions, now = Date.now()) {
            const fromTs = getFromTimestamp(now);
            return transactions.filter(tx => {
                if (state.coinId !== "ALL" && tx.coinId !== state.coinId) return false;
                if (state.type !== "ALL" && tx.type !== state.type) return false;
                if (fromTs > 0 && tx.timestamp < fromTs) return false;
                return true;
            });
        }

        return {
            getState,
            setState,
            setFromControls,
            filterTransactions
        };
    }

    window.AppTransactionFilters = {
        createTransactionFilters
    };
})();
