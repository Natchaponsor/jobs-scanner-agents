import * as cheerio from "cheerio";
import type { Adapter } from "../types";
import type { RawJob } from "../../extract";

const BASE = "https://mycareer.hsbc.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const PAGE_SIZE = 10;

/**
 * mycareer.hsbc.com/en_GB/external/SearchJobs is the same Radancy/TalentBrew career-site
 * platform as Deloitte/Intuit/BlackRock/PwC/KPMG above, just themed with "pipeline"
 * terminology instead of "job" (`pipelineRecordsPerPage`/`pipelineOffset` instead of
 * `jobRecordsPerPage`/`jobOffset`, `PipelineDetail` instead of `JobDetail`) — the earlier
 * `avature.wizard` signal on this domain was a different part of HSBC's hiring stack (an
 * application-form portal), not the public job search, which was found via the "Search Jobs"
 * form's actual results page. Server-renders its full listing, confirmed via plain curl.
 */
export const hsbcAdapter: Adapter = {
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
  const res = await fetch(`${BASE}/en_GB/external/SearchJobs?pipelineRecordsPerPage=${PAGE_SIZE}&pipelineOffset=${offset}`, {
    headers: { "User-Agent": UA, Accept: "text/html" },
  });
  if (!res.ok) throw new Error(`HSBC: HTTP ${res.status}`);
  const $ = cheerio.load(await res.text());

  const legend = $(".list-controls__text__legend").first().text();
  const total = Number(legend.match(/of\s*(\d+)\s*results/)?.[1] ?? 0);

  const jobs: RawJob[] = [];
  $("article.article--result").each((_, el) => {
    const article = $(el);
    const link = article.find("h3.article__header__text__title a").first();
    const title = link.text().trim();
    const href = link.attr("href");
    const location = article.find(".article__header__text__subtitle .location").first().text().trim();
    if (!title || !href) return;

    jobs.push({ title, location, url: href, postedAt: null, description: "" });
  });

  return { jobs, total };
}
