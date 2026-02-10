(function initRefreshSchedulerModule() {
    function createRefreshScheduler(options) {
        const {
            refresh,
            intervalMs,
            getHasAssets
        } = options;
        let timer = null;
        let pausedByOffline = false;

        function tick() {
            if (document.hidden) return;
            if (!navigator.onLine) return;
            if (!getHasAssets()) return;
            refresh();
        }

        function start() {
            stop();
            timer = setInterval(tick, intervalMs);
        }

        function stop() {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }

        function onVisibilityChange() {
            if (!document.hidden && getHasAssets()) {
                refresh();
            }
        }

        function onNetworkChange() {
            if (!navigator.onLine) {
                pausedByOffline = true;
                return;
            }
            if (pausedByOffline) {
                pausedByOffline = false;
            }
            if (!document.hidden && getHasAssets()) {
                refresh();
            }
        }

        return {
            start,
            stop,
            onVisibilityChange,
            onNetworkChange
        };
    }

    window.AppRefreshScheduler = {
        createRefreshScheduler
    };
})();
