import { classifyLocation } from "./locations";
import type { Job, JobType, ScanSource, WorkMode, YoeBucket } from "./types";

/** What an adapter hands back before normalization. Fields it can't determine are left undefined
 *  and filled in here via rule-based extraction from title/description text. */
export interface RawJob {
  title: string;
  location: string;
  url: string;
  postedAt: string | null;
  description: string;
  workMode?: WorkMode;
  jobType?: JobType;
  /** Set when the source exposes an explicit seniority tag (e.g. Google's "Mid"/"Senior"
   *  labels) — takes priority over the regex-based guess, which stays generic/global. */
  yearsExperience?: YoeBucket;
}

export const FUNCTION_LABELS = [
  "Product Manager",
  "Software Engineer",
  "Data Scientist",
  "Data Analyst",
  "Data Engineer",
  "Design",
  "Marketing",
  "Sales",
  "Finance",
  "HR / Recruiting",
  "Operations",
  "Research",
  "Legal",
  "Other",
];

const FUNCTION_KEYWORDS: [RegExp, string][] = [
  [/product\s*manager|product\s*management/i, "Product Manager"],
  [/software\s*engineer|swe\b|backend|frontend|full[\s-]?stack/i, "Software Engineer"],
  [/data\s*scientist/i, "Data Scientist"],
  [/data\s*analyst/i, "Data Analyst"],
  [/data\s*engineer/i, "Data Engineer"],
  [/designer|ux\b|ui\/ux/i, "Design"],
  [/marketing/i, "Marketing"],
  [/sales\b|account\s*executive/i, "Sales"],
  [/finance|financial\s*analyst|accounting/i, "Finance"],
  [/recruit|talent\s*acquisition|hr\b|human\s*resources/i, "HR / Recruiting"],
  [/operations|program\s*manager|project\s*manager/i, "Operations"],
  [/research(?!ed)/i, "Research"],
  [/legal|counsel/i, "Legal"],
];

const YOE_PATTERNS: [RegExp, YoeBucket][] = [
  [/\b1[0-9]\+?\s*years?/i, "10+"],
  [/\b(10)\+?\s*years?/i, "10+"],
  [/\b(5|6|7|8|9)\+?\s*years?/i, "5-10"],
  [/\b(3|4)\+?\s*years?/i, "3-5"],
  [/\b(0|1|2)\+?\s*years?/i, "0-3"],
  [/senior|staff|principal|lead\b/i, "5-10"],
  [/entry[\s-]?level|new\s*grad|early\s*career|associate\b/i, "0-3"],
  [/intern\b/i, "0-3"],
];

function bucketFromRange(min: number, max: number): YoeBucket {
  const mid = (min + max) / 2;
  if (mid < 3) return "0-3";
  if (mid < 5) return "3-5";
  if (mid < 10) return "5-10";
  return "10+";
}

export function extractYearsExperience(text: string): YoeBucket {
  const rangeMatch = text.match(/\b(\d{1,2})\s*-\s*(\d{1,2})\s*\+?\s*years?/i);
  if (rangeMatch) {
    return bucketFromRange(Number(rangeMatch[1]), Number(rangeMatch[2]));
  }
  for (const [pattern, bucket] of YOE_PATTERNS) {
    if (pattern.test(text)) return bucket;
  }
  return "not-specified";
}

export function extractFunction(title: string, fallback: string): string {
  for (const [pattern, label] of FUNCTION_KEYWORDS) {
    if (pattern.test(title)) return label;
  }
  return fallback;
}

export function extractWorkMode(text: string): WorkMode {
  if (/remote/i.test(text)) return "remote";
  if (/hybrid/i.test(text)) return "hybrid";
  if (/on[\s-]?site|in[\s-]?person|in[\s-]?office/i.test(text)) return "in-person";
  return "not-specified";
}

export function extractJobType(title: string): JobType {
  if (/intern(ship)?/i.test(title)) return "Internship";
  if (/part[\s-]?time/i.test(title)) return "PT";
  return "FT";
}

export function normalize(raw: RawJob, source: ScanSource): Job {
  const { country, state, city } = classifyLocation(raw.location);
  const text = `${raw.title} ${raw.description}`;
  return {
    id: `${source.name}::${raw.url}`,
    sourceType: source.category,
    sourceName: source.name,
    roleTitle: raw.title,
    function: extractFunction(raw.title, "Other"),
    locationCountry: country,
    locationState: state,
    locationCity: city,
    locationRaw: raw.location.trim(),
    yearsExperience: raw.yearsExperience ?? extractYearsExperience(text),
    jobType: raw.jobType ?? extractJobType(raw.title),
    workMode: raw.workMode ?? extractWorkMode(text),
    industry: source.industry,
    url: raw.url,
    discoveredAt: raw.postedAt ?? new Date().toISOString(),
    saved: false,
    applied: false,
    appliedAt: null,
  };
}
