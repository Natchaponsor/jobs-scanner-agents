import * as cheerio from "cheerio";
import type { Adapter } from "../types";
import type { RawJob } from "../../extract";
import type { YoeBucket } from "../../types";

const LEVEL_TO_YOE: Record<string, YoeBucket> = {
  "early careers": "0-3",
  "campus": "0-3",
  "internship": "0-3",
  "experienced hire": "3-5",
  "senior": "5-10",
};

/** careers.twosigma.com/careers/OpenRoles server-renders its full listing (Radancy-style
 *  career-site platform) — confirmed via plain curl, no JS execution needed. */
export const twoSigmaAdapter: Adapter = {
  async fetch() {
    const res = await fetch("https://careers.twosigma.com/careers/OpenRoles", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html",
      },
    });
    if (!res.ok) throw new Error(`Two Sigma: HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const jobs: RawJob[] = [];
    $("article.article--result").each((_, el) => {
      const card = $(el);
      const link = card.find("h3 a.link").first();
      const title = link.text().trim();
      const url = link.attr("href");
      const spans = card.find(".paragraph_inner-span").map((__, s) => $(s).text().trim()).get();
      const [location, , level] = spans;
      if (!title || !url) return;

      jobs.push({
        title,
        location: location ?? "",
        url,
        postedAt: null,
        description: "",
        yearsExperience: level ? LEVEL_TO_YOE[level.toLowerCase()] : undefined,
      });
    });

    return jobs;
  },
};
