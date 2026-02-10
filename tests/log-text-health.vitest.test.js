import { describe, it, expect } from "vitest";

const { collectViolations } = require("../scripts/check-log-text-health.js");

describe("check-log-text-health", () => {
  it("finds no suspicious runtime text in repository baseline", () => {
    const violations = collectViolations();
    expect(Array.isArray(violations)).toBe(true);
    expect(violations).toHaveLength(0);
  });
});
