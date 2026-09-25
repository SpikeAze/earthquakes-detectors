# SeismoScope — Security Policy

SeismoScope is a static frontend (no backend, auth, cookies, or stored PII).
Its threat surface is XSS-via-data, supply chain, and data integrity.
This file records the controls in place and the recurring hygiene to keep them effective.

## 1. Response headers (set in host dashboard — code cannot set these)

Static hosting cannot emit HTTP headers from code, so configure these on the
host (Render Dashboard → Static Site → Headers, path `/*` for every row).
They are the real enforcement behind the in-app `<meta>` CSP fallback in `index.html`.

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https: data:; connect-src 'self' https://earthquake.usgs.gov https://nominatim.openstreetmap.org; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

Notes:

- `frame-ancestors 'none'` is intentionally present here and **absent** from the
  `<meta>` CSP: browsers ignore `frame-ancestors` in meta tags, so only this
  header provides clickjacking protection.
- `style-src 'unsafe-inline'` is required (React renders all styling as inline
  `style` attributes). `script-src` stays strict: the built app uses no inline
  scripts and no `eval`.
- `img-src https:` must stay open: map tiles load from Esri's CDN.
- The app uses no camera, microphone, or browser geolocation (location search
  is a text query to Nominatim), hence the locked-down `Permissions-Policy`.

## 2. Dependency hygiene

- After every `npm install` or dependency change, run (directly — not via an
  npm script wrapper, which this npm version blocks for audit):

  ```sh
  npm audit --audit-level=moderate
  ```

- Fix findings with `npm audit fix`, then re-run lint and a production build
  before committing. The runtime bundle is small (React, Leaflet, Recharts,
  Zustand); most advisories historically land in build-only tooling
  (`eslint`/`vite` chains) and never ship to browsers — verify with `npm ls <pkg>`.
- Prefer `npm update <pkg>` within the pinned major range over adding new
  dependencies. Every new dependency widens supply-chain exposure.

## 3. Data handling rules (for contributors)

- All USGS API strings rendered in the UI pass through React escaping — never
  use `dangerouslySetInnerHTML` for event data.
- External links must go through `safeUsgsUrl()` (`src/utils/helpers.ts`):
  HTTPS + `*.usgs.gov` only. Never render API-provided URLs raw.
- CSV export must keep both protections: formula-injection prefixing
  (`= + - @` and control chars) **and** RFC 4180 quoting of fields containing
  `, "`, or line breaks.
- Location search text is sent to OpenStreetMap Nominatim solely to resolve
  coordinates (disclosed in the in-app About section). Never log or persist it.

## 4. Reporting a vulnerability

Open a private report via the project repository's issue tracker (or contact the
maintainer directly). Please include: affected URL/version, reproduction steps,
and the output of `npm audit` if dependency-related. Do not open public issues
for actively exploitable findings until a fix is released.
