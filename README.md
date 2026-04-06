# Open Row Pacer App

A rowing performance app that tracks stroke rate, split, distance, and force curve in real time. Built with React + Vite, designed for mobile use on the water.

**Live:** [row-pacer.app](https://row-pacer.app)

## Features

- Real-time stroke rate detection via device motion sensor
- GPS-based distance and pace tracking
- Per-stroke force curve (Concept2-style)
- Customizable stats grid (drag to reorder, add/remove tiles, variable layouts)
- Portrait and landscape layouts
- German / English language toggle

## Local Development

```bash
npm install
npm run dev
```

To test on a phone on the same network (required for motion sensor access):

```bash
npm run dev -- --host
```

Then open the printed network URL on your phone.

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

| Type  | Name | Value               |
|-------|------|---------------------|
| A     | `@`  | `185.199.108.153`   |
| A     | `@`  | `185.199.109.153`   |
| A     | `@`  | `185.199.110.153`   |
| A     | `@`  | `185.199.111.153`   |
| CNAME | `www`| `mopl90.github.io`  |

> Proxy must be **DNS only** (not proxied) — Cloudflare's orange-cloud proxy breaks GitHub Pages domain verification.

The `public/CNAME` file in the repo contains `row-pacer.app` so GitHub Pages serves on the custom domain after each deploy.

HTTPS is handled automatically by GitHub Pages once DNS resolves.

## License

MIT © MoPl90
