(function initNewsIntelModule() {
    const CACHE_KEY = "cryptofolio_news_snapshot_v1";
    const INSIGHT_CACHE_KEY = "cryptofolio_news_insight_cache_v1";
    const PUBLIC_STATUS_KEY = "cryptofolio_news_public_status_v1";

    function createNewsIntel(options) {
        const {
            elements,
            t,
            localeGetter,
            showToast,
            fetchNewsFeed,
            fetchNewsInsight,
            parseNewsPayload,
            renderNewsFeed,
            renderNewsInsight,
            getSettings,
            getPortfolioContext,
            escapeHtml,
            formatPercent,
            formatTime,
            onJumpToSymbol
        } = options;

        let state = null;
        let visibleCount = 20;
        let countdownTimer = null;
        let modeHintTimer = null;
        let lastRenderedMode = null;

        function hasContainer() {
            return Boolean(
                elements?.newsFeedList &&
                elements?.newsInsightCard &&
                elements?.newsTopicSelect &&
                elements?.newsSinceSelect &&
                elements?.newsAnalysisModeSelect &&
                elements?.newsUpdated &&
                elements?.newsQuality &&
                elements?.newsSources &&
                elements?.newsNextRefresh &&
                elements?.newsLoadMoreBtn
            );
        }

        function saveCache(adapterResult, insightResult) {
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(adapterResult));
                localStorage.setItem(INSIGHT_CACHE_KEY, JSON.stringify(insightResult));
            } catch (_error) {
                // ignore cache write failures
            }
        }

        function loadCache() {
            try {
                const rawFeed = localStorage.getItem(CACHE_KEY);
                const rawInsight = localStorage.getItem(INSIGHT_CACHE_KEY);
                return {
                    feed: rawFeed ? JSON.parse(rawFeed) : null,
                    insight: rawInsight ? JSON.parse(rawInsight) : null
                };
            } catch (_error) {
                return { feed: null, insight: null };
            }
        }

        function savePublicStatus(nextState) {
            try {
                localStorage.setItem(PUBLIC_STATUS_KEY, JSON.stringify({
                    updatedAt: Number(nextState?.adapter?.updatedAt || Date.now()),
                    crawlUpdatedAt: Number(nextState?.adapter?.crawlUpdatedAt || nextState?.adapter?.updatedAt || Date.now()),
                    crawlCount: Number(nextState?.adapter?.crawlCount || nextState?.adapter?.items?.length || 0),
                    lastErrorCode: String(nextState?.adapter?.lastErrorCode || ""),
                    quality: nextState?.adapter?.quality || "stale",
                    sources: nextState?.adapter?.sources || [],
                    count: nextState?.adapter?.items?.length || 0,
                    regimeImpact: nextState?.insight?.regimeImpact || "balanced",
                    confidence: Number(nextState?.insight?.confidence || 0),
                    mode: nextState?.insightMode || "fallback"
                }));
            } catch (_error) {
                // ignore
            }
        }

        function showModeHint(mode) {
            if (!elements?.newsModeHint) return;
            elements.newsModeHint.textContent = t(`news.mode.detail.${mode}`);
            elements.newsModeHint.classList.remove("hidden");
            elements.newsModeHint.classList.add("is-visible");
            if (modeHintTimer) clearTimeout(modeHintTimer);
            modeHintTimer = setTimeout(() => {
                elements.newsModeHint?.classList.remove("is-visible");
                elements.newsModeHint?.classList.add("hidden");
            }, 2000);
        }

        function renderState() {
            if (!hasContainer() || !state) return;
            const settings = getSettings();
            const mode = settings.newsAnalysisMode === "pro" ? "pro" : "brief";

            elements.newsFeedList.innerHTML = renderNewsFeed({
                items: state.adapter.items,
                visibleCount,
                t,
                formatTime,
                escapeHtml,
                locale: localeGetter(),
                quality: state.adapter.quality
            });

            const insightMeta = {
                asOf: state.insight?.asOf || state.adapter.updatedAt,
                quality: state.adapter.quality,
                sources: state.adapter.sources,
                mode,
                itemCount: state.adapter.items.length
            };

            const timelineItems = (state.adapter.items || []).slice(0, 6).map(item => ({
                id: item.id,
                title: item.title,
                publishedAt: item.publishedAt,
                source: item.source,
                regimeImpact: state.insight?.regimeImpact || "balanced",
                confidence: Number(state.insight?.confidence || 0)
            }));

            elements.newsInsightCard.innerHTML = renderNewsInsight({
                insight: state.insight,
                t,
                formatPercent,
                formatTime,
                mode,
                escapeHtml,
                locale: localeGetter(),
                insightMeta,
                timelineItems
            });

            elements.newsUpdated.textContent = t("news.updated", {
                value: new Date(state.adapter.updatedAt).toLocaleTimeString(localeGetter(), { hour: "2-digit", minute: "2-digit" })
            });
            elements.newsQuality.textContent = t("news.qualityLabel", { value: t(`news.quality.${state.adapter.quality}`) });
            elements.newsSources.textContent = t("news.sources", { value: state.adapter.sources.join(", ") || t("news.unknown") });
            if (elements.newsFilterState) {
                elements.newsFilterState.textContent = t("settings.news.summary", {
                    topic: t(`news.topic.${settings.newsTopic || "all"}`),
                    since: t(`news.since.${settings.newsSince || "24h"}`),
                    mode: t(`news.mode.${mode}`)
                });
            }
            elements.newsLoadMoreBtn.classList.toggle("hidden", visibleCount >= state.adapter.items.length);
            elements.newsLoadMoreBtn.textContent = t("news.loadMore");

            if (lastRenderedMode !== mode) {
                showModeHint(mode);
            }
            lastRenderedMode = mode;
        }

        function updateCountdown() {
            if (!state || !elements.newsNextRefresh) return;
            const settings = getSettings();
            const intervalSec = Number(settings.newsRefreshIntervalSec || 300);
            const nextAt = state.fetchedAt + intervalSec * 1000;
            const diff = Math.max(0, Math.round((nextAt - Date.now()) / 1000));
            elements.newsNextRefresh.textContent = t("news.nextRefresh", { value: `${diff}s` });
        }

        function startCountdown() {
            if (countdownTimer) clearInterval(countdownTimer);
            countdownTimer = setInterval(updateCountdown, 1000);
            updateCountdown();
        }

        function buildSkeleton(mode) {
            const count = mode === "pro" ? 6 : 3;
            return Array.from({ length: count }).map(() => '<div class="news-skeleton"></div>').join("");
        }

        function renderProviderHint(adapter) {
            const isProviderMissing = adapter?.code === "NEWS_PROVIDER_NOT_CONFIGURED";
            const title = isProviderMissing ? t("news.providerRequired") : t("news.empty");
            const hint = isProviderMissing ? t("news.providerRequiredHint") : (adapter?.message || t("news.insight.empty"));
            elements.newsFeedList.innerHTML = `<div class="news-empty-card"><p class="news-insight-summary">${escapeHtml(title)}</p><p class="section-meta">${escapeHtml(hint)}</p></div>`;
            elements.newsInsightCard.innerHTML = `<div class="news-empty-card"><p class="news-insight-summary">${escapeHtml(t("news.insight.title"))}</p><p class="section-meta">${escapeHtml(hint)}</p></div>`;
            elements.newsSources.textContent = t("news.sources", { value: t("news.unknown") });
            elements.newsQuality.textContent = t("news.qualityLabel", { value: t(`news.quality.${adapter?.quality || "stale"}`) });
            elements.newsUpdated.textContent = t("news.updated", {
                value: new Date(adapter?.updatedAt || Date.now()).toLocaleTimeString(localeGetter(), { hour: "2-digit", minute: "2-digit" })
            });
            elements.newsNextRefresh.textContent = t("news.nextRefresh", { value: "--" });
            elements.newsLoadMoreBtn.classList.add("hidden");
        }

        async function refresh(opts = {}) {
            if (!hasContainer()) return;
            const settings = getSettings();
            if (!settings.newsEnabled) {
                elements.newsFeedList.innerHTML = `<p class="section-meta">${escapeHtml(t("news.disabledHint"))}</p>`;
                elements.newsInsightCard.innerHTML = `<p class="section-meta">${escapeHtml(t("news.disabled"))}</p>`;
                return;
            }

            const force = Boolean(opts.force);
            const intervalMs = Number(settings.newsRefreshIntervalSec || 300) * 1000;
            if (!force && state && Date.now() - state.fetchedAt < intervalMs) {
                renderState();
                return;
            }

            visibleCount = 20;
            elements.newsFeedList.innerHTML = buildSkeleton(settings.newsAnalysisMode);
            elements.newsInsightCard.innerHTML = `<p class="section-meta">${escapeHtml(t("news.analyzing"))}</p>`;

            try {
                const payload = await fetchNewsFeed(settings.newsTopic, settings.newsSince, 50, localeGetter());
                const adapter = parseNewsPayload(payload);
                if (!adapter.ok) {
                    state = {
                        adapter,
                        insight: null,
                        insightMode: "fallback",
                        fetchedAt: Date.now()
                    };
                    savePublicStatus(state);
                    renderProviderHint(adapter);
                    startCountdown();
                    return;
                }
                const insight = await fetchNewsInsight(adapter.items.slice(0, 10), localeGetter(), getPortfolioContext());
                state = {
                    adapter,
                    insight,
                    insightMode: insight?.mode || "fallback",
                    fetchedAt: Date.now()
                };
                saveCache(adapter, insight);
                savePublicStatus(state);
                renderState();
                startCountdown();
            } catch (_error) {
                const cached = loadCache();
                if (cached.feed) {
                    state = {
                        adapter: {
                            ...cached.feed,
                            quality: "stale",
                            warnings: [...new Set([...(cached.feed.warnings || []), "stale"])]
                        },
                        insight: cached.insight || null,
                        insightMode: (cached.insight && cached.insight.mode) || "fallback",
                        fetchedAt: Date.now()
                    };
                    savePublicStatus(state);
                    renderState();
                    startCountdown();
                    showToast(t("news.fallback"), "error");
                } else {
                    elements.newsFeedList.innerHTML = `<p class="section-meta">${escapeHtml(t("news.empty"))}</p>`;
                    elements.newsInsightCard.innerHTML = `<p class="section-meta">${escapeHtml(t("news.insight.empty"))}</p>`;
                    showToast(t("news.fetchFailed"), "error");
                }
            }
        }

        function rerender() {
            if (!state) return;
            renderState();
            updateCountdown();
        }

        function bind() {
            elements.newsLoadMoreBtn?.addEventListener("click", () => {
                visibleCount += 20;
                renderState();
            });

            elements.newsFeedList?.addEventListener("click", event => {
                const symbolButton = event.target.closest("[data-news-jump-symbol]");
                if (!symbolButton) return;
                const symbol = symbolButton.getAttribute("data-news-jump-symbol");
                if (!symbol) return;
                onJumpToSymbol?.(symbol);
            });
        }

        return {
            bind,
            refresh,
            rerender,
            getAnalysis() {
                if (!state) return null;
                return {
                    regimeImpact: state.insight?.regimeImpact || "balanced",
                    confidence: Number(state.insight?.confidence || 0),
                    quality: state.adapter?.quality || "stale",
                    sources: state.adapter?.sources || [],
                    asOf: state.insight?.asOf || state.adapter?.updatedAt || Date.now(),
                    updatedAt: Number(state.adapter?.updatedAt || Date.now()),
                    topDrivers: (state.insight?.keyRisks || []).slice(0, 3),
                    mode: state.insightMode || "fallback"
                };
            },
            getPublicStatus() {
                if (!state) return null;
                return {
                    updatedAt: state.adapter.updatedAt,
                    quality: state.adapter.quality,
                    sources: state.adapter.sources,
                    count: state.adapter.items.length,
                    regimeImpact: state.insight?.regimeImpact || "balanced",
                    confidence: Number(state.insight?.confidence || 0)
                };
            }
        };
    }

    window.AppNewsIntel = {
        CACHE_KEY,
        INSIGHT_CACHE_KEY,
        PUBLIC_STATUS_KEY,
        createNewsIntel
    };
})();
