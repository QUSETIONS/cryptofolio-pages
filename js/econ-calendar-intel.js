(function initEconCalendarIntelModule() {
    const CACHE_KEY = "cryptofolio_econ_calendar_v1";

    function createEconCalendarIntel(options) {
        const {
            elements,
            t,
            localeGetter,
            showToast,
            fetchEconCalendar,
            parseEconCalendarPayload,
            renderEconEvents,
            getSettings,
            escapeHtml,
            formatTime
        } = options;

        let state = null;

        function hasContainer() {
            return Boolean(elements?.calendarEventsList && elements?.calendarUpdated && elements?.calendarQuality);
        }

        function saveCache(data) {
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            } catch (_error) {}
        }

        function loadCache() {
            try {
                const raw = localStorage.getItem(CACHE_KEY);
                return raw ? JSON.parse(raw) : null;
            } catch (_error) {
                return null;
            }
        }

        function render() {
            if (!hasContainer()) return;
            if (!state) {
                elements.calendarEventsList.innerHTML = `<p class="section-meta">${escapeHtml(t("calendar.empty"))}</p>`;
                return;
            }
            elements.calendarEventsList.innerHTML = renderEconEvents({
                events: state.events,
                t,
                formatTime,
                escapeHtml
            });
            elements.calendarUpdated.textContent = t("calendar.updated", {
                value: new Date(state.updatedAt).toLocaleTimeString(localeGetter(), { hour: "2-digit", minute: "2-digit" })
            });
            elements.calendarQuality.textContent = t("calendar.quality", { value: t(`news.quality.${state.quality}`) });
        }

        async function refresh(opts = {}) {
            if (!hasContainer()) return;
            const settings = getSettings();
            if (!settings.calendarEnabled) {
                elements.calendarEventsList.innerHTML = `<p class="section-meta">${escapeHtml(t("calendar.disabled"))}</p>`;
                return;
            }
            try {
                const payload = await fetchEconCalendar(settings.calendarWindow, settings.calendarImportance, localeGetter());
                state = parseEconCalendarPayload(payload);
                saveCache(state);
                render();
            } catch (_error) {
                const cached = loadCache();
                if (cached) {
                    state = { ...cached, quality: "stale" };
                    render();
                    if (!opts.silent) showToast(t("calendar.fallback"), "error");
                } else {
                    elements.calendarEventsList.innerHTML = `<p class="section-meta">${escapeHtml(t("calendar.empty"))}</p>`;
                    if (!opts.silent) showToast(t("calendar.fetchFailed"), "error");
                }
            }
        }

        function rerender() {
            render();
        }

        function getAnalysis() {
            if (!state) return null;
            const upcoming = state.events.filter(item => item.timestamp >= Date.now()).slice(0, 3);
            return {
                quality: state.quality,
                updatedAt: state.updatedAt,
                upcoming
            };
        }

        return {
            refresh,
            rerender,
            getAnalysis
        };
    }

    window.AppEconCalendarIntel = {
        CACHE_KEY,
        createEconCalendarIntel
    };
})();

