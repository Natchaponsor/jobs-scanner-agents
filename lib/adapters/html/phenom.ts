/**
 * Shared fetch/parse logic for Phenom People career sites that embed their full result set
 * directly as a `phApp.ddo = {...}` JSON blob in server-rendered HTML (confirmed via plain
 * curl on BCG, Cisco, and eBay — no browser needed). Most Phenom sites instead require a
 * tenant-id param on `/api/apply/v2/jobs` that can't be reliably guessed from the CDN asset
 * path (see the "not yet supported" entries in lib/defaultSources.ts for examples where that
 * wall wasn't cracked); this embedded-JSON path sidesteps that entirely.
 */

export interface PhenomJob {
  title: string;
  location: string;
  applyUrl: string;
  type?: string;
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export async function fetchPhenomPage(
  companyLabel: string,
  baseUrl: string,
  from: number
): Promise<{ jobs: PhenomJob[]; total: number }> {
  const url = from === 0 ? baseUrl : `${baseUrl}?from=${from}&s=1`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error(`${companyLabel}: HTTP ${res.status}`);
  const html = await res.text();

  const marker = "phApp.ddo = ";
  const start = html.indexOf(marker);
  if (start === -1) throw new Error(`${companyLabel}: phApp.ddo not found in page`);
  const raw = extractBalancedObject(html, start + marker.length);
  const parsed = JSON.parse(raw) as {
    eagerLoadRefineSearch: { totalHits: number; data: { jobs: PhenomJob[] } };
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
  throw new Error("unterminated JSON object in phApp.ddo");
}
