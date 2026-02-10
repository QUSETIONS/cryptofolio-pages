(function initDemoAuditModule() {
    const DEMO_AUDIT_KEY = "cryptofolio_demo_audit_log";
    const MAX_AUDIT_ITEMS = 30;

    function createDemoAudit() {
        function read() {
            const raw = localStorage.getItem(DEMO_AUDIT_KEY);
            if (!raw) return [];
            try {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [];
            } catch (_error) {
                return [];
            }
        }

        function write(items) {
            localStorage.setItem(DEMO_AUDIT_KEY, JSON.stringify(items.slice(-MAX_AUDIT_ITEMS)));
        }

        function append(action, detail) {
            const items = read();
            items.push({
                id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                action,
                detail: String(detail || ""),
                timestamp: Date.now()
            });
            write(items);
        }

        function clear() {
            localStorage.removeItem(DEMO_AUDIT_KEY);
        }

        return {
            read,
            append,
            clear
        };
    }

    window.AppDemoAudit = {
        DEMO_AUDIT_KEY,
        createDemoAudit
    };
})();
