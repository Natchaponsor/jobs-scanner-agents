import type { Adapter } from "../types";
import type { RawJob } from "../../extract";
import { fetchPhenomPage } from "./phenom";

const BASE = "https://mycareer.airasia.com/gb/en/search-results";
const PAGE_SIZE = 10;

/**
 * Same Phenom People platform and embedded `phApp.ddo` server-rendered pattern as BCG/Cisco/
 * eBay — see lib/adapters/html/phenom.ts. ~142 jobs, confirmed real Singapore/Malaysia/
 * Indonesia/Philippines/Cambodia postings.
 */
export const airasiaAdapter: Adapter = {
  async fetch() {
    const first = await fetchPhenomPage("AirAsia", BASE, 0);
    const remainingPages = Math.ceil(first.total / PAGE_SIZE) - 1;
    const rest = await Promise.all(
      Array.from({ length: Math.max(remainingPages, 0) }, (_, i) => fetchPhenomPage("AirAsia", BASE, (i + 1) * PAGE_SIZE))
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
