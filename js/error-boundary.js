(function initErrorBoundaryModule() {
    const ERROR_LOG_KEY = "cryptofolio_runtime_errors_v1";
    const MAX_ERROR_LOG = 20;

    function appendRuntimeErrorLog(entry) {
        try {
            const prev = JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || "[]");
            const next = Array.isArray(prev) ? prev.slice(-MAX_ERROR_LOG + 1) : [];
            next.push(entry);
            localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(next));
        } catch (_error) {
            // ignore storage failures
        }
    }

    function createErrorBoundary(options) {
        const {
            showErrorBanner,
            showToast,
            t
        } = options;

        function nextDiagnosticId() {
            return `ERR-${Date.now().toString(36).toUpperCase()}`;
        }

        function handleRuntimeError(error, source) {
            const diagnosticId = nextDiagnosticId();
            const rawMessage = error?.message || String(error || "unknown_error");
            const message = `${t("banner.runtimeError")} (${diagnosticId})`;
            appendRuntimeErrorLog({
                diagnosticId,
                source,
                message: rawMessage,
                route: window.location.pathname,
                hash: window.location.hash,
                ts: Date.now()
            });
            console.error(`[${diagnosticId}] ${source}:`, rawMessage, error);
            showErrorBanner(message);
            showToast(t("toast.runtimeError"), "error");
            return diagnosticId;
        }

        function bindGlobalListeners() {
            window.addEventListener("error", event => {
                handleRuntimeError(event.error || event.message, "window.error");
            });
            window.addEventListener("unhandledrejection", event => {
                handleRuntimeError(event.reason, "window.unhandledrejection");
            });
        }

        return {
            bindGlobalListeners,
            handleRuntimeError
        };
    }

    window.AppErrorBoundary = {
        ERROR_LOG_KEY,
        createErrorBoundary
    };
})();
