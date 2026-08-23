import * as cheerio from "cheerio";
import type { RawJob } from "../../extract";

/**
 * Shared fetch/parse logic for SAP SuccessFactors Career Site Builder sites — confirmed on
 * both EY (careers.ey.com) and SAP itself (jobs.sap.com), same `tr.data-row` template.
 * Server-renders its full paginated listing, confirmed via plain curl.
 */

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const PAGE_SIZE = 25;

export async function fetchSuccessFactorsRegion(
  companyLabel: string,
  searchUrl: string,
  region: string
): Promise<RawJob[]> {
  const first = await fetchPage(companyLabel, searchUrl, region, 0);
  const remainingPages = Math.ceil(first.total / PAGE_SIZE) - 1;
  const rest = await Promise.all(
    Array.from({ length: Math.max(remainingPages, 0) }, (_, i) => fetchPage(companyLabel, searchUrl, region, (i + 1) * PAGE_SIZE))
  );
  return [first, ...rest].flatMap((page) => page.jobs);
}

async function fetchPage(companyLabel: string, searchUrl: string, region: string, startrow: number) {
  const url = `${searchUrl}?q=&locationsearch=${encodeURIComponent(region)}${startrow ? `&startrow=${startrow}` : ""}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error(`${companyLabel} (${region}): HTTP ${res.status}`);
  const $ = cheerio.load(await res.text());
  const base = new URL(searchUrl).origin;

  const jobs: RawJob[] = [];
  $("tr.data-row").each((_, el) => {
    const row = $(el);
    const link = row.find("a.jobTitle-link").first();
    const title = link.text().trim();
    const href = link.attr("href");
    const location = row.find(".jobLocation").first().text().trim();
    if (!title || !href) return;
    jobs.push({ title, location, url: new URL(href, base).toString(), postedAt: null, description: "" });
  });

  // No explicit result-count element on this template — the highest `startrow` value in the
  // pagination controls is a reliable proxy (this page always renders a link to the last page).
  const maxStartRow = Math.max(
    0,
    ...$('a[href*="startrow="]')
      .map((__, a) => Number(new URL($(a).attr("href") ?? "", base).searchParams.get("startrow") ?? 0))
      .get()
  );
  return { jobs, total: maxStartRow + PAGE_SIZE };
}
