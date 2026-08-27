import type { Adapter } from "../types";
import type { RawJob } from "../../extract";
import { fetchPhenomPage } from "./phenom";

const BASE = "https://careers.circle.com/us/en/search-results";
const PAGE_SIZE = 10;

/**
 * Same Phenom People platform and embedded `phApp.ddo` server-rendered pattern as BCG/Cisco/
 * eBay/AirAsia — see lib/adapters/html/phenom.ts. ~61 jobs, confirmed real Singapore-tagged
 * postings.
 */
export const circleAdapter: Adapter = {
  async fetch() {
    const first = await fetchPhenomPage("Circle", BASE, 0);
    const remainingPages = Math.ceil(first.total / PAGE_SIZE) - 1;
    const rest = await Promise.all(
      Array.from({ length: Math.max(remainingPages, 0) }, (_, i) => fetchPhenomPage("Circle", BASE, (i + 1) * PAGE_SIZE))
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
