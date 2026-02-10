(function initDecisionWorkspaceModule() {
    function mapMacroRegime(value) {
        if (value === "RISK_ON") return "risk-on";
        if (value === "DEFENSIVE") return "defensive";
        return "balanced";
    }

    function computeDecision(input) {
        const macro = input?.macro || null;
        const news = input?.news || null;
        const stress = input?.stress || null;
        const calendar = input?.calendar || null;

        const macroScore = Number(macro?.score || 50);
        const newsConfidence = Number(news?.confidence || 0.5);
        const stressDelta = Number(stress?.deltaPct || 0);

        let score = 50;
        score += (macroScore - 50) * 0.5;
        score += (news?.regimeImpact === "risk-on" ? 8 : news?.regimeImpact === "defensive" ? -8 : 0) * newsConfidence;
        score += stressDelta > 0 ? 6 : stressDelta < -8 ? -10 : -2;
        if ((calendar?.upcoming || []).some(item => item.importance === "high")) {
            score -= 4;
        }
        score = Math.max(0, Math.min(100, score));

        let actionLevel = "hold";
        if (score >= 66) actionLevel = "increase";
        if (score <= 33) actionLevel = "reduce";

        const regime = score >= 66 ? "risk-on" : score <= 33 ? "defensive" : "balanced";
        const macroRegime = mapMacroRegime(macro?.regime);
        const confidence = Math.max(0.2, Math.min(0.95, (Number(macro?.confidence || 0.5) + newsConfidence) / 2));

        const drivers = [
            { label: "macro", value: macroRegime },
            { label: "news", value: news?.regimeImpact || "balanced" },
            { label: "stress", value: `${stressDelta.toFixed(2)}%` }
        ];

        const limitations = [
            "Signal is scenario-based and not a trading instruction.",
            "Model does not include order-flow and on-chain microstructure."
        ];

        return {
            regime,
            actionLevel,
            score,
            confidence,
            drivers,
            limitations,
            asOf: Date.now()
        };
    }

    window.AppDecisionWorkspace = {
        computeDecision
    };
})();

