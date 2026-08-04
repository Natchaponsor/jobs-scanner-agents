import type { Adapter } from "./types";

interface AshbyJob {
  title: string;
  location: string;
  jobUrl: string;
  publishedAt?: string;
  descriptionHtml?: string;
  employmentType?: string;
  isRemote?: boolean | null;
  workplaceType?: string | null;
}

/** Generic adapter for any company on Ashby: api.ashbyhq.com/posting-api/job-board/{boardName} */
export const ashbyAdapter: Adapter = {
  async fetch(source) {
    const board = source.identifier;
    const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${board}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Ashby ${board}: HTTP ${res.status}`);
    const data = (await res.json()) as { jobs: AshbyJob[] };

    return data.jobs.map((job) => ({
      title: job.title,
      location: job.location ?? "",
      url: job.jobUrl,
      postedAt: job.publishedAt ?? null,
      description: (job.descriptionHtml ?? "").replace(/<[^>]+>/g, " "),
      jobType: job.employmentType === "PartTime" ? "PT" : job.employmentType === "Intern" ? "Internship" : "FT",
      workMode: job.isRemote ? "remote" : job.workplaceType === "Hybrid" ? "hybrid" : job.workplaceType === "OnSite" ? "in-person" : undefined,
    }));
  },
};
