import type { Adapter } from "../types";
import type { RawJob } from "../../extract";

const BASE = "https://careers.bcg.com/global/en/search-results";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const PAGE_SIZE = 10;

interface BcgJob {
  title: string;
  location: string;
  applyUrl: string;
  type?: string;
}

/**
 * careers.bcg.com is on Phenom People, but unlike most Phenom sites (see the "not yet
 * supported" Cisco/eBay entries — a public `/api/apply/v2/jobs` endpoint exists, but its
 * tenant param can't be guessed from the CDN path), BCG's search-results page embeds the full
 * result set directly as a `phApp.ddo = {...}` JSON blob in server-rendered HTML — confirmed
 * via plain curl, no browser needed. Global listing (~900 jobs spanning the US and APAC,
 * including confirmed Singapore/Vietnam/Philippines/Indonesia/Malaysia postings), paginated
 * via `?from=N&s=1`.
 */
export const bcgAdapter: Adapter = {
  async fetch() {
    const first = await fetchPage(0);
    const remainingPages = Math.ceil(first.total / PAGE_SIZE) - 1;
    const rest = await Promise.all(
      Array.from({ length: Math.max(remainingPages, 0) }, (_, i) => fetchPage((i + 1) * PAGE_SIZE))
    );
    const jobs = [first, ...rest].flatMap((page) => page.jobs);

    return jobs.map(
      (job): RawJob => ({
        title: job.title,
        location: job.location,
        url: job.applyUrl,
        postedAt: null,
        description: "",
        jobType: job.type === "Intern" ? "Internship" : "FT",
      })
    );
  },
};

async function fetchPage(from: number): Promise<{ jobs: BcgJob[]; total: number }> {
  const url = from === 0 ? BASE : `${BASE}?from=${from}&s=1`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error(`BCG: HTTP ${res.status}`);
  const html = await res.text();

  const marker = "phApp.ddo = ";
  const start = html.indexOf(marker);
  if (start === -1) throw new Error("BCG: phApp.ddo not found in page");
  const raw = extractBalancedObject(html, start + marker.length);
  const parsed = JSON.parse(raw) as {
    eagerLoadRefineSearch: { totalHits: number; data: { jobs: BcgJob[] } };
  };
  return { jobs: parsed.eagerLoadRefineSearch.data.jobs, total: parsed.eagerLoadRefineSearch.totalHits };
}

/** Scans forward from an opening `{` to find its matching closing brace, respecting quoted
 *  strings that may themselves contain `}`/`;` sequences that would confuse a naive search. */
function extractBalancedObject(text: string, start: number): string {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
    } else if (char === '"') {
      inString = true;
    } else if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  throw new Error("BCG: unterminated JSON object");
}
