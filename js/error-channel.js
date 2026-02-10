(function initErrorChannelModule() {
    function createErrorChannel(elements) {
        function showToast(message, type = "success") {
            if (!elements.toast) return;
            elements.toast.textContent = message;
            elements.toast.className = `toast ${type} show`;
            setTimeout(() => {
                elements.toast.classList.remove("show");
            }, 3000);
        }

        function showErrorBanner(message) {
            if (!elements.errorBanner || !elements.errorBannerText) return;
            elements.errorBannerText.textContent = message;
            elements.errorBanner.classList.remove("hidden");
        }

        function hideErrorBanner() {
            if (!elements.errorBanner) return;
            elements.errorBanner.classList.add("hidden");
        }

        function setInlineError(target, message) {
            const map = {
                tx: elements.txInlineError,
                alert: elements.alertInlineError,
                asset: elements.assetInlineError
            };
            const element = map[target];
            if (!element) return;
            if (!message) {
                element.textContent = "";
                element.classList.add("hidden");
                return;
            }
            element.textContent = message;
            element.classList.remove("hidden");
        }

        return {
            showToast,
            showErrorBanner,
            hideErrorBanner,
            setInlineError
        };
    }

    window.AppErrorChannel = {
        createErrorChannel
    };
})();
