# Jobs Scanner Agents

A personal, local-first job scanner. Scans company career sites on demand (no cron, no
background schedule) for full-time roles matching your filters, and tracks saved/applied
status locally in your browser.

## Why local-first, and why no LinkedIn/Handshake(platform)/Glassdoor

This runs on your machine (`npm run dev`), not as a deployed public site. All job data,
saved/applied state, and filter preferences live in your browser's `localStorage` — there's
no backend database and nothing to host.

LinkedIn and Glassdoor actively detect and block automated access (LinkedIn has sued
scrapers over it), and Handshake-the-platform's job board sits entirely behind a personal
university login with no automatable path. None of that is something this project builds
around. The scan-sources UI still lists them (toggleable, for when/if that changes) but their
adapters are intentionally unimplemented rather than faked. (Handshake-the-*company*'s own
open roles are a separate, working source — see the table below.)

## Features

- **On-demand scanning** — nothing runs on a schedule; click "Scan now."
- **Filters**: location (country picker — US/UK/Singapore/Thailand/APAC/Any — plus a city/state
  text box with suggested-city chips per country), function, years of experience, job type,
  work mode, industry, and free-text search. Location filtering is keyword-based (`lib/locations.ts`)
  and scans each posting's full raw location string, not just a rigid "City, Country" format —
  needed because real ATS location strings are inconsistent (multi-location lists, 2/3-letter
  country codes, bare city names).
- **Scan sources page** (`/sources`) — three separate cards: "Social platforms" (job boards,
  not automated — see below), "Career sites" (individual companies, nested under three big
  categories: Finance (Banks & Traditional Finance, Payments & FinTech, Quant/Hedge Funds &
  Crypto, Private Equity), Tech (Big Tech, Software, AI, E-Commerce, Media and Entertainment,
  Social Media, Travel and Ride Share, Etc), and Consulting (Management Consulting, Tech
  Consulting, Big 4 & Professional Services, Boutique Consulting)), and "Additional company"
  (custom sources you've added, plus the add-a-company form). Every collapsible section —
  Social media, each big category, each subcategory — starts collapsed by default. Each
  subcategory has its own master toggle to enable/disable every working source in it at once.
  Sources marked "not yet
  supported" stay off until a real adapter is confirmed for them.
- **Export to Excel** — top nav, between Dashboard and Scan sources; exports whatever the
  current filters/sort are showing.
- **Saved/applied tracking**, sortable by newest or company, adjustable page size.
- Footer with a no-affiliation disclaimer, and a feedback button (bottom-right) linking to
  this repo's GitHub Issues.

## What's actually wired up

| Company | Adapter | Status |
|---|---|---|
| Airbnb, SoFi, Stripe, Adyen, Chime, Binance, Robinhood, Anthropic, Lyft, Figma, Datadog, Quince, LinkedIn (their own careers, not the job-board platform) | Greenhouse | ✅ working |
| Spotify | Lever | ✅ working |
| Column, Air Wallex, Ramp, OpenAI, Handshake (their own careers, not the job-board platform), Mercor | Ashby | ✅ working |
| Adobe, Capital One, Expedia, NVIDIA, Bank of America | Workday | ✅ working |
| Amazon / AWS | Amazon's own API | ✅ working |
| JPMorgan | Oracle Fusion Recruiting Cloud's public REST API | ✅ working |
| Google, Two Sigma, LINE MAN Wongnai (covers LINE MAN, Wongnai, LINE Pay Thailand) | Server-rendered HTML/hydration state, parsed directly (no browser needed — confirmed via plain `curl`) | ✅ working |
| Intuit, BlackRock | Radancy/TalentBrew career-site platform (same family as Two Sigma above, different theme per company) — server-renders its full paginated listing, parsed with `cheerio` | ✅ working |
| Shopee | Sea Group's own recruiting API (`ats.workatsea.com`), public and unauthenticated. Scoped to Thailand rather than pulling all ~2,600 jobs across every Sea Group market — see `lib/adapters/shopee.ts`. | ✅ working |
| BCG | Phenom People, but embeds its full result set as a server-rendered JSON blob (`phApp.ddo = {...}`) rather than needing the tenant-guessing that blocked Cisco/eBay below. Global listing, confirmed Singapore/Vietnam/Philippines/Indonesia/Malaysia postings — see `lib/adapters/html/bcg.ts`. | ✅ working, disabled by default |
| Deloitte, PwC (US portion), KPMG (US portion) | Radancy/TalentBrew (same family as Two Sigma/Intuit/BlackRock above) — server-renders its full listing. US-only; other member firms run on separate country sites. | ✅ working, disabled by default |
| Accenture | Workday (`accenture.wd103.myworkdayjobs.com`) — generic adapter, confirmed real Singapore results | ✅ working, disabled by default |
| PwC (APAC portion) | PwC's global Workday tenant (`pwc.wd3.myworkdayjobs.com`), searched for "Singapore"/"Bangkok" rather than pulling all ~4,500 jobs worldwide — merged with the US Radancy source above, see `lib/adapters/html/pwc.ts`. | ✅ working, disabled by default |
| EY | SAP SuccessFactors Career Site Builder — server-renders its full listing. Global site lists ~7,300 jobs; scoped via `locationsearch` to United States/Singapore/Thailand, all three confirmed with real matches — see `lib/adapters/html/ey.ts`. | ✅ working, disabled by default |
| KPMG (Thailand portion) | Adobe Experience Manager — job postings are individual content pages listed directly on the Thailand "Experienced Hires" page, not run through a separate ATS — merged with the US Radancy source above, see `lib/adapters/html/kpmg.ts`. | ✅ working, disabled by default |
| Netflix | Eightfold | ⚠️ adapter present, disabled by default — endpoint returned a bot-protection page during testing |
| TikTok/ByteDance | — | Client-side rendered with no exposed API. The one case that's genuinely just "needs a real browser" (not bot-mitigated) — would need a Playwright adapter, which is a real new dependency (~300MB Chromium), so it's flagged rather than added speculatively. |
| Meta | — | Same as TikTok — not bot-blocked, but `metacareers.com` runs on Facebook's internal "Comet" GraphQL framework; job data only loads via `POST /graphql` calls carrying session tokens generated after full JS boot. |
| Amex | — | Client-rendered *and* its data API is proxied through randomized, rotating paths — classic PerimeterX-style obfuscation. Not building around that. |
| Microsoft | — | Its search API stalls mid-TLS-handshake for non-browser clients — TLS-fingerprint-based bot blocking. Not building around that either. |
| Agoda, Citadel, DoorDash, Canva, PayPal, Visa, ServiceNow, X/Twitter | — | All return a Cloudflare "Just a moment…" JS challenge to non-browser requests. Same line as LinkedIn(platform)/Glassdoor: not building a bypass. |
| Lazada | — | The real job-search backend (`aidc-jobs.alibaba.com`, Alibaba Group's shared international recruiting platform) loads Alibaba's "Baxia" anti-bot script and requires a `getSecurityId` token before the job API responds. Same policy as Agoda/Citadel/Microsoft/Tesla: not building around active bot-mitigation. |
| Tesla | — | Found the real endpoint (`tesla.com/cua-api/apps/careers/state`) by watching network traffic in a real browser — renders fine there. Hitting it directly gets Akamai Bot Manager's "Access Denied" page. Same enforcement category as Agoda/Citadel/Microsoft, different vendor. |
| Line (LY Corp) | — | Not bot-blocked — runs on Gatsby + a Strapi-backed API — but the real job-listing endpoint wasn't found in a quick pass (the directly-fetchable `page-data.json` files only contain footer/nav content, not listings). Worth a proper look, not yet done. |
| Cisco, eBay | — | Both on Phenom People (`cdn.phenompeople.com`). The public `/api/apply/v2/jobs` endpoint is real, but every tenant-id guess derived from CDN asset paths returns "Tenant not identified" — the correct param wasn't found without live network capture against these specific tenants. eBay also has per-location pages (e.g. `/us/en/jobs-in-california`) that genuinely server-render, but there's no single unified feed, only ~30 separate location pages. |
| HSBC | — | Runs on Avature — a new ATS family for this project. The search page is a form/wizard shell; the results-page URL convention wasn't found without driving the wizard in a real browser. |
| Goldman Sachs | — | Custom Next.js app ("Higher") with an Apollo/GraphQL client — confirmed via `__NEXT_DATA__`, whose `initialApolloState` ships empty. Not bot-blocked, just genuinely client-rendered. |
| Uber, Apple | — | Uber's 406 is just strict Accept-header negotiation (not bot-blocking), but the real page is a client-only SPA with no discoverable API. Apple's "Workday" references are a false positive (internal HR copy, not its career site); it's a custom Next.js-shaped app with no server-rendered listing found. |
| McKinsey | — | The TLS/HTTP2 handshake completes but the server resets the stream (`INTERNAL_ERROR`) for a non-browser client, on both HTTP/2 and HTTP/1.1 — TLS/protocol-fingerprint-based bot blocking, same enforcement category as Microsoft. |
| Bain, Kearney | — | Cloudflare mitigation — Bain's response carries an explicit `cf-mitigated: challenge` header; Kearney serves a captcha challenge page. Same policy as Agoda/Citadel/DoorDash/Canva. |
| L.E.K. Consulting | — | Runs on Oleeo/TalentLink (`lek.tal.net`) — individual job pages are gated behind an ALTCHA proof-of-work captcha ("Quick Check Needed... confirm you're a real person"), confirmed via plain curl. Active bot-mitigation, not attempting a bypass. |

39 of 82 default company sources are live and working; the rest are visible but disabled on
`/sources` with the specific reason noted above rather than a generic "not yet supported."

All 10 consulting firms (McKinsey, Bain, BCG, Deloitte, Accenture, PwC, EY, Kearney, L.E.K.,
KPMG) were investigated for US and APAC (Singapore/Thailand especially) coverage; 6 came back
with real working adapters (confirmed 140 Thailand-tagged and 130 Singapore-tagged postings in
testing) and 4 are genuinely bot-mitigated. Every consulting source ships `enabled: false` by
default regardless of adapter status — unlike every other group on `/sources`, "adapter ready"
here doesn't mean "on by default." Toggle them on by hand if you want them scanned.

Two other groups are placeholders only — added to the source list and grouped, but their
career sites haven't been investigated yet, so they're not in the table above:
- 7 more quant trading firms: Jane Street, DRW, Jump Trading, Hudson River Trading, Optiver,
  IMC Trading, Susquehanna International Group (SIG)
- 10 private equity firms: Lakeshore Capital, Blackstone, KKR, Carlyle Group, TPG, Warburg
  Pincus, Affinity Equity Partners, Northstar Group, Creador, Navis Capital Partners

## Getting started

```bash
npm install
npm run dev
```

Opens on **http://localhost:3002**. Click "Scan now" — nothing scans automatically.

## Extraction

Years of experience, function, work mode, and job type are inferred with regex/keyword
rules (`lib/extract.ts`) from each posting's title/description — no paid LLM calls, so this
stays free to run. Location is classified separately (`lib/locations.ts`) by scanning the
full raw location string for country/region keywords, since a naive "split on the last
comma" approach left most postings unclassified in practice.

## Adding a company adapter

If a career site runs on Greenhouse, Lever, Workday, Ashby, or Oracle Fusion Recruiting
Cloud, add it to `lib/defaultSources.ts` with the right `identifier` — the existing generic
adapter will just work. Before assuming a site needs a real browser, check whether it
server-renders: it often does, even for very large companies (`curl` the search-results URL
and look for actual job titles in the raw HTML). If so, add a `lib/adapters/html/<company>.ts`
parser using `cheerio` and register it in `lib/adapters/html/index.ts` — much lighter than a
browser.

Only reach for `lib/adapters/playwright-generic.ts` (real `page.goto`/selector logic, requires
`npx playwright install chromium` once) when a site is genuinely client-rendered with no
server-side content — and never to get past an active bot challenge (Cloudflare, PerimeterX-style
obfuscated endpoints, TLS-fingerprint/Akamai blocking). Sites doing that stay `unimplemented`
on purpose.
