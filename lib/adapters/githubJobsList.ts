import type { Adapter } from "./types";
import type { RawJob } from "../extract";
import type { WorkAuthorization } from "../types";
import { classifyLocation } from "../locations";

interface Listing {
  company_name: string;
  title: string;
  active: boolean;
  is_visible?: boolean;
  date_posted?: number;
  url: string;
  locations: string[];
  category?: string;
  sponsorship?: string;
}

// Best-effort bucketing into this project's existing industry filter values — not exhaustive
// (e.g. "Hardware" has no clean match here) — an unmapped category just falls back to the
// ScanSource's own static industry ("any"), same as every other adapter.
const CATEGORY_TO_INDUSTRY: Record<string, string> = {
  Software: "Software",
  "Software Engineering": "Software",
  "AI/ML/Data": "AI",
  "Data Science, AI & Machine Learning": "AI",
  Quant: "Finance",
  Product: "Software",
  "Product Management": "Software",
};

// The dataset's own sponsorship field is a real, human-verified signal — more reliable than
// this project's usual regex guess over description text (which this source doesn't even have).
// Still gated to US postings only, same rule as extractWorkAuthorization.
function mapSponsorship(raw: string | undefined, country: string): WorkAuthorization | undefined {
  if (country !== "United States") return undefined;
  switch (raw) {
    case "U.S. Citizenship is Required":
      return "Citizenship Required";
    case "Does Not Offer Sponsorship":
      return "No Sponsorship";
    case "Offers Sponsorship":
      return "Sponsorship Available";
    default:
      return undefined; // "Other" / unset — genuinely not specified, let it fall through to "n/a"
  }
}

/**
 * Generic adapter for the "Simplify Jobs" family of community-maintained GitHub repos (New Grad
 * Positions, Summer Internships, ...) — each publishes a machine-readable
 * `.github/scripts/listings.json` on its `dev` branch: a public, unauthenticated, structured
 * feed (no HTML scraping) covering hundreds of companies, crowdsourced/verified by Simplify and
 * community contributors (e.g. Pitt CSC). identifier = `"{owner}/{repo}"`, e.g.
 * "SimplifyJobs/New-Grad-Positions". Confirmed live: ~19k total historical entries, ~3.2k
 * currently `active`.
 *
 * Unlike every other adapter, one ScanSource here produces jobs from MANY different real
 * companies — each RawJob carries its own `company`/`industry`/`workAuthorization` overrides
 * (see the corresponding fields on RawJob and how normalize() in lib/extract.ts prefers them
 * over the ScanSource's own static name/industry) rather than being attributed to one company.
 */
export const githubJobsListAdapter: Adapter = {
  async fetch(source) {
    const repo = source.identifier;
    const res = await fetch(`https://raw.githubusercontent.com/${repo}/dev/.github/scripts/listings.json`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`GitHub jobs list (${repo}): HTTP ${res.status}`);
    const listings = (await res.json()) as Listing[];

    const jobs: RawJob[] = [];
    for (const item of listings) {
      if (!item.active || item.is_visible === false) continue;
      const location = (item.locations ?? []).join("; ");
      const { country } = classifyLocation(location);
      jobs.push({
        title: item.title,
        company: item.company_name,
        location,
        url: item.url,
        postedAt: item.date_posted ? new Date(item.date_posted * 1000).toISOString() : null,
        description: "",
        industry: item.category ? CATEGORY_TO_INDUSTRY[item.category] : undefined,
        workAuthorization: mapSponsorship(item.sponsorship, country),
      });
    }
    return jobs;
  },
};
