import { classifyLocation } from "./locations";
import type { Job, JobType, ScanSource, WorkAuthorization, WorkMode, YoeBucket } from "./types";

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
  "Program Manager",
  "Engineering Management",
  "Business Operations Manager",
  "Software Engineer",
  "Data Scientist",
  "Data Analyst",
  "Data Engineer",
  "Design",
  "Marketing",
  "Customer Success",
  "Sales",
  "Business Development",
  "Finance",
  "HR / Recruiting",
  "Consulting",
  "Supply Chain / Logistics",
  "Strategy",
  "Operations",
  "Research",
  "Legal",
  "Other",
];

// Ordered most- to least-specific: extractFunction returns on the first match, so a title like
// "Engineering Manager, Backend" needs to hit Engineering Management before the broader
// Software Engineer pattern would otherwise claim it via "backend".
const FUNCTION_KEYWORDS: [RegExp, string][] = [
  [/product\s*manager|product\s*management/i, "Product Manager"],
  [/program\s*manager|program\s*management|project\s*manager|project\s*management/i, "Program Manager"],
  [/engineering\s*manager|engineering\s*management/i, "Engineering Management"],
  [/business\s*operations|biz\s*ops|revenue\s*operations|revops|sales\s*operations|salesops|operations\s*manager/i, "Business Operations Manager"],
  [/software\s*engineer|swe\b|backend|frontend|full[\s-]?stack/i, "Software Engineer"],
  [/data\s*scientist/i, "Data Scientist"],
  [/data\s*analyst/i, "Data Analyst"],
  [/data\s*engineer/i, "Data Engineer"],
  [/designer|ux\b|ui\/ux/i, "Design"],
  [/marketing/i, "Marketing"],
  [/customer\s*success|customer\s*support|client\s*success/i, "Customer Success"],
  [/sales\b|account\s*executive/i, "Sales"],
  [/business\s*development|bizdev/i, "Business Development"],
  [/finance|financial\s*analyst|accounting/i, "Finance"],
  [/recruit|talent\s*acquisition|hr\b|human\s*resources/i, "HR / Recruiting"],
  [/consulting|consultant/i, "Consulting"],
  [/supply\s*chain|logistics/i, "Supply Chain / Logistics"],
  [/\bstrategy\b|strategic\s*planning/i, "Strategy"],
  [/operations/i, "Operations"],
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

// Checked before SPONSORSHIP_AVAILABLE_PATTERN below, and deliberately broad on "security
// clearance" — a posting that mentions it at all overwhelmingly means it's required. The
// trailing clause is a proximity match for negated sponsorship ("unable to sponsor", "not
// able to offer visa sponsorship") rather than true negation parsing — regex can't fully
// cover natural-language phrasing variety, but this catches the common real forms.
const US_CITIZEN_ONLY_PATTERN =
  /must\s*be\s*a\s*(?:u\.?s\.?|united\s*states)\s*citizen|u\.?s\.?\s*citizenship\s*(?:is\s*)?required|security\s*clearance|(?:^|\W)(?:no|not|unable\s*to|cannot|can['’]?t|won['’]?t|will\s*not|does\s*not)\b[^.]{0,30}sponsor/i;
const SPONSORSHIP_AVAILABLE_PATTERN =
  /visa\s*sponsorship|sponsor(?:s|ship)?\s*(?:work\s*)?visas?|sponsor\s*work\s*authorization|h-?1b\s*sponsorship|we\s*(?:will\s*|do\s*|can\s*|are\s*happy\s*to\s*)?sponsor\b/i;

/** Only meaningful for US postings — "US citizen only" / "we sponsor visas" is a US hiring
 *  convention, so every other country's jobs are left "n/a" rather than guessed at. Within US
 *  postings, defaults to "n/a" too when the posting simply doesn't mention it (most don't). */
export function extractWorkAuthorization(text: string, country: string): WorkAuthorization {
  if (country !== "United States") return "n/a";
  if (US_CITIZEN_ONLY_PATTERN.test(text)) return "US Citizen Only";
  if (SPONSORSHIP_AVAILABLE_PATTERN.test(text)) return "Sponsorship Available";
  return "n/a";
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
    workAuthorization: extractWorkAuthorization(text, country),
    industry: source.industry,
    url: raw.url,
    discoveredAt: raw.postedAt ?? new Date().toISOString(),
    saved: false,
    applied: false,
    appliedAt: null,
  };
}
