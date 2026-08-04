import type { Adapter } from "./types";

interface GreenhouseJob {
  absolute_url: string;
  title: string;
  updated_at: string;
  location?: { name?: string };
  content?: string;
}

/** Generic adapter for any company on Greenhouse: boards-api.greenhouse.io/v1/boards/{token}/jobs */
export const greenhouseAdapter: Adapter = {
  async fetch(source) {
    const token = source.identifier;
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Greenhouse ${token}: HTTP ${res.status}`);
    const data = (await res.json()) as { jobs: GreenhouseJob[] };

    return data.jobs.map((job) => ({
      title: job.title,
      location: job.location?.name ?? "",
      url: job.absolute_url,
      postedAt: job.updated_at ?? null,
      description: (job.content ?? "").replace(/<[^>]+>/g, " "),
    }));
  },
};
