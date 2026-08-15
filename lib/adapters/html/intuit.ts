import * as cheerio from "cheerio";
import type { Adapter } from "../types";
import type { RawJob } from "../../extract";

const BASE = "https://jobs.intuit.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** jobs.intuit.com/search-jobs is a Radancy/TalentBrew career site (same platform family as
 *  Two Sigma) — server-renders its full listing, confirmed via plain curl. Paginates via
 *  `?p=N`, 15 results per page (total page count is in `#search-results`'s data attribute). */
export const intuitAdapter: Adapter = {
  async fetch() {
    const first = await fetchPage(1);
    const rest = await Promise.all(
      Array.from({ length: Math.max(first.totalPages - 1, 0) }, (_, i) => fetchPage(i + 2))
    );
    return [first, ...rest].flatMap((page) => page.jobs);
  },
};

async function fetchPage(page: number): Promise<{ jobs: RawJob[]; totalPages: number }> {
  const res = await fetch(`${BASE}/search-jobs?p=${page}`, {
    headers: { "User-Agent": UA, Accept: "text/html" },
  });
  if (!res.ok) throw new Error(`Intuit: HTTP ${res.status}`);
  const $ = cheerio.load(await res.text());

  const totalPages = Number($("#search-results").attr("data-total-pages") ?? 1);
  const jobs: RawJob[] = [];
  $("li[data-remote]").each((_, el) => {
    const li = $(el);
    const link = li.find("a.sr-item").first();
    const title = link.find("h2").first().text().trim();
    const href = link.attr("href");
    const location = li.find(".job-location").first().text().trim();
    if (!title || !href) return;

    jobs.push({
      title,
      location,
      url: new URL(href, BASE).toString(),
      postedAt: null,
      description: "",
    });
  });

  return { jobs, totalPages };
}
