import type { Adapter } from "./types";

interface SmartRecruitersPosting {
  id: string;
  name: string;
  releasedDate?: string;
  location?: { city?: string; region?: string; country?: string; fullLocation?: string; remote?: boolean };
  typeOfEmployment?: { label?: string };
}

const PAGE_SIZE = 100;

/** Generic adapter for any company on SmartRecruiters: the public, unauthenticated
 *  api.smartrecruiters.com/v1/companies/{identifier}/postings REST API. identifier = the
 *  company's SmartRecruiters slug, e.g. "Wise" — capped at 100 results per page server-side. */
export const smartRecruitersAdapter: Adapter = {
  async fetch(source) {
    const company = source.identifier;
    const first = await fetchPage(company, 0);
    const remainingPages = Math.ceil(first.total / PAGE_SIZE) - 1;
    const rest = await Promise.all(
      Array.from({ length: Math.max(remainingPages, 0) }, (_, i) => fetchPage(company, (i + 1) * PAGE_SIZE))
    );
    return [first, ...rest].flatMap((page) => page.jobs);
  },
};

async function fetchPage(company: string, offset: number) {
  const res = await fetch(
    `https://api.smartrecruiters.com/v1/companies/${company}/postings?limit=${PAGE_SIZE}&offset=${offset}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`SmartRecruiters ${company}: HTTP ${res.status}`);
  const data = (await res.json()) as { totalFound: number; content: SmartRecruitersPosting[] };

  const jobs = data.content.map((posting) => ({
    title: posting.name,
    location: posting.location?.fullLocation ?? [posting.location?.city, posting.location?.country].filter(Boolean).join(", "),
    url: `https://jobs.smartrecruiters.com/${company}/${posting.id}`,
    postedAt: posting.releasedDate ?? null,
    description: "",
    workMode: posting.location?.remote ? ("remote" as const) : undefined,
    jobType: posting.typeOfEmployment?.label === "Part-time" ? ("PT" as const) : posting.typeOfEmployment?.label === "Internship" ? ("Internship" as const) : ("FT" as const),
  }));
  return { jobs, total: data.totalFound };
}
