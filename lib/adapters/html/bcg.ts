import type { Adapter } from "../types";
import type { RawJob } from "../../extract";
import { fetchPhenomPage } from "./phenom";

const BASE = "https://careers.bcg.com/global/en/search-results";
const PAGE_SIZE = 10;

/**
 * careers.bcg.com is on Phenom People, but unlike most Phenom sites (see the "not yet
 * supported" entries in lib/defaultSources.ts — a public `/api/apply/v2/jobs` endpoint
 * exists, but its tenant param can't be guessed from the CDN path), BCG's search-results page
 * embeds the full result set directly as a `phApp.ddo = {...}` JSON blob in server-rendered
 * HTML — confirmed via plain curl, no browser needed. Global listing (~900 jobs spanning the
 * US and APAC, including confirmed Singapore/Vietnam/Philippines/Indonesia/Malaysia
 * postings), paginated via `?from=N&s=1`. See lib/adapters/html/phenom.ts for the shared
 * fetch/parse logic (also used by Cisco and eBay).
 */
export const bcgAdapter: Adapter = {
  async fetch() {
    const first = await fetchPhenomPage("BCG", BASE, 0);
    const remainingPages = Math.ceil(first.total / PAGE_SIZE) - 1;
    const rest = await Promise.all(
      Array.from({ length: Math.max(remainingPages, 0) }, (_, i) => fetchPhenomPage("BCG", BASE, (i + 1) * PAGE_SIZE))
    );
    const jobs = [first, ...rest].flatMap((page) => page.jobs);

    return jobs.map(
      (job): RawJob => ({
        title: job.title,
        location: job.location,
        url: job.applyUrl,
        postedAt: null,
        description: "",
        jobType: job.type === "Intern" ? "Internship" : "FT",
      })
    );
  },
};
