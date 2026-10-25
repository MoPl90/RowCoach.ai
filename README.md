# Open Row Pacer App

A rowing performance app that tracks stroke rate, split, distance, and force curve in real time. Built with React + Vite, designed for mobile use on the water.

**Live:** [row-pacer.app](https://row-pacer.app)

## Features

- Real-time stroke rate detection via device motion sensor
- GPS-based distance and pace tracking
- Live track map ([OpenFreeMap](https://openfreemap.org) vector tiles, no API key; loaded on first GPS fix)
- Per-stroke force curve (Concept2-style)
- Customizable stats grid (drag to reorder, add/remove tiles, variable layouts)
- Portrait and landscape layouts
- German / English language toggle

## Local Development

Requires Node.js 24 LTS (same as CI).

```bash
npm install
npm run dev
```

To test on a phone on the same network (required for motion sensor access):

```bash
npm run dev -- --host
```

Then open the printed network URL on your phone.

> Browsers only allow GPS (and on iOS the motion sensor) on HTTPS pages. Over the plain-http network URL these may be blocked, so test sensor features on the deployed site if needed.

## Dev Mode

Append `?dev` to the URL (e.g. `row-pacer.app/?dev`) to enable:

- **Dev overlay** — simulate strokes (single or auto at a set SPM) and boat speed, for testing without a boat.
- **Session recording** — while running, raw motion samples, GPS fixes, detected strokes and pause/resume/sensitivity events are kept in memory. After **Stop**, the **Export** button in the overlay downloads them as `row-pacer-<start time>.json`, for replaying sessions offline and tuning stroke detection.

The recording is held in memory only: it is lost on page reload and replaced on the next **Start** from idle (Reset keeps it). Expect roughly 6 MB per hour.

<details>
<summary>Export format</summary>

```jsonc
{
  "version": 1,
  "startedAt": "2026-10-24T11:08:54.066Z", // absolute anchor; all t below are ms since this
  "meta": { "userAgent": "…", "sens": 3, "motionPermission": true },
  "motion":  [[t, x, y, z, withGravity]],  // devicemotion, m/s²; withGravity=1 if only accelerationIncludingGravity was available
  "gps":     [[t, lat, lon, accuracy, speed]],
  "strokes": [[t]],                         // strokes accepted by the stroke-rate logic
  "events":  [[t, "pause" | "resume" | "sens", value]]
}
```

</details>

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Deployment

The app is deployed to [GitHub Pages](https://pages.github.com/) via GitHub Actions and served on a custom domain through Cloudflare.

### GitHub Actions

Every push to `main` triggers `.github/workflows/deploy.yml`, which:
1. Installs dependencies (`npm ci`)
2. Builds the app (`npm run build`)
3. Uploads `dist/` and deploys to GitHub Pages

In the repository go to **Settings → Pages** and set **Source** to **GitHub Actions**.

### Custom Domain (Cloudflare)

The domain `row-pacer.app` is registered and managed through Cloudflare.

**DNS records** (set Proxy status to **DNS only** — gray cloud):

| Type  | Name | Value               | Proxy    |
|-------|------|---------------------|----------|
| A     | `@`  | `185.199.108.153`   | DNS only |
| A     | `@`  | `185.199.109.153`   | DNS only |
| A     | `@`  | `185.199.110.153`   | DNS only |
| A     | `@`  | `185.199.111.153`   | DNS only |
| CNAME | `www`| `mopl90.github.io`  | DNS only |

> Proxy must be **DNS only** (gray cloud) on all records. With Cloudflare's orange-cloud proxy, GitHub Pages can't issue a certificate for the domain or verify it, and the Cloudflare → GitHub hop isn't verified HTTPS.

The `public/CNAME` file in the repo contains `row-pacer.app` so GitHub Pages serves on the custom domain after each deploy.

HTTPS is provided by GitHub Pages. Once DNS resolves to the GitHub IPs, GitHub issues the certificate (can take up to an hour); then enable **Settings → Pages → Enforce HTTPS**.

**Domain verification:** to stop anyone else from claiming the domain for their own Pages site, verify it under **GitHub → Settings (account) → Pages → Add a domain** and add the `_github-pages-challenge-MoPl90` TXT record it shows in Cloudflare.

## Credits

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, tiles by [OpenFreeMap](https://openfreemap.org) © [OpenMapTiles](https://openmaptiles.org).

## License

MIT © MoPl90
