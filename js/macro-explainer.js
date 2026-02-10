(function initMacroExplainerModule() {
    function tKeyForDriver(key) {
        return {
            trend: "macro.driver.trend",
            breadth: "macro.driver.breadth",
            volatility: "macro.driver.volatility",
            concentration: "macro.driver.concentration",
            liquidity: "macro.driver.liquidity"
        }[key] || "macro.driver.trend";
    }

    function explain(scoreResult, t, mode = "brief", context = {}) {
        const isPro = mode === "pro";
        const regimeKey = {
            RISK_ON: "macro.regimeRiskOn",
            BALANCED: "macro.regimeBalanced",
            DEFENSIVE: "macro.regimeDefensive"
        }[scoreResult.regime] || "macro.regimeBalanced";

        const driverLines = (scoreResult.topDrivers || []).map((item, index) =>
            t(isPro ? "macro.pro.topDriver" : "macro.brief.topDriver", {
                idx: index + 1,
                driver: t(tKeyForDriver(item.key)),
                impact: item.value >= 0 ? t("macro.impactPositive") : t("macro.impactNegative")
            })
        );

        const warnings = (scoreResult.warnings || [])
            .map(code => t(`macro.warning.${code}`))
            .filter(Boolean);
        const warningLine = warnings.length > 0 ? warnings.join(" | ") : t("macro.warning.none");

        const summaryLines = isPro
            ? [
                t("macro.pro.summary1", {
                    regime: t(regimeKey),
                    score: scoreResult.score.toFixed(1)
                }),
                t("macro.pro.summary2", {
                    confidence: `${Math.round(scoreResult.confidence * 100)}%`
                }),
                driverLines[0] || t("macro.pro.summaryFallback")
            ]
            : [
                t("macro.brief.summary1", {
                    regime: t(regimeKey),
                    score: scoreResult.score.toFixed(0)
                }),
                driverLines[0] || t("macro.brief.summaryFallback"),
                t("macro.brief.reminder")
            ];

        const factor = scoreResult.factors || {};
        const adapterResult = context.adapterResult || {};
        const asOf = Number(adapterResult.updatedAt) || Date.now();
        const quality = adapterResult.quality || "stale";
        const sources = Array.isArray(adapterResult.sources) ? adapterResult.sources : [];
        const confidence = Math.max(0, Math.min(1, Number(scoreResult.confidence || 0)));
        const proDetails = {
            qualityLine: t("macro.pro.quality", {
                quality,
                updatedAt: String(asOf)
            }),
            evidenceLines: [
                t("macro.pro.evidence1", {
                    trend: Number(factor.trend || 0).toFixed(1),
                    breadth: Number(factor.breadth || 0).toFixed(1),
                    volatility: Number(factor.volatility || 0).toFixed(1)
                }),
                t("macro.pro.evidence2", {
                    concentration: Number(factor.concentration || 0).toFixed(1),
                    liquidity: Number(factor.liquidity || 0).toFixed(1)
                })
            ],
            methodologyLine: t("macro.pro.methodology"),
            limitationLine: t("macro.pro.limitation"),
            driverLines
        };

        return {
            mode: isPro ? "pro" : "brief",
            regimeLabel: t(regimeKey),
            scoreLabel: t("macro.scoreLabel", { score: scoreResult.score.toFixed(1) }),
            summaryLines,
            topDrivers: driverLines,
            warnings,
            warningLine,
            asOf,
            quality,
            sources,
            confidence,
            confidenceLabel: t("macro.confidenceLabel", {
                value: `${Math.round(scoreResult.confidence * 100)}%`
            }),
            proDetails
        };
    }

    window.AppMacroExplainer = {
        explain
    };
})();
