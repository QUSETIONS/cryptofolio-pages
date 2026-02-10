import { describe, it, expect } from "vitest";

const newsFeed = require("../api/news-feed.js");

describe("news feed internals", () => {
  it("dedupes items by url + title", () => {
    const items = [
      { url: "https://a.com/1", title: "Headline A" },
      { url: "https://a.com/1", title: "Headline A" },
      { url: "https://a.com/1", title: "Headline B" }
    ];
    const result = newsFeed._internals.dedupeItems(items);
    expect(result).toHaveLength(2);
  });

  it("sanitizes html in text fields", () => {
    const raw = `<img src=x onerror=alert(1)>Fed <b>policy</b>`;
    const clean = newsFeed._internals.sanitizeText(raw, 120);
    expect(clean).toContain("Fed");
    expect(clean).not.toContain("<");
    expect(clean).not.toContain("onerror");
  });
});

