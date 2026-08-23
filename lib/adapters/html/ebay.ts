import type { Adapter } from "../types";
import type { RawJob } from "../../extract";
import { fetchPhenomPage } from "./phenom";

const BASE = "https://jobs.ebayinc.com/us/en/search-results";
const PAGE_SIZE = 10;

/**
 * Same Phenom People platform and embedded `phApp.ddo` server-rendered pattern as BCG/Cisco —
 * see lib/adapters/html/phenom.ts. eBay's domain moved from jobs.ebaycareers.com to
 * jobs.ebayinc.com (the old domain now 301s here) — see the co-ebay comment in
 * lib/defaultSources.ts for the earlier per-location-pages-only dead end this replaces.
 * Confirmed via plain curl: ~466 jobs, paginated via `?from=N&s=1`.
 */
export const ebayAdapter: Adapter = {
  async fetch() {
    const first = await fetchPhenomPage("eBay", BASE, 0);
    const remainingPages = Math.ceil(first.total / PAGE_SIZE) - 1;
    const rest = await Promise.all(
      Array.from({ length: Math.max(remainingPages, 0) }, (_, i) => fetchPhenomPage("eBay", BASE, (i + 1) * PAGE_SIZE))
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
