import { describe, it, expect } from "vitest";

const core = require("../api/_news-core.js");

describe("news rss parser", () => {
  it("parses rss items into normalized articles", () => {
    const xml = `<?xml version="1.0"?><rss><channel>
      <item>
        <title>Bitcoin rallies on ETF inflows</title>
        <description>BTC rose after fresh ETF demand.</description>
        <link>https://example.com/a</link>
        <pubDate>Mon, 10 Feb 2026 10:00:00 GMT</pubDate>
      </item>
      <item>
        <title>Fed keeps rates unchanged</title>
        <description>Macro risk remains balanced.</description>
        <link>https://example.com/b</link>
        <pubDate>Mon, 10 Feb 2026 09:00:00 GMT</pubDate>
      </item>
    </channel></rss>`;

    const source = { name: "TestRSS", topics: ["macro", "crypto"] };
    const result = core.parseRssItems(xml, source, "en-US");

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0].source).toBe("TestRSS");
    expect(result[0].url).toMatch(/^https:\/\//);
    expect(result[0].lang).toBe("en-US");
    expect(Array.isArray(result[0].topics)).toBe(true);
  });

  it("drops invalid rss items without valid url/title", () => {
    const xml = `<?xml version="1.0"?><rss><channel>
      <item>
        <title></title>
        <description>Missing title</description>
        <link>javascript:alert(1)</link>
      </item>
    </channel></rss>`;
    const source = { name: "TestRSS", topics: ["macro"] };
    const result = core.parseRssItems(xml, source, "zh-CN");
    expect(result).toHaveLength(0);
  });
});
