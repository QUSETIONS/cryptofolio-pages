import { describe, it, expect, beforeAll, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

beforeAll(() => {
  globalThis.window = {};
  globalThis.confirm = () => true;
  globalThis.localStorage = {
    removeItem: vi.fn()
  };
  const code = readFileSync(resolve(process.cwd(), "js/controllers.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(code);
});

describe("AppControllers", () => {
  it("transaction controller submits valid transaction", () => {
    const addTransaction = vi.fn(() => true);
    const refreshData = vi.fn();
    const showToast = vi.fn();
    const setInlineError = vi.fn();
    const elements = {
      txAssetSelect: { value: "1" },
      txType: { value: "BUY" },
      txAmount: { value: "2" },
      txPrice: { value: "100" },
      txFee: { value: "1" },
      transactionForm: { reset: vi.fn() }
    };
    const controller = window.AppControllers.createTransactionController({
      elements,
      addTransaction,
      removeTransaction: vi.fn(),
      refreshData,
      showToast,
      setInlineError,
      t: key => key,
      confirmAction: vi.fn(async () => true)
    });
    controller.handleTransactionSubmit({ preventDefault: vi.fn() });
    expect(addTransaction).toHaveBeenCalled();
    expect(refreshData).toHaveBeenCalled();
  });

  it("settings controller resets local keys", async () => {
    const removeSpy = vi.spyOn(globalThis.localStorage, "removeItem");
    const controller = window.AppControllers.createSettingsController({
      elements: {
        addAssetForm: { reset: vi.fn() },
        transactionForm: { reset: vi.fn() },
        alertForm: { reset: vi.fn() },
        costMethodSelect: { value: "average" }
      },
      storageKeys: {
        assets: "a",
        snapshots: "s",
        transactions: "t",
        settings: "st",
        alertRules: "ar",
        alertHistory: "ah"
      },
      saveSettings: vi.fn(),
      invalidateComputedCaches: vi.fn(),
      applyTheme: vi.fn(),
      updateSettingsSummary: vi.fn(),
      setFormMode: vi.fn(),
      refreshData: vi.fn(),
      showToast: vi.fn(),
      setCostMethod: vi.fn(),
      setAfterResetState: vi.fn(),
      t: key => key,
      confirmAction: vi.fn(async () => true),
      setLocale: vi.fn()
    });
    await controller.handleResetData();
    expect(removeSpy).toHaveBeenCalledTimes(6);
    removeSpy.mockRestore();
  });
});
