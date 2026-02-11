# ID Scanner

Client-only PDF417 scanner and SVG generator built with React + TypeScript + Vite.

## Features

- Live webcam PDF417 scanning with camera selection.
- Image upload decode (`png`, `jpg`, `webp`, `heic`, `heif`) fallback.
- Raw decode payload + automatic AAMVA field parsing.
- PDF417 SVG generation from:
  - Raw payload text.
  - Washington ID / DL focused AAMVA v08 builder with many element codes.
- Advanced PDF417 controls: compact mode, rows, columns, error-correction level.
- In-memory scan history (last 20 events, cleared on refresh).
- No backend, no persistence, no telemetry.

## Stack

- React 19 + TypeScript
- Vite
- `@zxing/browser` for PDF417 decode
- `aamva-parser` for AAMVA parsing
- `bwip-js` for PDF417 SVG generation
- Vitest + Testing Library + Playwright

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run test
npm run test:watch
npm run test:e2e
```

## Deployment

Build static assets and deploy `dist/` to any HTTPS static host:

```bash
npm run build
```

Recommended: Netlify, Vercel, GitHub Pages.

### GitHub Pages (repo site)

This project includes `.github/workflows/deploy-pages.yml` for automatic GitHub Pages deploys.

1. Push this repo to GitHub with default branch `main`.
2. In GitHub: `Settings -> Pages -> Build and deployment`, set `Source` to `GitHub Actions`.
3. Push to `main` (or run the workflow manually). The site publishes to:
   - `https://<username>.github.io/ID-Scanner/`

If your repository name is not `ID-Scanner`, update:

- `VITE_BASE_PATH` in `.github/workflows/deploy-pages.yml`
- `build:gh` in `package.json`

## Notes

- Camera scanning requires a secure context (`https://` or `localhost`).
- Parsing is best-effort. Raw payload is always preserved.
