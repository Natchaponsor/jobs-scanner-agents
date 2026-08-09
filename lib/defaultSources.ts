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
  { id: "co-sofi", category: "company", name: "SoFi", identifier: "sofi", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Financial Services" },
  { id: "co-adobe", category: "company", name: "Adobe", identifier: "adobe.wd5.myworkdayjobs.com|external_experienced", adapterType: "workday", enabled: true, isDefault: true, industry: "Software", group: "Software" },
  { id: "co-capitalone", category: "company", name: "Capital One", identifier: "capitalone.wd12.myworkdayjobs.com|Capital_One", adapterType: "workday", enabled: true, isDefault: true, industry: "Finance", group: "Financial Services" },
  { id: "co-amazon", category: "company", name: "Amazon and AWS", identifier: "amazon", adapterType: "custom-amazon", enabled: true, isDefault: true, industry: "Tech", group: "Big Tech" },
  { id: "co-column", category: "company", name: "Column", identifier: "column", adapterType: "ashby", enabled: true, isDefault: true, industry: "Finance", group: "Financial Services" },
  { id: "co-google", category: "company", name: "Google", identifier: "co-google", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "Tech", group: "Big Tech" },
  { id: "co-twosigma", category: "company", name: "Two Sigma", identifier: "co-twosigma", adapterType: "html-scrape", enabled: true, isDefault: true, industry: "Finance", group: "Financial Services" },
  { id: "co-jpmorgan", category: "company", name: "JP Morgan", identifier: "jpmc|CX_1001", adapterType: "oracle-fusion", enabled: true, isDefault: true, industry: "Finance", group: "Financial Services" },
  { id: "co-airwallex", category: "company", name: "Air Wallex", identifier: "airwallex", adapterType: "ashby", enabled: true, isDefault: true, industry: "Finance", group: "Financial Services" },
  { id: "co-spotify", category: "company", name: "Spotify", identifier: "spotify", adapterType: "lever", enabled: true, isDefault: true, industry: "Media", group: "Media and Entertainment" },
  { id: "co-ramp", category: "company", name: "Ramp", identifier: "ramp", adapterType: "ashby", enabled: true, isDefault: true, industry: "Finance", group: "Financial Services" },
  { id: "co-stripe", category: "company", name: "Stripe", identifier: "stripe", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Financial Services" },
  { id: "co-adyen", category: "company", name: "Adyen", identifier: "adyen", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Financial Services" },
  { id: "co-chime", category: "company", name: "Chime", identifier: "chime", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Financial Services" },
  { id: "co-binance", category: "company", name: "Binance", identifier: "binance", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Financial Services" },
  { id: "co-robinhood", category: "company", name: "Robinhood", identifier: "robinhood", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance", group: "Financial Services" },
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

  // Eightfold endpoint returns an HTML challenge/error page rather than JSON when probed
  // headlessly — likely bot-protected. Adapter is wired up but left disabled until confirmed.
  { id: "co-netflix", category: "company", name: "Netflix", identifier: "netflix.com|explore.jobs.netflix.net", adapterType: "eightfold", enabled: false, isDefault: true, industry: "Media", group: "Media and Entertainment" },

  // --- Company sites: not implemented — investigated but not confirmed. Big enterprises on
  // custom SPAs or unidentified platforms, quick-probed (SSR check + common Workday/Eightfold
  // guesses) rather than deep-dived one at a time like the earlier bot-mitigated batch.
  { id: "co-amex", category: "company", name: "Amex", identifier: "https://careers.americanexpress.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Financial Services" },
  { id: "co-microsoft", category: "company", name: "Microsoft", identifier: "https://careers.microsoft.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Big Tech" },
  { id: "co-tiktok", category: "company", name: "TikTok and ByteDance", identifier: "https://lifeattiktok.com/search", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Media and Entertainment" },
  { id: "co-agoda", category: "company", name: "Agoda", identifier: "https://careersatagoda.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Travel", group: "Travel and Ride Share" },
  { id: "co-citadel", category: "company", name: "Citadel", identifier: "https://www.citadel.com/careers/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Financial Services" },
  { id: "co-bofa", category: "company", name: "Bank of America", identifier: "https://careers.bankofamerica.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Financial Services" },
  { id: "co-cisco", category: "company", name: "Cisco", identifier: "https://jobs.cisco.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Software" },
  { id: "co-uber", category: "company", name: "Uber", identifier: "https://www.uber.com/us/en/careers/list/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Travel and Ride Share" },
  { id: "co-nvidia", category: "company", name: "NVIDIA", identifier: "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Big Tech" },
  { id: "co-apple", category: "company", name: "Apple", identifier: "https://jobs.apple.com/en-us/search", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Big Tech" },
  { id: "co-intuit", category: "company", name: "Intuit", identifier: "https://jobs.intuit.com/search-jobs", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Financial Services" },
  { id: "co-hsbc", category: "company", name: "HSBC", identifier: "https://mycareer.hsbc.com/en_GB/external", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Financial Services" },
  { id: "co-goldmansachs", category: "company", name: "Goldman Sachs", identifier: "https://higher.gs.com/results", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Financial Services" },
  // Meta: not bot-blocked, but genuinely needs a real browser — job data only loads via
  // POST /graphql calls carrying session-specific tokens (lsd, __hsi, etc.) generated by
  // Facebook's internal "Comet" framework after full JS boot. Same category as TikTok.
  { id: "co-meta", category: "company", name: "Meta", identifier: "https://www.metacareers.com/jobs", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Big Tech" },
  { id: "co-blackrock", category: "company", name: "Blackrock", identifier: "https://careers.blackrock.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Financial Services" },
  { id: "co-paypal", category: "company", name: "PayPal", identifier: "https://careers.pypl.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Financial Services" },
  { id: "co-visa", category: "company", name: "Visa", identifier: "https://usa.visa.com/careers/search-careers.html", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance", group: "Financial Services" },
  { id: "co-servicenow", category: "company", name: "Service Now", identifier: "https://careers.servicenow.com/jobs/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Software" },
  { id: "co-expedia", category: "company", name: "Expedia", identifier: "https://careers.expediagroup.com/jobs/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Travel", group: "Travel and Ride Share" },
  { id: "co-ebay", category: "company", name: "Ebay", identifier: "https://jobs.ebaycareers.com/global/en/search-results", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "E-Commerce" },
  { id: "co-twitter", category: "company", name: "X (Twitter)", identifier: "https://careers.x.com/en", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Media", group: "Media and Entertainment" },
  // Tesla: the real jobs endpoint (tesla.com/cua-api/apps/careers/state, found by watching
  // network traffic in a real browser session, where it renders fine) returns Akamai's
  // "Access Denied" page when hit directly — Akamai Bot Manager, confirmed via response body
  // referencing errors.edgesuite.net. Same enforcement category as Agoda/Citadel/Microsoft.
  { id: "co-tesla", category: "company", name: "Tesla", identifier: "https://www.tesla.com/careers/search/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Big Tech" },
  // DoorDash, Canva: both return a Cloudflare "Just a moment…" JS challenge to non-browser
  // requests — same enforcement category as Agoda/Citadel.
  { id: "co-doordash", category: "company", name: "DoorDash", identifier: "https://careersatdoordash.com/job-search/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Travel and Ride Share" },
  { id: "co-canva", category: "company", name: "Canva", identifier: "https://www.lifeatcanva.com/en/jobs/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Software", group: "Software" },
  // Line (LY Corp): not bot-blocked, runs on Gatsby + a Strapi-backed API, but the real job
  // listing endpoint wasn't found in a quick pass (the page-data.json files that are directly
  // fetchable only contain footer/nav content, not the listings) — needs a proper look, not a
  // guess.
  { id: "co-line", category: "company", name: "Line", identifier: "https://careers.linecorp.com/jobs/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech", group: "Social Media" },
];
