export type JobType = "FT" | "PT" | "Internship";
export type WorkMode = "in-person" | "hybrid" | "remote" | "not-specified";
export type YoeBucket = "0-3" | "3-5" | "5-10" | "10+" | "not-specified";
export interface Job {
  /** Stable id: `${sourceName}::${url}` */
  id: string;
  sourceType: "company" | "social";
  sourceName: string;
  roleTitle: string;
  function: string;
  locationCountry: string;
  locationState: string;
  locationCity: string;
  /** Original, unparsed location text from the source — used as a display fallback when
   *  the string was too messy (multi-location lists, ATS codes) to parse a clean city. */
  locationRaw: string;
  yearsExperience: YoeBucket;
  jobType: JobType;
  workMode: WorkMode;
  industry: string;
  url: string;
  discoveredAt: string;
  saved: boolean;
  applied: boolean;
  appliedAt: string | null;
}

export type AdapterType =
  | "greenhouse"
  | "lever"
  | "workday"
  | "eightfold"
  | "ashby"
  | "oracle-fusion"
  | "html-scrape"
  | "custom-amazon"
  | "custom-shopee"
  | "playwright"
  | "unimplemented";

/** Adapter types with real, working `fetch` logic — used to gate which toggles are
 *  interactive and which sources a group's master toggle affects. */
export const WORKING_ADAPTER_TYPES: AdapterType[] = [
  "greenhouse",
  "lever",
  "workday",
  "eightfold",
  "ashby",
  "oracle-fusion",
  "html-scrape",
  "custom-amazon",
  "custom-shopee",
];

/** Curated groupings for the /sources settings page (distinct from `industry`, which is
 *  job-level metadata used by the dashboard's industry filter). Lets a company sit in a
 *  named set like "Big Tech" regardless of its literal industry. `null` for social sources,
 *  which aren't grouped. Each group nests under one `BigCategory` — see
 *  GROUPS_BY_BIG_CATEGORY in app/sources/page.tsx for that mapping. */
export type SourceGroup =
  | "Banks & Traditional Finance"
  | "Payments & FinTech"
  | "Quant, Hedge Funds & Crypto"
  | "Media and Entertainment"
  | "AI"
  | "E-Commerce"
  | "Big Tech"
  | "Travel and Ride Share"
  | "Software"
  | "Social Media"
  | "Management Consulting"
  | "Tech Consulting"
  | "Big 4 & Professional Services"
  | "Boutique Consulting"
  | "Etc";

/** Top-level umbrella shown on the /sources page above its groups. */
export type BigCategory = "FinTech" | "Tech" | "Consulting";

export interface ScanSource {
  id: string;
  category: "social" | "company";
  name: string;
  /** Adapter-specific identifier, e.g. Greenhouse board token, Workday tenant/site, or a URL. */
  identifier: string;
  adapterType: AdapterType;
  enabled: boolean;
  isDefault: boolean;
  industry: string;
  group: SourceGroup | null;
}

export interface ScanRun {
  id: string;
  startedAt: string;
  finishedAt: string;
  sourcesScanned: number;
  jobsFound: number;
  jobsNew: number;
  errors: { sourceName: string; message: string }[];
}

export interface Filters {
  locationCountry: string;
  locationCity: string;
  function: string;
  yearsExperience: YoeBucket | "any";
  jobType: JobType | "any";
  workMode: WorkMode | "any";
  industry: string;
  search: string;
}
