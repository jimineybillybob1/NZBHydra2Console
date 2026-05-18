# Cloudflare Worker Setup — CORS Proxy for NZBHydra + Torbox

A small Cloudflare Worker that forwards browser requests to your NZBHydra and to the Torbox API, adding the CORS headers that neither service sends by default. Free Cloudflare tier covers everything. Takes ~5 minutes.

## Why this exists

Both NZBHydra and Torbox respond fine to other servers (cURL, Sonarr, etc.) but reject browser requests because they don’t include `Access-Control-Allow-Origin` headers. The Worker sits in front of them, talks to them server-to-server (no CORS rules apply there), then returns the response to your browser with the right headers attached.

```
┌─────────────┐    ┌────────────────┐    ┌────────────────────┐
│  iPhone PWA │ ── │ This Worker    │ ── │ NZBHydra2          │
│             │ ── │ /...           │ ── │ (your instance)    │
│             │    │ /torbox/...    │ ── │ api.torbox.app     │
└─────────────┘    └────────────────┘    └────────────────────┘
```

The Worker routes by path:

- `/torbox/...` → forwarded to `api.torbox.app/...`
- everything else → forwarded to your NZBHydra URL

## Step 1: Sign up for Cloudflare

If you don’t have an account: [cloudflare.com](https://cloudflare.com) → sign up. You do **not** need to move any domain to Cloudflare — Workers run on their own `*.workers.dev` subdomain.

## Step 2: Create the Worker

1. In the Cloudflare dashboard, go to **Workers & Pages** in the left sidebar
1. Click **Create application** → **Create Worker**
1. Give it a name like `nzbhydra-proxy` (this becomes part of its URL: `nzbhydra-proxy.yourname.workers.dev`)
1. Click **Deploy** to deploy the default hello-world worker — we’ll replace the code in the next step

## Step 3: Replace the code

1. From the Worker overview, click **Edit code** (top right)
1. Delete everything in the editor
1. Paste in the entire contents of `worker.js` from this repo
1. **Edit the constants at the top of the file:**
- `NZBHYDRA_URL` — your actual NZBHydra URL (no trailing slash)
  - e.g. `https://yourname-nzbhydra.elfhosted.com`
- `ALLOWED_ORIGIN` — your GitHub Pages origin (no path), e.g. `https://yourusername.github.io`
  - Or leave as `"*"` for any origin (fine for a personal tool)
1. Click **Deploy** (top right)

## Step 4: Get the Worker URL

After deploy, the worker’s URL is shown at the top of the page — something like `https://nzbhydra-proxy.yourname.workers.dev`. Copy it.

## Step 5: Update NZB Console settings

1. Open your NZB Console PWA on your phone
1. Open settings (gear icon top-right)
1. Set **NZBHydra URL** to the **Worker URL** (e.g. `https://nzbhydra-proxy.yourname.workers.dev`)
- **Not** your real NZBHydra URL — the PWA only ever talks to the Worker now
1. Leave the **NZBHydra API key** and **Torbox API key** as your real keys
1. Save

## Test it

**Search:** type a query and hit return. Results should appear. If you get a `NetworkError`, double-check the Worker code is deployed and `NZBHYDRA_URL` matches your instance exactly.

**Download:** tap **→ TORBOX** on any result. Button should turn green ✓ QUEUED. If you get a `NetworkError` here but search works, the Worker is missing the `/torbox/` route — make sure you pasted the full updated `worker.js`, not an older version.

## How the routing works

Browser sends:

```
POST https://nzbhydra-proxy.yourname.workers.dev/torbox/v1/api/usenet/createusenetdownload
Authorization: Bearer tk-yourtorboxkey
```

Worker rewrites and forwards as:

```
POST https://api.torbox.app/v1/api/usenet/createusenetdownload
Authorization: Bearer tk-yourtorboxkey
```

Torbox responds with JSON. Worker returns it to the browser with CORS headers added. Your Torbox key passes through unchanged.

For NZBHydra requests (e.g. `/api?apikey=...&t=search&q=...`), the Worker just forwards the whole path and query string to your NZBHydra URL untouched.

## Security notes

- Anyone who knows your Worker URL can route requests through it. They’d still need your NZBHydra and Torbox API keys to do anything useful — those live in your phone’s localStorage, not the Worker.
- For extra safety, set `ALLOWED_ORIGIN` to your specific GitHub Pages URL instead of `"*"`. Note: this is a **browser-enforced** check; anyone using `curl` or another non-browser client ignores it.
- The Worker doesn’t log, store, or persist anything. Cloudflare counts request volume for billing, but doesn’t see request bodies.
- If you rotate your NZBHydra or Torbox API keys, update them in the NZB Console settings — the Worker doesn’t know or care about them.

## Limits

Cloudflare Workers free tier: **100,000 requests per day**. You will not hit this from a phone.

Note that **Torbox’s own rate limit** (60 POSTs/hour to the usenet endpoint) is enforced server-side and is unrelated to Cloudflare. The PWA tracks this client-side and shows a `0/60 HR` counter in the header.

## Updating the Worker

If you make changes to `worker.js` (e.g. updating the NZBHydra URL or proxying additional services):

1. Cloudflare dashboard → **Workers & Pages** → click your `nzbhydra-proxy` worker
1. **Edit code** → paste new contents → **Deploy**

Changes propagate globally in a few seconds. No need to update anything on the phone unless the Worker URL itself changes.