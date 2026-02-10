(function initConfirmDialogModule() {
    function createConfirmDialog(elements) {
        let resolver = null;
        let lastFocused = null;

        function closeWith(result) {
            if (!elements.confirmDialogRoot) return;
            elements.confirmDialogRoot.classList.add("hidden");
            if (typeof resolver === "function") {
                resolver(Boolean(result));
            }
            resolver = null;
            if (lastFocused && typeof lastFocused.focus === "function") {
                lastFocused.focus();
            }
        }

        function onKeydown(e) {
            if (elements.confirmDialogRoot?.classList.contains("hidden")) return;
            if (e.key === "Escape") {
                e.preventDefault();
                closeWith(false);
                return;
            }
            if (e.key === "Tab") {
                const focusables = [
                    elements.confirmCancelBtn,
                    elements.confirmOkBtn
                ].filter(Boolean);
                if (focusables.length === 0) return;
                const index = focusables.indexOf(document.activeElement);
                const next = e.shiftKey ? (index - 1 + focusables.length) % focusables.length : (index + 1) % focusables.length;
                e.preventDefault();
                focusables[next].focus();
            }
        }

        function bind() {
            elements.confirmOverlay?.addEventListener("click", () => closeWith(false));
            elements.confirmCancelBtn?.addEventListener("click", () => closeWith(false));
            elements.confirmOkBtn?.addEventListener("click", () => closeWith(true));
            window.addEventListener("keydown", onKeydown);
        }

        function confirm(options) {
            const opts = options || {};
            if (!elements.confirmDialogRoot) {
                return Promise.resolve(window.confirm(String(opts.message || "")));
            }
            lastFocused = document.activeElement;
            elements.confirmTitle.textContent = String(opts.title || "");
            elements.confirmMessage.textContent = String(opts.message || "");
            elements.confirmOkBtn.textContent = String(opts.confirmText || "Confirm");
            elements.confirmCancelBtn.textContent = String(opts.cancelText || "Cancel");
            elements.confirmDialogRoot.classList.remove("hidden");
            elements.confirmOkBtn.classList.toggle("danger-btn", opts.tone === "danger");
            elements.confirmOkBtn.focus();
            return new Promise(resolve => {
                resolver = resolve;
            });
        }

        return {
            bind,
            confirm
        };
    }

    window.AppConfirmDialog = {
        createConfirmDialog
    };
})();
