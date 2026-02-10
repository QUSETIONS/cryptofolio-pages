(function initIdGeneratorModule() {
    function fallbackId(prefix) {
        const p = prefix ? `${prefix}_` : "";
        return `${p}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    }

    function nextId(prefix = "") {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
            return prefix ? `${prefix}_${crypto.randomUUID()}` : crypto.randomUUID();
        }
        return fallbackId(prefix);
    }

    function nextNumericId() {
        return Date.now() + Math.floor(Math.random() * 100000);
    }

    window.AppIdGenerator = {
        nextId,
        nextNumericId
    };
})();
