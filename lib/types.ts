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
  | "workday"
  | "eightfold"
  | "ashby"
  | "oracle-fusion"
  | "html-scrape"
  | "custom-amazon"
  | "playwright"
  | "unimplemented";

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
