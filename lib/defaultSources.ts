import type { ScanSource } from "./types";

/**
 * Default scanning scope. `identifier` is adapter-specific:
 * - greenhouse: board token (boards-api.greenhouse.io/v1/boards/{token}/jobs)
 * - lever: board token (api.lever.co/v0/postings/{token})
 * - workday: `{host}|{siteSlug}` e.g. `adobe.wd5.myworkdayjobs.com|external_experienced`
 * - ashby: board name (api.ashbyhq.com/posting-api/job-board/{board})
 * - oracle-fusion: `{tenant}|{siteNumber}` e.g. `jpmc|CX_1001`
 * - html-scrape: unused here — dispatched by source.id, see lib/adapters/html/index.ts
 * - custom-amazon: unused, adapter is hardcoded to amazon.jobs
 * - unimplemented: the company's career site URL, kept for reference / future wiring
 *
 * `group` organizes the /sources settings page (see SourceGroup in lib/types.ts) — distinct
 * from `industry`, which is job-level metadata for the dashboard's industry filter.
 */
export const DEFAULT_SOURCES: ScanSource[] = [
  // --- Social (not automatable in v1 — see README for why) ---
  { id: "social-linkedin", category: "social", name: "LinkedIn", identifier: "https://www.linkedin.com/jobs/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "any", group: null },
  { id: "social-handshake", category: "social", name: "Handshake", identifier: "https://joinhandshake.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "any", group: null },
  { id: "social-glassdoor", category: "social", name: "Glassdoor", identifier: "https://www.glassdoor.com/Job/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "any", group: null },

  // --- Company sites: confirmed working adapters ---
  { id: "co-airbnb", category: "company", name: "Airbnb", identifier: "airbnb", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Travel", group: "Travel and Ride Share" },
  { id: "co-sofi", category: "company", name: "SoFi", identifier: "sofi", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech" },
  { id: "co-adobe", category: "company", name: "Adobe", identifier: "adobe.wd5.myworkdayjobs.com|external_experienced", adapterType: "workday", enabled: true, isDefault: true, industry: "Software", group: "Software" },
  { id: "co-capitalone", category: "company", name: "Capital One", identifier: "capitalone.wd12.myworkdayjobs.com|Capital_One", adapterType: "workday", enabled: true, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance" },
  { id: "co-amazon", category: "company", name: "Amazon and AWS", identifier: "amazon", adapterType: "custom-amazon", enabled: true, isDefault: true, industry: "Tech", group: "Big Tech" },
  { id: "co-column", category: "company", name: "Column", identifier: "column", adapterType: "ashby", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech" },
  { id: "co-google", category: "company", name: "Google", identifier: "co-google", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "Tech", group: "Big Tech" },
  { id: "co-twosigma", category: "company", name: "Two Sigma", identifier: "co-twosigma", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "Finance", group: "Quant, Hedge Funds & Crypto" },
  { id: "co-jpmorgan", category: "company", name: "JP Morgan", identifier: "jpmc|CX_1001", adapterType: "oracle-fusion", enabled: true, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance" },
  { id: "co-airwallex", category: "company", name: "Air Wallex", identifier: "airwallex", adapterType: "ashby", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech" },
  { id: "co-spotify", category: "company", name: "Spotify", identifier: "spotify", adapterType: "lever", enabled: true, isDefault: true, industry: "Media", group: "Media and Entertainment" },
  { id: "co-ramp", category: "company", name: "Ramp", identifier: "ramp", adapterType: "ashby", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech" },
  { id: "co-stripe", category: "company", name: "Stripe", identifier: "stripe", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech" },
  { id: "co-adyen", category: "company", name: "Adyen", identifier: "adyen", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech" },
  { id: "co-chime", category: "company", name: "Chime", identifier: "chime", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech" },
  { id: "co-binance", category: "company", name: "Binance", identifier: "binance", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Quant, Hedge Funds & Crypto" },
  { id: "co-robinhood", category: "company", name: "Robinhood", identifier: "robinhood", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Payments & FinTech" },
  { id: "co-openai", category: "company", name: "OpenAI", identifier: "openai", adapterType: "ashby", enabled: true, isDefault: true, industry: "AI", group: "AI" },
  { id: "co-anthropic", category: "company", name: "Anthropic", identifier: "anthropic", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "AI", group: "AI" },
  { id: "co-handshake-co", category: "company", name: "Handshake", identifier: "handshake", adapterType: "ashby", enabled: true, isDefault: true, industry: "Tech", group: "Social Media" },
  { id: "co-mercor", category: "company", name: "Mercor", identifier: "mercor", adapterType: "ashby", enabled: true, isDefault: true, industry: "AI", group: "AI" },
  { id: "co-lyft", category: "company", name: "Lyft", identifier: "lyft", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Travel", group: "Travel and Ride Share" },
  { id: "co-figma", category: "company", name: "Figma", identifier: "figma", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Software", group: "Software" },
  { id: "co-datadog", category: "company", name: "Datadog", identifier: "datadog", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Software", group: "Software" },
  { id: "co-quince", category: "company", name: "Quince", identifier: "quince", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Tech", group: "E-Commerce" },
  // LinkedIn's own careers page (Greenhouse) — separate from the "LinkedIn" social source
  // above, which represents scanning LinkedIn-the-job-board-platform (not automatable).
  { id: "co-linkedin", category: "company", name: "LinkedIn", identifier: "linkedin", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Tech", group: "Social Media" },
  { id: "co-expedia", category: "company", name: "Expedia", identifier: "expedia.wd108.myworkdayjobs.com|search", adapterType: "workday", enabled: true, isDefault: true, industry: "Travel", group: "Travel and Ride Share" },
  { id: "co-nvidia", category: "company", name: "NVIDIA", identifier: "nvidia.wd5.myworkdayjobs.com|NVIDIAExternalCareerSite", adapterType: "workday", enabled: true, isDefault: true, industry: "Tech", group: "Big Tech" },
  { id: "co-bofa", category: "company", name: "Bank of America", identifier: "ghr.wd1.myworkdayjobs.com|lateral-us", adapterType: "workday", enabled: true, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance" },
  { id: "co-intuit", category: "company", name: "Intuit", identifier: "co-intuit", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance" },
  { id: "co-blackrock", category: "company", name: "Blackrock", identifier: "co-blackrock", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance" },
  // Sea Group's own recruiting API (ats.workatsea.com), scoped to Thailand — see lib/adapters/shopee.ts.
  { id: "co-shopee", category: "company", name: "Shopee", identifier: "shopee", adapterType: "custom-shopee", enabled: true, isDefault: true, industry: "Tech", group: "E-Commerce" },
  // careers.lmwn.com server-renders its listing — see lib/adapters/html/linemanwongnai.ts.
  { id: "co-linemanwongnai", category: "company", name: "LINE MAN Wongnai", identifier: "co-linemanwongnai", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "Tech", group: "Travel and Ride Share" },

  // Eightfold endpoint returns an HTML challenge/error page rather than JSON when probed
  // headlessly — likely bot-protected. Adapter is wired up but left disabled until confirmed.
  { id: "co-netflix", category: "company", name: "Netflix", identifier: "netflix.com|explore.jobs.netflix.net", adapterType: "eightfold", enabled: false, isDefault: true, industry: "Media", group: "Media and Entertainment" },

  // --- Company sites: not implemented — investigated but not confirmed. Big enterprises on
  // custom SPAs or unidentified platforms, quick-probed (SSR check + common Workday/Eightfold
  // guesses) rather than deep-dived one at a time like the earlier bot-mitigated batch.
  { id: "co-amex", category: "company", name: "Amex", identifier: "https://careers.americanexpress.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance" },
  { id: "co-microsoft", category: "company", name: "Microsoft", identifier: "https://careers.microsoft.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Big Tech" },
  { id: "co-tiktok", category: "company", name: "TikTok and ByteDance", identifier: "https://lifeattiktok.com/search", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Media and Entertainment" },
  { id: "co-agoda", category: "company", name: "Agoda", identifier: "https://careersatagoda.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Travel", group: "Travel and Ride Share" },
  { id: "co-citadel", category: "company", name: "Citadel", identifier: "https://www.citadel.com/careers/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Quant, Hedge Funds & Crypto" },
  // Cisco: on Phenom People (cdn.phenompeople.com) — the same platform as eBay below. Its
  // /api/apply/v2/jobs endpoint is real and public, but every "org" tenant-id guess derived
  // from the CDN asset path ("CISCISGLOBAL") returns "Tenant not identified"; the correct
  // param name/value wasn't found without capturing live network traffic against this
  // specific tenant.
  { id: "co-cisco", category: "company", name: "Cisco", identifier: "https://jobs.cisco.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Software" },
  // Uber: the 406 on a bare curl is just strict Accept-header negotiation, not bot-blocking
  // (adding `Accept: text/html` gets a normal 200) — but the resulting page is a client-only
  // SPA with no job data or API endpoint discoverable in the static HTML.
  { id: "co-uber", category: "company", name: "Uber", identifier: "https://www.uber.com/us/en/careers/list/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Travel and Ride Share" },
  // Apple: the "Workday" references in the page are just copy for Apple's internal HR profile
  // ("This won't be reflected in your Workday profile") — a false positive, not a Workday
  // career site. It's a Next.js-shaped custom app; no server-rendered listing or public API
  // endpoint was found.
  { id: "co-apple", category: "company", name: "Apple", identifier: "https://jobs.apple.com/en-us/search", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Big Tech" },
  // HSBC: runs on Avature (`avature.wizard` config in the page) — a new ATS family for this
  // project. The search page is a form/wizard shell; the actual results URL convention wasn't
  // found without driving the wizard in a real browser.
  { id: "co-hsbc", category: "company", name: "HSBC", identifier: "https://mycareer.hsbc.com/en_GB/external", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance" },
  // Goldman Sachs: custom Next.js app ("Higher") with an Apollo/GraphQL client — confirmed via
  // `__NEXT_DATA__`, whose `initialApolloState` ships empty, so job data loads entirely
  // client-side after JS boot. Not bot-blocked, just genuinely needs a browser.
  { id: "co-goldmansachs", category: "company", name: "Goldman Sachs", identifier: "https://higher.gs.com/results", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance" },
  // Meta: not bot-blocked, but genuinely needs a real browser — job data only loads via
  // POST /graphql calls carrying session-specific tokens (lsd, __hsi, etc.) generated by
  // Facebook's internal "Comet" framework after full JS boot. Same category as TikTok.
  { id: "co-meta", category: "company", name: "Meta", identifier: "https://www.metacareers.com/jobs", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Big Tech" },
  // PayPal, Visa, ServiceNow, X/Twitter: all return a Cloudflare "Just a moment…" JS challenge
  // to non-browser requests — same enforcement category as Agoda/Citadel/DoorDash/Canva.
  { id: "co-paypal", category: "company", name: "PayPal", identifier: "https://careers.pypl.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Payments & FinTech" },
  { id: "co-visa", category: "company", name: "Visa", identifier: "https://usa.visa.com/careers.html", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Banks & Traditional Finance" },
  { id: "co-servicenow", category: "company", name: "Service Now", identifier: "https://careers.servicenow.com/jobs/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Software" },
  { id: "co-twitter", category: "company", name: "X (Twitter)", identifier: "https://careers.x.com/en", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Media", group: "Media and Entertainment" },
  // eBay: moved domains (jobs.ebaycareers.com now 301s here) — also on Phenom People, same
  // platform as Cisco above, and hits the same "Tenant not identified" wall on the guessed
  // /api/apply/v2/jobs params. Per-location pages (e.g. /us/en/jobs-in-california) DO
  // server-render real listings, confirmed via plain curl — but there's no single unified
  // "all jobs" feed, only ~30 separate per-location pages, each needing its own pagination.
  { id: "co-ebay", category: "company", name: "Ebay", identifier: "https://jobs.ebayinc.com/us/en/jobs-by-location", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "E-Commerce" },
  // Tesla: the real jobs endpoint (tesla.com/cua-api/apps/careers/state, found by watching
  // network traffic in a real browser session, where it renders fine) returns Akamai's
  // "Access Denied" page when hit directly — Akamai Bot Manager, confirmed via response body
  // referencing errors.edgesuite.net. Same enforcement category as Agoda/Citadel/Microsoft.
  { id: "co-tesla", category: "company", name: "Tesla", identifier: "https://www.tesla.com/careers/search/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Big Tech" },
  // DoorDash, Canva: both return a Cloudflare "Just a moment…" JS challenge to non-browser
  // requests — same enforcement category as Agoda/Citadel.
  { id: "co-doordash", category: "company", name: "DoorDash", identifier: "https://careersatdoordash.com/job-search/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Travel and Ride Share" },
  { id: "co-canva", category: "company", name: "Canva", identifier: "https://www.lifeatcanva.com/en/jobs/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Software", group: "Software" },
  // Lazada: the real job-search backend (aidc-jobs.alibaba.com, Alibaba Group's shared
  // international recruiting platform) loads Alibaba's "Baxia" anti-bot script and requires a
  // getSecurityId token before the job API responds — active bot-mitigation, same policy as
  // Agoda/Citadel/Microsoft/Tesla above.
  { id: "co-lazada", category: "company", name: "Lazada", identifier: "https://www.lazada.com/en/careers/job-search/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "E-Commerce" },
  // Line (LY Corp): not bot-blocked, runs on Gatsby + a Strapi-backed API, but the real job
  // listing endpoint wasn't found in a quick pass (the page-data.json files that are directly
  // fetchable only contain footer/nav content, not the listings) — needs a proper look, not a
  // guess.
  { id: "co-line", category: "company", name: "Line", identifier: "https://careers.linecorp.com/jobs/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Social Media" },

  // --- Consulting: added as placeholders, career sites not yet investigated. Identifier is a
  // literal "not yet investigated" marker, not a real URL, until someone actually looks these up.
  // Subgrouped as: Management Consulting (MBB), Tech Consulting (large-scale IT/digital
  // transformation practices), Big 4 & Professional Services (audit-and-advisory firms whose
  // consulting arms are one part of a much bigger business — not boutiques), and Boutique
  // Consulting (smaller, strategy-focused specialists).
  { id: "co-mckinsey", category: "company", name: "McKinsey & Company", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Consulting", group: "Management Consulting" },
  { id: "co-bain", category: "company", name: "Bain & Company", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Consulting", group: "Management Consulting" },
  { id: "co-bcg", category: "company", name: "BCG", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Consulting", group: "Management Consulting" },
  { id: "co-deloitte", category: "company", name: "Deloitte", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Consulting", group: "Tech Consulting" },
  { id: "co-accenture", category: "company", name: "Accenture", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Consulting", group: "Tech Consulting" },
  { id: "co-pwc", category: "company", name: "PwC", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Consulting", group: "Big 4 & Professional Services" },
  { id: "co-ey", category: "company", name: "EY", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Consulting", group: "Big 4 & Professional Services" },
  { id: "co-kearney", category: "company", name: "Kearney", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Consulting", group: "Boutique Consulting" },
  { id: "co-lek", category: "company", name: "L.E.K. Consulting", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Consulting", group: "Boutique Consulting" },
  { id: "co-kpmg", category: "company", name: "KPMG", identifier: "not yet investigated", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Consulting", group: "Big 4 & Professional Services" },
];
