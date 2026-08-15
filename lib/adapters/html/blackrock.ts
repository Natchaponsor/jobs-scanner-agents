import * as cheerio from "cheerio";
import type { Adapter } from "../types";
import type { RawJob } from "../../extract";

const BASE = "https://careers.blackrock.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** careers.blackrock.com/search-jobs is a Radancy/TalentBrew career site (same platform
 *  family as Two Sigma and Intuit, different theme) — server-renders its full listing,
 *  confirmed via plain curl. Paginates via `?p=N`. */
export const blackrockAdapter: Adapter = {
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
  if (!res.ok) throw new Error(`BlackRock: HTTP ${res.status}`);
  const $ = cheerio.load(await res.text());

  const totalPages = Number($("#search-results").attr("data-total-pages") ?? 1);
  const jobs: RawJob[] = [];
  $("li.section3__search-results-li").each((_, el) => {
    const li = $(el);
    const link = li.find("a.section3__search-results-a").first();
    const title = link.find(".section3__job-title").first().text().trim();
    const href = link.attr("href");
    const location = li.find(".section3__job-location .section3__job-info").first().text().trim();
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
