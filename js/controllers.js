(function initControllersModule() {
    function createAssetController(deps) {
        const {
            elements,
            addAsset,
            updateAsset,
            removeAsset,
            getAssets,
            setFormMode,
            refreshData,
            applyRoute,
            showToast,
            setInlineError,
            t,
            confirmAction
        } = deps;

        function handleFormSubmit(e) {
            e.preventDefault();

            const coinId = elements.coinSelect.value;
            const amount = parseFloat(elements.amountInput.value);
            const costPrice = parseFloat(elements.costPriceInput.value);

            if (!coinId || isNaN(amount) || isNaN(costPrice)) {
                setInlineError("asset", t("error.assetRequired"));
                showToast(t("error.checkInput"), 'error');
                return;
            }
            if (amount <= 0 || costPrice <= 0) {
                setInlineError("asset", t("error.assetPositive"));
                showToast(t("error.checkInput"), 'error');
                return;
            }
            setInlineError("asset", "");

            const editingId = elements.editingIdInput.value ? Number(elements.editingIdInput.value) : null;
            if (editingId) {
                const updated = updateAsset(editingId, amount, costPrice);
                if (!updated) return;
                setFormMode('add');
            } else {
                addAsset(coinId, amount, costPrice);
                elements.addAssetForm.reset();
            }

            refreshData();
        }

        async function handleDelete(id) {
            const confirmed = await confirmAction(t("confirm.deleteAsset"));
            if (!confirmed) return;
            removeAsset(id);
            if (Number(elements.editingIdInput.value) === id) {
                setFormMode('add');
            }
            refreshData();
        }

        function handleEdit(id) {
            const target = getAssets().find(asset => asset.id === id);
            if (!target) {
                showToast(t("error.checkInput"), 'error');
                return;
            }
            setFormMode('edit', target);
        }

        async function handleAssetActionClick(e) {
            const button = e.target.closest('button[data-action]');
            if (!button) return;

            const id = Number(button.dataset.id);
            const action = button.dataset.action;
            if (!Number.isFinite(id)) return;

            if (action === 'delete') {
                await handleDelete(id);
                return;
            }
            if (action === 'edit') {
                handleEdit(id);
            }
        }

        function handleEmptyStateCta() {
            window.location.hash = '#/assets';
            applyRoute('assets');
            elements.coinSelect.focus();
        }

        return {
            handleFormSubmit,
            handleDelete,
            handleEdit,
            handleAssetActionClick,
            handleEmptyStateCta
        };
    }

    function createTransactionController(deps) {
        const {
            elements,
            addTransaction,
            removeTransaction,
            refreshData,
            showToast,
            setInlineError,
            t,
            confirmAction
        } = deps;

        function handleTransactionSubmit(e) {
            e.preventDefault();

            const assetId = Number(elements.txAssetSelect.value);
            const type = elements.txType.value;
            const amount = Number(elements.txAmount.value);
            const price = Number(elements.txPrice.value);
            const fee = Number(elements.txFee.value || 0);

            if (!Number.isFinite(assetId) || !type || !Number.isFinite(amount) || !Number.isFinite(price) || !Number.isFinite(fee)) {
                setInlineError("tx", t("error.txRequired"));
                showToast(t("error.checkInput"), 'error');
                return;
            }
            if (amount <= 0 || price <= 0 || fee < 0) {
                setInlineError("tx", t("error.txInvalid"));
                showToast(t("error.checkInput"), 'error');
                return;
            }
            setInlineError("tx", "");

            const success = addTransaction(assetId, type, amount, price, fee);
            if (!success) return;

            elements.transactionForm.reset();
            elements.txType.value = 'BUY';
            elements.txFee.value = '0';
            showToast(t("toast.txSaved"));
            refreshData();
        }

        async function handleTransactionListClick(e) {
            const button = e.target.closest('button[data-tx-id]');
            if (!button) return;
            const txId = Number(button.dataset.txId);
            if (!Number.isFinite(txId)) return;
            const confirmed = await confirmAction(t("confirm.deleteTx"));
            if (!confirmed) return;
            removeTransaction(txId);
            showToast(t("toast.txDeleted"));
            refreshData();
        }

        return {
            handleTransactionSubmit,
            handleTransactionListClick
        };
    }

    function createAlertController(deps) {
        const {
            elements,
            getAlertRules,
            setAlertRules,
            getAlertActiveMap,
            saveAlertRules,
            renderAlertRules,
            updateAlertCoinAvailability,
            refreshData,
            showToast,
            setInlineError,
            t,
            confirmAction
        } = deps;

        function handleAlertSubmit(e) {
            e.preventDefault();
            const type = elements.alertType.value;
            const coinId = elements.alertCoinSelect.value;
            const threshold = Number(elements.alertThreshold.value);
            const needCoin = type !== 'DRAWDOWN_ABOVE';

            if (!type || !Number.isFinite(threshold) || threshold < 0) {
                setInlineError("alert", t("error.alertThreshold"));
                showToast(t("error.checkInput"), 'error');
                return;
            }
            if (needCoin && !coinId) {
                setInlineError("alert", t("error.alertCoinRequired"));
                showToast(t("error.checkInput"), 'error');
                return;
            }
            setInlineError("alert", "");

            const nextRules = getAlertRules().concat({
                id: Date.now(),
                type,
                coinId: needCoin ? coinId : '',
                threshold,
                enabled: true,
                createdAt: Date.now()
            });
            setAlertRules(nextRules);
            saveAlertRules();
            elements.alertForm.reset();
            elements.alertType.value = 'PRICE_ABOVE';
            updateAlertCoinAvailability();
            renderAlertRules();
            showToast(t("toast.alertAdded"));
            refreshData();
        }

        async function handleAlertRulesClick(e) {
            const deleteBtn = e.target.closest('button[data-alert-delete]');
            if (deleteBtn) {
                const confirmed = await confirmAction(t("confirm.deleteAlert"));
                if (!confirmed) return;
                const id = Number(deleteBtn.dataset.alertDelete);
                if (!Number.isFinite(id)) return;
                const nextRules = getAlertRules().filter(rule => rule.id !== id);
                setAlertRules(nextRules);
                delete getAlertActiveMap()[id];
                saveAlertRules();
                renderAlertRules();
                showToast(t("toast.alertDeleted"));
                return;
            }

            const toggleInput = e.target.closest('input[data-alert-toggle]');
            if (!toggleInput) return;
            const id = Number(toggleInput.dataset.alertToggle);
            if (!Number.isFinite(id)) return;
            const rules = getAlertRules();
            const rule = rules.find(item => item.id === id);
            if (!rule) return;
            rule.enabled = toggleInput.checked;
            if (!rule.enabled) {
                getAlertActiveMap()[id] = false;
            }
            saveAlertRules();
        }

        return {
            handleAlertSubmit,
            handleAlertRulesClick
        };
    }

    function createSettingsController(deps) {
        const {
            elements,
            storageKeys,
            saveSettings,
            invalidateComputedCaches,
            applyTheme,
            updateSettingsSummary,
            setFormMode,
            refreshData,
            showToast,
            setCostMethod,
            setAfterResetState,
            t,
            confirmAction,
            setLocale
        } = deps;

        function handleCostMethodChange(e) {
            const method = e.target.value;
            if (method !== 'average' && method !== 'fifo') return;
            setCostMethod(method);
            saveSettings();
            invalidateComputedCaches();
            updateSettingsSummary();
            refreshData();
        }

        async function handleResetData() {
            const confirmed = await confirmAction(t("confirm.resetData"));
            if (!confirmed) return;

            localStorage.removeItem(storageKeys.assets);
            localStorage.removeItem(storageKeys.snapshots);
            localStorage.removeItem(storageKeys.transactions);
            localStorage.removeItem(storageKeys.settings);
            localStorage.removeItem(storageKeys.alertRules);
            localStorage.removeItem(storageKeys.alertHistory);

            setAfterResetState();
            elements.addAssetForm.reset();
            elements.transactionForm.reset();
            elements.alertForm.reset();
            elements.costMethodSelect.value = 'average';
            if (elements.localeSelect) {
                elements.localeSelect.value = 'en-US';
            }
            applyTheme('light');
            if (typeof setLocale === "function") {
                setLocale("en-US");
            }
            updateSettingsSummary();
            setFormMode('add');
            showToast(t("toast.resetDone"));
            refreshData();
        }

        return {
            handleCostMethodChange,
            handleResetData
        };
    }

    window.AppControllers = {
        createAssetController,
        createTransactionController,
        createAlertController,
        createSettingsController
    };
})();

