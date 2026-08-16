import * as cheerio from "cheerio";
import type { Adapter } from "../types";
import type { RawJob } from "../../extract";

const US_BASE = "https://jobs.us.pwc.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const US_PAGE_SIZE = 15;

const WORKDAY_HOST = "pwc.wd3.myworkdayjobs.com";
const WORKDAY_TENANT = "pwc";
const WORKDAY_SITE = "Global_Experienced_Careers";
// PwC's global Workday tenant lists ~4,500 jobs across every PwC territory; text-search-scoped
// to the regions this scanner cares about rather than pulling every office worldwide. Plain
// "Thailand"/"United States" as search terms under-match (Workday's free-text search seems to
// weight city names higher) — "Bangkok" and "USA" were confirmed by hand to return far more
// relevant results for the same regions.
const APAC_SEARCH_TERMS = ["Singapore", "Bangkok"];
interface WorkdayJob {
  title: string;
  externalPath: string;
  locationsText?: string;
}

/**
 * PwC operates as independent member firms per country — no single site covers everywhere.
 * This merges the two that were actually investigated:
 * - US (jobs.us.pwc.com): Radancy/TalentBrew career site (same family as Two Sigma/Intuit/
 *   BlackRock/Deloitte) — server-renders its full listing, confirmed via plain curl.
 * - APAC (pwc.wd3.myworkdayjobs.com/Global_Experienced_Careers): PwC's global Workday tenant,
 *   confirmed via plain curl and the public CXS jobs API — scoped to Singapore/Thailand
 *   search terms (see APAC_SEARCH_TERMS) rather than all ~4,500 jobs worldwide.
 */
export const pwcAdapter: Adapter = {
  async fetch() {
    const [us, apac] = await Promise.all([fetchUS(), fetchApac()]);
    return [...us, ...apac];
  },
};

async function fetchUS(): Promise<RawJob[]> {
  const first = await fetchUSPage(1);
  const remainingPages = Math.ceil(first.total / US_PAGE_SIZE) - 1;
  const rest = await Promise.all(
    Array.from({ length: Math.max(remainingPages, 0) }, (_, i) => fetchUSPage(i + 2))
  );
  return [first, ...rest].flatMap((page) => page.jobs);
}

async function fetchUSPage(page: number): Promise<{ jobs: RawJob[]; total: number }> {
  const res = await fetch(`${US_BASE}/search-jobs?p=${page}`, {
    headers: { "User-Agent": UA, Accept: "text/html" },
  });
  if (!res.ok) throw new Error(`PwC US: HTTP ${res.status}`);
  const $ = cheerio.load(await res.text());

  const total = Number($("#search-results").attr("data-total-job-results") ?? 0);
  const jobs: RawJob[] = [];
  $("li.search-results-list__item").each((_, el) => {
    const item = $(el);
    const link = item.find("a.search-results-list__job-link").first();
    const title = link.text().trim();
    const href = link.attr("href");
    const location = item.find(".job-location").first().text().trim();
    if (!title || !href) return;
    jobs.push({ title, location, url: new URL(href, US_BASE).toString(), postedAt: null, description: "" });
  });

  return { jobs, total };
}

async function fetchApac(): Promise<RawJob[]> {
  const results = await Promise.all(APAC_SEARCH_TERMS.map((term) => fetchWorkdaySearch(term)));
  return results.flat();
}

async function fetchWorkdaySearch(searchText: string): Promise<RawJob[]> {
  const first = await fetchWorkdayPage(searchText, 0);
  const remainingPages = Math.ceil(first.total / 20) - 1;
  const rest = await Promise.all(
    Array.from({ length: Math.max(remainingPages, 0) }, (_, i) => fetchWorkdayPage(searchText, (i + 1) * 20))
  );
  return [first, ...rest].flatMap((page) => page.jobs);
}

async function fetchWorkdayPage(searchText: string, offset: number): Promise<{ jobs: RawJob[]; total: number }> {
  const res = await fetch(`https://${WORKDAY_HOST}/wday/cxs/${WORKDAY_TENANT}/${WORKDAY_SITE}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ appliedFacets: {}, limit: 20, offset, searchText }),
  });
  if (!res.ok) throw new Error(`PwC Workday (${searchText}): HTTP ${res.status}`);
  const data = (await res.json()) as { total: number; jobPostings: WorkdayJob[] };

  const jobs: RawJob[] = data.jobPostings.map((job) => ({
    title: job.title,
    location: job.locationsText ?? "",
    url: `https://${WORKDAY_HOST}/${WORKDAY_SITE}${job.externalPath}`,
    postedAt: null,
    description: "",
  }));
  return { jobs, total: data.total };
}
