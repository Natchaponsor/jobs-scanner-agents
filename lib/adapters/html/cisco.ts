import type { Adapter } from "../types";
import type { RawJob } from "../../extract";
import { fetchPhenomPage } from "./phenom";

const BASE = "https://careers.cisco.com/global/en/search-results";
const PAGE_SIZE = 10;

/**
 * Same Phenom People platform and embedded `phApp.ddo` server-rendered pattern as BCG — see
 * lib/adapters/html/phenom.ts. Confirmed via plain curl: ~1,170 jobs globally, paginated via
 * `?from=N&s=1`, spread across the US and APAC (Japan, Australia, Hong Kong, Taiwan, India
 * confirmed in a spot check).
 */
export const ciscoAdapter: Adapter = {
  async fetch() {
    const first = await fetchPhenomPage("Cisco", BASE, 0);
    const remainingPages = Math.ceil(first.total / PAGE_SIZE) - 1;
    const rest = await Promise.all(
      Array.from({ length: Math.max(remainingPages, 0) }, (_, i) => fetchPhenomPage("Cisco", BASE, (i + 1) * PAGE_SIZE))
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
