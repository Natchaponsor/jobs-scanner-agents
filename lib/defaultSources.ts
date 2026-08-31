import type { ScanSource } from "./types";

/**
 * Default scanning scope. `identifier` is adapter-specific:
 * - greenhouse: board token (boards-api.greenhouse.io/v1/boards/{token}/jobs)
 * - lever: board token (api.lever.co/v0/postings/{token})
 * - workday: `{host}|{siteSlug}` e.g. `adobe.wd5.myworkdayjobs.com|external_experienced`
 * - ashby: board name (api.ashbyhq.com/posting-api/job-board/{board})
 * - oracle-fusion: `{tenant}|{siteNumber}` e.g. `jpmc|CX_1001`
 * - smartrecruiters: company slug (api.smartrecruiters.com/v1/companies/{slug}/postings)
 * - github-jobs-list: `"{owner}/{repo}"` of a "Simplify Jobs"-family GitHub repo, e.g.
 *   "SimplifyJobs/New-Grad-Positions" — see lib/adapters/githubJobsList.ts
 * - html-scrape: unused here — dispatched by source.id, see lib/adapters/html/index.ts
 * - custom-amazon: unused, adapter is hardcoded to amazon.jobs
 * - unimplemented: the company's career site URL, kept for reference / future wiring
 *
 * `group` organizes the /sources settings page (see SourceGroup in lib/types.ts) — distinct
 * from `industry`, which is job-level metadata for the dashboard's industry filter.
 *
 * `majorLocations` (shown on /sources as a subtitle tag) is HQ-first: the company's
 * headquarters — public, well-known info, not independently verified per entry — plus
 * Singapore and/or Thailand if this project has actually confirmed real postings there for
 * that source (via a live scan or a dedicated location-scoped check during adapter
 * verification, documented inline where relevant). A country's absence means "not confirmed,"
 * not "doesn't hire there" — most sources have never been checked for SG/TH presence
 * specifically. Omitted entirely for one entry (Lakeshore Capital) whose HQ isn't confidently
 * known.
 */
export const DEFAULT_SOURCES: ScanSource[] = [
  // --- Social (not automatable in v1 — see README for why) ---
  { id: "social-linkedin", category: "social", name: "LinkedIn", identifier: "https://www.linkedin.com/jobs/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "any", group: null },
  { id: "social-handshake", category: "social", name: "Handshake", identifier: "https://joinhandshake.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "any", group: null },
  { id: "social-glassdoor", category: "social", name: "Glassdoor", identifier: "https://www.glassdoor.com/Job/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "any", group: null },
  { id: "social-indeed", category: "social", name: "Indeed", identifier: "https://www.indeed.com/jobs", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "any", group: null },
  // New Grad Positions (GitHub): unlike the platforms above, this one is genuinely automatable
  // — a public, unauthenticated, structured JSON feed (not a scrape), no bot-detection to run
  // into. Publishes `.github/scripts/listings.json` on its `dev` branch: real postings across
  // hundreds of companies, crowdsourced/verified by Simplify + community contributors (17.8k+
  // GitHub stars, updated continuously). Confirmed live: ~3.2k currently active entries. Each
  // job is attributed to its real hiring company (not this source's own name) — see
  // lib/adapters/githubJobsList.ts.
  { id: "social-github-newgrad", category: "social", name: "New Grad Positions (GitHub)", identifier: "SimplifyJobs/New-Grad-Positions", adapterType: "github-jobs-list", enabled: true, isDefault: true, industry: "any", group: null },

  // --- Company sites: confirmed working adapters ---
  { id: "co-airbnb", category: "company", name: "Airbnb", identifier: "airbnb", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Travel", group: "Travel and Ride Share", majorLocations: ["United States", "Singapore", "Thailand"] },
  { id: "co-sofi", category: "company", name: "SoFi", identifier: "sofi", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech", majorLocations: ["United States"] },
  { id: "co-adobe", category: "company", name: "Adobe", identifier: "adobe.wd5.myworkdayjobs.com|external_experienced", adapterType: "workday", enabled: true, isDefault: true, industry: "Software", group: "Software", majorLocations: ["United States"] },
  { id: "co-capitalone", category: "company", name: "Capital One", identifier: "capitalone.wd12.myworkdayjobs.com|Capital_One", adapterType: "workday", enabled: true, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance", majorLocations: ["United States"] },
  { id: "co-amazon", category: "company", name: "Amazon and AWS", identifier: "amazon", adapterType: "custom-amazon", enabled: true, isDefault: true, industry: "Big Tech", group: "Big Tech", majorLocations: ["United States"] },
  { id: "co-column", category: "company", name: "Column", identifier: "column", adapterType: "ashby", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech", majorLocations: ["United States"] },
  { id: "co-google", category: "company", name: "Google", identifier: "co-google", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "Big Tech", group: "Big Tech", majorLocations: ["United States", "Singapore"] },
  { id: "co-twosigma", category: "company", name: "Two Sigma", identifier: "co-twosigma", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "Finance", group: "Quant, Hedge Funds & Crypto", majorLocations: ["United States"] },
  { id: "co-jpmorgan", category: "company", name: "JP Morgan", identifier: "jpmc|CX_1001", adapterType: "oracle-fusion", enabled: true, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance", majorLocations: ["United States"] },
  { id: "co-airwallex", category: "company", name: "Air Wallex", identifier: "airwallex", adapterType: "ashby", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech", majorLocations: ["Australia", "Singapore"] },
  { id: "co-spotify", category: "company", name: "Spotify", identifier: "spotify", adapterType: "lever", enabled: true, isDefault: true, industry: "Media", group: "Media and Entertainment", majorLocations: ["Sweden", "Singapore"] },
  { id: "co-ramp", category: "company", name: "Ramp", identifier: "ramp", adapterType: "ashby", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech", majorLocations: ["United States"] },
  { id: "co-stripe", category: "company", name: "Stripe", identifier: "stripe", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech", majorLocations: ["United States", "Singapore", "Thailand"] },
  { id: "co-adyen", category: "company", name: "Adyen", identifier: "adyen", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech", majorLocations: ["Netherlands", "Singapore"] },
  { id: "co-chime", category: "company", name: "Chime", identifier: "chime", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech", majorLocations: ["United States"] },
  // Wise: SmartRecruiters' public postings API — see lib/adapters/smartrecruiters.ts. The
  // wise.jobs career site itself runs a themed "SmartRecruiters Attrax" CMS shell, but the
  // underlying company slug ("Wise") works directly against the generic public API. Confirmed
  // real Singapore-tagged postings among ~426 total.
  { id: "co-wise", category: "company", name: "Wise", identifier: "Wise", adapterType: "smartrecruiters", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech", majorLocations: ["United Kingdom", "Singapore", "Thailand"] },
  // Coda Payments: Lever, board token "Coda" — confirmed real Singapore- and
  // Bangkok-tagged postings, its two biggest APAC hubs.
  { id: "co-codapayments", category: "company", name: "Coda Payments", identifier: "Coda", adapterType: "lever", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech", majorLocations: ["Singapore", "Thailand"] },
  // Nium: Lever, board token "nium" — confirmed real Singapore- and Kuala Lumpur-tagged
  // postings.
  { id: "co-nium", category: "company", name: "Nium", identifier: "nium", adapterType: "lever", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech", majorLocations: ["Singapore"] },
  { id: "co-monzo", category: "company", name: "Monzo", identifier: "monzo", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech", majorLocations: ["United Kingdom"] },
  { id: "co-n26", category: "company", name: "N26", identifier: "n26", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech", majorLocations: ["Germany"] },
  { id: "co-binance", category: "company", name: "Binance", identifier: "binance", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Quant, Hedge Funds & Crypto", majorLocations: ["UAE"] },
  { id: "co-gemini", category: "company", name: "Gemini", identifier: "gemini", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Quant, Hedge Funds & Crypto", majorLocations: ["United States", "Singapore"] },
  // Kraken: Ashby — the board name isn't the literal company name ("kraken"), which returns an
  // empty jobs array; the real board is "kraken.com" (found in the site's own outbound links to
  // jobs.ashbyhq.com). 91 jobs, confirmed real Singapore-tagged postings.
  { id: "co-kraken", category: "company", name: "Kraken", identifier: "kraken.com", adapterType: "ashby", enabled: true, isDefault: true, industry: "Finance", group: "Quant, Hedge Funds & Crypto", majorLocations: ["United States", "Singapore"] },
  // Circle: careers.circle.com is on Phenom People, same embedded `phApp.ddo` pattern as BCG/
  // Cisco/eBay/AirAsia above — see lib/adapters/html/phenom.ts and
  // lib/adapters/html/circle.ts. ~61 jobs, confirmed real Singapore-tagged postings.
  { id: "co-circle", category: "company", name: "Circle", identifier: "co-circle", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "Finance", group: "Quant, Hedge Funds & Crypto", majorLocations: ["United States", "Singapore"] },
  { id: "co-robinhood", category: "company", name: "Robinhood", identifier: "robinhood", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech", majorLocations: ["United States", "Singapore"] },
  { id: "co-openai", category: "company", name: "OpenAI", identifier: "openai", adapterType: "ashby", enabled: true, isDefault: true, industry: "AI", group: "AI", majorLocations: ["United States", "Singapore"] },
  { id: "co-anthropic", category: "company", name: "Anthropic", identifier: "anthropic", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "AI", group: "AI", majorLocations: ["United States", "Singapore"] },
  { id: "co-handshake-co", category: "company", name: "Handshake", identifier: "handshake", adapterType: "ashby", enabled: true, isDefault: true, industry: "Social Media", group: "Social Media", majorLocations: ["United States"] },
  { id: "co-mercor", category: "company", name: "Mercor", identifier: "mercor", adapterType: "ashby", enabled: true, isDefault: true, industry: "AI", group: "AI", majorLocations: ["United States"] },
  { id: "co-lyft", category: "company", name: "Lyft", identifier: "lyft", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Travel", group: "Travel and Ride Share", majorLocations: ["United States"] },
  { id: "co-figma", category: "company", name: "Figma", identifier: "figma", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Software", group: "Software", majorLocations: ["United States", "Singapore"] },
  { id: "co-datadog", category: "company", name: "Datadog", identifier: "datadog", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Software", group: "Software", majorLocations: ["United States", "Singapore"] },
  { id: "co-asana", category: "company", name: "Asana", identifier: "asana", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Software", group: "Software", majorLocations: ["United States", "Singapore"] },
  { id: "co-postman", category: "company", name: "Postman", identifier: "postman", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Software", group: "Software", majorLocations: ["United States"] },
  { id: "co-linear", category: "company", name: "Linear", identifier: "Linear", adapterType: "ashby", enabled: true, isDefault: true, industry: "Software", group: "Software", majorLocations: ["United States"] },
  { id: "co-razer", category: "company", name: "Razer", identifier: "razer.wd3.myworkdayjobs.com|Careers", adapterType: "workday", enabled: true, isDefault: true, industry: "Software", group: "Software", majorLocations: ["Singapore"] },
  // Snowflake's career site is a Phenom People skin, but its jobs are actually hosted on
  // Ashby (its embedded phApp.ddo blob's applyUrl fields point to jobs.ashbyhq.com/snowflake)
  // — hits the generic Ashby adapter directly, no bespoke scraping needed. Confirmed real
  // Singapore-tagged postings among ~392 total.
  { id: "co-snowflake", category: "company", name: "Snowflake", identifier: "snowflake", adapterType: "ashby", enabled: true, isDefault: true, industry: "Software", group: "Software", majorLocations: ["United States", "Singapore"] },
  { id: "co-paloalto", category: "company", name: "Palo Alto Networks", identifier: "paloaltonetworks.wd5.myworkdayjobs.com|panwexternalcareers", adapterType: "workday", enabled: true, isDefault: true, industry: "Software", group: "Software", majorLocations: ["United States", "Singapore"] },
  { id: "co-trendmicro", category: "company", name: "Trend Micro", identifier: "trendmicro.wd3.myworkdayjobs.com|External", adapterType: "workday", enabled: true, isDefault: true, industry: "Software", group: "Software", majorLocations: ["Japan", "Singapore"] },
  { id: "co-propertyguru", category: "company", name: "PropertyGuru", identifier: "propertyguru.wd105.myworkdayjobs.com|PropertyGuru", adapterType: "workday", enabled: true, isDefault: true, industry: "Software", group: "Software", majorLocations: ["Singapore"] },
  { id: "co-quince", category: "company", name: "Quince", identifier: "quince", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "E-Commerce", group: "E-Commerce", majorLocations: ["United States", "Thailand"] },
  // LinkedIn's own careers page (Greenhouse) — separate from the "LinkedIn" social source
  // above, which represents scanning LinkedIn-the-job-board-platform (not automatable).
  { id: "co-linkedin", category: "company", name: "LinkedIn", identifier: "linkedin", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Social Media", group: "Social Media", majorLocations: ["United States"] },
  { id: "co-expedia", category: "company", name: "Expedia", identifier: "expedia.wd108.myworkdayjobs.com|search", adapterType: "workday", enabled: true, isDefault: true, industry: "Travel", group: "Travel and Ride Share", majorLocations: ["United States"] },
  // AirAsia: mycareer.airasia.com is on Phenom People, same embedded `phApp.ddo` pattern as
  // BCG/Cisco/eBay/Snowflake above — see lib/adapters/html/phenom.ts and
  // lib/adapters/html/airasia.ts. ~142 jobs, confirmed real Singapore/Malaysia/Indonesia/
  // Philippines/Cambodia postings.
  { id: "co-airasia", category: "company", name: "AirAsia", identifier: "co-airasia", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "Travel", group: "Travel and Ride Share", majorLocations: ["Malaysia", "Singapore", "Thailand"] },
  { id: "co-nvidia", category: "company", name: "NVIDIA", identifier: "nvidia.wd5.myworkdayjobs.com|NVIDIAExternalCareerSite", adapterType: "workday", enabled: true, isDefault: true, industry: "Big Tech", group: "Big Tech", majorLocations: ["United States"] },
  { id: "co-bofa", category: "company", name: "Bank of America", identifier: "ghr.wd1.myworkdayjobs.com|lateral-us", adapterType: "workday", enabled: true, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance", majorLocations: ["United States"] },
  { id: "co-intuit", category: "company", name: "Intuit", identifier: "co-intuit", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance", majorLocations: ["United States"] },
  { id: "co-blackrock", category: "company", name: "Blackrock", identifier: "co-blackrock", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance", majorLocations: ["United States", "Singapore"] },
  // HSBC: mycareer.hsbc.com/en_GB/external/SearchJobs is the same Radancy/TalentBrew platform
  // as Two Sigma/Intuit/Blackrock above, themed with "pipeline" terminology instead of "job" —
  // see lib/adapters/html/hsbc.ts.
  { id: "co-hsbc", category: "company", name: "HSBC", identifier: "co-hsbc", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance", majorLocations: ["United Kingdom"] },
  // KKP (Kiatnakin Phatra Financial Group): careers.kkpfg.com is a SAP SuccessFactors Career
  // Site Builder site, same template as EY/SAP above — see lib/adapters/html/kkp.ts. ~125 jobs,
  // all Thailand (KKP only hires there).
  { id: "co-kkp", category: "company", name: "KKP", identifier: "co-kkp", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance", majorLocations: ["Thailand"] },
  // SCB (Siam Commercial Bank): careers.scb.co.th returns a 403 "The request is blocked" page
  // on every path, from an Azure Front Door WAF (confirmed via the `x-azure-ref` response
  // header) — active bot-mitigation, not attempting a bypass. A new mitigation vendor for this
  // project's list, same policy as the Cloudflare/Akamai/PerimeterX entries elsewhere.
  { id: "co-scb", category: "company", name: "SCB", identifier: "https://careers.scb.co.th/en/jobs", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance", majorLocations: ["Thailand"] },
  // Cisco: careers.cisco.com is on Phenom People, same embedded `phApp.ddo` pattern as
  // BCG/eBay — see lib/adapters/html/phenom.ts. ~1,170 jobs globally, US + APAC confirmed.
  { id: "co-cisco", category: "company", name: "Cisco", identifier: "co-cisco", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "Software", group: "Software", majorLocations: ["United States", "Singapore", "Thailand"] },
  // eBay: jobs.ebayinc.com is also Phenom People — see lib/adapters/html/phenom.ts.
  // ~466 jobs confirmed via plain curl.
  { id: "co-ebay", category: "company", name: "Ebay", identifier: "co-ebay", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "E-Commerce", group: "E-Commerce", majorLocations: ["United States"] },
  // SAP: jobs.sap.com runs its own SuccessFactors Career Site Builder — same template as EY
  // above. Scoped to US/Singapore/Thailand — see lib/adapters/html/sap.ts and the shared
  // lib/adapters/html/successfactors.ts helper.
  { id: "co-sap", category: "company", name: "SAP", identifier: "co-sap", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "Software", group: "Software", majorLocations: ["Germany", "Singapore", "Thailand"] },
  // Sea Group's own recruiting API (ats.workatsea.com), scoped to Thailand — see lib/adapters/shopee.ts.
  { id: "co-shopee", category: "company", name: "Shopee", identifier: "shopee", adapterType: "custom-shopee", enabled: true, isDefault: true, industry: "E-Commerce", group: "E-Commerce", majorLocations: ["Singapore", "Thailand"] },
  // careers.lmwn.com server-renders its listing — see lib/adapters/html/linemanwongnai.ts.
  { id: "co-linemanwongnai", category: "company", name: "LINE MAN Wongnai", identifier: "co-linemanwongnai", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "Travel", group: "Travel and Ride Share", majorLocations: ["Thailand"] },

  // Eightfold endpoint returns an HTML challenge/error page rather than JSON when probed
  // headlessly — likely bot-protected. Adapter is wired up but left disabled until confirmed.
  { id: "co-netflix", category: "company", name: "Netflix", identifier: "netflix.com|explore.jobs.netflix.net", adapterType: "eightfold", enabled: false, isDefault: true, industry: "Media", group: "Media and Entertainment", majorLocations: ["United States"] },

  // --- Company sites: not implemented — investigated but not confirmed. Big enterprises on
  // custom SPAs or unidentified platforms, quick-probed (SSR check + common Workday/Eightfold
  // guesses) rather than deep-dived one at a time like the earlier bot-mitigated batch.
  { id: "co-amex", category: "company", name: "Amex", identifier: "https://careers.americanexpress.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance", majorLocations: ["United States"] },
  { id: "co-microsoft", category: "company", name: "Microsoft", identifier: "https://careers.microsoft.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Big Tech", group: "Big Tech", majorLocations: ["United States"] },
  { id: "co-tiktok", category: "company", name: "TikTok and ByteDance", identifier: "https://lifeattiktok.com/search", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Media", group: "Media and Entertainment", majorLocations: ["China"] },
  { id: "co-agoda", category: "company", name: "Agoda", identifier: "https://careersatagoda.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Travel", group: "Travel and Ride Share", majorLocations: ["Singapore"] },
  { id: "co-citadel", category: "company", name: "Citadel", identifier: "https://www.citadel.com/careers/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Quant, Hedge Funds & Crypto", majorLocations: ["United States"] },
  // More quant trading firms — added as placeholders, career sites not yet investigated.
  { id: "co-janestreet", category: "company", name: "Jane Street", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Quant, Hedge Funds & Crypto", majorLocations: ["United States"] },
  // DRW: Greenhouse — the CSP header on drw.com explicitly whitelists boards-api.greenhouse.io,
  // but the board token isn't in the server-rendered HTML (client-fetched); found the real
  // token ("drweng") inside DRW's own Next.js JS bundle. 164 jobs, confirmed 13 Singapore-
  // tagged postings. (DRW also runs a smaller "drwfr" board for Montreal/French postings, not
  // used here.)
  { id: "co-drw", category: "company", name: "DRW", identifier: "drweng", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Quant, Hedge Funds & Crypto", majorLocations: ["United States", "Singapore"] },
  { id: "co-jumptrading", category: "company", name: "Jump Trading", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Quant, Hedge Funds & Crypto", majorLocations: ["United States"] },
  { id: "co-hudsonrivertrading", category: "company", name: "Hudson River Trading", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Quant, Hedge Funds & Crypto", majorLocations: ["United States"] },
  // Optiver: not a recognizable ATS — a custom React site with a genuine public JSON API
  // (www.optiver.com/en/api/v1/jobs) embedded as hydration state in the server-rendered page.
  // Capped at 16 results per query with no working pagination param found, but the `location`
  // filter genuinely scopes server-side — see lib/adapters/html/optiver.ts. Confirmed 6
  // Singapore-tagged postings (fully captured, under the 16-item cap).
  { id: "co-optiver", category: "company", name: "Optiver", identifier: "co-optiver", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "Finance", group: "Quant, Hedge Funds & Crypto", majorLocations: ["Netherlands", "Singapore"] },
  { id: "co-imc", category: "company", name: "IMC Trading", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Quant, Hedge Funds & Crypto", majorLocations: ["Netherlands"] },
  { id: "co-sig", category: "company", name: "Susquehanna International Group", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Quant, Hedge Funds & Crypto", majorLocations: ["United States"] },
  // Uber: the 406 on a bare curl is just strict Accept-header negotiation, not bot-blocking
  // (adding `Accept: text/html` gets a normal 200) — but the resulting page is a client-only
  // SPA with no job data or API endpoint discoverable in the static HTML.
  { id: "co-uber", category: "company", name: "Uber", identifier: "https://www.uber.com/us/en/careers/list/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Travel", group: "Travel and Ride Share", majorLocations: ["United States"] },
  // Apple: the "Workday" references in the page are just copy for Apple's internal HR profile
  // ("This won't be reflected in your Workday profile") — a false positive, not a Workday
  // career site. It's a Next.js-shaped custom app; no server-rendered listing or public API
  // endpoint was found.
  { id: "co-apple", category: "company", name: "Apple", identifier: "https://jobs.apple.com/en-us/search", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Big Tech", group: "Big Tech", majorLocations: ["United States"] },
  // Goldman Sachs: custom Next.js app ("Higher") with an Apollo/GraphQL client — confirmed via
  // `__NEXT_DATA__`, whose `initialApolloState` ships empty, so job data loads entirely
  // client-side after JS boot. Not bot-blocked, just genuinely needs a browser.
  { id: "co-goldmansachs", category: "company", name: "Goldman Sachs", identifier: "https://higher.gs.com/results", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance", majorLocations: ["United States"] },
  // Meta: not bot-blocked, but genuinely needs a real browser — job data only loads via
  // POST /graphql calls carrying session-specific tokens (lsd, __hsi, etc.) generated by
  // Facebook's internal "Comet" framework after full JS boot. Same category as TikTok.
  { id: "co-meta", category: "company", name: "Meta", identifier: "https://www.metacareers.com/jobs", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Big Tech", group: "Big Tech", majorLocations: ["United States"] },
  // PayPal, Visa, ServiceNow, X/Twitter: all return a Cloudflare "Just a moment…" JS challenge
  // to non-browser requests — same enforcement category as Agoda/Citadel/DoorDash/Canva.
  { id: "co-paypal", category: "company", name: "PayPal", identifier: "https://careers.pypl.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Payments & FinTech", majorLocations: ["United States"] },
  { id: "co-visa", category: "company", name: "Visa", identifier: "https://usa.visa.com/careers.html", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance", majorLocations: ["United States"] },
  { id: "co-servicenow", category: "company", name: "Service Now", identifier: "https://careers.servicenow.com/jobs/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Software", group: "Software", majorLocations: ["United States"] },
  { id: "co-twitter", category: "company", name: "X (Twitter)", identifier: "https://careers.x.com/en", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Media", group: "Media and Entertainment", majorLocations: ["United States"] },
  // Tesla: the real jobs endpoint (tesla.com/cua-api/apps/careers/state, found by watching
  // network traffic in a real browser session, where it renders fine) returns Akamai's
  // "Access Denied" page when hit directly — Akamai Bot Manager, confirmed via response body
  // referencing errors.edgesuite.net. Same enforcement category as Agoda/Citadel/Microsoft.
  { id: "co-tesla", category: "company", name: "Tesla", identifier: "https://www.tesla.com/careers/search/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Big Tech", group: "Big Tech", majorLocations: ["United States"] },
  // DoorDash, Canva: both return a Cloudflare "Just a moment…" JS challenge to non-browser
  // requests — same enforcement category as Agoda/Citadel.
  { id: "co-doordash", category: "company", name: "DoorDash", identifier: "https://careersatdoordash.com/job-search/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Travel", group: "Travel and Ride Share", majorLocations: ["United States"] },
  { id: "co-canva", category: "company", name: "Canva", identifier: "https://www.lifeatcanva.com/en/jobs/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Software", group: "Software", majorLocations: ["Australia"] },
  // Lazada: the real job-search backend (aidc-jobs.alibaba.com, Alibaba Group's shared
  // international recruiting platform) loads Alibaba's "Baxia" anti-bot script and requires a
  // getSecurityId token before the job API responds — active bot-mitigation, same policy as
  // Agoda/Citadel/Microsoft/Tesla above.
  { id: "co-lazada", category: "company", name: "Lazada", identifier: "https://www.lazada.com/en/careers/job-search/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "E-Commerce", group: "E-Commerce", majorLocations: ["Singapore"] },
  // Line (LY Corp): not bot-blocked, runs on Gatsby + a Strapi-backed API, but the real job
  // listing endpoint wasn't found in a quick pass (the page-data.json files that are directly
  // fetchable only contain footer/nav content, not the listings) — needs a proper look, not a
  // guess.
  { id: "co-line", category: "company", name: "Line", identifier: "https://careers.linecorp.com/jobs/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Social Media", group: "Social Media", majorLocations: ["Japan"] },

  // --- Consulting: investigated for US + APAC (Singapore/Thailand) coverage specifically.
  // Per instruction, every consulting source ships with enabled:false regardless of whether a
  // working adapter was found — these stay off by default even once "adapter ready", unlike
  // every other group on the page. Subgrouped as: Management Consulting (MBB), Tech Consulting
  // (large-scale IT/digital transformation practices), Big 4 & Professional Services
  // (audit-and-advisory firms whose consulting arms are one part of a much bigger business —
  // not boutiques), and Boutique Consulting (smaller, strategy-focused specialists).
  //
  // McKinsey: the TLS/HTTP2 handshake completes but the server resets the stream
  // ("INTERNAL_ERROR") for a non-browser client, on both HTTP/2 and HTTP/1.1 — TLS/protocol-
  // fingerprint-based bot blocking, same enforcement category as Microsoft.
  { id: "co-mckinsey", category: "company", name: "McKinsey & Company", identifier: "https://www.mckinsey.com/careers/search-jobs", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Consulting", group: "Management Consulting", majorLocations: ["United States"] },
  // Bain: Cloudflare "challenge" mitigation, confirmed via the cf-mitigated response header
  // (not just a generic 403) — same policy as Agoda/Citadel/DoorDash/Canva.
  { id: "co-bain", category: "company", name: "Bain & Company", identifier: "https://www.bain.com/careers/find-a-role/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Consulting", group: "Management Consulting", majorLocations: ["United States"] },
  // BCG: on Phenom People, but unlike Cisco/eBay below, the search-results page embeds the
  // full result set directly as server-rendered JSON (`phApp.ddo = {...}`) — no API-tenant
  // guessing needed. Global listing confirmed to include Singapore, Vietnam, Philippines,
  // Indonesia, and Malaysia postings — see lib/adapters/html/bcg.ts.
  { id: "co-bcg", category: "company", name: "BCG", identifier: "co-bcg", adapterType: "html-scrape", enabled: false, isDefault: true, industry: "Consulting", group: "Management Consulting", majorLocations: ["United States", "Singapore"] },
  // Deloitte: Radancy/TalentBrew (same platform as Two Sigma/Intuit/BlackRock/PwC below) —
  // server-renders its full listing. US-only; other Deloitte member firms run on separate
  // sites not yet investigated — see lib/adapters/html/deloitte.ts.
  { id: "co-deloitte", category: "company", name: "Deloitte", identifier: "co-deloitte", adapterType: "html-scrape", enabled: false, isDefault: true, industry: "Consulting", group: "Tech Consulting", majorLocations: ["United Kingdom"] },
  // Accenture: standard Workday (accenture.wd103.myworkdayjobs.com), confirmed working with
  // real Singapore results via the generic adapter — no bespoke code needed.
  { id: "co-accenture", category: "company", name: "Accenture", identifier: "accenture.wd103.myworkdayjobs.com|AccentureCareers", adapterType: "workday", enabled: false, isDefault: true, industry: "Consulting", group: "Tech Consulting", majorLocations: ["Ireland", "Singapore"] },
  // PwC: like KPMG below, no single global site — merges jobs.us.pwc.com (Radancy, US) with
  // PwC's global Workday tenant (pwc.wd3.myworkdayjobs.com, searched for Singapore/Bangkok
  // rather than pulling all ~4,500 jobs worldwide) — see lib/adapters/html/pwc.ts.
  { id: "co-pwc", category: "company", name: "PwC", identifier: "co-pwc", adapterType: "html-scrape", enabled: false, isDefault: true, industry: "Consulting", group: "Big 4 & Professional Services", majorLocations: ["United Kingdom"] },
  // EY: SAP SuccessFactors' Career Site Builder — server-renders its full listing. Global site
  // lists ~7,300 jobs worldwide; scoped via locationsearch to United States/Singapore/Thailand,
  // all three confirmed with real matching postings — see lib/adapters/html/ey.ts.
  { id: "co-ey", category: "company", name: "EY", identifier: "co-ey", adapterType: "html-scrape", enabled: false, isDefault: true, industry: "Consulting", group: "Big 4 & Professional Services", majorLocations: ["United Kingdom", "Singapore", "Thailand"] },
  // Kearney: Cloudflare challenge (captcha page body, __cf_bm cookie) — same policy as
  // Agoda/Citadel/DoorDash/Canva/Bain above.
  { id: "co-kearney", category: "company", name: "Kearney", identifier: "https://www.kearney.com/careers", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Consulting", group: "Boutique Consulting", majorLocations: ["United States"] },
  // L.E.K. Consulting: runs on Oleeo/TalentLink (lek.tal.net) — individual job pages are
  // gated behind an ALTCHA proof-of-work captcha ("Quick Check Needed... confirm you're a
  // real person"), confirmed via plain curl. Active bot-mitigation, not attempting a bypass.
  { id: "co-lek", category: "company", name: "L.E.K. Consulting", identifier: "https://www.lek.com/careers", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Consulting", group: "Boutique Consulting", majorLocations: ["United States"] },
  // KPMG: no single global site (independent member firms per country) — merges
  // kpmguscareers.com (Radancy, US) with kpmg.com/th/en/careers (Adobe Experience Manager,
  // Thailand postings listed directly as content pages, confirmed via plain curl). Singapore
  // wasn't found on this pass — see lib/adapters/html/kpmg.ts.
  { id: "co-kpmg", category: "company", name: "KPMG", identifier: "co-kpmg", adapterType: "html-scrape", enabled: false, isDefault: true, industry: "Consulting", group: "Big 4 & Professional Services", majorLocations: ["Netherlands", "Thailand"] },

  // --- Private Equity: added as placeholders, career sites not yet investigated. Mix of major
  // US firms and firms with a strong Southeast Asia presence.
  { id: "co-lakeshorecapital", category: "company", name: "Lakeshore Capital", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Private Equity" },
  // Blackstone: active Cloudflare bot-block (cf-mitigated: challenge), not attempted further.
  { id: "co-blackstone", category: "company", name: "Blackstone", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Private Equity", majorLocations: ["United States"] },
  { id: "co-kkr", category: "company", name: "KKR", identifier: "stage", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Private Equity", majorLocations: ["United States", "Singapore"] },
  // Carlyle Group: active Cloudflare bot-block ("Attention Required!" page), not attempted further.
  { id: "co-carlylegroup", category: "company", name: "Carlyle Group", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Private Equity", majorLocations: ["United States"] },
  { id: "co-tpg", category: "company", name: "TPG", identifier: "tpgcareers", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Private Equity", majorLocations: ["United States"] },
  { id: "co-warburgpincus", category: "company", name: "Warburg Pincus", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Private Equity", majorLocations: ["United States"] },
  { id: "co-affinityequity", category: "company", name: "Affinity Equity Partners", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Private Equity", majorLocations: ["Hong Kong"] },
  { id: "co-northstargroup", category: "company", name: "Northstar Group", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Private Equity", majorLocations: ["Singapore"] },
  { id: "co-creador", category: "company", name: "Creador", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Private Equity", majorLocations: ["Malaysia"] },
  { id: "co-naviscapital", category: "company", name: "Navis Capital Partners", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Private Equity", majorLocations: ["Malaysia"] },
];
