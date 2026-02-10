(function initDesktopPetModule() {
    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function createDesktopPet(options) {
        const {
            root,
            body,
            menu,
            isEnabled,
            getPosition,
            onPositionChange,
            onAction
        } = options || {};

        if (!root || !body || !menu) {
            return {
                bind() {},
                sync() {},
                show() {},
                hide() {},
                destroy() {}
            };
        }

        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        let isBound = false;

        function applyPosition(position) {
            const x = Number(position?.x);
            const y = Number(position?.y);
            const defaultX = window.innerWidth - 96;
            const defaultY = window.innerHeight - 128;
            const maxX = Math.max(0, window.innerWidth - 70);
            const maxY = Math.max(0, window.innerHeight - 70);
            const nextX = Number.isFinite(x) ? clamp(x, 0, maxX) : defaultX;
            const nextY = Number.isFinite(y) ? clamp(y, 0, maxY) : defaultY;
            root.style.left = `${nextX}px`;
            root.style.top = `${nextY}px`;
        }

        function closeMenu() {
            menu.classList.add("hidden");
        }

        function openMenu() {
            menu.classList.remove("hidden");
        }

        function sync() {
            root.classList.toggle("hidden", !isEnabled());
            if (!isEnabled()) {
                closeMenu();
                return;
            }
            applyPosition(getPosition());
        }

        function onBodyClick() {
            if (menu.classList.contains("hidden")) {
                openMenu();
            } else {
                closeMenu();
            }
        }

        function onMenuClick(event) {
            const action = event?.target?.getAttribute("data-pet-action");
            if (!action) return;
            closeMenu();
            onAction(action);
        }

        function onPointerDown(event) {
            if (event.pointerType === "mouse" && event.button !== 0) return;
            isDragging = true;
            root.classList.add("is-dragging");
            const rect = root.getBoundingClientRect();
            dragOffset = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
            body.setPointerCapture(event.pointerId);
        }

        function onPointerMove(event) {
            if (!isDragging) return;
            const maxX = Math.max(0, window.innerWidth - root.offsetWidth);
            const maxY = Math.max(0, window.innerHeight - root.offsetHeight);
            const nextX = clamp(event.clientX - dragOffset.x, 0, maxX);
            const nextY = clamp(event.clientY - dragOffset.y, 0, maxY);
            root.style.left = `${nextX}px`;
            root.style.top = `${nextY}px`;
        }

        function onPointerUp(event) {
            if (!isDragging) return;
            isDragging = false;
            root.classList.remove("is-dragging");
            body.releasePointerCapture(event.pointerId);
            const rect = root.getBoundingClientRect();
            onPositionChange({ x: rect.left, y: rect.top });
        }

        function onResize() {
            applyPosition(getPosition());
        }

        function onDocumentClick(event) {
            if (root.contains(event.target)) return;
            closeMenu();
        }

        function bind() {
            if (isBound) return;
            isBound = true;
            body.addEventListener("click", onBodyClick);
            body.addEventListener("pointerdown", onPointerDown);
            body.addEventListener("pointermove", onPointerMove);
            body.addEventListener("pointerup", onPointerUp);
            menu.addEventListener("click", onMenuClick);
            document.addEventListener("click", onDocumentClick);
            window.addEventListener("resize", onResize);
            sync();
        }

        function destroy() {
            if (!isBound) return;
            isBound = false;
            body.removeEventListener("click", onBodyClick);
            body.removeEventListener("pointerdown", onPointerDown);
            body.removeEventListener("pointermove", onPointerMove);
            body.removeEventListener("pointerup", onPointerUp);
            menu.removeEventListener("click", onMenuClick);
            document.removeEventListener("click", onDocumentClick);
            window.removeEventListener("resize", onResize);
        }

        return {
            bind,
            sync,
            show() {
                root.classList.remove("hidden");
            },
            hide() {
                root.classList.add("hidden");
            },
            destroy
        };
    }

    window.AppDesktopPet = { createDesktopPet };
})();
