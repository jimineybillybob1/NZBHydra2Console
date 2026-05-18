# NZBHydra2Console

A mobile-first PWA frontend for [NZBHydra2](https://github.com/theotherp/nzbhydra2) that searches your NZB indexers and sends results directly to [Torbox](https://torbox.app) with one tap. Designed for iOS home-screen install. Single static HTML file, no build step.

## Features

- **Mobile-first** UI optimised for one-handed phone use
- **Search across all your NZBHydra indexers** with category chips (All / Books / TV / Movies / Music)
- **Sort results** in-place by relevance / size / age / grabs — no re-fetching
- **Tap → Torbox**: sends NZB straight to your Torbox account via their API
- **Recent searches dropdown** with per-entry remove and clear-all
- **Rate limit tracking** for Torbox’s 60/hour download endpoint — visible counter in the header, auto-blocks at limit
- **Masked API keys** in settings with reveal toggles
- **All credentials stored locally** in your browser’s `localStorage` — nothing in the repo, nothing on a server

## Architecture

```
┌─────────────┐    ┌────────────────────┐    ┌──────────────┐
│  iPhone PWA │ ── │  Cloudflare Worker │ ── │  NZBHydra2   │
│             │    │  (CORS proxy)      │ ── │  Torbox API  │
└─────────────┘    └────────────────────┘    └──────────────┘
```

The Cloudflare Worker is necessary because neither NZBHydra nor Torbox send the CORS headers required for a browser-based frontend to call them directly. The Worker forwards requests and adds the headers. API keys travel through it but are not stored — they live only in your phone’s `localStorage`.

## Setup

### 1. Deploy the frontend via GitHub Pages

1. Push this repo to GitHub
1. Repo Settings → Pages → Build from `main` branch, `/ (root)` folder
1. Wait a minute, visit `https://yourusername.github.io/NZBHydra2Console/`

### 2. Deploy the Cloudflare Worker (CORS proxy)

The worker proxies requests to both NZBHydra and Torbox. See **`WORKER-SETUP.md`** for step-by-step instructions. Summary:

1. Sign up for free at [cloudflare.com](https://cloudflare.com) — no domain required
1. Workers & Pages → Create Worker → name it (e.g. `nzbhydra-proxy`)
1. Edit code → paste contents of `worker.js`
1. **Important:** edit `NZBHYDRA_URL` at the top of the worker code to point to your real NZBHydra instance
1. Deploy → copy the Worker’s URL (`https://nzbhydra-proxy.yourname.workers.dev`)

### 3. Configure the app on your phone

1. Open the GitHub Pages URL in Safari (with trailing slash: `.../NZBHydra2Console/`)
1. Settings sheet auto-opens. Enter:
- **NZBHydra URL** — your **Worker URL** (not the real NZBHydra URL)
- **NZBHydra API Key** — your real NZBHydra API key (Config → Authorization)
- **Torbox API Key** — your real Torbox API key (Settings → API on torbox.app)
- **Result Limit** — 50 is a good default
1. Tap **SAVE**
1. Tap Safari’s Share icon → **Add to Home Screen**

The PWA launches in standalone mode (no Safari chrome) when opened from the home screen.

## Using the app

### Search

Type a query and hit return. The category chips below the input filter the search (book / tvsearch / movie / music). Tap into an empty search field to see your recent searches; tap one to re-run it with its original category. Use the `✕` button in the search field to clear quickly.

### Sort

Below the chips, four sort options re-order results in-place without re-fetching:

- **RELEVANCE** — server order (default)
- **SIZE ↓** — biggest first
- **NEWEST** — most recent uploads first
- **GRABS ↓** — most downloaded first

### Download

Each result shows source indexer, size, age, and grab count in a labelled grid. Tap **→ TORBOX** to send to your Torbox account. Button turns green ✓ QUEUED on success.

### Rate limit awareness

Torbox limits the usenet download endpoint to **60 requests per hour per API token**. The counter in the header (`0/60 HR`) tracks your usage in a rolling 60-minute window:

- **Grey** — normal usage
- **Orange** — 80%+ used (warning)
- **Red** — at limit; downloads will be blocked client-side until the oldest send ages out

Long-press the counter for a tooltip showing exact usage and cooldown time.

Note: tracking is per-device. If you also send NZBs to Torbox from other tools (Sonarr, Radarr, etc.) the PWA’s counter won’t see those — your actual Torbox usage may be higher.

### Settings

Gear icon top-right opens the settings sheet. API keys are masked by default; tap **SHOW** next to each to reveal briefly. Keys auto-re-hide when you close the sheet.

## Privacy

- All credentials stored only in your browser’s `localStorage` — never transmitted except to the Cloudflare Worker → NZBHydra/Torbox
- The HTML and worker code in this repo contain no secrets
- Repo can be public; anyone hitting the URL just sees a config form
- The Cloudflare Worker doesn’t log or persist anything — Cloudflare’s free tier logs request counts only

## Troubleshooting

**“NetworkError” or “CORS” error on search** — your Worker isn’t deployed correctly, or the `NZBHYDRA_URL` constant inside the Worker doesn’t match your actual NZBHydra URL. Verify in the Cloudflare dashboard.

**Search works but Torbox send fails** — verify your Torbox API key (Settings → API on torbox.app, key starts with `tk-...`). Error toast will show what Torbox returned.

**Rate limit (429) errors** — you’re hitting Torbox’s 60-per-hour cap on the usenet endpoint. The PWA tracks this client-side now to prevent it, but if you ever hit the server-side limit, the button shows `✕ RATE LIMITED` and the cooldown displays.

**Indexer name shows as `?`** — your NZBHydra version may use a different XML attribute. The PWA looks for `hydraIndexerName` first; if your version uses something else, check a response in the browser console and edit the `parseNewznab` function.

**PWA shows old behaviour after pushing changes** — iOS aggressively caches PWAs. Force-close the app (swipe up, swipe away) then reopen. If still stuck: Settings → Apps → Safari → Advanced → Website Data → find your github.io URL → swipe to delete → reopen the PWA.

## Customising

Everything’s in `index.html`. The colour scheme lives in CSS variables at the top of the `<style>` block — change `--accent` for a different accent colour. Add categories by editing the `.chips` div and adding `data-cat="..."` values that match [Newznab API types](https://github.com/theotherp/nzbhydra2/wiki/External-API,-RSS-and-cached-queries).

To remove the Cloudflare Worker dependency (e.g. if you host your own reverse proxy that handles CORS), point the **NZBHydra URL** setting directly at your NZBHydra instance — but you’ll also need to change the Torbox endpoint in the code, since that currently goes through the Worker’s `/torbox/` path prefix.

## Files

- **`index.html`** — the entire PWA
- **`worker.js`** — Cloudflare Worker source (deployed separately via Cloudflare dashboard)
- **`site.webmanifest`** — PWA manifest (icons, theme colors, name)
- **`favicon.*` / `apple-touch-icon.png` / `web-app-manifest-*.png`** — icons
- **`WORKER-SETUP.md`** — detailed Cloudflare Worker deployment guide
- **`README.md`** — this file

## License

Do whatever you want with it.