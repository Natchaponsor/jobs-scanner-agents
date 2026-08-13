import type { Adapter } from "../types";
import type { JobType } from "../../types";

interface LmwnPosition {
  id: number;
  title: string;
  route_name: string;
  department_route_name: string;
  employment: string;
  locations: string[];
}

const EMPLOYMENT_TO_JOB_TYPE: Record<string, JobType> = {
  Intern: "Internship",
};

/** careers.lmwn.com/jobs server-renders its full listing into a React Query hydration blob
 *  (window.__REACT_QUERY_STATE__, queryKey ["job-positions-all"]) — confirmed via plain curl,
 *  no JS execution needed. Covers LINE MAN, Wongnai, and LINE Pay Thailand under one board. */
export const linemanWongnaiAdapter: Adapter = {
  async fetch() {
    const res = await fetch("https://careers.lmwn.com/jobs", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html",
      },
    });
    if (!res.ok) throw new Error(`LINE MAN Wongnai: HTTP ${res.status}`);
    const html = await res.text();
    const positions = extractPositions(html);

    return positions.map((job) => ({
      title: job.title,
      location: job.locations.join(", "),
      url: `https://careers.lmwn.com/${job.department_route_name}/${job.id}-${job.route_name}`,
      postedAt: null,
      description: "",
      jobType: EMPLOYMENT_TO_JOB_TYPE[job.employment],
    }));
  },
};

function extractPositions(html: string): LmwnPosition[] {
  const marker = "window.__REACT_QUERY_STATE__ = ";
  const start = html.indexOf(marker);
  if (start === -1) throw new Error("LINE MAN Wongnai: hydration state not found in page");
  const raw = extractBalancedObject(html, start + marker.length);
  const parsed = JSON.parse(raw) as { queries: { queryKey: string[]; state: { data: unknown } }[] };
  const query = parsed.queries.find((q) => q.queryKey[0] === "job-positions-all");
  if (!query) throw new Error("LINE MAN Wongnai: job-positions-all query not found");
  return query.state.data as LmwnPosition[];
}

/** Scans forward from an opening `{` to find its matching closing brace, respecting quoted
 *  strings (which may themselves contain literal `};`/`</script` sequences that would confuse
 *  a naive string search for the end of the assignment). */
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
  throw new Error("LINE MAN Wongnai: unterminated JSON object in hydration state");
}
