(function initDemoStateBackupModule() {
    const DEMO_BACKUP_KEY = "cryptofolio_backup_before_demo";

    function backupBeforeDemo(state) {
        const payload = {
            backupAt: Date.now(),
            data: state
        };
        localStorage.setItem(DEMO_BACKUP_KEY, JSON.stringify(payload));
    }

    function restoreFromDemoBackup() {
        const raw = localStorage.getItem(DEMO_BACKUP_KEY);
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            return parsed?.data || null;
        } catch (_error) {
            return null;
        }
    }

    function getDemoBackupMeta() {
        const raw = localStorage.getItem(DEMO_BACKUP_KEY);
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            if (!parsed?.backupAt) return null;
            return {
                backupAt: Number(parsed.backupAt)
            };
        } catch (_error) {
            return null;
        }
    }

    function clearDemoBackup() {
        localStorage.removeItem(DEMO_BACKUP_KEY);
    }

    window.AppDemoStateBackup = {
        DEMO_BACKUP_KEY,
        backupBeforeDemo,
        restoreFromDemoBackup,
        getDemoBackupMeta,
        clearDemoBackup
    };
})();
