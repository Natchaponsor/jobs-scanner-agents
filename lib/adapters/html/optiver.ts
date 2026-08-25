import type { Adapter } from "../types";
import type { RawJob } from "../../extract";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// Optiver's public jobs API caps every response at 16 items with no working pagination param
// found (skip/offset/limit/page/take/size/count/top all silently ignored) — but the
// `location` filter genuinely scopes results server-side, so querying each of its own listed
// office locations (from the page's embedded filterConfig) captures the full ~176-job dataset,
// confirmed by summing each location's totalCount back up to the unfiltered total. Locations
// with more than 16 open roles (Amsterdam/Chicago/Sydney/Shanghai) will still be truncated at
// 16 per office; every other office's listing is complete.
const LOCATIONS = [
  "amsterdam", "austin", "chicago", "hong-kong", "london", "miami", "mumbai",
  "new-york", "philadelphia", "shanghai", "singapore", "sydney", "taipei",
];

interface OptiverJob {
  title: string;
  location: string;
  href: string;
}

export const optiverAdapter: Adapter = {
  async fetch() {
    const results = await Promise.all(LOCATIONS.map(fetchLocation));
    const seen = new Set<string>();
    const jobs: RawJob[] = [];
    for (const job of results.flat()) {
      if (seen.has(job.href)) continue;
      seen.add(job.href);
      jobs.push({
        title: job.title,
        location: job.location,
        url: new URL(job.href, "https://www.optiver.com").toString(),
        postedAt: null,
        description: "",
      });
    }
    return jobs;
  },
};

async function fetchLocation(location: string): Promise<OptiverJob[]> {
  const res = await fetch(`https://www.optiver.com/en/api/v1/jobs?location=${location}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Optiver (${location}): HTTP ${res.status}`);
  const data = (await res.json()) as { items: OptiverJob[] };
  return data.items;
}
