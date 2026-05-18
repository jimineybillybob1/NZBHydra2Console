/**
 * NZBHydra + Torbox CORS Proxy — Cloudflare Worker
 *
 * Routes:
 *   /torbox/*  → forwards to https://api.torbox.app/* (Torbox API)
 *   /*         → forwards to NZBHYDRA_URL/* (NZBHydra)
 *
 * Adds CORS headers to every response so a browser frontend can call it.
 *
 * Setup:
 *   1. Edit NZBHYDRA_URL below to your NZBHydra base URL (no trailing slash)
 *   2. Edit ALLOWED_ORIGIN to your GitHub Pages origin, or "*" for any origin
 *   3. Deploy via the Cloudflare dashboard
 */

const NZBHYDRA_URL = "https://jimineybillybob-nzbhydra.elfhosted.com";
const TORBOX_URL = "https://api.torbox.app";
const ALLOWED_ORIGIN = "*"; // e.g. "https://yourusername.github.io" or "*"

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Determine target upstream based on path prefix
    let target;
    if (url.pathname.startsWith("/torbox/")) {
      const subPath = url.pathname.replace(/^\/torbox/, "");
      target = TORBOX_URL + subPath + url.search;
    } else {
      target = NZBHYDRA_URL + url.pathname + url.search;
    }

    // Build forwarded headers — copy ALL headers from the original request
    // except for hop-by-hop and CF-specific headers
    const forwardHeaders = new Headers();
    const skipHeaders = new Set([
      "host", "cf-connecting-ip", "cf-ipcountry", "cf-ray", "cf-visitor",
      "cf-warp-tag-id", "x-forwarded-for", "x-forwarded-proto", "x-real-ip",
      "connection", "keep-alive", "transfer-encoding", "upgrade",
    ]);
    for (const [name, value] of request.headers.entries()) {
      if (!skipHeaders.has(name.toLowerCase())) {
        forwardHeaders.set(name, value);
      }
    }

    // Read body as ArrayBuffer for non-GET/HEAD requests so it forwards reliably
    let body = undefined;
    if (!["GET", "HEAD"].includes(request.method)) {
      body = await request.arrayBuffer();
    }

    // Forward request
    let upstream;
    try {
      upstream = await fetch(target, {
        method: request.method,
        headers: forwardHeaders,
        body: body,
        redirect: "follow",
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "upstream_fetch_failed", message: String(err), target }),
        { status: 502, headers: { "content-type": "application/json", ...corsHeaders() } }
      );
    }

    // Add CORS headers to response, preserve everything else
    const respHeaders = new Headers(upstream.headers);
    for (const [k, v] of Object.entries(corsHeaders())) {
      respHeaders.set(k, v);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: respHeaders,
    });
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Expose-Headers": "*",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
