(function initStressPresetsModule() {
    const PRESETS = [
        {
            id: "risk_off",
            label: "Risk-Off",
            shocks: {
                byCoin: { bitcoin: -12, ethereum: -15 },
                groups: { alt: -20, stable: 0 }
            },
            note: "Broad risk-off with heavier drawdown on altcoins."
        },
        {
            id: "liquidity_squeeze",
            label: "Liquidity Squeeze",
            shocks: {
                groups: { market: -8, stable: 0 }
            },
            note: "Liquidity compression across risky assets."
        },
        {
            id: "crypto_rally",
            label: "Crypto Rally",
            shocks: {
                byCoin: { bitcoin: 10, ethereum: 14 },
                groups: { alt: 18, stable: 0 }
            },
            note: "Risk-on rally led by majors and alt-beta expansion."
        }
    ];

    function getPresetById(id) {
        return PRESETS.find(item => item.id === id) || PRESETS[0];
    }

    window.AppStressPresets = {
        PRESETS,
        getPresetById
    };
})();
