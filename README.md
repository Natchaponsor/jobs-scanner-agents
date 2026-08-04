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
| Netflix | Eightfold | ⚠️ adapter present, disabled by default — endpoint returned a bot-protection page during testing |
| Google, Microsoft, TikTok/ByteDance, Agoda, JPMorgan, Amex, Two Sigma, Citadel, Column | — | not yet supported (custom career sites, need a per-company Playwright scraper) |

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

If a career site runs on Greenhouse or Workday, add it to `lib/defaultSources.ts` with the
right `identifier` — the existing generic adapter will just work. For anything else, extend
`lib/adapters/playwright-generic.ts` with real `page.goto`/selector logic (requires
`npx playwright install chromium` once).
