import { describe, it, expect } from "vitest";

const newsTranslate = require("../api/news-translate.js");

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

describe("api/news-translate", () => {
  it("returns concise zh summary for zh-CN locale", async () => {
    const req = {
      method: "POST",
      body: {
        locale: "zh-CN",
        items: [
          {
            id: "1",
            title: "Shopify shares drop despite strong earnings",
            summary: "",
            source: "CNBC Markets"
          }
        ]
      }
    };
    const res = createRes();
    await newsTranslate(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.items[0].titleZh).toContain("股票");
    expect(res.body.items[0].summaryZh).toContain("发生了什么");
  });
});
