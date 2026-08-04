import type { Adapter } from "./types";

interface LeverPosting {
  text: string;
  categories?: { location?: string };
  hostedUrl: string;
  createdAt?: number;
  descriptionPlain?: string;
  workplaceType?: string;
}

/** Generic adapter for any company on Lever: api.lever.co/v0/postings/{token}?mode=json */
export const leverAdapter: Adapter = {
  async fetch(source) {
    const token = source.identifier;
    const res = await fetch(`https://api.lever.co/v0/postings/${token}?mode=json`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Lever ${token}: HTTP ${res.status}`);
    const postings = (await res.json()) as LeverPosting[];

    return postings.map((p) => ({
      title: p.text,
      location: p.categories?.location ?? "",
      url: p.hostedUrl,
      postedAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      description: p.descriptionPlain ?? "",
      workMode:
        p.workplaceType === "remote" ? ("remote" as const) : p.workplaceType === "hybrid" ? ("hybrid" as const) : undefined,
    }));
  },
};
