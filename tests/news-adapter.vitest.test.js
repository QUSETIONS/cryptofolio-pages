import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

beforeAll(() => {
  globalThis.window = {};
  const code = readFileSync(resolve(process.cwd(), "js/news-adapter.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(code);
});

describe("AppNewsAdapter.parse", () => {
  it("normalizes payload and keeps valid http items", () => {
    const payload = {
      ok: true,
      updatedAt: Date.now(),
      quality: "fresh",
      topic: "macro",
      since: "24h",
      locale: "en-US",
      sources: ["A"],
      items: [
        {
          id: "n1",
          title: "Fed keeps rates unchanged",
          summary: "<b>Summary</b>",
          url: "https://example.com/news/1",
          source: "Example",
          publishedAt: Date.now(),
          topics: ["rates"],
          symbols: ["BTC"],
          sentimentHint: "neutral"
        },
        {
          id: "bad",
          title: "Broken url",
          url: "javascript:alert(1)"
        }
      ]
    };

    const result = window.AppNewsAdapter.parse(payload);
    expect(result.ok).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].summary).toBe("Summary");
    expect(result.quality).toBe("fresh");
    expect(result.topic).toBe("macro");
  });

  it("degrades gracefully on empty payload", () => {
    const result = window.AppNewsAdapter.parse(null);
    expect(result.items).toHaveLength(0);
    expect(result.quality).toBe("stale");
    expect(result.warnings).toContain("empty");
  });
});

