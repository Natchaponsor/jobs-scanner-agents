import type { ScanSource } from "./types";

/**
 * Default scanning scope. `identifier` is adapter-specific:
 * - greenhouse: board token (boards-api.greenhouse.io/v1/boards/{token}/jobs)
 * - workday: `{host}|{siteSlug}` e.g. `adobe.wd5.myworkdayjobs.com|external_experienced`
 * - custom-amazon: unused, adapter is hardcoded to amazon.jobs
 * - playwright / unimplemented: the company's career site URL, for future adapter wiring
 */
export const DEFAULT_SOURCES: ScanSource[] = [
  // --- Social (not automatable in v1 — see plan/README for why) ---
  { id: "social-linkedin", category: "social", name: "LinkedIn", identifier: "https://www.linkedin.com/jobs/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "any" },
  { id: "social-handshake", category: "social", name: "Handshake", identifier: "https://joinhandshake.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "any" },
  { id: "social-glassdoor", category: "social", name: "Glassdoor", identifier: "https://www.glassdoor.com/Job/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "any" },

  // --- Company sites: confirmed working adapters ---
  { id: "co-airbnb", category: "company", name: "Airbnb", identifier: "airbnb", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Travel" },
  { id: "co-sofi", category: "company", name: "SoFi", identifier: "sofi", adapterType: "greenhouse", enabled: true, isDefault: true, industry: "Finance" },
  { id: "co-adobe", category: "company", name: "Adobe", identifier: "adobe.wd5.myworkdayjobs.com|external_experienced", adapterType: "workday", enabled: true, isDefault: true, industry: "Software" },
  { id: "co-capitalone", category: "company", name: "Capital One", identifier: "capitalone.wd12.myworkdayjobs.com|Capital_One", adapterType: "workday", enabled: true, isDefault: true, industry: "Finance" },
  { id: "co-amazon", category: "company", name: "Amazon and AWS", identifier: "amazon", adapterType: "custom-amazon", enabled: true, isDefault: true, industry: "Tech" },
  // Eightfold endpoint returns an HTML challenge/error page rather than JSON when probed
  // headlessly — likely bot-protected. Adapter is wired up but left disabled until confirmed.
  { id: "co-netflix", category: "company", name: "Netflix", identifier: "netflix.com|explore.jobs.netflix.net", adapterType: "eightfold", enabled: false, isDefault: true, industry: "Media" },

  // --- Company sites: not yet wired up (custom career sites, need per-company Playwright config) ---
  { id: "co-google", category: "company", name: "Google", identifier: "https://careers.google.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech" },
  { id: "co-tiktok", category: "company", name: "TikTok and ByteDance", identifier: "https://careers.tiktok.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech" },
  { id: "co-agoda", category: "company", name: "Agoda", identifier: "https://careersatagoda.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Travel" },
  { id: "co-column", category: "company", name: "Column", identifier: "https://column.com/careers", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance" },
  { id: "co-jpmorgan", category: "company", name: "JP Morgan", identifier: "https://careers.jpmorgan.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance" },
  { id: "co-amex", category: "company", name: "Amex", identifier: "https://careers.americanexpress.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance" },
  { id: "co-microsoft", category: "company", name: "Microsoft", identifier: "https://careers.microsoft.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Tech" },
  { id: "co-twosigma", category: "company", name: "Two Sigma", identifier: "https://careers.twosigma.com/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance" },
  { id: "co-citadel", category: "company", name: "Citadel", identifier: "https://www.citadel.com/careers/", adapterType: "unimplemented", enabled: false, isDefault: true, industry: "Finance" },
];
