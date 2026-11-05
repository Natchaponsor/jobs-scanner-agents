# Jobs Scanner Agents

A personal, local-first job scanner. Scans company career sites for full-time roles matching
your filters, and tracks saved/applied status locally in your browser. Scans are on demand
("Scan now" in the app); a daily GitHub Actions run also publishes a shared snapshot you can
sync in with one click (see [Running the daily scan on GitHub](#running-the-daily-scan-on-github)).

## Why local-first, and why no LinkedIn/Handshake(platform)/Glassdoor

This runs on your machine (`npm run dev`), or optionally deployed to Vercel's free tier (see
below). Either way there's no backend database and nothing personal is stored server-side: job
data and saved/applied state live in your browser's IndexedDB, and filter/source preferences in
its `localStorage` (a full scan is ~26k jobs, far too big for `localStorage`'s quota), scoped to
whichever browser has the app open.

LinkedIn and Glassdoor actively detect and block automated access (LinkedIn has sued
scrapers over it), and Handshake-the-platform's job board sits entirely behind a personal
university login with no automatable path. None of that is something this project builds
around. The scan-sources UI still lists them (toggleable, for when/if that changes) but their
adapters are intentionally unimplemented rather than faked. (Handshake-the-*company*'s own
open roles are a separate, working source — see the table below.)

One "social" source *is* wired up and working, for a different reason than the rest: **New
Grad Positions (GitHub)** — `SimplifyJobs/New-Grad-Positions`, a public, unauthenticated,
structured JSON feed (`.github/scripts/listings.json`, no scraping) covering hundreds of
companies' postings, crowdsourced/verified by Simplify and community contributors (17.8k+
GitHub stars, updated continuously). There's no bot-detection to run into and nothing to
scrape — it's just a real public API, so it gets the same treatment as any Greenhouse/Lever
board. Unlike every other source, one entry here produces jobs attributed to many different
real companies (see `lib/adapters/githubJobsList.ts`).

## Features

- **On-demand scanning** — the app itself never scans in the background; click "Scan now." (The
  separate daily GitHub Actions run described below publishes a snapshot, but nothing is pulled
  into your browser until you click "Sync GitHub snapshot.")
- **Filters**: location (country picker — US/UK/Singapore/Thailand/APAC/Any — plus a city/state
  text box with suggested-city chips per country), function (22 labels — Product/Program
  Manager, Engineering Management, Business Operations Manager, Business Development,
  Consulting, Customer Success, Supply Chain/Logistics, Strategy, and more), years of
  experience, job type, work mode, work authorization, industry (9 values — Big Tech,
  E-Commerce, Social Media, Finance, Software, Media, Travel, AI, Consulting), and free-text
  search. Location filtering is keyword-based (`lib/locations.ts`) and scans each posting's
  full raw location string, not just a rigid "City, Country" format — needed because real ATS
  location strings are inconsistent (multi-location lists, 2/3-letter country codes, bare city
  names).
- **Work authorization filter** (US jobs only — the dropdown disables itself otherwise):
  "Citizenship Required" / "No Sponsorship" / "Sponsorship Available" / "n/a" — split into four
  buckets rather than three, since "no sponsorship" (needs *existing* independent work
  authorization) and "citizenship required" (or a security clearance, which implies it) are
  legally different asks. Regex-inferred from posting text
  (`extractWorkAuthorization` in `lib/extract.ts`) — no LLM, so most postings that don't
  explicitly mention citizenship/sponsorship land in "n/a" rather than a guess.
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
- **Multi-role clustering** — a company with more than one matching role on the current page
  collapses into a single expandable row ("9 roles", the shared function label if every role
  has the same one, expand for the individual postings) instead of repeating the company name
  down the table; a company with just one match still shows inline as a normal row. Grouping is
  stable-order (a company's position is set by its first occurrence in the current sort), so
  "Company" sort clusters perfectly and "Newest" clusters correctly whenever a company's roles
  were discovered together.
- Footer with a no-affiliation disclaimer, and a feedback button (bottom-right) linking to
  this repo's GitHub Issues.

## What's actually wired up

| Company | Adapter | Status |
|---|---|---|
| New Grad Positions (GitHub) — one source covering ~1,300 different real companies | Public JSON feed (`SimplifyJobs/New-Grad-Positions`'s `.github/scripts/listings.json`) — not a scrape, a real structured API. Each job is attributed to its actual hiring company, with per-job industry/work-authorization overrides where the feed's own data is more reliable than this project's usual regex guess — see `lib/adapters/githubJobsList.ts`. Confirmed live: ~3,200 currently active postings. | ✅ working |
| Airbnb, SoFi, Stripe, Adyen, Chime, Binance, Robinhood, Anthropic, Lyft, Figma, Datadog, Quince, TPG, KKR, DRW (board token isn't in the server-rendered HTML — found it inside DRW's own Next.js JS bundle after its CSP header tipped off that it was on Greenhouse at all), Asana, Gemini, Monzo, N26 | Greenhouse | ✅ working |
| Spotify, Coda Payments, Nium | Lever | ✅ working |
| Column, Air Wallex, Ramp, OpenAI, Handshake (their own careers, not the job-board platform), Mercor, Snowflake (career site is a Phenom People skin, but its `applyUrl` fields point straight at `jobs.ashbyhq.com/snowflake` — hits the generic adapter directly), Linear, Kraken (board name isn't the literal company name — "kraken" returns an empty jobs array; the real board is "kraken.com", found in the site's own outbound links) | Ashby | ✅ working |
| Adobe, Capital One, Expedia, NVIDIA, Bank of America, Razer, Palo Alto Networks, Trend Micro, PropertyGuru, Postman (moved off Greenhouse — its `postman` board now 404s — found by watching the open-positions page's network requests) | Workday — paged through in full, 20 per request (Workday rejects a larger `limit`), 6 pages in flight at a time, capped at 2,500 jobs per source (the largest tenant, Palo Alto Networks, is ~1,400) | ✅ working |
| Amazon / AWS | Amazon's own API, queried per country (US, UK, Singapore, Thailand), newest first, up to 1,000 per country (the US alone has 10,000+). The old hardcoded `loc_query=California` was silently ignored by the API and never narrowed anything. | ✅ working |
| JPMorgan | Oracle Fusion Recruiting Cloud's public REST API, paged 100 at a time up to 2,500 of its ~7,200 jobs (newest first) | ✅ working |
| Wise | SmartRecruiters' public, unauthenticated postings API (`api.smartrecruiters.com/v1/companies/{slug}/postings`) — new generic adapter type, reusable for any company on SmartRecruiters, not just Wise. Confirmed real Singapore-tagged postings among ~426 total. | ✅ working |
| Google, Two Sigma, LINE MAN Wongnai (covers LINE MAN, Wongnai, LINE Pay Thailand) | Server-rendered HTML/hydration state, parsed directly (no browser needed — confirmed via plain `curl`) | ✅ working |
| Optiver | Not a recognizable ATS — a custom React site with a genuine public JSON API (`www.optiver.com/en/api/v1/jobs`) embedded as hydration state in the server-rendered page. Capped at 16 results per query with no working pagination param found (tried skip/offset/limit/page/take/size/count/top), but its `location` filter genuinely scopes server-side, so querying each of its own listed office locations captures the full dataset (confirmed by summing each location's count back up to the unfiltered total) — see `lib/adapters/html/optiver.ts`. Confirmed 6 Singapore-tagged postings, fully captured. | ✅ working |
| Intuit, BlackRock, HSBC | Radancy/TalentBrew career-site platform (same family as Two Sigma above, different theme per company — HSBC's variant uses "pipeline" terminology instead of "job") — server-renders its full paginated listing, parsed with `cheerio` | ✅ working |
| Shopee | Sea Group's own recruiting API (`ats.workatsea.com`), public and unauthenticated. Scoped to Thailand rather than pulling all ~2,600 jobs across every Sea Group market — see `lib/adapters/shopee.ts`. | ✅ working |
| BCG | Phenom People, but embeds its full result set as a server-rendered JSON blob (`phApp.ddo = {...}`) rather than needing tenant-guessing. Global listing, confirmed Singapore/Vietnam/Philippines/Indonesia/Malaysia postings — see `lib/adapters/html/bcg.ts`. | ✅ working, disabled by default |
| Cisco, eBay, AirAsia, Circle | Same Phenom People `phApp.ddo` pattern as BCG above — shared fetch/parse logic in `lib/adapters/html/phenom.ts`. Cisco confirmed ~1,170 jobs globally (US + APAC); eBay confirmed ~466 jobs; AirAsia confirmed ~142 jobs with real Singapore/Malaysia/Indonesia/Philippines/Cambodia postings; Circle confirmed ~61 jobs with real Singapore-tagged postings. | ✅ working |
| Deloitte, PwC (US portion), KPMG (US portion) | Radancy/TalentBrew (same family as Two Sigma/Intuit/BlackRock above) — server-renders its full listing. US-only; other member firms run on separate country sites. | ✅ working, disabled by default |
| Accenture | Workday (`accenture.wd103.myworkdayjobs.com`) — generic adapter, confirmed real Singapore results | ✅ working, disabled by default |
| PwC (APAC portion) | PwC's global Workday tenant (`pwc.wd3.myworkdayjobs.com`), searched for "Singapore"/"Bangkok" rather than pulling all ~4,500 jobs worldwide — merged with the US Radancy source above, see `lib/adapters/html/pwc.ts`. | ✅ working, disabled by default |
| EY | SAP SuccessFactors Career Site Builder (same template SAP's own career site used before it went behind Cloudflare, see below) — server-renders its full listing. Global site lists ~7,300 jobs; scoped via `locationsearch` to United States/Singapore/Thailand, all three confirmed with real matches — see `lib/adapters/html/ey.ts` and the shared `lib/adapters/html/successfactors.ts` helper. | ✅ working, disabled by default |
| KKP (Kiatnakin Phatra Financial Group) | Also SuccessFactors Career Site Builder, same template — but unlike EY/SAP, scoping to `locationsearch=Thailand` actually *undercounts* (~75 of 125 jobs), because some rows render their location in Thai script ("กรุงเทพมหานคร, ไทย") rather than English "Thailand". KKP only hires in Thailand anyway, so the adapter just pulls the full unfiltered listing instead — see `lib/adapters/html/kkp.ts`. ~125 jobs confirmed, all Thailand. | ✅ working |
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
| Goldman Sachs | — | Custom Next.js app ("Higher") with an Apollo/GraphQL client — confirmed via `__NEXT_DATA__`, whose `initialApolloState` ships empty. Not bot-blocked, just genuinely client-rendered. |
| Uber, Apple | — | Uber's 406 is just strict Accept-header negotiation (not bot-blocking), but the real page is a client-only SPA with no discoverable API. Apple's "Workday" references are a false positive (internal HR copy, not its career site); it's a custom Next.js-shaped app with no server-rendered listing found. |
| McKinsey | — | The TLS/HTTP2 handshake completes but the server resets the stream (`INTERNAL_ERROR`) for a non-browser client, on both HTTP/2 and HTTP/1.1 — TLS/protocol-fingerprint-based bot blocking, same enforcement category as Microsoft. |
| Bain, Kearney | — | Cloudflare mitigation — Bain's response carries an explicit `cf-mitigated: challenge` header; Kearney serves a captcha challenge page. Same policy as Agoda/Citadel/DoorDash/Canva. |
| L.E.K. Consulting | — | Runs on Oleeo/TalentLink (`lek.tal.net`) — individual job pages are gated behind an ALTCHA proof-of-work captcha ("Quick Check Needed... confirm you're a real person"), confirmed via plain curl. Active bot-mitigation, not attempting a bypass. |
| Blackstone | — | Cloudflare mitigation — `cf-mitigated: challenge` header on every request. Same policy as Bain/Kearney above. |
| SCB (Siam Commercial Bank) | — | Returns a 403 "The request is blocked" page on every path, from an Azure Front Door WAF (confirmed via the `x-azure-ref` response header) — a new bot-mitigation vendor for this list, same policy as the Cloudflare/Akamai/PerimeterX entries elsewhere: not attempting a bypass. |
| Carlyle Group | — | Cloudflare "Attention Required!" block page on every request. Same policy as Bain/Kearney above. |
| SAP | — | `jobs.sap.com` (SuccessFactors, the same template as EY — it worked, ~220 jobs across US/Singapore/Thailand) is now behind a Cloudflare managed challenge: every request gets a 403 with `cf-mitigated: challenge`, from both a GitHub runner and a local machine. Not attempting a bypass. `lib/adapters/html/sap.ts` is kept in case it lifts. |
| LinkedIn (their own careers) | — | Used to be a Greenhouse board; that board now 404s and `careers.linkedin.com` sends every open-roles link to `linkedin.com/jobs` — the same job-board platform as the blocked "LinkedIn" social source, so there's nothing left to scan without going through it. |

63 of 102 default company sources are live and working; the rest are visible but disabled on
`/sources` with the specific reason noted above rather than a generic "not yet supported." (That
count is `category: "company"` sources only — the GitHub source above is `category: "social"`,
alongside LinkedIn/Handshake/Glassdoor/Indeed, so it's not in the denominator despite being the
one social source that actually works.)

All 10 consulting firms (McKinsey, Bain, BCG, Deloitte, Accenture, PwC, EY, Kearney, L.E.K.,
KPMG) were investigated for US and APAC (Singapore/Thailand especially) coverage; 6 came back
with real working adapters (confirmed 140 Thailand-tagged and 130 Singapore-tagged postings in
testing) and 4 are genuinely bot-mitigated. Every consulting source ships `enabled: false` by
default regardless of adapter status — unlike every other group on `/sources`, "adapter ready"
here doesn't mean "on by default." Toggle them on by hand if you want them scanned.

Two other groups were added as placeholders and are now partially investigated:
- 7 quant trading firms (Jane Street, DRW, Jump Trading, Hudson River Trading, Optiver, IMC
  Trading, Susquehanna International Group/SIG) were checked — DRW and Optiver came back
  working (see the Greenhouse and Optiver rows above), Jump Trading and IMC Trading's initial
  "Greenhouse"/"iCIMS" keyword hits turned out to be false positives from a stale shared probe
  file, SIG's iCIMS hit was real but its jobs page is client-rendered with no embedded data, and
  Jane Street and Hudson River Trading remain placeholders (Hudson River Trading's only
  Greenhouse board turned out to be a talent-community signup form, not real postings).
- 10 private equity firms (Lakeshore Capital, Blackstone, KKR, Carlyle Group, TPG, Warburg
  Pincus, Affinity Equity Partners, Northstar Group, Creador, Navis Capital Partners) were
  checked — KKR and TPG came back working (both on Greenhouse; KKR's board token is literally
  "stage", confirmed genuine via its `absolute_url` postings), Blackstone and Carlyle Group are
  actively Cloudflare-blocked (see table above), and the remaining 6 are still placeholders —
  no working adapter found yet.

## Getting started

```bash
npm install
npm run dev
```

Opens on **http://localhost:3002**. Click "Scan now" — nothing scans automatically.

## Running the daily scan on GitHub

Everything above still runs entirely on your own machine with zero hosting cost — this is an
*optional* addition, not a replacement. GitHub can't host a Next.js server for free, but
**GitHub Actions** can run a scheduled job for free, which turns out to be enough:
`.github/workflows/daily-scan.yml` runs once a day (`scripts/scan.ts`, the same adapters/
`runScan` logic as "Scan now", no server involved), and commits the result to `data/jobs.json`.

Your own saved/applied status, filters, and enabled sources never leave your browser's
`localStorage` — only the raw scanned listings (not personal data) get centrally refreshed.
The dashboard's **"Sync GitHub snapshot"** button fetches that file directly from
`raw.githubusercontent.com` (no auth, permissive CORS — no proxy route needed) and merges it in
exactly like a live scan would, by job id, preserving your existing saved/applied state.
**"Scan now" still works exactly as before** — it's a live, on-demand scan; the daily GitHub run
is a separate, additional background layer, not a replacement for it.

What the daily run actually does, and doesn't do:

- It scans every source that's **enabled in the code defaults** (`lib/defaultSources.ts`, 58
  sources today) with no function filter — your own on/off choices in `/sources` aren't visible
  to it. A run takes about 20–90 seconds.
- **Complete listings, not samples.** The big Workday/Oracle/Amazon/Google sources are paged
  through (see the table below) rather than cut off at their first 20–25 results.
- **Closed postings go away.** "Sync GitHub snapshot" adds new jobs *and* drops ones the
  snapshot no longer lists — except anything you saved or applied to, companies the snapshot
  doesn't cover, and companies whose source errored in that run. The dashboard's last-sync
  record includes how many were dropped (`jobsRemoved`).
- **Failures are loud.** Each failing source is a warning annotation and a row in the run's
  summary (flagged when it also failed the previous run); the job *fails* — emailing you and
  skipping the commit — if the scan returns zero jobs, more than 25% of sources fail, or the job
  count falls below 70% of the previous snapshot.
- **Cheap to store.** The snapshot is sorted by job id with one job per line, and a job keeps
  its first-seen `discoveredAt` across days, so a day-to-day diff is only the jobs that actually
  changed (~400 lines, not ~270,000). It's ~18 MB raw, ~1.2 MB gzipped.
- **No alerts yet.** There's no email/push when new jobs appear, and no "new since yesterday"
  view — the snapshot only changes what "Sync" pulls in. GitHub's own failure email is the only
  notification.
- Runs land anywhere from roughly 16:00 to 22:00 UTC rather than at the `0 13 * * *` cron time —
  GitHub treats schedules as best-effort.

**The repo needs to be public** for this to work — `raw.githubusercontent.com` returns a 404
for files in a private repo unless the request carries a GitHub auth token, which a plain
browser fetch can't do securely. There's nothing sensitive to expose by making it public:
no secrets are tracked (`.env`/`.env.local` are gitignored), and `data/jobs.json` is just
scraped *public* job postings — none of your personal saved/applied/filter state ever leaves
your browser to begin with. (Settings → General → Danger Zone → Change visibility, if it's
currently private.)

To turn this on for your own fork: push to GitHub with Actions enabled (the workflow needs
`contents: write` permission, already set in the YAML) and it starts running on the `0 13 * * *`
UTC schedule; the `data/jobs.json` URL in `store/useJobsStore.ts`'s `GITHUB_SNAPSHOT_URL` is
hardcoded to this repo's own path, so update it if you fork this to a different GitHub
username/repo. You can also trigger a run immediately from the Actions tab
(`workflow_dispatch`) instead of waiting for the schedule.

## Deploying to Vercel (optional)

Also optional, and complementary to the GitHub Actions layer above rather than a replacement
for it — Vercel hosts the interactive app itself (dashboard, `/sources`, `/api/scan`) at a real
URL instead of just `localhost`, for free at this scale. **Hosting it doesn't change data
locality at all**: saved/applied status, filters, and enabled sources still live in
whichever *browser* has the app open, scoped to that origin — that was already true at
`localhost:3002`, and it's equally true at `your-project.vercel.app`. There's no database and
no shared state between visitors; two different browsers hitting the same deployed URL just
have two independent local states, same as they would locally.

1. Push this repo to GitHub (if you haven't already).
2. In Vercel: **Add New Project** → import the repo → it auto-detects Next.js → **Deploy**.
   No config needed beyond what's already in this repo.
3. Every future push to `main` auto-deploys.
4. `/api/scan` runs as a Vercel serverless function — `app/api/scan/route.ts` sets
   `maxDuration = 60` (Hobby's max for a standard function) since a full scan across every
   enabled source has taken up to ~70s in testing. If "Scan now" times out with a lot of
   sources enabled, turn on **Fluid Compute** in the project's Settings → Functions (still
   free on Hobby) and bump `maxDuration` to `300`. Scans are now paginated, so "Scan now" with
   the function filter on "Any function" fetches whole listings and takes longer than one with a
   function selected (which narrows Workday/Oracle/Amazon/Google server-side) — if it's close to
   the limit, pick a function, or lean on the daily snapshot instead.

The daily GitHub Actions snapshot keeps working independently of whether (or where) the app is
deployed — "Sync GitHub snapshot" fetches straight from `raw.githubusercontent.com` either way.

## Testing

```bash
npm run test
```

Vitest, `node` environment, no DOM/component tests — coverage is the pure extraction/filtering
logic in `lib/`, not the UI. 42 tests across 5 files:

- `lib/extract.test.ts` — `extractWorkAuthorization` (US-only scoping, citizen-only/sponsorship
  detection, the two phrasing bugs caught during manual testing: rigid "security clearance
  required" word order, and "sponsor work visas"/"offer ... sponsorship" phrasing that the
  original pattern missed) and `extractFunction` (every function label added this round, plus
  a regression guard on the FUNCTION_KEYWORDS reordering — "Engineering Manager, Backend" must
  resolve to Engineering Management, not get caught by the broader Software Engineer pattern).
- `lib/selectors.test.ts` — `filterAndSortJobs`'s work authorization filter: passes everything
  through on "any", restricts US jobs to the selected value, and — the actual point of the
  feature — never excludes non-US jobs no matter what's selected.
- `lib/mergeJobs.test.ts` — `mergeJobs` (adds unseen jobs, never overwrites saved/applied state)
  and `pruneClosed` (drops closed postings but never saved/applied ones, never companies the
  snapshot doesn't cover or whose source errored, and never GitHub-list jobs when that list
  didn't come through).
- `lib/adapters/paginate.test.ts` — the shared pagination helpers: offset math, the per-source
  ceiling, bounded concurrency, order preservation, and retry.
- `lib/defaultSources.test.ts` — data-integrity checks on the industry re-tagging: no source is
  still on the old generic "Tech" catch-all, every source's industry is a known differentiated
  value, and the specific companies that moved (Big Tech/E-Commerce/Social Media/merged into
  Travel/Software/Media) landed where intended.

## Extraction

Years of experience, function, work mode, and job type are inferred with regex/keyword
rules (`lib/extract.ts`) from each posting's title/description — no paid LLM calls, so this
stays free to run. Location is classified separately (`lib/locations.ts`) by scanning the
full raw location string for country/region keywords, since a naive "split on the last
comma" approach left most postings unclassified in practice.

## Adding a company adapter

If a career site runs on Greenhouse, Lever, Workday, Ashby, SmartRecruiters, or Oracle Fusion
Recruiting Cloud, add it to `lib/defaultSources.ts` with the right `identifier` — the existing
generic adapter will just work. (Community-maintained GitHub job lists in the "Simplify Jobs"
format work the same way, via the `github-jobs-list` adapter and an `owner/repo` identifier.)
If the API paginates, use the helpers in `lib/adapters/paginate.ts` rather than taking just the
first page: every job lands in the browser's local store, so cap a source at
`MAX_JOBS_PER_SOURCE`. Don't trust a company's board token to stay put — Postman and LinkedIn's
Greenhouse boards both vanished; `data/jobs.json`'s `run.errors` and the daily run's summary show
what's failing. Before assuming a site needs a real browser, check whether it
server-renders: it often does, even for very large companies (`curl` the search-results URL
and look for actual job titles in the raw HTML). If so, add a `lib/adapters/html/<company>.ts`
parser using `cheerio` and register it in `lib/adapters/html/index.ts` — much lighter than a
browser.

Only reach for `lib/adapters/playwright-generic.ts` (real `page.goto`/selector logic, requires
`npx playwright install chromium` once) when a site is genuinely client-rendered with no
server-side content — and never to get past an active bot challenge (Cloudflare, PerimeterX-style
obfuscated endpoints, TLS-fingerprint/Akamai blocking). Sites doing that stay `unimplemented`
on purpose.
