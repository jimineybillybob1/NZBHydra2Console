# NZB Console

A mobile-first PWA frontend for [NZBHydra2](https://github.com/theotherp/nzbhydra2) that sends NZBs directly to [Torbox](https://torbox.app). Designed for iOS home-screen install. Single static HTML file, no build step, no backend.

## What it does

- Search across all your NZBHydra indexers from your phone
- Filter by category (All / Books / TV / Movies / Music)
- Tap a result → sends the NZB to Torbox via the Torbox API
- Stores API keys in `localStorage` on your device only — nothing in the repo, nothing on a server

## Setup

### 1. Add icons

Drop the following PNG files in `icons/`:

- `icon-32.png` — 32×32 favicon
- `icon-180.png` — 180×180 iOS home screen (most important one)
- `icon-192.png` — 192×192 Android / general
- `icon-512.png` — 512×512 high-res
- `icon-512-maskable.png` — 512×512 with safe padding for Android adaptive icons

Quickest path: design one 1024×1024 PNG, run it through [realfavicongenerator.net](https://realfavicongenerator.net) to get all sizes, drop into `icons/`.

iOS quirks: no transparency, no pre-rounded corners (iOS rounds automatically), keep ~10% padding from the edges.

### 2. Deploy via GitHub Pages

1. Push this repo to GitHub
2. Repo Settings → Pages → Build from `main` branch, `/ (root)` folder
3. Wait a minute, visit the published URL

### 3. Configure CORS on NZBHydra

NZBHydra blocks cross-origin browser requests by default. You'll need to allow your GitHub Pages origin:

1. Open NZBHydra → **Config → Main**
2. Find **"CORS allowed"** or similar (you may need to enable "Show advanced")
3. Set the allowed origin to your GitHub Pages URL, e.g. `https://yourusername.github.io`
4. Save and restart NZBHydra

If you don't see a CORS option, your NZBHydra might be behind a reverse proxy (like ElfHosted's) — you may be able to add CORS headers at that layer instead.

### 4. Configure the app on your phone

1. Open the GitHub Pages URL in Safari
2. Settings sheet opens automatically. Enter:
   - **NZBHydra URL** — full URL, no trailing slash (e.g. `https://yourname-nzbhydra.elfhosted.com`)
   - **NZBHydra API key** — NZBHydra → Config → Authorization → API key
   - **Torbox API key** — torbox.app → Settings → API
   - **Result limit** — how many results to fetch per indexer (50 is a good default)
3. Tap **Save**
4. Tap Safari's Share icon → **Add to Home Screen**

## Privacy

- API keys live only in your browser's `localStorage`
- The HTML file in this repo contains no secrets
- API calls go directly from your phone to NZBHydra and Torbox; no third-party server in between
- The repo can be public — anyone hitting the URL just gets a config form

## Troubleshooting

**"CORS or network error"** — see step 3 above. Your NZBHydra needs to allow your GitHub Pages origin.

**Search works but Torbox send fails** — check your Torbox API key. The error toast will show what Torbox returned.

**Nothing happens when I tap a result** — make sure the NZB link in the result actually works (open it in a browser). If NZBHydra's NZB-serving endpoint requires auth and isn't including the key, you may need to set **NZB access type** to **Proxy** in NZBHydra (Config → Searching).

## Customising

Everything's in `index.html`. The colour scheme lives in CSS variables at the top of the `<style>` block — change `--accent` for a different accent colour. Add categories by editing the `.chips` div and adding `data-cat="..."` values that match [Newznab API types](https://github.com/theotherp/nzbhydra2/wiki/Newznab-API).

## License

Do whatever you want with it.
