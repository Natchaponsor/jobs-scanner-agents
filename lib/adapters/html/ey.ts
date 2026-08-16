import * as cheerio from "cheerio";
import type { Adapter } from "../types";
import type { RawJob } from "../../extract";

const BASE = "https://careers.ey.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const PAGE_SIZE = 25;
// EY's global SuccessFactors site lists ~7,300 jobs worldwide (max startrow seen: 7275) —
// scoped via locationsearch to the regions this scanner cares about instead of paginating
// through every EY office on the planet.
const REGIONS = ["United States", "Singapore", "Thailand"];

/**
 * careers.ey.com runs on SAP SuccessFactors' Career Site Builder — server-renders its full
 * listing, confirmed via plain curl. `locationsearch` genuinely filters (confirmed real
 * Singapore- and Thailand-tagged postings), unlike the free-text `q` search on some of the
 * other consulting firms' sites.
 */
export const eyAdapter: Adapter = {
  async fetch() {
    const results = await Promise.all(REGIONS.map((region) => fetchRegion(region)));
    return results.flat();
  },
};

async function fetchRegion(region: string): Promise<RawJob[]> {
  const first = await fetchPage(region, 0);
  const remainingPages = Math.ceil(first.total / PAGE_SIZE) - 1;
  const rest = await Promise.all(
    Array.from({ length: Math.max(remainingPages, 0) }, (_, i) => fetchPage(region, (i + 1) * PAGE_SIZE))
  );
  return [first, ...rest].flatMap((page) => page.jobs);
}

async function fetchPage(region: string, startrow: number): Promise<{ jobs: RawJob[]; total: number }> {
  const url = `${BASE}/ey/search/?q=&locationsearch=${encodeURIComponent(region)}${startrow ? `&startrow=${startrow}` : ""}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error(`EY (${region}): HTTP ${res.status}`);
  const $ = cheerio.load(await res.text());

  const jobs: RawJob[] = [];
  $("tr.data-row").each((_, el) => {
    const row = $(el);
    const link = row.find("a.jobTitle-link").first();
    const title = link.text().trim();
    const href = link.attr("href");
    const location = row.find(".jobLocation").first().text().trim();
    if (!title || !href) return;
    jobs.push({ title, location, url: new URL(href, BASE).toString(), postedAt: null, description: "" });
  });

  // No explicit result-count element on this template — the highest `startrow` value in the
  // pagination controls is a reliable proxy (this page always renders a link to the last page).
  const maxStartRow = Math.max(
    0,
    ...$('a[href*="startrow="]')
      .map((__, a) => Number(new URL($(a).attr("href") ?? "", BASE).searchParams.get("startrow") ?? 0))
      .get()
  );
  return { jobs, total: maxStartRow + PAGE_SIZE };
}
