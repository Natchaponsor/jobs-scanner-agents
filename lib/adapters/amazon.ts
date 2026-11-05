import type { Adapter } from "./types";
import { mapLimit, remainingOffsets, withRetry } from "./paginate";

interface AmazonJob {
  title: string;
  normalized_location?: string;
  location?: string;
  job_path: string;
  posted_date?: string;
  description_short?: string;
  basic_qualifications?: string;
  job_schedule_type?: string;
}

// Amazon's search API takes an ISO-3 `country` filter. (It also has a `loc_query` param, but
// that one is silently ignored — every value, "California" included, returns the same
// worldwide mix — so the old hardcoded `loc_query=California` never actually narrowed anything.)
// These are this project's priority markets; USA alone has 10,000+ postings (the API's reported
// ceiling), so each country is cut off at MAX_PER_COUNTRY, newest first (GBR's ~716, SGP's ~132
// and THA's ~13 fit in full).
const COUNTRIES = ["USA", "GBR", "SGP", "THA"];
const PAGE_SIZE = 100;
const MAX_PER_COUNTRY = 1000;

/** Amazon's own career-site JSON API (not an off-the-shelf ATS). */
export const amazonAdapter: Adapter = {
  async fetch(_source, query) {
    const fetchPage = async (country: string, offset: number) => {
      const params = new URLSearchParams({
        base_query: query.function,
        country,
        sort: "recent",
        offset: String(offset),
        result_limit: String(PAGE_SIZE),
      });
      // Amazon serves zstd-encoded bodies, which Node's fetch can't decompress (truncates the
      // JSON mid-string). Force a compression Node actually supports.
      const res = await fetch(`https://www.amazon.jobs/en/search.json?${params}`, {
        headers: { Accept: "application/json", "Accept-Encoding": "gzip, deflate, br" },
      });
      if (!res.ok) throw new Error(`Amazon (${country}): HTTP ${res.status}`);
      return (await res.json()) as { hits?: number; jobs: AmazonJob[] };
    };

    const perCountry = await Promise.all(
      COUNTRIES.map(async (country) => {
        const first = await withRetry(() => fetchPage(country, 0));
        const rest = await mapLimit(
          remainingOffsets(first.hits ?? 0, PAGE_SIZE, MAX_PER_COUNTRY),
          4,
          (offset) => withRetry(() => fetchPage(country, offset))
        );
        return [first, ...rest].flatMap((page) => page.jobs);
      })
    );

    return perCountry.flat().map((job) => ({
      title: job.title,
      location: job.normalized_location ?? job.location ?? "",
      url: `https://www.amazon.jobs${job.job_path}`,
      postedAt: job.posted_date ?? null,
      description: `${job.description_short ?? ""} ${job.basic_qualifications ?? ""}`,
      jobType: job.job_schedule_type === "Part Time" ? "PT" : ("FT" as const),
    }));
  },
};
