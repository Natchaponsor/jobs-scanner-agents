import type { Adapter } from "./types";

interface ShopeeJob {
  id: number;
  job_name: string;
  job_description?: string;
}

interface ShopeeListResponse {
  data: { job_list: ShopeeJob[]; total_count: number };
}

// Bangkok — the only Thailand location in this ATS's own location metadata.
const THAILAND_CITY_ID = 31;
const PAGE_SIZE = 100;

async function fetchPage(offset: number): Promise<ShopeeListResponse> {
  const res = await fetch(
    `https://ats.workatsea.com/ats/api/v1/user/job/list/?limit=${PAGE_SIZE}&offset=${offset}&city_ids=${THAILAND_CITY_ID}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`Shopee: HTTP ${res.status}`);
  return res.json();
}

/**
 * Sea Group's own recruiting platform ("workatsea.com", surfaced at careers.shopee.sg) —
 * shared across Shopee, ShopeePay and SPX Express. Public, unauthenticated JSON API,
 * confirmed via plain curl. Scoped to Thailand (city_ids=31) rather than pulling Shopee's
 * full ~2,600 jobs across every Sea Group market.
 *
 * Job detail URLs are inferred from the SPA's "job-detail" route chunk name — the site serves
 * an identical shell for every path, so the exact route can't be confirmed by curl alone.
 */
export const shopeeAdapter: Adapter = {
  async fetch() {
    const first = await fetchPage(0);
    const remainingPages = Math.ceil(first.data.total_count / PAGE_SIZE) - 1;
    const rest = await Promise.all(
      Array.from({ length: Math.max(remainingPages, 0) }, (_, i) => fetchPage((i + 1) * PAGE_SIZE))
    );
    const jobs = [first, ...rest].flatMap((page) => page.data.job_list);

    return jobs.map((job) => ({
      title: job.job_name,
      location: "Bangkok, Thailand",
      url: `https://careers.shopee.sg/job-detail/${job.id}`,
      postedAt: null,
      description: (job.job_description ?? "").replace(/<[^>]+>/g, " "),
    }));
  },
};
