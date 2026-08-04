import type { Adapter } from "./types";

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

/** Amazon's own career-site JSON API (not an off-the-shelf ATS). */
export const amazonAdapter: Adapter = {
  async fetch(_source, query) {
    const url = `https://www.amazon.jobs/en/search.json?base_query=${encodeURIComponent(query.function)}&loc_query=California&result_limit=25`;
    // Amazon serves zstd-encoded bodies, which Node's fetch can't decompress (truncates the
    // JSON mid-string). Force a compression Node actually supports.
    const res = await fetch(url, { headers: { Accept: "application/json", "Accept-Encoding": "gzip, deflate, br" } });
    if (!res.ok) throw new Error(`Amazon: HTTP ${res.status}`);
    const data = (await res.json()) as { jobs: AmazonJob[] };

    return data.jobs.map((job) => ({
      title: job.title,
      location: job.normalized_location ?? job.location ?? "",
      url: `https://www.amazon.jobs${job.job_path}`,
      postedAt: job.posted_date ?? null,
      description: `${job.description_short ?? ""} ${job.basic_qualifications ?? ""}`,
      jobType: job.job_schedule_type === "Part Time" ? "PT" : ("FT" as const),
    }));
  },
};
