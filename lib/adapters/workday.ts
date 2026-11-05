import type { Adapter } from "./types";
import { mapLimit, remainingOffsets, withRetry } from "./paginate";

interface WorkdayJob {
  title: string;
  externalPath: string;
  locationsText?: string;
  postedOn?: string;
}

interface WorkdayPage {
  total?: number;
  jobPostings: WorkdayJob[];
}

// Workday's cxs API returns nothing at all for a `limit` above 20, so large tenants have to be
// walked page by page. 6 in flight finished Palo Alto's 1,370 jobs in ~23s with no rate limiting.
const PAGE_SIZE = 20;
const CONCURRENCY = 6;

/** Generic adapter for any company on Workday. identifier = `{host}|{siteSlug}`,
 *  e.g. `adobe.wd5.myworkdayjobs.com|external_experienced`. Pages through the whole listing
 *  (up to MAX_JOBS_PER_SOURCE) — `total` is only dependable on the first page, so the later
 *  offsets are computed from that one number. */
export const workdayAdapter: Adapter = {
  async fetch(source, query) {
    const [host, site] = source.identifier.split("|");
    if (!host || !site) throw new Error(`Workday ${source.name}: malformed identifier "${source.identifier}"`);

    const fetchPage = async (offset: number): Promise<WorkdayPage> => {
      const res = await fetch(`https://${host}/wday/cxs/${host.split(".")[0]}/${site}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ appliedFacets: {}, limit: PAGE_SIZE, offset, searchText: query.function }),
      });
      if (!res.ok) throw new Error(`Workday ${source.name}: HTTP ${res.status}`);
      return (await res.json()) as WorkdayPage;
    };

    const first = await withRetry(() => fetchPage(0));
    const rest = await mapLimit(remainingOffsets(first.total ?? 0, PAGE_SIZE), CONCURRENCY, (offset) =>
      withRetry(() => fetchPage(offset))
    );

    return [first, ...rest]
      .flatMap((page) => page.jobPostings)
      .map((job) => ({
        title: job.title,
        location: job.locationsText ?? "",
        url: `https://${host}/${site}${job.externalPath}`,
        postedAt: null,
        description: job.postedOn ?? "",
      }));
  },
};
