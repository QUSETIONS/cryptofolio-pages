(function initNewsAdapterModule() {
    function sanitizeText(input, maxLen = 420) {
        return String(input || "")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, maxLen);
    }

    function normalizeQuality(value) {
        return ["fresh", "delayed", "stale", "partial"].includes(value) ? value : "stale";
    }

    function normalizeTopic(value) {
        return ["all", "macro", "crypto", "rates"].includes(value) ? value : "all";
    }

    function normalizeSince(value) {
        return ["1h", "24h", "7d"].includes(value) ? value : "24h";
    }

    function dedupeItems(items) {
        const seen = new Set();
        const out = [];
        items.forEach(item => {
            const key = `${item.url}::${item.title.toLowerCase()}`;
            if (seen.has(key)) return;
            seen.add(key);
            out.push(item);
        });
        return out;
    }

    function shouldLocalizeToZh(locale) {
        return locale === "zh-CN";
    }

    function looksMostlyAscii(text) {
        const value = String(text || "");
        if (!value) return false;
        const stripped = value.replace(/\s+/g, "");
        if (!stripped) return false;
        const asciiCount = (stripped.match(/[A-Za-z]/g) || []).length;
        return asciiCount / stripped.length >= 0.35;
    }

    function localizeHeadlineZh(text) {
        if (!text) return "";
        let out = String(text);
        const replacements = [
            [/stocks?/gi, "股市"],
            [/shares?/gi, "股票"],
            [/dollar/gi, "美元"],
            [/bond yields?/gi, "债券收益率"],
            [/earnings/gi, "财报"],
            [/revenue/gi, "营收"],
            [/estimates?/gi, "预期"],
            [/risk[- ]off/gi, "风险偏好下降"],
            [/risk[- ]on/gi, "风险偏好回升"],
            [/inflation/gi, "通胀"],
            [/rate cut/gi, "降息"],
            [/rate hike/gi, "加息"],
            [/federal reserve|fed/gi, "美联储"],
            [/bitcoin/gi, "比特币"],
            [/ethereum/gi, "以太坊"],
            [/crypto/gi, "加密市场"],
            [/gold/gi, "黄金"]
        ];
        replacements.forEach(([pattern, value]) => {
            out = out.replace(pattern, value);
        });
        return out;
    }

    function buildFallbackSummaryZh(item) {
        const source = item.source || "新闻源";
        const localizedTitle = localizeHeadlineZh(item.title || "");
        if (!localizedTitle) {
            return `来自${source}的市场快讯，建议结合价格与风险指标交叉判断。`;
        }
        return `要点：${localizedTitle}。来源：${source}。建议结合仓位与风险信号综合判断。`;
    }

    function localizeNewsItem(item, locale) {
        if (!shouldLocalizeToZh(locale)) return item;
        const next = { ...item };
        if (looksMostlyAscii(next.title)) {
            next.title = localizeHeadlineZh(next.title);
        }
        if (!next.summary) {
            next.summary = buildFallbackSummaryZh(next);
        } else if (looksMostlyAscii(next.summary)) {
            next.summary = `摘要：${localizeHeadlineZh(next.summary)}`;
        }
        return next;
    }

    function parse(payload) {
        const rawItems = Array.isArray(payload?.items) ? payload.items : [];
        const locale = payload?.locale === "zh-CN" ? "zh-CN" : "en-US";
        const items = dedupeItems(rawItems
            .map(item => {
                const title = sanitizeText(item?.title, 220);
                const summary = sanitizeText(item?.summary, 360);
                const source = sanitizeText(item?.source, 80);
                const url = String(item?.url || "").trim();
                const publishedAt = Number(item?.publishedAt || Date.now());
                if (!title || !/^https?:\/\//i.test(url)) return null;
                return {
                    id: String(item?.id || `${title}-${publishedAt}`),
                    title,
                    summary,
                    url,
                    source: source || "Unknown",
                    publishedAt: Number.isFinite(publishedAt) ? publishedAt : Date.now(),
                    lang: item?.lang === "zh-CN" ? "zh-CN" : "en-US",
                    topics: Array.isArray(item?.topics) ? item.topics.filter(Boolean).slice(0, 6) : [],
                    symbols: Array.isArray(item?.symbols) ? item.symbols.filter(Boolean).slice(0, 6) : [],
                    sentimentHint: ["positive", "negative", "neutral"].includes(item?.sentimentHint) ? item.sentimentHint : "neutral",
                    quality: normalizeQuality(item?.quality)
                };
            })
            .filter(Boolean)
            .map(item => localizeNewsItem(item, locale)))
            .sort((a, b) => b.publishedAt - a.publishedAt);

        const warnings = [];
        const quality = normalizeQuality(payload?.quality);
        if (quality === "partial") warnings.push("partial");
        if (quality === "stale") warnings.push("stale");
        if (items.length === 0) warnings.push("empty");
        if (payload?.ok === false && payload?.code) warnings.push(String(payload.code).toLowerCase());

        return {
            ok: payload?.ok !== false,
            code: payload?.code ? String(payload.code) : "",
            message: payload?.message ? sanitizeText(payload.message, 260) : "",
            updatedAt: Number(payload?.updatedAt || Date.now()),
            crawlUpdatedAt: Number(payload?.crawlUpdatedAt || payload?.updatedAt || Date.now()),
            crawlCount: Number(payload?.crawlCount || rawItems.length || 0),
            lastErrorCode: payload?.lastErrorCode ? String(payload.lastErrorCode) : "",
            quality,
            topic: normalizeTopic(payload?.topic),
            since: normalizeSince(payload?.since),
            locale,
            sources: Array.isArray(payload?.sources) ? payload.sources.filter(Boolean) : [],
            items,
            warnings
        };
    }

    window.AppNewsAdapter = {
        parse,
        dedupeItems,
        normalizeQuality,
        normalizeTopic,
        normalizeSince
    };
})();
