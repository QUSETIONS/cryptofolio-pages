(function initMacroIntelModule() {
    const CACHE_KEY = "cryptofolio_macro_snapshot_cache_v2";
    const PUBLIC_STATUS_KEY = "cryptofolio_macro_public_status_v1";

    function createMacroIntel(options) {
        const {
            elements,
            t,
            localeGetter,
            showToast,
            fetchMacroSnapshot,
            parseMacroPayload,
            scoreMacroData,
            explainMacroState,
            getSettings
        } = options;

        let chart = null;
        let state = null;
        let countdownTimer = null;

        function hasContainer() {
            return Boolean(
                elements?.macroCurveChart &&
                elements?.macroRegimeBadge &&
                elements?.macroInsight1 &&
                elements?.macroInsight2 &&
                elements?.macroInsight3 &&
                elements?.macroUpdated &&
                elements?.macroScore &&
                elements?.macroConfidence &&
                elements?.macroSources &&
                elements?.macroWarnings &&
                elements?.macroFactorList &&
                elements?.macroProDetails &&
                elements?.macroQualityLine &&
                elements?.macroProDriver1 &&
                elements?.macroProDriver2 &&
                elements?.macroProDriver3 &&
                elements?.macroProEvidence1 &&
                elements?.macroProEvidence2 &&
                elements?.macroProMethod &&
                elements?.macroProLimit &&
                elements?.macroFactorTrend &&
                elements?.macroFactorBreadth &&
                elements?.macroFactorVolatility &&
                elements?.macroFactorConcentration &&
                elements?.macroFactorLiquidity &&
                elements?.macroNextRefresh
            );
        }

        function saveCache(payload) {
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
            } catch (_error) {
                // ignore cache write failure
            }
        }

        function loadCache() {
            try {
                const raw = localStorage.getItem(CACHE_KEY);
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                return parsed && typeof parsed === "object" ? parsed : null;
            } catch (_error) {
                return null;
            }
        }

        function savePublicStatus(nextState) {
            try {
                if (!nextState) return;
                localStorage.setItem(PUBLIC_STATUS_KEY, JSON.stringify({
                    asOf: Number(nextState.explanation?.asOf || nextState.adapterResult?.updatedAt || Date.now()),
                    quality: nextState.explanation?.quality || nextState.adapterResult?.quality || "stale",
                    sources: Array.isArray(nextState.explanation?.sources) ? nextState.explanation.sources : (nextState.adapterResult?.sources || []),
                    score: Number(nextState.scoreResult?.score || 0),
                    regime: nextState.scoreResult?.regime || "BALANCED",
                    confidence: Number(nextState.explanation?.confidence || 0),
                    updatedAt: Date.now()
                }));
            } catch (_error) {
                // ignore cache write failure
            }
        }

        function formatValue(value) {
            return new Intl.NumberFormat(localeGetter(), {
                maximumFractionDigits: 2
            }).format(Number(value || 0));
        }

        function setBar(element, value) {
            if (!element) return;
            const normalized = Math.max(0, Math.min(100, Number(value || 0)));
            element.style.width = `${normalized}%`;
            element.setAttribute("aria-valuenow", normalized.toFixed(1));
        }

        function buildReferenceSeries(seriesMap) {
            const preferredOrder = ["crypto_btc", "equity_sp500", "gold_xau", "dollar_dxy", "rates_ust10y"];
            return preferredOrder
                .map(id => seriesMap[id])
                .filter(Boolean);
        }

        function renderChart(adapterResult) {
            if (!window.Chart || !elements.macroCurveChart) return;
            const ctx = elements.macroCurveChart.getContext("2d");
            if (!ctx) return;

            const seriesList = buildReferenceSeries(adapterResult.seriesMap);
            if (seriesList.length === 0) return;

            const maxLen = Math.max(...seriesList.map(item => item.points.length));
            const basePoints = seriesList[0].points;
            const labels = basePoints.map(item =>
                new Date(item.ts).toLocaleDateString(localeGetter(), { month: "short", day: "numeric" })
            );

            const datasets = seriesList.map((item, idx) => {
                const first = item.points[0]?.value || 1;
                const normalized = item.points.map(point => ((point.value / first) - 1) * 100);
                const palette = ["#ff6b35", "#0ea5e9", "#f59e0b", "#8b5cf6", "#22c55e"];
                return {
                    label: item.label,
                    data: normalized,
                    borderColor: palette[idx % palette.length],
                    borderWidth: 1.8,
                    pointRadius: 0,
                    tension: 0.22,
                    fill: false
                };
            });

            if (!chart) {
                chart = new window.Chart(ctx, {
                    type: "line",
                    data: {
                        labels,
                        datasets
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        plugins: {
                            legend: {
                                display: true,
                                labels: { boxWidth: 10, boxHeight: 10 }
                            },
                            tooltip: {
                                callbacks: {
                                    label: context => `${context.dataset.label}: ${Number(context.parsed.y).toFixed(2)}%`
                                }
                            }
                        },
                        scales: {
                            x: {
                                ticks: {
                                    maxTicksLimit: maxLen > 45 ? 6 : 8
                                }
                            },
                            y: {
                                ticks: {
                                    callback: value => `${value}%`
                                }
                            }
                        }
                    }
                });
                return;
            }

            chart.data.labels = labels;
            chart.data.datasets = datasets;
            chart.update("none");
        }

        function renderScore(scoreResult, explanation, adapterResult) {
            elements.macroRegimeBadge.textContent = explanation.regimeLabel;
            elements.macroRegimeBadge.classList.remove("positive", "neutral", "negative");
            if (scoreResult.regime === "RISK_ON") elements.macroRegimeBadge.classList.add("positive");
            if (scoreResult.regime === "BALANCED") elements.macroRegimeBadge.classList.add("neutral");
            if (scoreResult.regime === "DEFENSIVE") elements.macroRegimeBadge.classList.add("negative");

            elements.macroScore.textContent = explanation.scoreLabel;
            elements.macroConfidence.textContent = explanation.confidenceLabel;
            elements.macroInsight1.textContent = explanation.summaryLines?.[0] || "--";
            elements.macroInsight2.textContent = explanation.summaryLines?.[1] || "--";
            elements.macroInsight3.textContent = explanation.summaryLines?.[2] || "--";
            elements.macroWarnings.textContent = explanation.warningLine || t("macro.warning.none");
            elements.macroSources.textContent = t("macro.sourcesLabel", {
                value: (adapterResult.sources || []).join(", ") || t("macro.sourcesUnknown")
            });
            elements.macroUpdated.textContent = t("macro.updatedAt", {
                time: new Date(adapterResult.updatedAt).toLocaleTimeString(localeGetter(), {
                    hour: "2-digit",
                    minute: "2-digit"
                })
            });

            const isPro = explanation.mode === "pro";
            elements.macroFactorList.classList.toggle("hidden", !isPro);
            elements.macroProDetails.classList.toggle("hidden", !isPro);

            if (isPro) {
                setBar(elements.macroFactorTrend, scoreResult.factors.trend);
                setBar(elements.macroFactorBreadth, scoreResult.factors.breadth);
                setBar(elements.macroFactorVolatility, scoreResult.factors.volatility);
                setBar(elements.macroFactorConcentration, scoreResult.factors.concentration);
                setBar(elements.macroFactorLiquidity, scoreResult.factors.liquidity);

                elements.macroQualityLine.textContent = explanation.proDetails?.qualityLine || "--";
                elements.macroProDriver1.textContent = explanation.proDetails?.driverLines?.[0] || "--";
                elements.macroProDriver2.textContent = explanation.proDetails?.driverLines?.[1] || "--";
                elements.macroProDriver3.textContent = explanation.proDetails?.driverLines?.[2] || "--";
                elements.macroProEvidence1.textContent = explanation.proDetails?.evidenceLines?.[0] || "--";
                elements.macroProEvidence2.textContent = explanation.proDetails?.evidenceLines?.[1] || "--";
                elements.macroProMethod.textContent = explanation.proDetails?.methodologyLine || "--";
                elements.macroProLimit.textContent = explanation.proDetails?.limitationLine || "--";
            }
        }

        function renderState(nextState) {
            if (!hasContainer() || !nextState) return;
            renderChart(nextState.adapterResult);
            renderScore(nextState.scoreResult, nextState.explanation, nextState.adapterResult);
        }

        function updateCountdown() {
            if (!state) return;
            const settings = getSettings();
            const intervalSec = Number(settings.macroRefreshIntervalSec || 300);
            const nextAt = state.fetchedAt + intervalSec * 1000;
            const diffSec = Math.max(0, Math.round((nextAt - Date.now()) / 1000));
            elements.macroNextRefresh.textContent = t("macro.nextRefresh", { value: `${diffSec}s` });
        }

        function startCountdown() {
            if (countdownTimer) {
                clearInterval(countdownTimer);
            }
            countdownTimer = setInterval(updateCountdown, 1000);
            updateCountdown();
        }

        async function refresh(opts = {}) {
            if (!hasContainer()) return;
            const settings = getSettings();
            if (!settings.macroEnabled) {
                elements.macroRegimeBadge.textContent = t("macro.disabled");
                elements.macroWarnings.textContent = t("macro.disabledHint");
                return;
            }

            const force = Boolean(opts.force);
            const intervalMs = Number(settings.macroRefreshIntervalSec || 300) * 1000;
            if (!force && state && Date.now() - state.fetchedAt < intervalMs) {
                renderState(state);
                return;
            }

            try {
                let payload = null;
                if (window.__MACRO_TEST_SNAPSHOT__) {
                    payload = window.__MACRO_TEST_SNAPSHOT__;
                } else if (window.__MACRO_TEST_FAIL__) {
                    throw new Error("macro_test_forced_failure");
                } else {
                    payload = await fetchMacroSnapshot(settings.macroWindow);
                }
                const adapterResult = parseMacroPayload(payload);
                const scoreResult = scoreMacroData(adapterResult);
                const explanation = explainMacroState(scoreResult, t, settings.macroAnalysisMode, { adapterResult });
                state = {
                    adapterResult,
                    scoreResult,
                    explanation,
                    fetchedAt: Date.now()
                };
                saveCache(payload);
                savePublicStatus(state);
                renderState(state);
                startCountdown();
            } catch (error) {
                console.error("Macro intel refresh failed", error);
                const cached = loadCache();
                if (cached) {
                    const adapterResult = parseMacroPayload(cached);
                    adapterResult.warnings = [...new Set([...(adapterResult.warnings || []), "cached_mode"])];
                    const scoreResult = scoreMacroData(adapterResult);
                    const explanation = explainMacroState(scoreResult, t, settings.macroAnalysisMode, { adapterResult });
                    state = {
                        adapterResult,
                        scoreResult,
                        explanation,
                        fetchedAt: Date.now()
                    };
                    savePublicStatus(state);
                    renderState(state);
                    startCountdown();
                } else {
                    elements.macroRegimeBadge.textContent = t("macro.unavailable");
                    elements.macroWarnings.textContent = t("macro.fallback");
                }
                showToast?.(t("toast.macroFailed"), "error");
            }
        }

        function rerender() {
            if (!state) return;
            const settings = getSettings();
            state.explanation = explainMacroState(state.scoreResult, t, settings.macroAnalysisMode, { adapterResult: state.adapterResult });
            renderState(state);
            updateCountdown();
        }

        return {
            refresh,
            rerender,
            getAnalysis() {
                if (!state) return null;
                return {
                    regime: state.scoreResult?.regime || "BALANCED",
                    score: Number(state.scoreResult?.score || 0),
                    asOf: Number(state.explanation?.asOf || state.adapterResult?.updatedAt || Date.now()),
                    confidence: Number(state.explanation?.confidence || 0),
                    quality: state.explanation?.quality || state.adapterResult?.quality || "stale",
                    sources: Array.isArray(state.explanation?.sources) ? state.explanation.sources : (state.adapterResult?.sources || [])
                };
            },
            clearCache() {
                localStorage.removeItem(CACHE_KEY);
            }
        };
    }

    window.AppMacroIntel = {
        CACHE_KEY,
        PUBLIC_STATUS_KEY,
        createMacroIntel
    };
})();
