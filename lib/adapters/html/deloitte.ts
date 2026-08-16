import * as cheerio from "cheerio";
import type { Adapter } from "../types";
import type { RawJob } from "../../extract";

const BASE = "https://apply.deloitte.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const PAGE_SIZE = 10;

/**
 * apply.deloitte.com/en_US/careers/SearchJobs is a Radancy/TalentBrew career site (same
 * family as Two Sigma/Intuit/BlackRock/PwC) — server-renders its full listing, confirmed via
 * plain curl. US-only: the on-page search box doesn't actually filter to other countries —
 * other Deloitte member firms run on separate sites not yet investigated. Paginates via
 * `?jobRecordsPerPage=10&jobOffset=N` (fixed page size — a higher jobRecordsPerPage value is
 * silently ignored).
 */
export const deloitteAdapter: Adapter = {
  async fetch() {
    const first = await fetchPage(0);
    const remainingPages = Math.ceil(first.total / PAGE_SIZE) - 1;
    const rest = await Promise.all(
      Array.from({ length: Math.max(remainingPages, 0) }, (_, i) => fetchPage((i + 1) * PAGE_SIZE))
    );
    return [first, ...rest].flatMap((page) => page.jobs);
  },
};

async function fetchPage(offset: number): Promise<{ jobs: RawJob[]; total: number }> {
  const res = await fetch(`${BASE}/en_US/careers/SearchJobs/?jobRecordsPerPage=${PAGE_SIZE}&jobOffset=${offset}`, {
    headers: { "User-Agent": UA, Accept: "text/html" },
  });
  if (!res.ok) throw new Error(`Deloitte: HTTP ${res.status}`);
  const $ = cheerio.load(await res.text());

  const total = Number($("article.article--result").first().attr("data-total") ?? 0);
  const jobs: RawJob[] = [];
  $("article.article--result").each((_, el) => {
    const article = $(el);
    const link = article.find("h3.article__header__text__title a.link").first();
    const title = link.text().trim();
    const href = link.attr("href");
    const spans = article
      .find(".article__header__text__subtitle span")
      .map((__, s) => $(s).text().trim())
      .get();
    const location = spans[spans.length - 1] ?? "";
    if (!title || !href) return;

    jobs.push({ title, location, url: href, postedAt: null, description: "" });
  });

  return { jobs, total };
}
