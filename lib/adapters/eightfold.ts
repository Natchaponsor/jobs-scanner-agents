import type { Adapter } from "./types";

interface EightfoldJob {
  name: string;
  location?: string;
  url?: string;
  id?: number | string;
  t_update?: number;
}

/** Generic adapter for any company on Eightfold. identifier = `{domain}|{host}`,
 *  e.g. `netflix.com|explore.jobs.netflix.net`. */
export const eightfoldAdapter: Adapter = {
  async fetch(source) {
    const [domain, host] = source.identifier.split("|");
    if (!domain || !host) throw new Error(`Eightfold ${source.name}: malformed identifier "${source.identifier}"`);

    const res = await fetch(`https://${host}/api/apply/v2/jobs?domain=${encodeURIComponent(domain)}&start=0&num=25`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Eightfold ${source.name}: HTTP ${res.status}`);
    const data = (await res.json()) as { positions?: EightfoldJob[] };

    return (data.positions ?? []).map((job) => ({
      title: job.name,
      location: job.location ?? "",
      url: job.url ?? `https://${host}/`,
      postedAt: job.t_update ? new Date(job.t_update * 1000).toISOString() : null,
      description: "",
    }));
  },
};
