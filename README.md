# ID Scanner

Client-only PDF417 scanner and SVG generator built with React + TypeScript + Vite.

## Features

- Live webcam PDF417 scanning with camera selection.
- Image upload decode (`png`, `jpg`, `webp`) fallback.
- Raw decode payload + automatic AAMVA field parsing.
- PDF417 SVG generation from:
  - Raw payload text.
  - Structured AAMVA v08 form.
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

## Notes

- Camera scanning requires a secure context (`https://` or `localhost`).
- Parsing is best-effort. Raw payload is always preserved.
