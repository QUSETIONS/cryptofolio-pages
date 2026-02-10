import { describe, it, expect } from "vitest";

const newsFeed = require("../api/news-feed.js");

function createRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

describe("api/news-feed provider behavior", () => {
  it("returns provider-not-configured when no key is present", async () => {
    const prevNews = process.env.NEWS_API_KEY;
    const prevGnews = process.env.GNEWS_API_KEY;
    const prevCrawler = process.env.NEWS_CRAWLER_ENABLED;
    delete process.env.NEWS_API_KEY;
    delete process.env.GNEWS_API_KEY;
    process.env.NEWS_CRAWLER_ENABLED = "0";

    const req = { query: { locale: "zh-CN", topic: "all", since: "24h", limit: "20" } };
    const res = createRes();
    await newsFeed(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.code).toBe("NEWS_PROVIDER_NOT_CONFIGURED");
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items).toHaveLength(0);

    if (prevNews != null) process.env.NEWS_API_KEY = prevNews;
    if (prevGnews != null) process.env.GNEWS_API_KEY = prevGnews;
    if (prevCrawler != null) process.env.NEWS_CRAWLER_ENABLED = prevCrawler;
    else delete process.env.NEWS_CRAWLER_ENABLED;
  });
});
