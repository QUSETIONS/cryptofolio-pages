import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

beforeAll(() => {
  globalThis.window = {};
  const code = readFileSync(resolve(process.cwd(), "js/econ-calendar-adapter.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(code);
});

describe("econ calendar adapter", () => {
  it("parses valid payload and sorts by timestamp", () => {
    const now = Date.now();
    const payload = {
      ok: true,
      updatedAt: now,
      quality: "fresh",
      window: "7d",
      importance: "all",
      events: [
        { id: "b", title: "Event B", timestamp: now + 2000, importance: "high" },
        { id: "a", title: "Event A", timestamp: now + 1000, importance: "medium" }
      ]
    };
    const parsed = window.AppEconCalendarAdapter.parse(payload);
    expect(parsed.events[0].id).toBe("a");
    expect(parsed.quality).toBe("fresh");
  });

  it("degrades invalid payload safely", () => {
    const parsed = window.AppEconCalendarAdapter.parse(null);
    expect(parsed.events).toHaveLength(0);
    expect(parsed.quality).toBe("stale");
  });
});

