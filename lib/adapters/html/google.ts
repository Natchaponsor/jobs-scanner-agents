import * as cheerio from "cheerio";
import type { Adapter } from "../types";
import type { RawJob } from "../../extract";
import type { YoeBucket } from "../../types";
import { mapLimit, withRetry } from "../paginate";

const BASE = "https://www.google.com/about/careers/applications/";

/** Google's own level tags, mapped onto our buckets. Preferred over regex guessing since
 *  it's an explicit signal from the source rather than an inference from free text. */
const LEVEL_TO_YOE: Record<string, YoeBucket> = {
  intern: "0-3",
  entry: "0-3",
  early: "0-3",
  mid: "3-5",
  advanced: "5-10",
  senior: "5-10",
  director: "10+",
  executive: "10+",
};

// Google's results page holds 20 cards and accepts `page=N` and `location=...` (both confirmed:
// `location=Thailand` returns just its 14 postings, `page=40` for Singapore comes back empty).
// Walked per priority market rather than worldwide, in batches of 5 pages until a short or empty
// page marks the end, with a ceiling since the United States alone runs to many hundreds.
const PAGE_SIZE = 20;
const LOCATIONS = ["United States", "United Kingdom", "Singapore", "Thailand"];
const MAX_PAGES_PER_LOCATION = 25;
const BATCH = 5;

/**
 * careers.google.com server-renders its search results into the initial HTML response
 * (confirmed via plain curl — no JS execution needed), so this parses that HTML directly
 * instead of driving a real browser.
 */
export const googleAdapter: Adapter = {
  async fetch(_source, query) {
    const fetchPage = async (location: string, page: number): Promise<RawJob[]> => {
      const url = `${BASE}jobs/results/?q=${encodeURIComponent(query.function)}&location=${encodeURIComponent(location)}&page=${page}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          Accept: "text/html",
        },
      });
      if (!res.ok) throw new Error(`Google (${location}): HTTP ${res.status}`);
      return parseResults(await res.text());
    };

    const fetchLocation = async (location: string): Promise<RawJob[]> => {
      const jobs: RawJob[] = [];
      for (let start = 1; start <= MAX_PAGES_PER_LOCATION; start += BATCH) {
        const pages = Array.from({ length: Math.min(BATCH, MAX_PAGES_PER_LOCATION - start + 1) }, (_, i) => start + i);
        const results = await mapLimit(pages, BATCH, (page) => withRetry(() => fetchPage(location, page)));
        for (const batch of results) jobs.push(...batch);
        if (results.some((batch) => batch.length < PAGE_SIZE)) break;
      }
      return jobs;
    };

    return (await Promise.all(LOCATIONS.map(fetchLocation))).flat();
  },
};

function parseResults(html: string): RawJob[] {
  const $ = cheerio.load(html);
  const jobs: RawJob[] = [];

  $("li.lLd3Je").each((_, el) => {
    const card = $(el);
    const title = card.find("h3.QJPWVe").first().text().trim();
    const location = card.find("span.r0wTof").first().text().trim();
    const level = card.find("span.wVSTAb").first().text().trim().toLowerCase();
    // Google's links are relative without a leading slash ("jobs/results/...").
    const href = card.find('a[href*="jobs/results/"]').first().attr("href");
    if (!title || !href) return;

    jobs.push({
      title,
      location,
      url: new URL(href, BASE).toString(),
      postedAt: null,
      description: "",
      yearsExperience: LEVEL_TO_YOE[level],
    });
  });

  return jobs;
}
