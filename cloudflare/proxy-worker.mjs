const DEFAULT_ORIGIN = "https://crypto-portfolio-tracker-tan-nine.vercel.app";

function buildTargetUrl(requestUrl, originUrl) {
  const incoming = new URL(requestUrl);
  const targetBase = new URL(originUrl);
  targetBase.pathname = incoming.pathname;
  targetBase.search = incoming.search;
  return targetBase.toString();
}

function cloneHeaders(originalHeaders, originHost) {
  const headers = new Headers(originalHeaders);
  headers.set("host", originHost);
  headers.set("x-forwarded-host", headers.get("host") || "");
  headers.set("x-forwarded-proto", "https");
  return headers;
}

export default {
  async fetch(request, env) {
    const origin = env.ORIGIN_URL || DEFAULT_ORIGIN;
    const originHost = new URL(origin).host;
    const targetUrl = buildTargetUrl(request.url, origin);
    const method = request.method.toUpperCase();
    const init = {
      method,
      headers: cloneHeaders(request.headers, originHost),
      redirect: "manual",
    };
    if (method !== "GET" && method !== "HEAD") {
      init.body = request.body;
    }
    try {
      const upstream = await fetch(targetUrl, init);
      const responseHeaders = new Headers(upstream.headers);
      responseHeaders.set("x-cryptofolio-edge", "cloudflare-proxy");
      responseHeaders.set("x-cryptofolio-origin", originHost);
      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          ok: false,
          code: "CF_PROXY_UPSTREAM_ERROR",
          message: "Cloudflare proxy could not reach upstream origin.",
          detail: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 502,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
            "x-cryptofolio-edge": "cloudflare-proxy",
          },
        }
      );
    }
  },
};
