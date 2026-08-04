# Jobs Scanner Agents

A personal, local-first job scanner. Scans company career sites on demand (no cron, no
background schedule) for full-time roles matching your filters, and tracks saved/applied
status locally in your browser.

## Why local-first, and why no LinkedIn/Handshake/Glassdoor

This runs on your machine (`npm run dev`), not as a deployed public site. All job data,
saved/applied state, and filter preferences live in your browser's `localStorage` — there's
no backend database and nothing to host.

LinkedIn and Glassdoor actively detect and block automated access (LinkedIn has sued
scrapers over it), and Handshake's job data sits entirely behind a personal university
login with no automatable path. None of that is something this project builds around. The
scan-sources UI still lists them (toggleable, for when/if that changes) but their adapters
are intentionally unimplemented rather than faked.

## What's actually wired up

| Company | Adapter | Status |
|---|---|---|
| Airbnb, SoFi | Greenhouse | ✅ working |
| Adobe, Capital One | Workday | ✅ working |
| Amazon / AWS | Amazon's own API | ✅ working |
| Column | Ashby | ✅ working |
| JPMorgan | Oracle Fusion Recruiting Cloud's public REST API | ✅ working |
| Google, Two Sigma | Server-rendered HTML, parsed with `cheerio` (no browser needed — confirmed via plain `curl`) | ✅ working |
| Netflix | Eightfold | ⚠️ adapter present, disabled by default — endpoint returned a bot-protection page during testing |
| TikTok/ByteDance | — | Client-side rendered with no exposed API. The one case that's genuinely just "needs a real browser" (not bot-mitigated) — would need a Playwright adapter, which is a real new dependency (~300MB Chromium), so it's flagged rather than added speculatively. |
| Amex | — | Client-rendered *and* its data API is proxied through randomized, rotating paths — classic PerimeterX-style obfuscation. Not building around that. |
| Microsoft | — | Its search API stalls mid-TLS-handshake for non-browser clients — TLS-fingerprint-based bot blocking. Not building around that either. |
| Agoda, Citadel | — | Both return a Cloudflare "Just a moment…" JS challenge to non-browser requests. Same line as LinkedIn/Glassdoor: not building a bypass. |

Toggle sources and add custom companies at `/sources`.

## Getting started

```bash
npm install
npm run dev
```

Opens on **http://localhost:3002**. Click "Scan now" — nothing scans automatically.

## Extraction

Years of experience, function, work mode, and job type are inferred with regex/keyword
rules (`lib/extract.ts`) from each posting's title/description — no paid LLM calls, so this
stays free to run.

## Adding a company adapter

If a career site runs on Greenhouse, Workday, Ashby, or Oracle Fusion Recruiting Cloud, add
it to `lib/defaultSources.ts` with the right `identifier` — the existing generic adapter will
just work. Before assuming a site needs a real browser, check whether it server-renders: it
often does, even for very large companies (`curl` the search-results URL and look for actual
job titles in the raw HTML). If so, add a `lib/adapters/html/<company>.ts` parser using
`cheerio` and register it in `lib/adapters/html/index.ts` — much lighter than a browser.

Only reach for `lib/adapters/playwright-generic.ts` (real `page.goto`/selector logic, requires
`npx playwright install chromium` once) when a site is genuinely client-rendered with no
server-side content — and never to get past an active bot challenge (Cloudflare, PerimeterX-style
obfuscated endpoints, TLS-fingerprint blocking). Sites doing that stay `unimplemented` on purpose.
