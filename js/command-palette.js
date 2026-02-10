(function initCommandPaletteModule() {
    function createCommandPalette(options) {
        const {
            elements,
            noResultText = "No command found."
        } = options;

        let items = [];
        let activeIndex = 0;
        let visibleItems = [];
        let lastFocusedElement = null;
        let noResultLabel = noResultText;

        function isOpen() {
            return !!elements.commandPalette && !elements.commandPalette.classList.contains("hidden");
        }

        function setItems(nextItems) {
            items = Array.isArray(nextItems) ? [...nextItems] : [];
            activeIndex = 0;
        }

        function getKeyword() {
            return (elements.commandInput?.value || "").trim().toLowerCase();
        }

        function getVisibleItems() {
            const keyword = getKeyword();
            return items.filter(item =>
                item.label.toLowerCase().includes(keyword) ||
                item.hint.toLowerCase().includes(keyword)
            );
        }

        function syncAria() {
            if (!elements.commandInput || !elements.commandList) return;
            const active = visibleItems[activeIndex];
            if (!active) {
                elements.commandInput.removeAttribute("aria-activedescendant");
                return;
            }
            elements.commandInput.setAttribute("aria-activedescendant", `command-option-${active.id}`);
        }

        function render() {
            if (!elements.commandList) return;
            visibleItems = getVisibleItems();
            if (activeIndex >= visibleItems.length) {
                activeIndex = visibleItems.length > 0 ? visibleItems.length - 1 : 0;
            }
            const html = visibleItems.map((item, index) => `
                <li
                    id="command-option-${item.id}"
                    role="option"
                    aria-selected="${index === activeIndex ? "true" : "false"}"
                    class="command-item ${index === activeIndex ? "active" : ""}"
                    data-command-id="${item.id}"
                >
                    <span>${item.label}</span>
                    <span class="command-hint">${item.hint}</span>
                </li>
            `).join("");
            elements.commandList.innerHTML = html || `<li class="command-item" role="option" aria-selected="false">${noResultLabel}</li>`;
            syncAria();
        }

        function open() {
            if (!elements.commandPalette) return;
            lastFocusedElement = document.activeElement;
            activeIndex = 0;
            elements.commandPalette.classList.remove("hidden");
            if (elements.commandInput) {
                elements.commandInput.value = "";
                elements.commandInput.focus();
            }
            render();
        }

        function close() {
            if (!elements.commandPalette) return;
            elements.commandPalette.classList.add("hidden");
            if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
                lastFocusedElement.focus();
            }
        }

        function executeActive() {
            const selected = visibleItems[activeIndex];
            if (!selected || typeof selected.run !== "function") return;
            selected.run();
            close();
        }

        function onInput() {
            activeIndex = 0;
            render();
        }

        function onListClick(e) {
            const item = e.target.closest("[data-command-id]");
            if (!item) return;
            const id = item.dataset.commandId;
            const target = items.find(cmd => cmd.id === id);
            if (!target) return;
            target.run();
            close();
        }

        function onKeydown(e) {
            if (e.key === "Escape") {
                e.preventDefault();
                close();
                return;
            }
            if (e.key === "ArrowDown") {
                e.preventDefault();
                if (visibleItems.length > 0) {
                    activeIndex = (activeIndex + 1) % visibleItems.length;
                    render();
                }
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                if (visibleItems.length > 0) {
                    activeIndex = (activeIndex - 1 + visibleItems.length) % visibleItems.length;
                    render();
                }
                return;
            }
            if (e.key === "Tab") {
                e.preventDefault();
                if (visibleItems.length > 0) {
                    activeIndex = e.shiftKey
                        ? (activeIndex - 1 + visibleItems.length) % visibleItems.length
                        : (activeIndex + 1) % visibleItems.length;
                    render();
                }
                return;
            }
            if (e.key === "Enter") {
                e.preventDefault();
                executeActive();
            }
        }

        function onGlobalShortcut(e) {
            const key = String(e.key || "").toLowerCase();
            if ((e.ctrlKey || e.metaKey) && key === "k") {
                e.preventDefault();
                if (isOpen()) {
                    close();
                } else {
                    open();
                }
            }
        }

        function bind() {
            elements.commandOverlay?.addEventListener("click", close);
            elements.commandInput?.addEventListener("input", onInput);
            elements.commandInput?.addEventListener("keydown", onKeydown);
            elements.commandList?.addEventListener("click", onListClick);
            window.addEventListener("keydown", onGlobalShortcut);
        }

        function unbind() {
            elements.commandOverlay?.removeEventListener("click", close);
            elements.commandInput?.removeEventListener("input", onInput);
            elements.commandInput?.removeEventListener("keydown", onKeydown);
            elements.commandList?.removeEventListener("click", onListClick);
            window.removeEventListener("keydown", onGlobalShortcut);
        }

        function setNoResultText(nextText) {
            noResultLabel = String(nextText || "");
        }

        return {
            setItems,
            setNoResultText,
            render,
            open,
            close,
            isOpen,
            bind,
            unbind
        };
    }

    window.AppCommandPalette = {
        createCommandPalette
    };
})();
