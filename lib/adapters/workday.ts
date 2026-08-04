import type { Adapter } from "./types";

interface WorkdayJob {
  title: string;
  externalPath: string;
  locationsText?: string;
  postedOn?: string;
}

/** Generic adapter for any company on Workday. identifier = `{host}|{siteSlug}`,
 *  e.g. `adobe.wd5.myworkdayjobs.com|external_experienced`. */
export const workdayAdapter: Adapter = {
  async fetch(source, query) {
    const [host, site] = source.identifier.split("|");
    if (!host || !site) throw new Error(`Workday ${source.name}: malformed identifier "${source.identifier}"`);

    const res = await fetch(`https://${host}/wday/cxs/${host.split(".")[0]}/${site}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: 0, searchText: query.function }),
    });
    if (!res.ok) throw new Error(`Workday ${source.name}: HTTP ${res.status}`);
    const data = (await res.json()) as { jobPostings: WorkdayJob[] };

    return data.jobPostings.map((job) => ({
      title: job.title,
      location: job.locationsText ?? "",
      url: `https://${host}/${site}${job.externalPath}`,
      postedAt: null,
      description: job.postedOn ?? "",
    }));
  },
};
